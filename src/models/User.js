import mongoose from "mongoose";
import bcrypt from "bcrypt";

const { Schema } = mongoose;

/* ---------------------- Refresh Tokens Schema ---------------------- */
const RefreshTokenSchema = new Schema({
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  ip: String,
  userAgent: String,
});

/* ---------------------- OTP Schema ---------------------- */
const OTPSchema = new Schema({
  code: String,
  expiresAt: Date,
  purpose: { type: String, enum: ["verifyEmail", "forgotPassword"] },
});

/* ---------------------- User Stats Schema ---------------------- */
const UserStatsSchema = new Schema(
  {
    totalReadNews: { type: Number, default: 0 },
    totalSpentTime: { type: Number, default: 0 }, // seconds
    bookmarksCount: { type: Number, default: 0 },
    sharedCount: { type: Number, default: 0 },
    currentMilestone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Milestone",
      default: null,
    },
    milestoneProgress: { type: Number, default: 0 },
  },
  { _id: false }
);

/* ---------------------- Main User Schema ---------------------- */
const UserSchema = new Schema(
  {
    name: { type: String, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },

    role: { type: String, enum: ["user", "admin"], default: "user" },

    // Verification
    isVerified: { type: Boolean, default: false },
    otp: OTPSchema,
    otpVerified: { type: Boolean, default: false },

    // Category Selection
    preferredCategories: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    ],
    isCategoriesSelected: { type: Boolean, default: false },

    // Stats (with proper defaults)
    stats: {
      type: UserStatsSchema,
      default: () => ({
        totalReadNews: 0,
        totalSpentTime: 0,
        bookmarksCount: 0,
        sharedCount: 0,
        currentMilestone: null,
        milestoneProgress: 0,
      }),
    },
    bookmarksCount: { type: Number, default: 0 },
    passwordChangedAt: Date,
    refreshTokens: [RefreshTokenSchema],
  },
  { timestamps: true }
);

/* ---------------------- Password Hashing ---------------------- */
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || "12", 10);
  this.password = await bcrypt.hash(this.password, saltRounds);

  if (!this.isNew) {
    this.passwordChangedAt = Date.now();
  }
  next();
});

/* ---------------------- Compare Password Method ---------------------- */
UserSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

/* ---------------------- Validate OTP ---------------------- */
UserSchema.methods.isOtpValid = function (otpCode) {
  if (!this.otp || !this.otp.code || !this.otp.expiresAt) return false;
  return this.otp.code === otpCode && this.otp.expiresAt > Date.now();
};

export default mongoose.model("User", UserSchema);
