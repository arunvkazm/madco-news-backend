import express from 'express';
import { getAllAppUsers, updateAppUser, toggleAppUserStatus,deleteAppUser } from '../controllers/userManagementController.js';
import { adminMiddleware } from '../middlewares/adminMiddleware.js';
import {requireRole} from '../middlewares/requireRole.js';


const router = express.Router();

router.use(adminMiddleware,requireRole("super_admin")); // Protect all routes

router.get('/get-all', getAllAppUsers);
router.put('/:id/toggle', toggleAppUserStatus);
router.put('/:id', updateAppUser);
router.delete('/:id', deleteAppUser);

export default router;
