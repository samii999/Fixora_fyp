"""
Flask Server with BOTH Models on Same ngrok URL
Run this on Google Colab or your local machine
"""

from flask import Flask, request, jsonify
from tensorflow import keras
import numpy as np
import base64
from io import BytesIO
from PIL import Image

app = Flask(__name__)

# Load BOTH models
urgency_model = keras.models.load_model('urgency_model.h5')  # Your urgency model
image_classification_model = keras.models.load_model('fixora_mobilenetv2_model_finetuned.keras')

# Categories for image classification
IMAGE_CATEGORIES = [
    'broken_street_light',
    'electric_issue',
    'garbage_overflow',
    'gas_problem',
    'open_manhole',
    'potholes',
    'traffic_lights',
    'water_leakage'
]

@app.route('/predict', methods=['POST'])
def predict_urgency():
    """Endpoint for urgency prediction (your existing model)"""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        # Your existing urgency prediction logic
        # ... (keep your existing code)
        
        return jsonify({
            'urgency': 'Medium',  # Your actual prediction
            'confidence': 0.85
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/classify', methods=['POST'])
def classify_image():
    """NEW: Endpoint for image classification"""
    try:
        data = request.get_json()
        image_base64 = data.get('image')
        
        if not image_base64:
            return jsonify({'error': 'No image provided'}), 400
        
        # Decode base64 image
        image_data = base64.b64decode(image_base64)
        image = Image.open(BytesIO(image_data))
        
        # Convert to RGB if needed
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Preprocess for MobileNetV2 (224x224)
        image = image.resize((224, 224))
        image_array = np.array(image) / 255.0
        image_array = np.expand_dims(image_array, axis=0)
        
        # Predict
        predictions = image_classification_model.predict(image_array)
        predicted_index = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_index])
        
        category = IMAGE_CATEGORIES[predicted_index]
        
        return jsonify({
            'category': category,
            'predicted_category': category,
            'confidence': confidence,
            'accuracy': confidence,
            'all_predictions': {
                IMAGE_CATEGORIES[i]: float(predictions[0][i]) 
                for i in range(len(IMAGE_CATEGORIES))
            }
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'models': {
            'urgency': 'loaded',
            'image_classification': 'loaded'
        }
    })


if __name__ == '__main__':
    print("🚀 Starting server with BOTH models...")
    print("📍 Endpoints:")
    print("   - POST /predict (urgency)")
    print("   - POST /classify (image classification)")
    print("   - GET /health")
    app.run(host='0.0.0.0', port=5000)
