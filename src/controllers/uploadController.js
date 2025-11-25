import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * 📤 UPLOAD IMAGE TO CLOUDINARY
 * Accepts multipart/form-data with 'image' field
 */
export async function uploadImage(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Upload to Cloudinary using buffer
    const uploadOptions = {
      folder: 'yourdoc/news',
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
          if (error) reject(error);
          else resolve(result);
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
    console.error('Upload error:', err);
    res.status(500).json({ message: 'Failed to upload image', error: err.message });
  }
}

