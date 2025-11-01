import cron from "node-cron";
import axios from "axios";
import News from "../models/News.js";
import Category from "../models/Category.js";
import { generateSummary } from "../utils/aiSummary.js";

const NEWS_API_KEY = process.env.NEWS_API_KEY;

// Helper: assign category name based on keywords
function detectCategory(title = "") {
  const lower = title.toLowerCase();
  if (lower.includes("sport")) return "Sports";
  if (lower.includes("politic")) return "Politics";
  if (lower.includes("tech")) return "Technology";
  if (lower.includes("business")) return "Business";
  if (lower.includes("health")) return "Health";
  return "General";
}

// Run every 30 minutes
cron.schedule("*/30 * * * *", async () => {
  console.log("📰 Fetching latest news from NewsAPI...");

  try {
    const { data } = await axios.get(
      `https://newsapi.org/v2/top-headlines?country=in&pageSize=40&apiKey=${NEWS_API_KEY}`
    );

    if (!data.articles?.length) {
      console.log("No new articles found.");
      return;
    }

    for (const article of data.articles) {
      const { title, description, url, urlToImage, source, publishedAt } = article;
      if (!title || !url) continue;

      // Skip if news already exists
      const exists = await News.findOne({ sourceUrl: url });
      if (exists) continue;

      const categoryName = detectCategory(title);
      let category = await Category.findOne({ name: categoryName });
      if (!category) {
        category = await Category.create({ name: categoryName });
      }

      const summary = await generateSummary(description || title);

      await News.create({
        title,
        summary,
        imageUrl: urlToImage || "",
        category: category._id,
        sourceName: source?.name || "Unknown",
        sourceUrl: url,
        status: "published",
        isTrending: false,
        publishedAt: new Date(publishedAt || Date.now()),
      });
    }

    console.log("✅ News updated successfully!");
  } catch (err) {
    console.error("❌ Cron job failed:", err.message);
  }
});
