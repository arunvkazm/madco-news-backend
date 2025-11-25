import express from 'express';
import multer from 'multer';
import { uploadImage } from '../controllers/uploadController.js';
import { upload } from '../middlewares/uploadMiddleware.js';
import { auth } from '../middlewares/auth.js';

const router = express.Router();

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File size too large. Maximum size is 5MB.' });
    }
    return res.status(400).json({ message: err.message });
  }
  if (err) {
    return res.status(400).json({ message: err.message || 'File upload error' });
  }
  next();
};

// POST /api/v1/upload/image - Upload image to Cloudinary
router.post('/image', auth, upload.single('image'), handleMulterError, uploadImage);

export default router;

