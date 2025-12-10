import User from "../models/User.js";
import Milestone from "../models/Milestone.js";
import UserRewardProgress from "../models/UserRewardProgress.js"; // ✅ ADD THIS

// 🔹 Record read + update stats + milestone PROGRESS (time based)
export async function recordNewsRead(req, res) {
  try {
    const { timeSpent, readCount } = req.body;

    const user = await User.findById(req.user.id).populate("stats.currentMilestone");
    if (!user) return res.status(404).json({ message: "User not found" });

    const safeTime = Number(timeSpent) > 0 ? Number(timeSpent) : 0;
    const safeCount = Number(readCount) > 0 ? Number(readCount) : 1;

    // Update basic stats
    user.stats.totalReadNews += safeCount;
    user.stats.totalSpentTime += safeTime;  

    // Increase time only for current milestone
    user.stats.milestoneTimeSpent += safeTime;

    // Fetch milestones
    const milestones = await Milestone.find().sort({ order: 1 });

    // If first time, assign milestone 1
    if (!user.stats.currentMilestone && milestones.length > 0) {
      user.stats.currentMilestone = milestones[0]._id;
      user.stats.milestoneTimeSpent = 0;
    }

    const current = await Milestone.findById(user.stats.currentMilestone);
    if (!current) {
      await user.save();
      return res.json({ message: "Recorded (no milestones configured)" });
    }

    // Calculate progress (only using milestoneTimeSpent)
    const progress = Math.min(
      (user.stats.milestoneTimeSpent / current.targetSeconds) * 100,
      100
    );

    user.stats.milestoneProgress = Math.round(progress);

    // Check completion
    if (progress >= 100) {
      // Move to next milestone
      const next = milestones.find((m) => m.order > current.order);

      if (next) {
        user.stats.currentMilestone = next._id;
        user.stats.milestoneProgress = 0;
        user.stats.milestoneTimeSpent = 0;  // RESET for next milestone
      }
    }

    await user.save();

    return res.json({
      message: "Read event recorded",
      milestoneProgress: user.stats.milestoneProgress,
      totalSpentTime: user.stats.totalSpentTime,
      milestoneTimeSpent: user.stats.milestoneTimeSpent,
      currentMilestone: user.stats.currentMilestone,
    });

  } catch (err) {
    console.error("recordNewsRead error:", err);
    res.status(500).json({ message: "Server error" });
  }
}


// 🔹 Stats + current & next milestone (time-based + reward)
export async function getUserStats(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("-password -refreshTokens")
      .populate(
        "stats.currentMilestone",
        "name description targetSeconds order reward"
      );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const currentMilestone = user.stats.currentMilestone;

    let nextMilestone = null;
    if (currentMilestone) {
      nextMilestone = await Milestone.findOne({
        order: currentMilestone.order + 1,
      }).select("name description targetSeconds order reward");
    } else {
      nextMilestone = await Milestone.findOne({ order: 1 }).select(
        "name description targetSeconds order reward"
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
        currentMilestone,
        nextMilestone,
      },
    });
  } catch (err) {
    console.error("Stats error =>", err);
    res.status(500).json({ message: "Server error" });
  }
}


// 🔹 Time-based reward unlocking (UserRewardProgress)
export async function addReadingTime(req, res) {
  try {
    const userId = req.user.id;
    const { seconds } = req.body;

    if (!seconds || seconds <= 0) {
      return res.status(400).json({ message: "Invalid seconds" });
    }

    let progress = await UserRewardProgress.findOne({ userId });

    if (!progress) {
      progress = await UserRewardProgress.create({
        userId,
        totalReadSeconds: seconds,
        completedMilestones: []
      });
    } else {
      progress.totalReadSeconds += seconds;
      await progress.save();
    }

    const milestones = await Milestone.find().sort({ targetSeconds: 1 });


    const newlyUnlocked = [];
    const alreadyUnlocked = [];

    const completedMap = new Map();
    for (const cm of progress.completedMilestones) {
      completedMap.set(String(cm.milestoneId), cm.completedAt);
    }

    for (const m of milestones) {
      const idStr = String(m._id);
      const alreadyDone = completedMap.has(idStr);

      if (!alreadyDone && progress.totalReadSeconds >= m.targetSeconds) {
        const completedAt = new Date();

        progress.completedMilestones.push({
          milestoneId: m._id,
          completedAt
        });

        newlyUnlocked.push({
          milestoneId: m._id,
          name: m.name,
          reward: m.reward,
          completedAt
        });

        completedMap.set(idStr, completedAt);
      } else if (alreadyDone) {
        alreadyUnlocked.push({
          milestoneId: m._id,
          name: m.name,
          reward: m.reward,
          completedAt: completedMap.get(idStr)
        });
      }
    }

    await progress.save();

    const completedIds = new Set(
      progress.completedMilestones.map((m) => String(m.milestoneId))
    );

    const nextMilestone = milestones.find(
      (m) => !completedIds.has(String(m._id))
    );

    let nextInfo = null;
    if (nextMilestone) {
      nextInfo = {
        id: nextMilestone._id,
        name: nextMilestone.name,
        description: nextMilestone.description,
        order: nextMilestone.order,
        targetSeconds: nextMilestone.targetSeconds,
        remainingSeconds: Math.max(
          nextMilestone.targetSeconds - progress.totalReadSeconds,
          0
        ),
        reward: nextMilestone.reward
      };
    }

    const hadNewUnlocks = newlyUnlocked.length > 0;

    return res.json({
      message: "Time added successfully",
      totalReadSeconds: progress.totalReadSeconds,
      hadNewUnlocks,
      unlockCount: newlyUnlocked.length,
      newlyUnlocked,
      alreadyUnlocked,
      nextMilestone: nextInfo
    });

  } catch (err) {
    console.error("addReadingTime error:", err);
    res.status(500).json({ message: "Server error" });
  }
}


export async function getNextMilestoneTarget(req, res) {
  try {
    const userId = req.user.id;

    // Get or initialize progress
    let progress = await UserRewardProgress.findOne({ userId });
    if (!progress) {
      progress = await UserRewardProgress.create({
        userId,
        totalReadSeconds: 0,
        completedMilestones: [],
      });
    }

   const milestones = await Milestone.find().sort({ targetSeconds: 1 });


    if (!milestones.length) {
      return res.json({
        hasMore: false,
        nextMilestone: null,
        message: "No milestones configured",
      });
    }

    // Get IDs of milestones already completed
    const completedIds = new Set(
      progress.completedMilestones.map((m) => String(m.milestoneId))
    );

   // first not completed in ascending targetSeconds
    const nextMilestone = milestones.find(
      (m) => !completedIds.has(String(m._id))
    );

    if (!nextMilestone) {
      return res.json({
        hasMore: false,
        nextMilestone: null,
        message: "All milestones completed",
      });
    }

    const remainingSeconds = Math.max(
      nextMilestone.targetSeconds - progress.totalReadSeconds,
      0
    );

    return res.json({
      hasMore: true,
      totalReadSeconds: progress.totalReadSeconds,
      nextMilestone: {
        id: nextMilestone._id,
        name: nextMilestone.name,
        description: nextMilestone.description,
        order: nextMilestone.order,
        targetSeconds: nextMilestone.targetSeconds,
        remainingSeconds,
        reward: nextMilestone.reward, // full reward object
      },
    });
  } catch (err) {
    console.error("getNextMilestoneTarget error:", err);
    res.status(500).json({ message: "Server error" });
  }
}
