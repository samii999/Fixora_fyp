# Image Classification Model Setup Guide

## Overview

This guide explains how to set up and integrate the **fixora_mobilenetv2_model_finetuned.keras** image classification model with your FIXORA application.

## Model Details

- **Model File**: `fixora_mobilenetv2_model_finetuned.keras`
- **Architecture**: MobileNetV2 (Fine-tuned)
- **Purpose**: Classify problem types from uploaded images
- **Categories**: 8 problem categories

### Supported Categories

1. **Broken Street Light** (`broken_street_light`)
2. **Electric Issue** (`electric_issue`)
3. **Garbage Overflow** (`garbage_overflow`)
4. **Gas Problem** (`gas_problem`)
5. **Open Manhole** (`open_manhole`)
6. **Potholes** (`potholes`)
7. **Traffic Lights** (`traffic_lights`)
8. **Water Leakage** (`water_leakage`)

## Setup Instructions

### Step 1: Prepare Your Model API

You need to host your Keras model on a server (e.g., Google Colab with ngrok) that exposes a REST API endpoint.

#### Example Flask API (Python)

```python
from flask import Flask, request, jsonify
from tensorflow import keras
import numpy as np
import base64
from io import BytesIO
from PIL import Image

app = Flask(__name__)

# Load the model
model = keras.models.load_model('fixora_mobilenetv2_model_finetuned.keras')

# Define categories (must match your model's training order)
CATEGORIES = [
    'broken_street_light',
    'electric_issue',
    'garbage_overflow',
    'gas_problem',
    'open_manhole',
    'potholes',
    'traffic_lights',
    'water_leakage'
]

@app.route('/classify', methods=['POST'])
def classify_image():
    try:
        # Get base64 image from request
        data = request.get_json()
        image_base64 = data.get('image')
        
        if not image_base64:
            return jsonify({'error': 'No image provided'}), 400
        
        # Decode base64 image
        image_data = base64.b64decode(image_base64)
        image = Image.open(BytesIO(image_data))
        
        # Preprocess image (adjust to your model's requirements)
        image = image.resize((224, 224))  # MobileNetV2 typical input size
        image_array = np.array(image) / 255.0  # Normalize
        image_array = np.expand_dims(image_array, axis=0)
        
        # Make prediction
        predictions = model.predict(image_array)
        predicted_index = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_index])
        
        # Get category
        category = CATEGORIES[predicted_index]
        
        return jsonify({
            'category': category,
            'predicted_category': category,
            'confidence': confidence,
            'accuracy': confidence,
            'all_predictions': {
                CATEGORIES[i]: float(predictions[0][i]) 
                for i in range(len(CATEGORIES))
            }
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'model': 'loaded'})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

### Step 2: Deploy with ngrok (for development)

1. **Run the Flask app**:
   ```bash
   python app.py
   ```

2. **Start ngrok**:
   ```bash
   ngrok http 5000
   ```

3. **Copy the ngrok URL** (e.g., `https://xxxx-xx-xxx-xxx-xxx.ngrok-free.app`)

### Step 3: Update FIXORA Configuration

Open `src/config/apiConfig.js` and update the `IMAGE_CLASSIFICATION_URL`:

```javascript
export const API_CONFIG = {
  // ... other config
  
  // Replace with your ngrok URL
  IMAGE_CLASSIFICATION_URL: 'https://your-ngrok-url-here.ngrok-free.app',
  
  // ... rest of config
};
```

### Step 4: Restart Your App

```bash
npm start
```

## Features Implemented

### 1. Automatic Image Classification

When users upload images in the ReportForm:
- Images are automatically sent to the classification API
- Real-time feedback shows the predicted category and confidence
- Classification happens in the background

### 2. Validation Rules

#### Multiple Images - Different Problems ❌
```
User uploads: [pothole.jpg, garbage.jpg]
Result: DENIED
Message: "Multiple different problem categories detected"
```

#### Multiple Images - Same Problem ✅
```
User uploads: [pothole1.jpg, pothole2.jpg, pothole3.jpg]
Result: ACCEPTED (Combined)
Confidence: Average of all predictions
```

