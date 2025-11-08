import User from "../models/User.js";
import crypto from "crypto";
import { sendEmail } from "../utils/sendEmail.js";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/tokens.js";

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";

/**
 * REGISTER USER + SEND OTP
 */
export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({
        message: "Email and password required",
        key: "MISSING_FIELDS",
      });

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({
        message: "Email already in use",
        key: "EMAIL_EXISTS",
      });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = new User({
      name,
      email,
      password,
      otp: {
        code: otpCode,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        purpose: "verifyEmail",
      },
      isVerified: false,
    });

    await user.save();

    // ✅ Async email (no await)
    sendEmail(
      email,
      "Verify your Madco News account",
      `Your OTP is ${otpCode}`
    ).catch(err => console.error("Email send error:", err));

    return res.status(201).json({
      message: "OTP sent to your email for verification",
      key: "OTP_SENT",
      user: { id: user._id, email: user.email },
    });
  } catch (err) {
    next(err);
  }
}


/**
 * VERIFY OTP (For registration & forgot password)
 */
export async function verifyOtp(req, res, next) {
  try {
    const { email, otp } = req.body;

    if (!email || !otp)
      return res.status(400).json({
        message: "Email and OTP required",
        key: "MISSING_FIELDS",
      });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({
        message: "User not found",
        key: "USER_NOT_FOUND",
      });

    // Validate OTP
    if (
      !user.otp ||
      user.otp.code !== otp ||
      user.otp.expiresAt < Date.now()
    ) {
      return res.status(400).json({
        message: "Invalid or expired OTP",
        key: "INVALID_OTP",
      });
    }

    // ✅ OTP for email verification
    if (user.otp.purpose === "verifyEmail") {
      user.isVerified = true;
      user.otpVerified = true;
      user.otp = undefined; // clear otp

      // 🎯 Generate temporary tokens for onboarding
      const accessToken = generateAccessToken({ sub: user._id, role: user.role });
      const refreshToken = generateRefreshToken({ sub: user._id, role: user.role });

      // store refresh token for session
      user.refreshTokens.push({ token: refreshToken });
      await user.save();

      return res.status(200).json({
        message: "OTP verified successfully. Please select categories.",
        key: "OTP_VERIFIED_SELECT_CATEGORIES",
        next: "SELECT_CATEGORIES",
        accessToken,
        refreshToken,
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN
      });
    }

    // ✅ OTP for Forgot Password Flow
    if (user.otp.purpose === "forgotPassword") {
      user.otp = undefined;
      await user.save();

      return res.status(200).json({
        message: "OTP verified successfully. You can reset your password now.",
        key: "OTP_VERIFIED_RESET_PASSWORD",
        next: "RESET_PASSWORD",
      });
    }

  } catch (err) {
    next(err);
  }
}



/**
 * LOGIN USER
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({
        message: "Email and password required",
        key: "MISSING_FIELDS"
      });

    const user = await User.findOne({ email });
    if (!user)
      return res.status(401).json({
        message: "Invalid credentials",
        key: "INVALID_CREDENTIALS"
      });

    const ok = await user.comparePassword(password);
    if (!ok)
      return res.status(401).json({
        message: "Invalid credentials",
        key: "INVALID_CREDENTIALS"
      });

    // ✅ Not verified yet
    if (!user.isVerified)
      return res.status(403).json({
        message: "Please verify your email first",
        key: "VERIFY_OTP_FIRST",
        next: "VERIFY_OTP"
      });

    // ✅ Verified but hasn't selected categories yet
    if (!user.isCategoriesSelected)
      return res.status(403).json({
        message: "Please select your categories to continue",
        key: "SELECT_CATEGORIES_FIRST",
        next: "SELECT_CATEGORIES"
      });

    // ✅ Everything okay → generate tokens
    const accessToken = generateAccessToken({
      sub: user._id,
      role: user.role
    });
    const refreshToken = generateRefreshToken({
      sub: user._id,
      role: user.role
    });

    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    return res.json({
      message: "Login successful",
      key: "LOGIN_SUCCESS",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN
    });
  } catch (err) {
    next(err);
  }
}


// Admin Login
export async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    if (user.role !== "admin")
      return res.status(403).json({ message: "Admin access required" });

    const accessToken = generateAccessToken({ sub: user._id, role: user.role });
    const refreshToken = generateRefreshToken({
      sub: user._id,
      role: user.role,
    });

    // Store refresh token
    user.refreshTokens.push({ token: refreshToken });
    await user.save();

    return res.json({
      message: "Admin login successful",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * FORGOT PASSWORD (Send OTP)
 */
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email)
      return res
        .status(400)
        .json({ message: "Email required", key: "MISSING_EMAIL" });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ message: "User not found", key: "USER_NOT_FOUND" });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = {
      code: otpCode,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      purpose: "forgotPassword",
    };
    await user.save();

    await sendEmail(
      email,
      "Madco News - Reset Password OTP",
      `Your OTP for password reset is ${otpCode}`
    );

    return res.json({
      message: "OTP sent to your email for password reset",
      key: "OTP_SENT_FOR_RESET",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * RESET PASSWORD (Using OTP)
 */
export async function resetPassword(req, res, next) {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !newPassword)
      return res
        .status(400)
        .json({ message: "All fields required", key: "MISSING_FIELDS" });

    const user = await User.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ message: "User not found", key: "USER_NOT_FOUND" });

    user.password = newPassword;
    user.otp = undefined; // clear OTP
    await user.save();

    return res.status(200).json({
      message: "Password reset successfully",
      key: "PASSWORD_RESET_SUCCESS",
    });
  } catch (err) {
    next(err);
  }
}

/**
 * REFRESH TOKEN
 */
export async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "Refresh token required" });

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(payload.sub);
    if (!user)
      return res.status(401).json({ message: "Invalid refresh token" });

    const existing = user.refreshTokens.find((rt) => rt.token === refreshToken);
    if (!existing) {
      user.refreshTokens = [];
      await user.save();
      return res
        .status(401)
        .json({ message: "Refresh token reuse detected. Please login again." });
    }

    user.refreshTokens = user.refreshTokens.filter(
      (rt) => rt.token !== refreshToken
    );

    const newAccessToken = generateAccessToken({
      sub: user._id,
      role: user.role,
    });
    const newRefreshToken = generateRefreshToken({
      sub: user._id,
      role: user.role,
    });

    user.refreshTokens.push({ token: newRefreshToken });
    await user.save();

    return res.json({
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * LOGOUT USER
 */
export async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken)
      return res.status(400).json({ message: "Refresh token required" });

    let payload = null;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {}

    if (!payload) {
      await User.updateMany(
        {},
        { $pull: { refreshTokens: { token: refreshToken } } }
      );
      return res.status(200).json({ message: "Logged out successfully" });
    }

    const user = await User.findById(payload.sub);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter(
        (rt) => rt.token !== refreshToken
      );
      await user.save();
    }

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
}
