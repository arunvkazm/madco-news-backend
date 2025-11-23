import User from "../models/User.js";
import News from "../models/News.js";
import Milestone from "../models/Milestone.js";
import mongoose from "mongoose";

export async function getOverview(req, res) {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    const categorySelectedUsers = await User.countDocuments({ isCategoriesSelected: true });
    
    const today = new Date();
    today.setHours(0,0,0,0);
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: today }});

    const active24Hours = await User.countDocuments({ updatedAt: { $gte: new Date(Date.now() - 24*60*60*1000)} });

    const totalNews = await News.countDocuments();
    const publishedNews = await News.countDocuments({ status: "published" });
    const draftNews = await News.countDocuments({ status: "draft" });

    const totalReads = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$stats.totalReadNews" } } }
    ]);

    const totalBookmarks = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$stats.bookmarksCount" } } }
    ]);

    return res.json({
      message: "Analytics fetched",
      data: {
        users: {
          total: totalUsers,
          verifiedUsers,
          categorySelectedUsers,
          newUsersToday,
          active24Hours
        },
        news: {
          totalNews,
          publishedNews,
          draftNews
        },
        engagement: {
          totalReads: totalReads[0]?.total || 0,
          totalBookmarks: totalBookmarks[0]?.total || 0
        }
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

// Milestones Stats
export async function getMilestoneStats(req, res) {
  try {
    const milestoneStats = await User.aggregate([
      { $match: { "stats.currentMilestone": { $ne: null } } },
      { 
        $group: { 
          _id: "$stats.currentMilestone", 
          users: { $sum: 1 }
        }
      }
    ]);

    const populated = await Milestone.populate(milestoneStats, { path: "_id", select: "name order targetReads" });

    res.json({
      message: "Milestone stats fetched",
      milestones: populated
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

// Category Interest Stats
export async function getCategoryStats(req, res) {
  try {
    const stats = await User.aggregate([
      { $unwind: "$preferredCategories" },
      { 
        $group: { 
          _id: "$preferredCategories", 
          count: { $sum: 1 } 
        }
      },
      {
        $lookup: {
          from: "categories",                // collection name
          localField: "_id",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      {
        $project: {
          categoryId: "$_id",
          name: "$category.name",
          count: 1,
          _id: 0
        }
      },
      { $sort: { count: -1 } }  // optional: highest first
    ]);

    res.json({ stats });
  } catch (err) {
    console.error("Category stats error", err);
    res.status(500).json({ message: "Server error" });
  }
}

export async function getMostReadCategories(req, res) {
  try {
    const stats = await User.aggregate([
      { $unwind: "$preferredCategories" },
      { 
        $group: { 
          _id: "$preferredCategories",
          totalReads: { $sum: "$stats.totalReadNews" },
          usersCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      { 
        $project: { 
          _id: 0,
          categoryId: "$_id",
          name: "$category.name",
          totalReads: 1,
          usersCount: 1
        }
      },
      { $sort: { totalReads: -1 } }
    ]);

    res.json({
      message: "Most read categories fetched",
      stats
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}
export async function getTopUsers(req, res) {
  try {
    const users = await User.find()
      .select("name email stats.totalReadNews stats.milestoneProgress stats.currentMilestone")
      .populate("stats.currentMilestone", "name order")
      .sort({ "stats.totalReadNews": -1 })
      .limit(20);

    res.json({
      message: "Top users leaderboard fetched",
      leaderboard: users
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}
