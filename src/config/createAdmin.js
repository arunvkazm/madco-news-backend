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

// Function to create admin
async function createAdmin({ name, email, password }) {
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      console.log(`⚠️ Admin with email ${email} already exists`);
      return;
    }

    const admin = new User({
      name,
      email,
      password,
      role: "admin",
      isVerified: true,
      otpVerified: true,
    });

    await admin.save();
    console.log(`✅ Admin created successfully: ${email}`);
  } catch (err) {
    console.error("❌ Error creating admin:", err);
  } finally {
    mongoose.disconnect();
  }
}

// CHANGE THESE VALUES BEFORE RUNNING
createAdmin({
  name: "Super Admin",
  email: "admin@madco.in",
  password: "SecurePassword123!",
});
