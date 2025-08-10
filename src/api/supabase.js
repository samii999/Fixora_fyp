import 'react-native-url-polyfill/auto';
import { decode as atob } from 'base-64';
import * as FileSystem from 'expo-file-system';
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
    console.log('[uploadToSupabase] uri:', uri);
    console.log('[uploadToSupabase] fileName:', fileName, 'fileType:', fileType);

    let uploadData, options;

    if (uri.startsWith('file://')) {
      // Read file as base64
      console.log('[uploadToSupabase] Reading file as base64...');
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      uploadData = base64;
      options = {
        contentType: fileType,
        upsert: true,
      };
      console.log('[uploadToSupabase] Uploading base64 string, length:', base64.length);
    } else {
      // For remote URIs, use fetch and blob
      console.log('[uploadToSupabase] Fetching remote URI...');
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      uploadData = await response.blob();
      options = {
        contentType: fileType,
        upsert: true,
      };
      console.log('[uploadToSupabase] Uploading blob, size:', uploadData.size);
    }

    // Upload to Supabase Storage
    console.log('[uploadToSupabase] Uploading to Supabase...');
    const { error } = await supabase.storage.from(bucket).upload(fileName, uploadData, options);

    if (error) {
      console.error('[uploadToSupabase] Supabase upload error:', error);
      throw error;
    }

    // Generate public URL using the same fileName (no extra path)
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    console.log('[uploadToSupabase] Uploaded file:', fileName, 'Public URL:', data.publicUrl);
    return data.publicUrl;
  } catch (error) {
    console.error('[uploadToSupabase] Error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};
