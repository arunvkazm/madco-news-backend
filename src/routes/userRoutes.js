import express from 'express';
import {
  selectCategories,
  getMyProfile
} from '../controllers/userController.js';

import {auth} from '../middlewares/auth.js';

const router = express.Router();

router.use(auth);

// CRUD routes
router.post('/select-categories', selectCategories);
router.post('/me',getMyProfile)    

export default router;
