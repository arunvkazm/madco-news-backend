import User from "../models/User.js";
import Milestone from "../models/Milestone.js";

export async function recordNewsRead(req, res) {
  try {
    const { newsId, timeSpent } = req.body; // timeSpent in seconds

    const user = await User.findById(req.user.id).populate(
      "stats.currentMilestone"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    // ✅ Update stats
    user.stats.totalReadNews += 1;
    user.stats.totalSpentTime += Number(timeSpent || 0);

    // ✅ Handle milestones
    const milestones = await Milestone.find().sort({ order: 1 });

    // If no milestone assigned yet, assign first one
    if (!user.stats.currentMilestone) {
      user.stats.currentMilestone = milestones[0]?._id;
    }

    const current = await Milestone.findById(user.stats.currentMilestone);
    const target = current?.targetReads || 1;
    const read = user.stats.totalReadNews;

    // ✅ Calculate progress %
    let progress = Math.min((read / target) * 100, 100);
    user.stats.milestoneProgress = Math.round(progress);

    // ✅ If milestone reached, move to next
    if (progress >= 100) {
      const next = milestones.find((m) => m.order > current.order);
      if (next) {
        user.stats.currentMilestone = next._id;
        user.stats.milestoneProgress = 0;
      }
    }

    await user.save();

    return res.json({
      message: "Read event recorded",
      totalReadNews: user.stats.totalReadNews,
      milestoneProgress: user.stats.milestoneProgress,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}


export async function getUserStats(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -refreshTokens")
      .populate("stats.currentMilestone", "name targetReads rewardText order");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentMilestone = user.stats.currentMilestone;

    // ✅ find next milestone only if current milestone exists
    let nextMilestone = null;
    if (currentMilestone) {
      nextMilestone = await Milestone.findOne({
        order: currentMilestone.order + 1
      }).select("name targetReads rewardText order");
    } else {
      // If user has no milestone assigned yet
      nextMilestone = await Milestone.findOne({ order: 1 }).select(
        "name targetReads rewardText order"
      );
    }

    return res.json({
      message: "User stats fetched",
      user: {
        name: user.name,
        email: user.email,
      },
      stats: {
        ...user.stats.toObject(),
        nextMilestone,
      }
    });

  } catch (err) {
    console.error("Stats error =>", err);
    res.status(500).json({ message: "Server error" });
  }
}

export async function addReadingTime(req, res) {
  try {
    const userId = req.user._id;
    const { seconds } = req.body;

    if (!seconds || seconds <= 0) {
      return res.status(400).json({ message: "Invalid seconds" });
    }

    let progress = await UserRewardProgress.findOne({ userId });

    if (!progress) {
      progress = await UserRewardProgress.create({
        userId,
        totalReadSeconds: seconds,
      });
    } else {
      progress.totalReadSeconds += seconds;
      await progress.save();
    }

    const milestones = await Milestone.find().sort({ order: 1 });

    const newlyUnlocked = [];

    for (const m of milestones) {
      const alreadyDone = progress.completedMilestones.find(
        (x) => String(x.milestoneId) === String(m._id)
      );

      if (!alreadyDone && progress.totalReadSeconds >= m.targetSeconds) {
        progress.completedMilestones.push({
          milestoneId: m._id,
          completedAt: new Date(),
        });

        newlyUnlocked.push({
          milestoneId: m._id,
          name: m.name,
          reward: m.reward, 
        });
      }
    }

    await progress.save();

    return res.json({
      message: "Time added successfully",
      totalReadSeconds: progress.totalReadSeconds,
      unlockedRewards: newlyUnlocked,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

