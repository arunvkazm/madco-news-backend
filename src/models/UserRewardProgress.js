import mongoose from "mongoose";

const UserRewardProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  totalReadSeconds: { type: Number, default: 0 },
  completedMilestones: [
    {
      milestoneId: { type: mongoose.Schema.Types.ObjectId, ref: "Milestone" },
      completedAt: Date
    }
  ]
}, { timestamps: true });

export default mongoose.model("UserRewardProgress", UserRewardProgressSchema);
