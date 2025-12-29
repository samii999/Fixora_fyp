/**
 * Prediction Service
 * Handles communication with the ML model API hosted on Colab via ngrok
 */

import { getPredictionUrl, getImageClassificationUrl, API_CONFIG, formatCategoryName } from '../config/apiConfig';

/**
 * Sends issue description to the prediction model and returns the predicted urgency
 * 
 * @param {string} description - The issue description text
 * @returns {Promise<Object>} - Prediction result with urgency level
 */
export const getPrediction = async (description) => {
  try {
    // Validate input
    if (!description || typeof description !== 'string' || description.trim().length === 0) {
      throw new Error('Description is required');
    }

    const url = getPredictionUrl();
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    console.log('🤖 Sending prediction request to:', url);
    console.log('📝 Description:', description.substring(0, 100) + '...');

    // Make API request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        text: description, // Adjust field name based on your model's expected input
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check if response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Prediction API error:', response.status, errorText);
      throw new Error(`API returned status ${response.status}: ${errorText}`);
    }

    // Parse response
    const data = await response.json();
    console.log('✅ Prediction received:', data);

    // Return structured prediction data (urgency only)
    // Adjust these field names based on your model's actual response format
    return {
      success: true,
      urgency: data.urgency || data.predicted_urgency || data.prediction || 'Medium',
      confidence: data.confidence || null,
      rawResponse: data,
    };

  } catch (error) {
    console.error('❌ Prediction service error:', error);

    // Handle specific error types
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timeout - Model took too long to respond',
        urgency: null,
      };
    }

    if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
      return {
        success: false,
        error: 'Network error - Check your internet connection and ensure the ngrok URL is correct',
        urgency: null,
      };
    }

    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      urgency: null,
    };
  }
};

/**
 * Validates if the prediction API is reachable
 * 
 * @returns {Promise<boolean>} - True if API is reachable, false otherwise
 */
export const validateApiConnection = async () => {
  try {
    const url = API_CONFIG.PREDICTION_API_URL;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    return response.ok;
  } catch (error) {
    console.error('API connection validation failed:', error);
    return false;
  }
};

/**
 * Gets a fallback prediction when API is unavailable
 * Uses simple keyword-based logic as backup
 * 
 * @param {string} description - The issue description
 * @returns {Object} - Fallback prediction with urgency
 */
export const getFallbackPrediction = (description) => {
  const lowerText = description.toLowerCase();
  
  // Simple urgency detection based on keywords
  const urgentKeywords = ['urgent', 'emergency', 'immediate', 'critical', 'dangerous', 'asap', 'severe', 'serious'];
  const mediumKeywords = ['important', 'attention', 'concern', 'issue', 'problem', 'broken', 'damaged'];
  
  let urgency = 'Low';
  
  if (urgentKeywords.some(keyword => lowerText.includes(keyword))) {
    urgency = 'High';
  } else if (mediumKeywords.some(keyword => lowerText.includes(keyword))) {
    urgency = 'Medium';
  }

  return {
    success: true,
    urgency: urgency,
    confidence: null,
    isFallback: true,
  };
};

/**
 * Converts image URI to base64 format
 * 
 * @param {string} imageUri - The image URI
 * @returns {Promise<string>} - Base64 encoded image
 */
const convertImageToBase64 = async (imageUri) => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result.split(',')[1]; // Remove data:image/... prefix
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

/**
 * Classifies an image using the MobileNetV2 model
 * Returns the predicted category and confidence
 * 
 * @param {string} imageUri - The image URI to classify
 * @returns {Promise<Object>} - Classification result with category and confidence
 */
export const classifyImage = async (imageUri) => {
  try {
    const url = getImageClassificationUrl();
    
    // Check if URL is configured
    if (url.includes('YOUR_NGROK_URL_HERE')) {
      throw new Error('Image classification URL not configured. Please update API_CONFIG.IMAGE_CLASSIFICATION_URL');
    }

    console.log('🖼️ Classifying image:', imageUri.substring(0, 50) + '...');
    
    // Convert image to base64
    const base64Image = await convertImageToBase64(imageUri);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);

    // Make API request
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        image: base64Image, // Adjust field name based on your model's expected input
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Check if response is OK
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Image classification API error:', response.status, errorText);
      throw new Error(`API returned status ${response.status}: ${errorText}`);
    }

    // Parse response
    const data = await response.json();
    console.log('✅ Classification received:', data);

    // Extract category and confidence
    // Adjust field names based on your model's response format
    const category = data.category || data.predicted_category || data.prediction || 'unknown';
    const confidence = data.confidence || data.accuracy || 0;

    return {
      success: true,
      category: category,
      categoryDisplay: formatCategoryName(category),
      confidence: confidence,
      meetsThreshold: confidence >= API_CONFIG.MIN_ACCURACY_THRESHOLD,
      rawResponse: data,
    };

  } catch (error) {
    console.error('❌ Image classification error:', error);

    // Handle specific error types
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timeout - Image classification took too long',
        category: null,
        confidence: 0,
        meetsThreshold: false,
      };
    }

    if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
      return {
        success: false,
        error: 'Network error - Check your internet connection and ensure the ngrok URL is correct',
        category: null,
        confidence: 0,
        meetsThreshold: false,
      };
    }

    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      category: null,
      confidence: 0,
      meetsThreshold: false,
    };
  }
};

/**
 * Classifies multiple images and validates consistency
 * 
 * @param {Array} imageUris - Array of image URIs to classify
 * @returns {Promise<Object>} - Combined classification result
 */
export const classifyMultipleImages = async (imageUris) => {
  try {
    console.log(`🖼️ Classifying ${imageUris.length} images...`);

    // Classify all images
    const results = await Promise.all(
      imageUris.map(uri => classifyImage(uri))
    );

    // Check if all classifications were successful
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
      return {
        success: false,
        error: `Failed to classify ${failedResults.length} image(s)`,
        results: results,
      };
    }

    // Check if all images meet the confidence threshold
    const lowConfidenceResults = results.filter(r => !r.meetsThreshold);
    if (lowConfidenceResults.length > 0) {
      return {
        success: false,
        error: `${lowConfidenceResults.length} image(s) below ${API_CONFIG.MIN_ACCURACY_THRESHOLD * 100}% confidence threshold`,
        belowThreshold: true,
        minConfidence: Math.min(...results.map(r => r.confidence)),
        results: results,
      };
    }

    // Get unique categories
    const categories = [...new Set(results.map(r => r.category))];

    // Check if all images are of the same category
    if (categories.length > 1) {
      return {
        success: false,
        error: 'Multiple different problem categories detected in images',
        multipleCategories: true,
        categories: categories,
        categoriesDisplay: categories.map(c => formatCategoryName(c)),
        results: results,
      };
    }

    // Calculate average confidence
    const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;

    // All validations passed
    return {
      success: true,
      category: results[0].category,
      categoryDisplay: results[0].categoryDisplay,
      confidence: avgConfidence,
      imageCount: results.length,
      allResults: results,
    };

  } catch (error) {
    console.error('❌ Multiple image classification error:', error);
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
};
