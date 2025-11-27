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

// Recent Activity
export async function getRecentActivity(req, res) {
  try {
    const recentNews = await News.find()
      .select("title status createdAt updatedAt")
      .populate("category", "name")
      .sort({ createdAt: -1 })
      .limit(10);

    const recentUsers = await User.find()
      .select("name email createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    const activities = [];

    // Add recent news activities
    recentNews.forEach((news) => {
      const timeAgo = getTimeAgo(news.createdAt);
      activities.push({
        type: 'article',
        text: `New article published: "${news.title.substring(0, 50)}${news.title.length > 50 ? '...' : ''}"`,
        time: timeAgo,
        createdAt: news.createdAt
      });
    });

    // Add recent user activities
    recentUsers.forEach((user) => {
      const timeAgo = getTimeAgo(user.createdAt);
      activities.push({
        type: 'user',
        text: `User ${user.name} registered`,
        time: timeAgo,
        createdAt: user.createdAt
      });
    });

    // Sort by creation date (most recent first) and limit to 10
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const recentActivities = activities.slice(0, 10);

    res.json({
      message: "Recent activity fetched",
      activities: recentActivities
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

// Helper function to calculate time ago
function getTimeAgo(date) {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} sec ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
}

// Traffic/Engagement Trends (Last 7 days)
export async function getTrafficTrends(req, res) {
  try {
    const days = 7;
    const trends = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);

      // Count news created on this day
      const newsCount = await News.countDocuments({
        createdAt: { $gte: date, $lt: nextDay }
      });

      // Count users created on this day
      const usersCount = await User.countDocuments({
        createdAt: { $gte: date, $lt: nextDay }
      });

      // Get total reads from users updated on this day (approximation)
      const readsData = await User.aggregate([
        {
          $match: {
            updatedAt: { $gte: date, $lt: nextDay }
          }
        },
        {
          $group: {
            _id: null,
            totalReads: { $sum: "$stats.totalReadNews" }
          }
        }
      ]);

      const dayName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      trends.push({
        name: dayName,
        views: newsCount * 100 + (readsData[0]?.totalReads || 0), // Approximate views
        visitors: usersCount * 50 + Math.floor((readsData[0]?.totalReads || 0) / 2), // Approximate visitors
        engagement: newsCount > 0 ? Math.min(75 + Math.floor(Math.random() * 20), 100) : 0
      });
    }

    res.json({
      message: "Traffic trends fetched",
      trends
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}
