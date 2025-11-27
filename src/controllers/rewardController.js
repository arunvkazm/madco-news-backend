import UserRewardProgress from "../models/UserRewardProgress.js";
import User from "../models/User.js";
import Milestone from "../models/Milestone.js";


export async function getMyRewards(req, res) {
  try {
    const userId = req.user.id;

    const progress = await UserRewardProgress.findOne({ userId })
      .populate("completedMilestones.milestoneId");

    if (!progress) {
      return res.json({ rewards: [] });
    }

    const rewards = progress.completedMilestones.map((entry) => {
      const milestone = entry.milestoneId;
      if (!milestone) return null;

      return {
        milestoneId: milestone._id,
        milestoneName: milestone.name,
        milestoneDescription: milestone.description,
        targetSeconds: milestone.targetSeconds,
        order: milestone.order,

        reward: milestone.reward, // full reward object

        completedAt: entry.completedAt,
      };
    }).filter(Boolean);

    return res.json({ rewards });
  } catch (err) {
    console.error("getMyRewards error:", err);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getRewardedUsers(req, res) {
  try {
    const { milestoneId, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (milestoneId) {
      filter["completedMilestones.milestoneId"] = milestoneId;
    }

    const progressDocs = await UserRewardProgress.find(filter)
      .populate("userId", "name email phoneNumber country")
      .populate("completedMilestones.milestoneId")
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const results = [];

    for (const progress of progressDocs) {
      for (const entry of progress.completedMilestones) {
        const milestone = entry.milestoneId;
        if (!milestone) continue;

        // If filtered by milestoneId, skip others
        if (milestoneId && String(milestone._id) !== String(milestoneId)) {
          continue;
        }

        results.push({
          user: {
            id: progress.userId._id,
            name: progress.userId.name,
            email: progress.userId.email,
            phoneNumber: progress.userId.phoneNumber,
            country: progress.userId.country,
          },
          milestone: {
            id: milestone._id,
            name: milestone.name,
            description: milestone.description,
            order: milestone.order,
            targetSeconds: milestone.targetSeconds,
          },
          reward: milestone.reward,       // full reward details
          completedAt: entry.completedAt, // when user unlocked it
        });
      }
    }

    return res.json({
      page: Number(page),
      limit: Number(limit),
      count: results.length,
      data: results,
    });
  } catch (err) {
    console.error("getRewardedUsers error:", err);
    res.status(500).json({ message: "Server error" });
  }
}
