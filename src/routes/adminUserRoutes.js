import express from 'express';
import { getAllUsers, toggleUserStatus, deleteUser } from '../controllers/adminController.js';
import { adminMiddleware } from '../middlewares/adminMiddleware.js';

const router = express.Router();

router.use(adminMiddleware); // Protect all routes

router.get('/users', getAllUsers);
router.put('/users/:id/toggle', toggleUserStatus);
router.delete('/users/:id', deleteUser);

export default router;
