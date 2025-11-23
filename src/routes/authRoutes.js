import express from 'express';
import { register, login,adminLogin, refreshToken, logout,verifyOtp,forgotPassword,resetPassword, verifyAuth } from '../controllers/authController.js';
import { auth } from '../middlewares/auth.js';
const router = express.Router();

router.post('/register', register);
router.post('/verify-otp',verifyOtp);
router.post('/forgot-password',forgotPassword);
router.post('/reset-password',resetPassword);
router.post('/login', login);
router.post('/admin-login', adminLogin);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.get('/verify', auth, verifyAuth); // Verify authentication status


export default router;
