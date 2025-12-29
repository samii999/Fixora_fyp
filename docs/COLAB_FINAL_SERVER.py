from flask import Flask, request, jsonify
from flask_cors import CORS
from pyngrok import ngrok
import joblib
import numpy as np
from sentence_transformers import SentenceTransformer
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing import image
from PIL import Image
import io
import base64


# -----------------------
# PATHS - Your Exact Setup
# -----------------------
IMG_MODEL_PATH = "/content/drive/My Drive/fixora_mobilenetv2_model_finetuned.keras"
IMG_LABEL_ENCODER_PATH = "/content/drive/My Drive/Fixora_Models/image_label_encoder.joblib"

TEXT_CLASSIFIER_PATH = "/content/drive/My Drive/Urgency_Detection/model_artifacts/classifier.joblib"
TEXT_LABEL_ENCODER_PATH = "/content/drive/My Drive/Urgency_Detection/model_artifacts/label_encoder.joblib"
EMBEDDING_MODEL_NAME_PATH = "/content/drive/My Drive/Urgency_Detection/model_artifacts/embedding_model_name.txt"


# -----------------------
# LOAD MODELS
# -----------------------
print("🚀 Loading models...")

# Image model
img_model = load_model(IMG_MODEL_PATH)
print("✅ Image classification model loaded.")

# For image label encoder (if you trained one)
try:
    img_label_encoder = joblib.load(IMG_LABEL_ENCODER_PATH)
    print("✅ Image label encoder loaded.")
except:
    img_label_encoder = None
    print("⚠️ No image_label_encoder.joblib found. Using default labels.")

# Urgency (text) model
text_classifier = joblib.load(TEXT_CLASSIFIER_PATH)
text_label_encoder = joblib.load(TEXT_LABEL_ENCODER_PATH)
with open(EMBEDDING_MODEL_NAME_PATH, "r") as f:
    embedding_model_name = f.read().strip()
embedding_model = SentenceTransformer(embedding_model_name)

print("✅ All models ready to use.")


# -----------------------
# FLASK APP
# -----------------------
app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return "✅ Fixora Combined AI API is running!"


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "models": {
            "image_classification": "loaded",
            "urgency_detection": "loaded"
        }
    })


