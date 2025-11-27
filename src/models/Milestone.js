import mongoose from "mongoose";

const RewardSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["coupon", "cash"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,

    // For coupon rewards (Amazon, Flipkart, etc.)
    provider: String,        // "Amazon", "Flipkart", etc.
    couponCode: String,      // If you assign a fixed code (optional)
    link: String,            // Landing URL (optional)

    // For cash-type rewards
    amount: Number,          // e.g. 50, 100
    currency: {
      type: String,
      default: "INR",
    },

    // Any extra info
    meta: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const MilestoneSchema = new mongoose.Schema(
  {
    name: String,
    description: String,

    // TIME-BASED milestone (in seconds)
    targetSeconds: {
      type: Number,
      required: true,
    },

    order: {
      type: Number,
      required: true,
      unique: true,
    },

    // NEW: full reward object per milestone
    reward: {
      type: RewardSchema,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Milestone", MilestoneSchema);
