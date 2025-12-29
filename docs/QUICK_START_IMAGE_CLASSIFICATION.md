# Quick Start: Image Classification Integration

## ⚡ Fast Setup (5 minutes)

### 1. Get Your Model Running

**Option A: Google Colab (Recommended for testing)**

```python
# In a Colab notebook
!pip install flask pyngrok tensorflow pillow

# Upload your fixora_mobilenetv2_model_finetuned.keras file

# Run this code:
from flask import Flask, request, jsonify
from tensorflow import keras
import numpy as np
import base64
from io import BytesIO
from PIL import Image
from pyngrok import ngrok

app = Flask(__name__)
model = keras.models.load_model('fixora_mobilenetv2_model_finetuned.keras')

CATEGORIES = ['broken_street_light', 'electric_issue', 'garbage_overflow', 
              'gas_problem', 'open_manhole', 'potholes', 'traffic_lights', 'water_leakage']

@app.route('/classify', methods=['POST'])
def classify():
    data = request.get_json()
    image_base64 = data['image']
    image_data = base64.b64decode(image_base64)
    image = Image.open(BytesIO(image_data)).resize((224, 224))
    image_array = np.expand_dims(np.array(image) / 255.0, axis=0)
    
    predictions = model.predict(image_array)
    idx = np.argmax(predictions[0])
    
    return jsonify({
        'category': CATEGORIES[idx],
        'confidence': float(predictions[0][idx])
    })

# Start ngrok tunnel
public_url = ngrok.connect(5000)
print(f'🌐 Public URL: {public_url}')

# Run Flask
app.run(port=5000)
```

**Option B: Local with ngrok**

```bash
# Terminal 1: Run your model server
python model_server.py

# Terminal 2: Expose with ngrok
ngrok http 5000
```

### 2. Update FIXORA Config

Copy the ngrok URL from above, then:

**File**: `src/config/apiConfig.js`

```javascript
IMAGE_CLASSIFICATION_URL: 'https://xxxx-xx-xxx.ngrok-free.app',
```

### 3. Restart & Test

```bash
npm start
```

Then in the app:
1. Go to "Report Issue"
2. Add an image
3. Watch it classify automatically! 🎉

---

## 🎯 What Happens Now?

### User Experience

```
User uploads image of pothole
    ↓
⏳ "Analyzing images..."
    ↓
✅ "Problem Type: Potholes
    Confidence: 92.5%
    All images validated successfully"
```

### Validation Rules (Automatic)

| Scenario | Result |
|----------|--------|
| 1 image, 90% confidence | ✅ **Allowed** |
| 2 images (same problem), 85% avg | ✅ **Allowed** |
| 2 images (different problems) | ❌ **Denied** |
| 1 image, 75% confidence | ❌ **Denied** (need 80%+) |

---

## 📱 Where Categories Show Up

### 1. Report Form (when submitting)
```
🤖 AI Image Classification
Problem Type: Water Leakage
Confidence: 87.3%
✓ All images validated successfully
```

### 2. Report Details (all users see this)
```
🤖 AI Classification
Problem Type: Garbage Overflow
Confidence: 91.2%
✓ 3 images analyzed
```

### 3. Report Lists
Category badge shown in report cards

---

## 🔧 Troubleshooting

### "Image classification URL not configured"
→ Update `IMAGE_CLASSIFICATION_URL` in `apiConfig.js`

### Classification not working
1. Check ngrok is running: `curl https://your-url/health`
2. Check React Native console for errors
3. Verify model server logs

### Always getting "Low Confidence"
→ Images might be too blurry. Test with clear, well-lit photos

---

## ✅ Testing Checklist

- [ ] Single clear image works
- [ ] Multiple images of SAME problem works
- [ ] Multiple images of DIFFERENT problems gets rejected
- [ ] Blurry image gets low confidence warning
- [ ] Category shows in report details
- [ ] All user roles can see category

---

## 📊 Sample Test Images

Test your setup with these scenarios:

1. **Pothole**: Take clear photo of road damage
2. **Garbage**: Overflowing bin
3. **Mixed**: Upload 1 pothole + 1 garbage (should fail)
4. **Blurry**: Out of focus image (should warn about confidence)

---

## 🚀 Production Ready?

For production deployment, replace ngrok with:
- **Google Cloud Run**: Auto-scaling, serverless
- **AWS Lambda**: Pay per use
- **Heroku**: Simple deployment

See `IMAGE_CLASSIFICATION_SETUP.md` for detailed production setup.

---

## 🎓 Key Features Summary

✅ **Automatic classification** - No manual category selection  
✅ **Real-time feedback** - Users see results immediately  
✅ **Smart validation** - Prevents mixed/low-quality submissions  
✅ **Multi-image support** - Combines predictions for same problem  
✅ **Universal visibility** - All roles see AI classifications  
✅ **80% accuracy threshold** - Ensures quality submissions  

---

## 📞 Need Help?

1. Check console logs in React Native debugger
2. Test API with curl or Postman first
3. Review `IMAGE_CLASSIFICATION_SETUP.md` for detailed docs
4. Ensure model categories match your training data

**Happy Classifying! 🤖**