# ============================================
# ENDPOINT 1: /predict (Combined - Original)
# ============================================
@app.route("/predict", methods=["POST"])
def predict():
    """
    Original endpoint for combined prediction
    Expects: multipart form data with images + description
    """
    try:
        files = request.files.getlist("images")
        description = request.form.get("description", "")

        if not files:
            return jsonify({"error": "No images uploaded"}), 400
        if not description.strip():
            return jsonify({"error": "No description provided"}), 400

        print(f"🖼️ {len(files)} image(s) received | Description: {description[:60]}...")

        # IMAGE PREDICTION
        image_preds, confs = [], []
        for f in files:
            img = Image.open(io.BytesIO(f.read())).convert("RGB").resize((224, 224))
            arr = np.expand_dims(np.array(img) / 255.0, axis=0)
            pred = img_model.predict(arr)[0]
            conf = float(np.max(pred))
            label_idx = np.argmax(pred)

            if img_label_encoder:
                label = img_label_encoder.inverse_transform([label_idx])[0]
            else:
                default_categories = [
                    'broken_street_light', 'electric_issue', 'garbage_overflow',
                    'gas_problem', 'open_manhole', 'potholes', 'traffic_lights', 'water_leakage'
                ]
                label = default_categories[label_idx] if label_idx < len(default_categories) else f"class_{label_idx}"

            image_preds.append(label)
            confs.append(conf)

        # Check: multiple different problems
        if len(set(image_preds)) > 1:
            return jsonify({
                "status": "denied",
                "reason": "Multiple images show different problems."
            }), 400

        issue_type = image_preds[0]
        avg_conf = np.mean(confs)

        # Confidence check
        if avg_conf < 0.8:
            return jsonify({
                "status": "resubmit",
                "issue_type": issue_type,
                "confidence": round(float(avg_conf), 2),
                "message": "Confidence below 80%. Please re-upload clearer images."
            }), 200

        # URGENCY DETECTION
        text_embedding = embedding_model.encode([description])
        urgency_encoded = text_classifier.predict(text_embedding)
        urgency = text_label_encoder.inverse_transform(urgency_encoded)[0]

        urgency_conf = None
        if hasattr(text_classifier, "predict_proba"):
            proba = text_classifier.predict_proba(text_embedding)[0]
            urgency_conf = float(np.max(proba))

        result = {
            "status": "success",
            "issue_type": issue_type,
            "issue_confidence": round(float(avg_conf), 2),
            "urgency": urgency,
            "urgency_confidence": round(float(urgency_conf), 2) if urgency_conf else None
        }

        print("✅ Final result:", result)
        return jsonify(result), 200

    except Exception as e:
        print(f"❌ Error in /predict: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500


# ============================================
# ENDPOINT 2: /classify (Image Only - for FIXORA)
# ============================================
@app.route("/classify", methods=["POST"])
def classify_image():
    """
    Image classification only (used by FIXORA app)
    Expects: JSON with base64 encoded image
    """
    try:
        data = request.get_json()
        image_base64 = data.get('image')
        
        if not image_base64:
            return jsonify({'error': 'No image provided'}), 400
        
        print(f"🖼️ /classify: Decoding base64 image...")
        
        # Decode base64 image
        image_data = base64.b64decode(image_base64)
        img = Image.open(io.BytesIO(image_data)).convert("RGB").resize((224, 224))
        
        # Predict
        arr = np.expand_dims(np.array(img) / 255.0, axis=0)
        pred = img_model.predict(arr)[0]
        conf = float(np.max(pred))
        label_idx = np.argmax(pred)
        
        if img_label_encoder:
            label = img_label_encoder.inverse_transform([label_idx])[0]
        else:
            default_categories = [
                'broken_street_light', 'electric_issue', 'garbage_overflow',
                'gas_problem', 'open_manhole', 'potholes', 'traffic_lights', 'water_leakage'
            ]
            label = default_categories[label_idx] if label_idx < len(default_categories) else f"class_{label_idx}"
        
        print(f"✅ Classification: {label} ({conf:.2%})")
        
        return jsonify({
            'category': label,
            'predicted_category': label,
            'confidence': float(conf),
            'accuracy': float(conf)
        }), 200
        
    except Exception as e:
        print(f"❌ Error in /classify: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# ============================================
# ENDPOINT 3: /predict_urgency (Text Only - for FIXORA)
# ============================================
@app.route("/predict_urgency", methods=["POST"])
def predict_urgency():
    """
    Urgency prediction from text only (used by FIXORA app)
    Expects: JSON with text description
    """
    try:
        data = request.get_json()
        description = data.get('text', '')
        
        if not description.strip():
            return jsonify({'error': 'No description provided'}), 400
        
        print(f"🔮 Predicting urgency for: {description[:60]}...")
        
        # Urgency prediction
        text_embedding = embedding_model.encode([description])
        urgency_encoded = text_classifier.predict(text_embedding)
        urgency = text_label_encoder.inverse_transform(urgency_encoded)[0]
        
        urgency_conf = None
        if hasattr(text_classifier, "predict_proba"):
            proba = text_classifier.predict_proba(text_embedding)[0]
            urgency_conf = float(np.max(proba))
        
        print(f"✅ Urgency: {urgency} (confidence: {urgency_conf:.2%})" if urgency_conf else f"✅ Urgency: {urgency}")
        
        return jsonify({
            'urgency': urgency,
            'predicted_urgency': urgency,
            'confidence': urgency_conf
        }), 200
        
    except Exception as e:
        print(f"❌ Error in /predict_urgency: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


# -----------------------
# START NGROK TUNNEL
# -----------------------
if __name__ == "__main__":
    public_url = ngrok.connect(5000)
    print("=" * 70)
    print("🌐 PUBLIC NGROK URL:", public_url)
    print("=" * 70)
    print("📍 Available endpoints:")
    print("   - GET  /                   (health check)")
    print("   - GET  /health             (detailed health)")
    print("   - POST /predict            (combined: images + text → issue + urgency)")
    print("   - POST /classify           (image only → category)")
    print("   - POST /predict_urgency    (text only → urgency)")
    print("=" * 70)
    print("🎯 For FIXORA app, use:")
    print(f"   - Image Classification: {public_url}/classify")
    print(f"   - Urgency Prediction:   {public_url}/predict_urgency")
    print("=" * 70)
    app.run(port=5000)
