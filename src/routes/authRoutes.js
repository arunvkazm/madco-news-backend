import express from 'express';
import { register, login, refreshToken, logout,verifyOtp,forgotPassword,resetPassword } from '../controllers/authController.js';
const router = express.Router();

router.post('/register', register);
router.post('/verify-otp',verifyOtp);
router.post('/forgot-password',forgotPassword);
router.post('/reset-password',resetPassword);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);


export default router;
