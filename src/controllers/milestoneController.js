import Milestone from "../models/Milestone.js";

/**
 * ➕ Add Milestone with Reward
 */
export async function addMilestone(req, res) {
  try {
    const { name, description, targetSeconds, order, reward } = req.body;

    if (!name || !targetSeconds || !order || !reward || !reward.type || !reward.title) {
      return res.status(400).json({
        message: "name, targetSeconds, order & reward (type, title) are required",
      });
    }

    const exists = await Milestone.findOne({ order });
    if (exists) {
      return res.status(409).json({ message: "Milestone order already exists" });
    }

    const milestone = await Milestone.create({
      name,
      description,
      targetSeconds,
      order,
      reward,
    });

    return res.status(201).json({
      message: "Milestone created successfully",
      milestone,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}


/**
 * 📜 Get All Milestones
 */
export async function getMilestones(req, res) {
  try {
    const milestones = await Milestone.find().sort({ order: 1 });
    res.json({ milestones });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}


/**
 * ✏️ Update Milestone
 */
export async function updateMilestone(req, res) {
  try {
    const { id } = req.params;

    const milestone = await Milestone.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!milestone)
      return res.status(404).json({ message: "Milestone not found" });

    res.json({
      message: "Milestone updated successfully",
      milestone,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}


/**
 * ❌ Delete Milestone
 */
export async function deleteMilestone(req, res) {
  try {
    const { id } = req.params;

    const milestone = await Milestone.findByIdAndDelete(id);
    if (!milestone)
      return res.status(404).json({ message: "Milestone not found" });

    res.json({
      message: "Milestone deleted successfully",
      id
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
}
