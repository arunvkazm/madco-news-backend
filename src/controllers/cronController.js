import Category from "../models/Category.js";
import News from "../models/News.js";
import axios from "axios";

export async function fetchLatestNews(req, res) {
  try {
    console.log("🚀 Cron started!");

    const { key } = req.query;
    if (key !== process.env.CRON_SECRET_KEY) {
      console.log("❌ Invalid cron key:", key);
      return res.status(401).json({ message: "Unauthorized" });
    }

    const NEWS_API_KEY = process.env.NEWS_API_KEY;
    console.log(
      "🟢 Using NEWS_API_KEY:",
      NEWS_API_KEY ? NEWS_API_KEY : "Missing"
    );

    const categories = await Category.find();
    console.log("📌 Categories found:", categories.length);
    categories.forEach((c) => console.log("   -", c.name));

    if (!NEWS_API_KEY) {
      return res.status(500).json({ message: "Missing NEWS_API_KEY" });
    }

    let totalAdded = 0;
    let totalSkipped = 0;

    await Promise.all(
      categories.map(async (category) => {
        console.log(`\n📂 Category: ${category.name}`);

        for (let page = 1; page <= 1; page++) {
          // Only 100 results max allowed
         const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
  category.name
)}&language=en&sortBy=publishedAt&pageSize=50&page=${page}&apiKey=${NEWS_API_KEY}`;


          console.log(`\n🌍 Fetching: ${url}`);

          try {
            const response = await axios.get(url);
            const data = response.data;

            console.log(
              `📄 Page ${page} -> Status: ${response.status}, Total Articles: ${
                data.articles?.length || 0
              }`
            );

            if (!data.articles || data.articles.length === 0) {
              console.log(
                `⚠️ No articles found for ${category.name} page ${page}`
              );
              continue;
            }

            for (const a of data.articles) {
              console.log("\n------------------------");
              console.log("📰 Title:", a.title);

              const content = a.content?.trim() || a.description?.trim() || "";

              console.log(
                "🔍 Raw Content:",
                content ? content.slice(0, 60) + "..." : "EMPTY"
              );

              if (!content || content.length < 30) {
                console.log("⚠️ Skipped (content too short)");
                totalSkipped++;
                continue;
              }

              // ---- Duplicate check ----
              const exists = await News.findOne({ sourceUrl: a.url });

              if (exists) {
                console.log("⛔ Duplicate skipped:", a.url);
                totalSkipped++;
                continue;
              }

              console.log("🟢 Adding new article ...");

              await News.create({
                title: a.title?.trim() || "Untitled",
                summary: content,
                imageUrl: a.urlToImage || null,
                category: category._id,
                sourceName: a.source?.name || "Unknown",
                sourceUrl: a.url,
                publishedAt: a.publishedAt || new Date(),
                status: "published",
                isExternal: true,
              });

              console.log("✅ Article saved");

              totalAdded++;
            }
          } catch (err) {
            console.error(
              `❌ Error fetching ${category.name} page ${page}:`,
              err.message
            );
          }
        }
      })
    );

    console.log("\n===================================");
    console.log("🎉 FINAL RESULT");
    console.log("➕ Added:", totalAdded);
    console.log("➖ Skipped:", totalSkipped);
    console.log("===================================");

    res.json({
      message: "News synced successfully with logs",
      added: totalAdded,
      skipped: totalSkipped,
    });
  } catch (err) {
    console.error("❌ Fatal error syncing news:", err);
    res.status(500).json({ message: "Error syncing news" });
  }
}
