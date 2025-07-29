import 'react-native-url-polyfill/auto';
import { supabase } from '../config/supabaseConfig';

// Temporary solution without uuid and mime packages
const generateFileName = () => {
  return `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getFileExtension = (uri) => {
  return uri.split('.').pop() || 'jpg';
};

const getMimeType = (uri) => {
  const ext = getFileExtension(uri).toLowerCase();
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  };
  return mimeTypes[ext] || 'image/jpeg';
};

export const uploadToSupabase = async (uri, bucket) => {
  try {
    const fileExt = getFileExtension(uri);
    const fileName = `${generateFileName()}.${fileExt}`;
    const fileType = getMimeType(uri);

    // Handle React Native image URIs properly
    let response;
    if (uri.startsWith('file://')) {
      // For local file URIs, use XMLHttpRequest or convert to base64
      const base64 = await convertImageToBase64(uri);
      const { error } = await supabase.storage.from(bucket).upload(fileName, base64, {
        contentType: fileType,
        upsert: true,
      });
      
      if (error) throw error;
    } else {
      // For remote URIs, use fetch
      response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      const blob = await response.blob();
      
      const { error } = await supabase.storage.from(bucket).upload(fileName, blob, {
        contentType: fileType,
        upsert: true,
      });
      
      if (error) throw error;
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return data.publicUrl;
  } catch (error) {
    console.error('Supabase upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

// Helper function to convert image to base64
const convertImageToBase64 = (uri) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = function() {
      const reader = new FileReader();
      reader.onloadend = function() {
        resolve(reader.result.split(',')[1]); // Remove data URL prefix
      };
      reader.readAsDataURL(xhr.response);
    };
    xhr.onerror = function() {
      reject(new Error('Failed to convert image to base64'));
    };
    xhr.open('GET', uri);
    xhr.responseType = 'blob';
    xhr.send();
  });
};
