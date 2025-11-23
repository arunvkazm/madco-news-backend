import mongoose from "mongoose";

const BookmarkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  newsRef: { type: mongoose.Schema.Types.ObjectId, ref: "News" }, // local DB news
  sourceUrl: { type: String }, // external news
  isExternal: { type: Boolean, default: false },

  // external fields
  title: String,
  summary: String,
  imageUrl: String,
  sourceName: String,
  publishedAt: Date,

  createdAt: { type: Date, default: Date.now }
});

// Index for performance
BookmarkSchema.index({ user: 1, newsRef: 1 });
BookmarkSchema.index({ user: 1, sourceUrl: 1 });

export default mongoose.model("Bookmark", BookmarkSchema);
