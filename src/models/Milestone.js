import mongoose from "mongoose";

const MilestoneSchema = new mongoose.Schema({
  name: String,
  description: String,

  // TIME-BASED milestone (in seconds)
  targetSeconds: {
    type: Number,
    required: true,
  },

  rewardText: String,
  order: Number,
}, { timestamps: true });

export default mongoose.model("Milestone", MilestoneSchema);
