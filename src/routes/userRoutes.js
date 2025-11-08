import express from 'express';
import {
  selectCategories
} from '../controllers/userController.js';

import {auth} from '../middlewares/auth.js';

const router = express.Router();


// CRUD routes
router.post('/select-categories',auth, selectCategories);    

export default router;
