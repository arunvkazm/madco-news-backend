import mongoose from "mongoose";
import { connectDB } from "./db.js";
import User from "../models/User.js";
import Milestone from "../models/Milestone.js";
import UserRewardProgress from "../models/UserRewardProgress.js";

// Connect to database
connectDB();

async function createTestRewardData() {
  try {
    console.log("🚀 Starting test reward data creation...\n");

    // 1. Create multiple test users
    const testUsersData = [
      {
        name: "Rahul Sharma",
        email: "rahul.test@madco.in",
        phone: { number: "9876543210", countryCode: "+91" },
        country: "India",
      },
      {
        name: "Priya Patel",
        email: "priya.test@madco.in",
        phone: { number: "9876543211", countryCode: "+91" },
        country: "India",
      },
      {
        name: "Amit Kumar",
        email: "amit.test@madco.in",
        phone: { number: "9876543212", countryCode: "+91" },
        country: "India",
      },
    ];

    const testUsers = [];
    for (const userData of testUsersData) {
      let testUser = await User.findOne({ email: userData.email });
      
      if (!testUser) {
        console.log(`📝 Creating test user: ${userData.name}...`);
        testUser = await User.create({
          name: userData.name,
          email: userData.email,
          password: "Test123!@#",
          phone: userData.phone,
          country: userData.country,
          role: "user",
          isVerified: true,
          otpVerified: true,
          userStatus: "active",
        });
        console.log(`✅ Test user created: ${testUser.email} (ID: ${testUser._id})`);
      } else {
        console.log(`✅ Test user already exists: ${testUser.email} (ID: ${testUser._id})`);
      }
      testUsers.push(testUser);
    }
    console.log();

    // 2. Get all milestones
    const milestones = await Milestone.find().sort({ order: 1 });
    
    if (milestones.length === 0) {
      console.log("❌ No milestones found! Please create at least one milestone first.");
      process.exit(1);
    }

    console.log(`📊 Found ${milestones.length} milestone(s):`);
    milestones.forEach((m, i) => {
      console.log(`   ${i + 1}. ${m.name} (Order: ${m.order}, Target: ${m.targetSeconds}s)`);
    });
    console.log();

    // 3. Create UserRewardProgress for each test user
    console.log("📝 Creating UserRewardProgress for all test users...\n");
    
    for (let i = 0; i < testUsers.length; i++) {
      const testUser = testUsers[i];
      let progress = await UserRewardProgress.findOne({ userId: testUser._id });

      if (!progress) {
        progress = await UserRewardProgress.create({
          userId: testUser._id,
          totalReadSeconds: milestones[0].targetSeconds + 100 + (i * 50),
          completedMilestones: [],
        });
        console.log(`✅ UserRewardProgress created for ${testUser.name}`);
      } else {
        console.log(`✅ UserRewardProgress already exists for ${testUser.name}`);
      }

      // 4. Add completed milestones (if not already added)
      const existingMilestoneIds = progress.completedMilestones.map(
        (cm) => cm.milestoneId.toString()
      );

      // Each user completes different number of milestones for variety
      const milestonesToAdd = milestones
        .filter((m) => !existingMilestoneIds.includes(m._id.toString()))
        .slice(0, Math.min(milestones.length, i + 1)); // First user gets 1, second gets 2, etc.

      if (milestonesToAdd.length > 0) {
        console.log(`   📝 Adding ${milestonesToAdd.length} milestone(s) to ${testUser.name}'s completed list...`);
        
        const completedMilestones = milestonesToAdd.map((milestone, idx) => ({
          milestoneId: milestone._id,
          completedAt: new Date(Date.now() - (i * 7 + idx) * 24 * 60 * 60 * 1000), // Different dates for each user
        }));

        progress.completedMilestones.push(...completedMilestones);
        progress.totalReadSeconds = Math.max(
          ...milestones.map((m) => m.targetSeconds)
        ) + 500 + (i * 100);

        await progress.save();
        console.log(`   ✅ Added ${milestonesToAdd.length} milestone(s) to ${testUser.name}'s completed milestones`);
      } else {
        console.log(`   ℹ️  All milestones are already marked as completed for ${testUser.name}`);
      }
      console.log();
    }

    // 5. Display final result
    console.log("📋 Final Test Data Summary:\n");
    for (const testUser of testUsers) {
      const finalProgress = await UserRewardProgress.findOne({ userId: testUser._id })
        .populate("completedMilestones.milestoneId");

      if (finalProgress) {
        console.log(`👤 User: ${testUser.name} (${testUser.email})`);
        console.log(`   Total Read Seconds: ${finalProgress.totalReadSeconds}s`);
        console.log(`   Completed Milestones: ${finalProgress.completedMilestones.length}`);
        if (finalProgress.completedMilestones.length > 0) {
          finalProgress.completedMilestones.forEach((cm, i) => {
            const milestone = cm.milestoneId;
            if (milestone) {
              console.log(`   ${i + 1}. ${milestone.name} - Completed: ${new Date(cm.completedAt).toLocaleString()}`);
            }
          });
        }
        console.log();
      }
    }

    console.log("✅ Test reward data created successfully!");
    console.log("🌐 You can now check the frontend at /rewardmanagement\n");

  } catch (err) {
    console.error("❌ Error creating test reward data:", err);
  } finally {
    mongoose.disconnect();
    console.log("\n🔌 Database connection closed");
  }
}

// Run the script
createTestRewardData();

