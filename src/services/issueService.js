import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/supabaseConfig';

const getFileExtensionFromUri = (uri) => {
  try {
    const lower = uri.split('?')[0].toLowerCase();
    const parts = lower.split('.');
    const ext = parts[parts.length - 1];
    if (ext === 'jpg' || ext === 'jpeg' || ext === 'png') {
      return ext === 'jpeg' ? 'jpg' : ext;
    }
    return 'jpg';
  } catch (e) {
    return 'jpg';
  }
};

const getMimeTypeFromExt = (ext) => {
  switch (ext) {
    case 'png':
      return 'image/png';
    case 'jpg':
    case 'jpeg':
    default:
      return 'image/jpeg';
  }
};

const generateReportFilename = (ext) => `report_${Date.now()}.${ext}`;

export const uploadImageToStorage = async (uri) => {
  if (!uri) {
    throw new Error('Image URI is required');
  }

  const ext = getFileExtensionFromUri(uri);
  const mime = getMimeTypeFromExt(ext);
  const filePath = generateReportFilename(ext);

  const form = new FormData();
  form.append('file', {
    uri,
    name: filePath,
    type: mime,
  });

  const endpoint = `${SUPABASE_URL}/storage/v1/object/reports/${encodeURIComponent(filePath)}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'multipart/form-data',
    },
    body: form,
  });

  if (!res.ok) {
    let message = `Upload failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson?.message) message = errJson.message;
    } catch {}
    throw new Error(message);
  }

  const { data } = supabase.storage.from('reports').getPublicUrl(filePath);
  return data.publicUrl;
};

export default {
  uploadImageToStorage,
};


