
export const API_CONFIG = {
  // Replace this URL with your current ngrok URL from Colab
  PREDICTION_API_URL: 'https://datively-subtile-benito.ngrok-free.dev',
  
  // Image Classification Model URL (fixora_mobilenetv2_model_finetuned.keras)
  // Update this with your ngrok URL for image classification
  IMAGE_CLASSIFICATION_URL: 'https://datively-subtile-benito.ngrok-free.dev',
  
  // API endpoints
  ENDPOINTS: {
    PREDICT: '/predict_urgency', // Urgency prediction endpoint (text only)
    CLASSIFY_IMAGE: '/classify', // Image classification endpoint
  },
  
  // Request timeout in milliseconds
  TIMEOUT: 10000, // 10 seconds
  
  // Image classification categories
  IMAGE_CATEGORIES: [
    'broken_street_light',
    'electric_issue',
    'garbage_overflow',
    'gas_problem',
    'open_manhole',
    'potholes',
    'traffic_lights',
    'water_leakage'
  ],
  
  // Minimum accuracy threshold for image classification
  MIN_ACCURACY_THRESHOLD: 0.80, // 80%
};

// Helper function to get the full prediction URL
export const getPredictionUrl = () => {
  return `${API_CONFIG.PREDICTION_API_URL}${API_CONFIG.ENDPOINTS.PREDICT}`;
};

// Helper function to get the full image classification URL
export const getImageClassificationUrl = () => {
  return `${API_CONFIG.IMAGE_CLASSIFICATION_URL}${API_CONFIG.ENDPOINTS.CLASSIFY_IMAGE}`;
};

// Helper function to format category name for display
export const formatCategoryName = (category) => {
  return category
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
