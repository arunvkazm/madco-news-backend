import express from 'express';
import {
  addCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  bulkCategoryAdd
} from '../controllers/adminController.js';

import { adminMiddleware } from '../middlewares/adminMiddleware.js';
import {auth} from '../middlewares/auth.js';

const router = express.Router();

// Protect all routes for admins
// router.use(adminMiddleware);

// CRUD routes
router.post('/admin/categories/add',adminMiddleware, addCategory);              // Add category
router.get('/categories',auth, getAllCategories);          // List categories
router.put('/admin/categories/:id',adminMiddleware, updateCategory);         // Update category
router.delete('/admin/categories/:id',adminMiddleware, deleteCategory); 
router.post('/admin/categories/bulk',adminMiddleware,bulkCategoryAdd) ;    // Delete category

export default router;
