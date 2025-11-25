import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Cloudinary configuration
function configureCloudinary() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud_name || !api_key || !api_secret) {
    console.error('⚠️ Cloudinary configuration missing:', {
      cloud_name: !!cloud_name,
      api_key: !!api_key,
      api_secret: !!api_secret,
      node_env: process.env.NODE_ENV,
    });
    return false;
  }

  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
  });

  return true;
}

// Configure on module load
configureCloudinary();

/**
 * 📤 UPLOAD IMAGE TO CLOUDINARY
 * Accepts multipart/form-data with 'image' field
 */
export async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Re-configure Cloudinary to ensure we have latest env vars (important for production)
    const isConfigured = configureCloudinary();
    
    // Validate Cloudinary configuration
    if (!isConfigured) {
      console.error('❌ Cloudinary configuration missing:', {
        cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
        api_key: !!process.env.CLOUDINARY_API_KEY,
        api_secret: !!process.env.CLOUDINARY_API_SECRET,
        node_env: process.env.NODE_ENV,
      });
      return res.status(500).json({ 
        message: 'Failed to upload image', 
        error: 'Cloudinary configuration is missing. Please check environment variables on Render.',
        hint: 'Ensure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are set in Render environment variables.'
      });
    }

    // Upload to Cloudinary using buffer
    const uploadOptions = {
      folder: 'madco/news',
      tags: ['autodelete_6m'],
      use_filename: true,
      unique_filename: true,
      resource_type: 'image',
    };

    // Convert buffer to data URI or use upload_stream
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Write buffer to upload stream
      uploadStream.end(req.file.buffer);
    });

    res.json({
      message: 'Image uploaded successfully',
      url: result.secure_url,
      public_id: result.public_id,
      created_at: result.created_at,
    });
  } catch (err) {
    console.error('❌ Upload error:', err);
    console.error('Error details:', {
      message: err.message,
      http_code: err.http_code,
      name: err.name,
      node_env: process.env.NODE_ENV,
      has_cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
      has_api_key: !!process.env.CLOUDINARY_API_KEY,
      has_api_secret: !!process.env.CLOUDINARY_API_SECRET,
    });
    
    // Provide more specific error messages
    let errorMessage = err.message || 'Failed to upload image';
    let hint = '';
    
    if (err.message && err.message.includes('Invalid Signature')) {
      errorMessage = 'Cloudinary authentication failed. Please check API credentials.';
      hint = 'The API secret might be incorrect. Verify CLOUDINARY_API_SECRET in Render environment variables matches your Cloudinary dashboard.';
    } else if (err.message && err.message.includes('Invalid api_key')) {
      errorMessage = 'Invalid Cloudinary API key. Please check your configuration.';
      hint = 'Verify CLOUDINARY_API_KEY in Render environment variables matches your Cloudinary dashboard.';
    } else if (err.message && err.message.includes('Invalid cloud_name')) {
      errorMessage = 'Invalid Cloudinary cloud name. Please check your configuration.';
      hint = 'Verify CLOUDINARY_CLOUD_NAME in Render environment variables matches your Cloudinary dashboard.';
    } else if (err.http_code === 401) {
      errorMessage = 'Cloudinary authentication failed. Invalid credentials.';
      hint = 'Check all three Cloudinary environment variables (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) in Render.';
    }
    
    res.status(500).json({ 
      message: 'Failed to upload image', 
      error: errorMessage,
      hint: hint || undefined,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
}

