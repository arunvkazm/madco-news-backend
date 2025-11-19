import express from 'express';
import {createAdminUser,getAllAdminUsers,updateAdminUser,deleteAdminUser} from '../controllers/adminUserController.js';
import { adminMiddleware } from '../middlewares/adminMiddleware.js';
import {requireRole} from '../middlewares/requireRole.js';
const router = express.Router();

// Protect all routes for admins
 router.use(adminMiddleware,requireRole("super_admin", "sub_admin")); 

router.get('/get-all', getAllAdminUsers);
router.post('/create-user', createAdminUser);
router.put('/update-user/:id', updateAdminUser);
router.delete('/delete-user/:id', deleteAdminUser);

export default router;

