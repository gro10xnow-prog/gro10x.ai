const { supabase, isSupabaseConfigured } = require('./supabase');

async function uploadFile(bucketName, filePath, fileBuffer, contentType) {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Storage upload skipped.');
    return { url: `/uploads/${filePath}` };
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error(`Storage upload error in ${bucketName}:`, error.message);
      return { error: error.message };
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return { url: publicUrlData.publicUrl, path: data.path };
  } catch (err) {
    console.error('Storage exception:', err.message);
    return { error: err.message };
  }
}

module.exports = {
  uploadFile
};
