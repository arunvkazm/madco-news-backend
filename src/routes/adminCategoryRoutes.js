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
router.post('/add',adminMiddleware, addCategory);              // Add category
router.get('/',auth, getAllCategories);          // List categories
router.put('/:id',adminMiddleware, updateCategory);         // Update category
router.delete('/:id',adminMiddleware, deleteCategory); 
router.post('/bulk',adminMiddleware,bulkCategoryAdd) ;    // Delete category

export default router;
