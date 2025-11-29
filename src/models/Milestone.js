import mongoose from "mongoose";

export const RewardSchema = new mongoose.Schema(
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
    provider: String,
    couponCode: String,
    link: String,
    amount: Number,
    currency: {
      type: String,
      default: "INR",
    },
    meta: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const MilestoneSchema = new mongoose.Schema(
  {
    name: String,
    description: String,
    targetSeconds: { type: Number, required: true },
    order: { type: Number, required: true, unique: true },

    reward: {
      type: RewardSchema,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Milestone", MilestoneSchema);
