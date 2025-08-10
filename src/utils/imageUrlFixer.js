import { supabase } from '../config/supabaseConfig';

// Utility function to check and fix image URLs
export const checkImageUrl = async (url) => {
  if (!url) return null;
  
  try {
    // Test if the URL is accessible
    const response = await fetch(url);
    if (response.ok) {
      console.log('✅ Image URL is accessible:', url);
      return url;
    } else {
      console.log('❌ Image URL not accessible:', url);
      return null;
    }
  } catch (error) {
    console.log('❌ Error checking image URL:', url, error);
    return null;
  }
};

// Function to get a corrected URL if the original doesn't work
export const getCorrectedImageUrl = (originalUrl) => {
  if (!originalUrl) return null;
  
  // If the URL contains 'reports/reports/', try removing the duplicate
  if (originalUrl.includes('reports/reports/')) {
    const correctedUrl = originalUrl.replace('reports/reports/', 'reports/');
    console.log('🔄 Attempting corrected URL:', correctedUrl);
    return correctedUrl;
  }
  
  return originalUrl;
};

// Function to list all files in the reports bucket for debugging
export const listBucketFiles = async () => {
  try {
    const { data, error } = await supabase.storage.from('reports').list();
    if (error) {
      console.error('Error listing bucket files:', error);
      return [];
    }
    
    console.log('📁 Files in reports bucket:', data);
    return data;
  } catch (error) {
    console.error('Error listing bucket files:', error);
    return [];
  }
}; 