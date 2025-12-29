# 🤖 AI Prediction Model Integration Guide

## Overview
Your app now integrates with an AI prediction model hosted on Colab via ngrok. The model automatically categorizes issue reports and determines urgency levels.

---

## 📋 What Has Been Implemented

### 1. **API Configuration** (`src/config/apiConfig.js`)
- Centralized location for your ngrok URL
- Easy to update when ngrok session restarts
- Configurable timeout settings

### 2. **Prediction Service** (`src/services/predictionService.js`)
- Handles API communication with your Colab-hosted model
- Automatic fallback prediction when API is unavailable
- Error handling and timeout management
- Network validation

### 3. **Enhanced Report Form** (`src/components/form/ReportForm.js`)
- "Get AI Prediction" button for manual predictions
- Automatic prediction during report submission
- Live prediction results display
- Loading states and error handling
- Fallback system ensures reports can always be submitted

### 4. **Database Structure**
Reports now include a `prediction` object:
```javascript
{
  category: "Water & Drainage",
  urgency: "High",
  confidence: 0.95,
  isFallback: false,
  predictedAt: Date
}
```

---

## 🚀 Setup Instructions

### **STEP 1: Update the ngrok URL** ⚠️ IMPORTANT
**Before running `npm start`, you MUST update the API URL:**

1. Open the file: **`src/config/apiConfig.js`**
2. Replace this line:
   ```javascript
   PREDICTION_API_URL: 'https://your-ngrok-url-here.ngrok-free.app',
   ```
   with your actual ngrok URL from Colab:
   ```javascript
   PREDICTION_API_URL: 'https://xxxx-xx-xxx-xxx-xxx.ngrok-free.app',
   ```
3. Save the file

### **STEP 2: Verify Your Model Endpoint**
Make sure your Colab model responds to POST requests at the `/predict` endpoint with this format:

**Request:**
```json
{
  "text": "Urgent water pipe burst flooding the street"
}
```

**Expected Response:**
```json
{
  "category": "Water & Drainage",
  "urgency": "High",
  "confidence": 0.95
}
```

> **Note:** If your endpoint or response format is different, update `src/services/predictionService.js` accordingly.

### **STEP 3: Start Your App**
```bash
npm start
```

---

## 💡 How It Works

### **User Flow:**
1. User enters issue description
2. (Optional) User clicks "🎯 Get AI Prediction" button to preview the prediction
3. Prediction is displayed showing:
   - 📂 Category
   - ⚡ Urgency (High/Medium/Low)
   - 📊 Confidence (if available)
4. User completes the rest of the form (images, location)
5. When submitting:
   - If prediction was already obtained → Uses it
   - If not → Automatically gets prediction before submission
6. Report is saved to Firestore with prediction data

### **Fallback System:**
If the API is unreachable or fails:
- App uses keyword-based fallback prediction
- User is notified but can still submit
- Report is marked with `isFallback: true`

---

## 🎨 UI Features

### **Prediction Section:**
- **Purple Button**: "🎯 Get AI Prediction" / "🔄 Get New Prediction"
- **Green Box**: Shows successful prediction
- **Orange Box**: Shows fallback prediction
- **Red Box**: Shows error with helpful message

### **Loading States:**
- Spinner during prediction request
- "Getting Prediction..." text
- Submit button disabled during prediction

### **Color-Coded Urgency:**
- 🔴 **Red**: High urgency
- 🟠 **Orange**: Medium urgency
- 🟢 **Green**: Low urgency

---

## 🔧 Configuration Options

### Update Timeout (in `apiConfig.js`):
```javascript
TIMEOUT: 10000, // milliseconds (10 seconds)
```

### Customize Endpoint (in `apiConfig.js`):
```javascript
ENDPOINTS: {
  PREDICT: '/predict', // Change if your endpoint is different
}
```

### Adjust Request Format (in `predictionService.js`):
Find this section and modify:
```javascript
body: JSON.stringify({
  text: description, // Change 'text' if your model expects different field name
})
```

### Adjust Response Parsing (in `predictionService.js`):
Find this section and modify:
```javascript
return {
  success: true,
  category: data.category || data.predicted_category || 'Unknown',
  urgency: data.urgency || data.predicted_urgency || 'Medium',
  confidence: data.confidence || null,
  rawResponse: data,
};
```

---

## 🐛 Troubleshooting

### **Problem: "Network error" message**
**Solution:**
1. Check your internet connection
2. Verify the ngrok URL in `apiConfig.js` is correct
3. Ensure your Colab notebook is running
4. Test the ngrok URL in a browser

### **Problem: "Request timeout"**
**Solution:**
1. Your model is taking too long to respond
2. Increase timeout in `apiConfig.js`
3. Optimize your model inference speed

### **Problem: Prediction shows "Unknown" category**
**Solution:**
1. Check if your model's response format matches expected format
2. Add console logs in `predictionService.js` to see raw response
3. Update response parsing logic if needed

### **Problem: Always getting fallback predictions**
**Solution:**
1. Check Colab notebook is running
2. Verify ngrok URL is up-to-date
3. Check your API endpoint path
4. Ensure model accepts POST requests with JSON body

---

## 📝 Testing Checklist

Before submitting to production:
- [ ] ngrok URL updated in `apiConfig.js`
- [ ] Colab notebook running and accessible
- [ ] Test prediction with sample description
- [ ] Verify prediction displays correctly
- [ ] Test error scenarios (turn off Colab)
- [ ] Confirm fallback works properly
- [ ] Check report saves with prediction data in Firestore
- [ ] Test complete flow: enter description → get prediction → submit report

---

## 🔄 Updating ngrok URL (Each Session)

**Every time you restart your Colab notebook:**
1. Copy new ngrok URL from Colab output
2. Open `src/config/apiConfig.js`
3. Update `PREDICTION_API_URL`
4. Save file
5. Restart app: `npm start` (or reload/refresh app)

---

## 📊 Monitoring & Debugging

### **View Logs:**
Check your React Native console for these logs:
- `🤖 Sending prediction request to:` - Request sent
- `✅ Prediction received:` - Success
- `❌ Prediction API error:` - API error
- `⚠️ Prediction failed, using fallback` - Fallback triggered

### **View Stored Data:**
In Firestore, check the `reports` collection. Each report should have:
```javascript
{
  description: "...",
  category: "Water & Drainage",  // From prediction
  prediction: {
    category: "Water & Drainage",
    urgency: "High",
    confidence: 0.95,
    isFallback: false,
    predictedAt: Timestamp
  },
  // ... other fields
}
```

---

## 🎯 Next Steps & Enhancements

Consider adding:
1. **Batch Predictions**: Predict multiple descriptions at once
2. **Prediction History**: Show user their past predictions
3. **Confidence Threshold**: Only accept high-confidence predictions
4. **A/B Testing**: Compare model vs fallback accuracy
5. **Analytics Dashboard**: Track prediction accuracy over time
6. **Model Feedback**: Allow users to rate prediction accuracy

---

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Review console logs
3. Test ngrok URL in browser
4. Verify Colab notebook is running
5. Check request/response format matches

---

## ✅ Summary

Your app now has full AI prediction integration with:
- ✅ Automatic category detection
- ✅ Urgency level prediction
- ✅ Fallback system for reliability
- ✅ User-friendly UI
- ✅ Error handling
- ✅ Prediction saved in database
- ✅ Easy ngrok URL updates

**Happy coding! 🚀**
