import User from "../models/User.js";
import News from "../models/News.js";
import Bookmark from "../models/Bookmark.js";


export async function addBookmark(req, res) {
  console.log("[BOOKMARK] addBookmark", req.body);

  try {
    const { newsId } = req.body;
    const userId = req.user.id;

    if (!newsId) {
      return res.status(400).json({ message: "newsId is required" });
    }

    const exists = await Bookmark.findOne({ user: userId, newsRef: newsId });

    if (exists) {
      console.log("[BOOKMARK] Already bookmarked", { userId, newsId });
      return res.status(200).json({ message: "Already bookmarked" });
    }

    const news = await News.findById(newsId);
    if (!news) {
      console.log("[BOOKMARK] News not found", newsId);
      return res.status(404).json({ message: "News not found" });
    }

    const bookmark = await Bookmark.create({
      user: userId,
      newsRef: newsId
    });

    await User.findByIdAndUpdate(userId, {
      $inc: { "stats.bookmarksCount": 1 }
    });

    console.log("[BOOKMARK] Created", { userId, newsId });
    return res.json({ message: "Bookmarked successfully", bookmark });

  } catch (err) {
    console.error("[BOOKMARK] addBookmark error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}


export async function removeBookmark(req, res) {
  console.log("[BOOKMARK] removeBookmark", req.body);

  try {
    const { newsId } = req.body;
    const userId = req.user.id;

    if (!newsId) {
      return res.status(400).json({ message: "newsId is required" });
    }

    const removed = await Bookmark.findOneAndDelete({
      user: userId,
      newsRef: newsId
    });

    if (!removed) {
      console.log("[BOOKMARK] Not found", { userId, newsId });
      return res.status(404).json({ message: "Bookmark not found" });
    }

    await User.findByIdAndUpdate(userId, {
      $inc: { "stats.bookmarksCount": -1 }
    });

    console.log("[BOOKMARK] Removed", { userId, newsId });
    return res.json({ message: "Bookmark removed" });

  } catch (err) {
    console.error("[BOOKMARK] removeBookmark error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}


export async function getBookmarks(req, res) {
  console.log("[BOOKMARK] getBookmarks");

  try {
    const userId = req.user.id;

    const bookmarks = await Bookmark.find({ user: userId })
      .populate("newsRef", "title summary imageUrl sourceUrl sourceName publishedAt")
      .sort({ createdAt: -1 });

    const formatted = bookmarks.map(b => ({
      id: b.newsRef._id,
      title: b.newsRef.title,
      summary: b.newsRef.summary,
      imageUrl: b.newsRef.imageUrl,
      sourceUrl: b.newsRef.sourceUrl,
      sourceName: b.newsRef.sourceName,
      publishedAt: b.newsRef.publishedAt
    }));

    res.json({ bookmarks: formatted });

  } catch (err) {
    console.error("[BOOKMARK] getBookmarks error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}


export async function isBookmarked(req, res) {
  console.log("[BOOKMARK] isBookmarked", req.query);

  try {
    const { newsId } = req.query;
    const userId = req.user.id;

    if (!newsId) {
      return res.status(400).json({ bookmarked: false });
    }

    const exists = await Bookmark.exists({
      user: userId,
      newsRef: newsId
    });

    res.json({ bookmarked: Boolean(exists) });

  } catch (err) {
    console.error("[BOOKMARK] isBookmarked error", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}



