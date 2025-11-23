import User from "../models/User.js";
import News from "../models/News.js";
import Bookmark from "../models/Bookmark.js";


export async function addBookmark(req, res) {
  const { newsId, externalId, title, summary, imageUrl, sourceUrl, sourceName, publishedAt } = req.body;
  const userId = req.user.id;

  // Check if already bookmarked
  const exists = await Bookmark.findOne({
    user: userId,
    $or: [{ newsRef: newsId }, { externalId }]
  });

  if (exists)
    return res.status(200).json({ message: "Already bookmarked" });

  const bookmark = await Bookmark.create({
    user: userId,
    newsRef: newsId || null,
    externalId: externalId || null,
    title, summary, imageUrl, sourceUrl, sourceName, publishedAt
  });

  // update stats counter
  await User.findByIdAndUpdate(userId, { $inc: { "stats.bookmarksCount": 1 } });

  res.json({ message: "Bookmarked successfully", bookmark });
}

export async function removeBookmark(req, res) {
  const { newsId, externalId } = req.body;
  const userId = req.user.id;

  const removed = await Bookmark.findOneAndDelete({
    user: userId,
    $or: [{ newsRef: newsId }, { externalId }]
  });

  if (!removed)
    return res.status(404).json({ message: "Bookmark not found" });

  await User.findByIdAndUpdate(userId, { $inc: { "stats.bookmarksCount": -1 } });

  res.json({ message: "Bookmark removed" });
}

export async function getBookmarks(req, res) {
  const userId = req.user.id;

  const bookmarks = await Bookmark.find({ user: userId })
    .populate("newsRef", "title summary imageUrl sourceUrl sourceName publishedAt")
    .sort({ createdAt: -1 });

  const formatted = bookmarks.map(b =>
    b.newsRef
      ? {
          id: b.newsRef._id,
          title: b.newsRef.title,
          summary: b.newsRef.summary,
          imageUrl: b.newsRef.imageUrl,
          sourceUrl: b.newsRef.sourceUrl,
          sourceName: b.newsRef.sourceName,
          publishedAt: b.newsRef.publishedAt,
          isExternal: false
        }
      : {
          externalId: b.externalId,
          title: b.title,
          summary: b.summary,
          imageUrl: b.imageUrl,
          sourceUrl: b.sourceUrl,
          sourceName: b.sourceName,
          publishedAt: b.publishedAt,
          isExternal: true
        }
  );

  res.json({ bookmarks: formatted });
}

export async function isBookmarked(req, res) {
  const { newsId, externalId } = req.query;
  const userId = req.user.id;

  const exists = await Bookmark.exists({
    user: userId,
    $or: [{ newsRef: newsId }, { externalId }]
  });

  res.json({ bookmarked: Boolean(exists) });
}


