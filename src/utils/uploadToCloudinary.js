import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from "dotenv";
dotenv.config();

// Initialize Cloudinary configuration
function configureCloudinary() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME;
  const api_key = process.env.CLOUDINARY_API_KEY;
  const api_secret = process.env.CLOUDINARY_API_SECRET;

  if (!cloud_name || !api_key || !api_secret) {
    console.error('⚠️ Cloudinary configuration missing in uploadToCloudinary');
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

export async function uploadToCloudinary(imagePath, options = {}) {
  // add a tag to make deletion easier later
  const uploadOptions = {
    folder: options.folder || 'news_images',
    tags: options.tags || ['autodelete_6m'],
    use_filename: true,
    unique_filename: true,
    resource_type: 'image'
  };

  const result = await cloudinary.uploader.upload(imagePath, uploadOptions);
  // cleanup local file if you want
  try { fs.unlinkSync(imagePath); } catch(e){ /* ignore */ }

  return {
    url: result.secure_url,
    public_id: result.public_id,
    created_at: result.created_at
  };
}

