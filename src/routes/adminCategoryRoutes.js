import express from 'express';
import {
  addCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
} from '../controllers/adminController.js';

import { adminMiddleware } from '../middlewares/adminMiddleware.js';

const router = express.Router();

// Protect all routes for admins
router.use(adminMiddleware);

// CRUD routes
router.post('/', addCategory);              // Add category
router.get('/', getAllCategories);          // List categories
router.put('/:id', updateCategory);         // Update category
router.delete('/:id', deleteCategory);      // Delete category

export default router;