#### Low Confidence (< 80%) ❌
```
User uploads: [blurry_image.jpg]
Classification: 75% confidence
Result: DENIED
Message: "Please upload clearer images (minimum 80% required)"
```

### 3. Category Display

Categories are shown to **all users** (User, Staff, Admin) in:
- **Report Form**: Real-time classification results
- **Report Detail Screen**: AI Classification card with confidence
- **Report Lists**: Category badge/label

## UI Components

### Report Form Classification Section

Shows during image upload:
```
🤖 AI Image Classification

Problem Type: Potholes
Confidence: 92.5%
✅ All images validated successfully
```

### Report Detail Screen

Shows for submitted reports:
```
🤖 AI Classification
Problem Type: Water Leakage
Confidence: 87.3%
✓ 2 images analyzed
```

## Validation Flow

```
User adds images
    ↓
Automatic classification
    ↓
Check 1: All images same category? 
    NO → Show error, prevent submission
    YES ↓
Check 2: Confidence ≥ 80%?
    NO → Request clearer images
    YES ↓
✅ Allow submission
```

## API Request/Response Format

### Request to `/classify`

```json
{
  "image": "base64_encoded_image_string"
}
```

### Response

```json
{
  "category": "potholes",
  "predicted_category": "potholes",
  "confidence": 0.925,
  "accuracy": 0.925,
  "all_predictions": {
    "broken_street_light": 0.01,
    "electric_issue": 0.02,
    "garbage_overflow": 0.01,
    "gas_problem": 0.005,
    "open_manhole": 0.015,
    "potholes": 0.925,
    "traffic_lights": 0.01,
    "water_leakage": 0.02
  }
}
```

## Database Schema

Reports now include `classificationMetadata`:

```javascript
{
  reportId: "RPT_1234567890",
  category: "Potholes",  // Display name
  categorySlug: "potholes",  // Slug for filtering
  // ... other fields
  classificationMetadata: {
    category: "potholes",
    categoryDisplay: "Potholes",
    confidence: 0.925,
    imageCount: 2,
    classifiedAt: Date
  }
}
```

## Troubleshooting

### Issue: "Image classification URL not configured"

**Solution**: Update `IMAGE_CLASSIFICATION_URL` in `src/config/apiConfig.js`

### Issue: "Network error"

**Solutions**:
1. Check if ngrok is running
2. Verify the ngrok URL is correct
3. Test the endpoint directly: `curl https://your-url.ngrok.io/health`

### Issue: Classification taking too long

**Solutions**:
1. Optimize image size before sending (already done - images are resized)
2. Increase timeout in `apiConfig.js`: `TIMEOUT: 15000` (15 seconds)
3. Use a faster server (consider cloud deployment)

### Issue: Low confidence on good images

**Solutions**:
1. Ensure images are well-lit and clear
2. Check if image preprocessing matches model training
3. Retrain model with more diverse data

## Production Deployment

For production, replace ngrok with a permanent solution:

### Option 1: Cloud Run (Google Cloud)
```bash
gcloud run deploy fixora-classifier \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

### Option 2: AWS Lambda + API Gateway
Use AWS SAM or Serverless framework

### Option 3: Heroku
```bash
heroku create fixora-classifier
git push heroku main
```

Then update `IMAGE_CLASSIFICATION_URL` with your production URL.

## Testing

### Test the API manually:

```bash
# Health check
curl https://your-url.ngrok.io/health

# Test classification (with base64 image)
curl -X POST https://your-url.ngrok.io/classify \
  -H "Content-Type: application/json" \
  -d '{"image": "your_base64_image_here"}'
```

### Test in the app:

1. Open the app
2. Navigate to "Report Issue"
3. Add an image
4. Check console logs for classification results
5. Try different scenarios:
   - Single image
   - Multiple images (same problem)
   - Multiple images (different problems)
   - Blurry images

## Support

For issues or questions:
1. Check console logs in React Native debugger
2. Check Flask server logs
3. Verify API response format matches expected structure
4. Test with Postman or curl first

## Next Steps

- [ ] Configure your ngrok URL
- [ ] Test with sample images
- [ ] Deploy to production
- [ ] Monitor classification accuracy
- [ ] Collect feedback from users
- [ ] Fine-tune model if needed
