# 🔧 Fix API Error: "Expected 2D array, got 1D array"

## The Error You're Seeing

```
ERROR ❌ Prediction API error: 500 
{"error":"Expected 2D array, got 1D array instead:\narray=['There is too much garbage...'].\nReshape your data..."}
```

---

## 🎯 Problem

Your machine learning model expects input data in a **2D array format** but is receiving a **1D array**.

### **What's Happening:**
- Your React Native app sends: `{"text": "description here"}`
- Your Flask backend receives it as a string
- When you pass it to the model, it becomes a 1D array
- Scikit-learn models expect 2D arrays

---

## ✅ Solution: Fix Your Flask Backend

### **Option 1: If Using TF-IDF Vectorizer**

```python
from flask import Flask, request, jsonify
from sklearn.feature_extraction.text import TfidfVectorizer
import pickle

app = Flask(__name__)

# Load your trained model and vectorizer
model = pickle.load(open('urgency_model.pkl', 'rb'))
vectorizer = pickle.load(open('vectorizer.pkl', 'rb'))

@app.route('/predict', methods=['POST'])
def predict():
    try:
        # Get text from request
        data = request.get_json()
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'No text provided'}), 400
        
        # Transform text to 2D array format
        # IMPORTANT: Note the [text] - this makes it a list (2D)
        text_features = vectorizer.transform([text])
        
        # Make prediction
        prediction = model.predict(text_features)[0]
        
        # Map numerical prediction to urgency level
        urgency_map = {0: 'Low', 1: 'Medium', 2: 'High'}
        urgency = urgency_map.get(prediction, 'Medium')
        
        return jsonify({
            'urgency': urgency,
            'confidence': None  # Add if your model supports probability
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

### **Option 2: If Using Custom Features**

```python
import numpy as np

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        # Extract features (example)
        features = extract_features(text)  # Your feature extraction
        
        # Reshape to 2D: (1, n_features)
        features_2d = np.array(features).reshape(1, -1)
        
        # Predict
        prediction = model.predict(features_2d)[0]
        
        urgency_map = {0: 'Low', 1: 'Medium', 2: 'High'}
        urgency = urgency_map.get(prediction, 'Medium')
        
        return jsonify({'urgency': urgency})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

### **Option 3: If Using Deep Learning (TensorFlow/Keras)**

```python
import numpy as np
from tensorflow.keras.preprocessing.sequence import pad_sequences

@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        # Tokenize and pad (example)
        sequence = tokenizer.texts_to_sequences([text])
        padded = pad_sequences(sequence, maxlen=MAX_LEN)
        
        # Predict (already in correct shape)
        prediction = model.predict(padded)[0]
        
        # Get urgency based on prediction
        urgency_idx = np.argmax(prediction)
        urgency_map = {0: 'Low', 1: 'Medium', 2: 'High'}
        urgency = urgency_map[urgency_idx]
        
        return jsonify({
            'urgency': urgency,
            'confidence': float(prediction[urgency_idx])
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
```

---

## 🧪 Test Your Fixed API

### **Test with cURL:**
```bash
curl -X POST http://127.0.0.1:5000/predict \
  -H "Content-Type: application/json" \
  -d '{"text": "URGENT! Water pipe burst flooding street"}'
```

### **Expected Response:**
```json
{
  "urgency": "High",
  "confidence": 0.95
}
```

---

## 🔍 Common Issues

### **Issue 1: Vectorizer Not Fitted**
```python
# WRONG: Creating new vectorizer
vectorizer = TfidfVectorizer()
text_features = vectorizer.transform([text])  # ERROR: Not fitted

# RIGHT: Load the same vectorizer used during training
vectorizer = pickle.load(open('vectorizer.pkl', 'rb'))
text_features = vectorizer.transform([text])  # Works!
```

### **Issue 2: Wrong Array Shape**
```python
# WRONG: Passing string directly
features = "text here"
prediction = model.predict(features)  # ERROR

# RIGHT: Wrap in list to make 2D
features = ["text here"]
prediction = model.predict(vectorizer.transform(features))  # Works!
```

### **Issue 3: Feature Count Mismatch**
```python
# Make sure features match training
# If trained with 1000 features, prediction must have 1000 features

# Check feature count
print(f"Model expects: {model.n_features_in_} features")
print(f"Got: {text_features.shape[1]} features")
```

---

## 📦 Complete Flask Example

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np

app = Flask(__name__)
CORS(app)  # Enable CORS for React Native

# Load model and vectorizer
try:
    model = pickle.load(open('urgency_model.pkl', 'rb'))
    vectorizer = pickle.load(open('vectorizer.pkl', 'rb'))
    print("✅ Model and vectorizer loaded successfully")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    model = None
    vectorizer = None

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'status': 'running',
        'endpoint': '/predict',
        'method': 'POST'
    })

@app.route('/predict', methods=['POST'])
def predict():
    if not model or not vectorizer:
        return jsonify({'error': 'Model not loaded'}), 500
    
    try:
        # Parse request
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400
        
        text = data.get('text', '')
        if not text or not text.strip():
            return jsonify({'error': 'Empty text provided'}), 400
        
        print(f"📝 Received text: {text[:100]}...")
        
        # Transform text - NOTE THE [text] to make it 2D
        text_features = vectorizer.transform([text])
        print(f"✅ Features shape: {text_features.shape}")
        
        # Predict
        prediction = model.predict(text_features)[0]
        print(f"🎯 Prediction: {prediction}")
        
        # Map to urgency
        urgency_map = {0: 'Low', 1: 'Medium', 2: 'High'}
        urgency = urgency_map.get(int(prediction), 'Medium')
        
        # Get probability if available
        confidence = None
        if hasattr(model, 'predict_proba'):
            proba = model.predict_proba(text_features)[0]
            confidence = float(max(proba))
        
        result = {
            'urgency': urgency,
            'confidence': confidence
        }
        
        print(f"✅ Result: {result}")
        return jsonify(result)
        
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting Flask server on http://127.0.0.1:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
```

---

## 🔄 Steps to Fix

1. **Update your Flask code** with the examples above
2. **Restart your Flask server**
   ```bash
   python app.py
   ```
3. **Test with cURL** to verify it works
4. **Update ngrok** if using it
   ```bash
   ngrok http 5000
   ```
5. **Update `apiConfig.js`** with new ngrok URL
6. **Test in your app**

---

## ✅ Verification

After fixing, you should see:

### **Console Logs:**
```
📝 Received text: There is too much garbage...
✅ Features shape: (1, 5000)
🎯 Prediction: 2
✅ Result: {'urgency': 'High', 'confidence': 0.95}
```

### **In React Native:**
```
LOG 🔮 Getting urgency prediction...
LOG 🤖 Sending prediction request to: https://...
LOG ✅ Prediction received: {urgency: "High", confidence: 0.95}
LOG ✅ Urgency determined: High
```

---

## 🎯 Key Takeaway

**Always wrap your text in a list** when passing to the model:

```python
# ❌ WRONG
text_features = vectorizer.transform(text)

# ✅ RIGHT
text_features = vectorizer.transform([text])
                                    #  ^    ^
                                    # List brackets!
```

This ensures it's treated as a 2D array (batch of 1 sample).

---

**Need more help?** Check your model training code to see how the data was shaped during training, and match that shape during prediction! 🚀
