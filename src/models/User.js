import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const { Schema } = mongoose;

const RefreshTokenSchema = new Schema({
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  ip: { type: String },
  userAgent: { type: String },
});

// ✅ New: Schema for OTP verification (used for registration & forgot password)
const OTPSchema = new Schema({
  code: { type: String },
  expiresAt: { type: Date },
  purpose: { type: String, enum: ['verifyEmail', 'forgotPassword'] }, // clear intent
});

const UserSchema = new Schema(
  {
    name: { type: String },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },

    // Email verification flag
    isVerified: { type: Boolean, default: false },

    // Refresh tokens (for multi-device login)
    refreshTokens: [RefreshTokenSchema],

    // ✅ New fields for OTP-based flow
    otp: OTPSchema,
    otpVerified: { type: Boolean, default: false }, // useful for registration verification

    // ✅ New: Password reset timestamp
    passwordChangedAt: { type: Date },
  },
  { timestamps: true }
);

// Pre-save hook to hash password
UserSchema.pre('save', async function (next) {
  const user = this;
  if (!user.isModified('password')) return next();
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
  const hash = await bcrypt.hash(user.password, saltRounds);
  user.password = hash;

  // If password changed, update timestamp
  if (!user.isNew) {
    user.passwordChangedAt = Date.now();
  }

  next();
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// ✅ Method to check if OTP is valid
UserSchema.methods.isOtpValid = function (otpCode) {
  if (
    !this.otp ||
    !this.otp.code ||
    !this.otp.expiresAt ||
    this.otp.expiresAt < Date.now()
  ) {
    return false;
  }
  return this.otp.code === otpCode;
};

export default mongoose.model('User', UserSchema);
