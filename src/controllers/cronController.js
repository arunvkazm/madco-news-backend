// src/controllers/cronController.js
import Category from "../models/Category.js";
import News from "../models/News.js";
import axios from "axios";

export async function fetchLatestNews(req, res) {
  try {
    const NEWS_API_KEY = process.env.NEWS_API_KEY;
    const categories = await Category.find();

    if (!NEWS_API_KEY) {
      return res.status(500).json({ message: "Missing NEWS_API_KEY" });
    }

    let totalAdded = 0;
    let totalSkipped = 0;

    await Promise.all(
      categories.map(async (category) => {
        const newsToInsert = [];

        for (let page = 1; page <= 3; page++) {
          const url = `https://newsapi.org/v2/top-headlines?category=${encodeURIComponent(
            category.name.toLowerCase()
          )}&language=en&pageSize=100&page=${page}&apiKey=${NEWS_API_KEY}`;

          try {
            const { data } = await axios.get(url);

            for (const a of data.articles || []) {
              // ✅ Prefer content; fallback to description
              let summary = a.content?.trim() || a.description?.trim() || "";

              // ✅ Skip empty or too short content
              if (!summary || summary.length < 30) {
                totalSkipped++;
                continue;
              }

              newsToInsert.push({
                title: a.title?.trim() || "Untitled",
                summary,
                imageUrl: a.urlToImage || null,
                category: category._id,
                sourceName: a.source?.name || "Unknown",
                sourceUrl: a.url,
                publishedAt: a.publishedAt || new Date(),
                status: "published",
                isExternal: true,
              });
            }
          } catch (err) {
            console.error(`⚠️ Error fetching ${category.name} page ${page}:`, err.message);
          }
        }

        if (newsToInsert.length > 0) {
          try {
            const result = await News.insertMany(newsToInsert, {
              ordered: false, // Skip duplicates
            });
            totalAdded += result.length;
          } catch (err) {
            if (err.code === 11000) return; // ignore duplicate key errors
            console.error("❌ Insert error:", err.message);
          }
        }
      })
    );

    res.json({
      message: "News fetched successfully",
      added: totalAdded,
      skipped: totalSkipped,
    });
  } catch (err) {
    console.error("❌ Fatal error syncing news:", err);
    res.status(500).json({ message: "Error syncing news" });
  }
}
