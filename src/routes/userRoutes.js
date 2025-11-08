import express from 'express';
import {
  selectCategories,
  getMyProfile,
  updateProfile
} from '../controllers/userController.js';

import {auth} from '../middlewares/auth.js';

const router = express.Router();

router.use(auth);

// CRUD routes
router.post('/select-categories', selectCategories);
router.get('/me',getMyProfile)  
router.put("/update-profile", updateProfile);


export default router;
