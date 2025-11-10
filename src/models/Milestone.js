import mongoose from "mongoose";

const MilestoneSchema = new mongoose.Schema({
  name: String,
  description: String,
  targetReads: Number, // e.g., 40 articles
  rewardText: String, // e.g., "Level 1 Reader"
  order: Number, // milestone order
}, { timestamps: true });

export default mongoose.model("Milestone", MilestoneSchema);
