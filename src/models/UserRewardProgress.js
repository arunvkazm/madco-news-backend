import mongoose from "mongoose";

const CompletedMilestoneSchema = new mongoose.Schema({
  milestoneId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Milestone",
    required: true,
  },
  completedAt: {
    type: Date,
    required: true,
  },

  // 🔥 NEW FIELDS
  claimed: {
    type: Boolean,
    default: false,
  },
  claimedAt: {
    type: Date,
  },
});

const UserRewardProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    totalReadSeconds: {
      type: Number,
      default: 0,
    },
    completedMilestones: [CompletedMilestoneSchema],
  },
  { timestamps: true }
);

export default mongoose.model(
  "UserRewardProgress",
  UserRewardProgressSchema
);
