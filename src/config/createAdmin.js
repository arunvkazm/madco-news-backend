import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User.js";

dotenv.config();

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ DB connection error:", err);
    process.exit(1);
  });

// Function to create super admin
async function createSuperAdmin({ name, email, password, phoneNumber, country }) {
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`⚠️ User with email ${email} already exists`);
      return;
    }

    const admin = new User({
      name,
      email,
      password,

      // Updated role
      role: "super_admin",

      // Optional new fields
      phoneNumber: phoneNumber || null,
      country: country || null,

      // User status field
      userStatus: "active",

      // Verification
      isVerified: true,
      otpVerified: true,
    });

    await admin.save();
    console.log(`✅ Super Admin created successfully: ${email}`);
  } catch (err) {
    console.error("❌ Error creating super admin:", err);
  } finally {
    mongoose.disconnect();
  }
}

// CHANGE VALUES BEFORE RUNNING
createSuperAdmin({
  name: "Super Admin",
  email: "admin@madco.in",
  password: "SecurePassword123!",
  phoneNumber: "+919876543210",
  country: "India",
});
