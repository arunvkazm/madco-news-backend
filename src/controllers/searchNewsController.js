import axios from "axios";
import News from "../models/News.js";

export async function searchNews(req, res) {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) return res.status(400).json({ message: "Search query is required" });

    const skip = (page - 1) * limit;

    // ✅ Search Local DB
    const localResults = await News.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { summary: { $regex: q, $options: "i" } }
      ],
      status: "published"
    })
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    let externalResults = [];

    if (localResults.length < limit) {
      const remaining = limit - localResults.length;
      const NEWS_API_KEY = process.env.NEWS_API_KEY;

      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&pageSize=${remaining}&language=en&sortBy=publishedAt&apiKey=${NEWS_API_KEY}`;

      const { data } = await axios.get(url);

      externalResults = data.articles.map(a => ({
        title: a.title,
        summary: a.description,
        imageUrl: a.urlToImage,
        sourceUrl: a.url,
        sourceName: a.source.name,
        publishedAt: a.publishedAt,
        isExternal: true
      }));
    }

    return res.json({
      message: "Search results",
      total: localResults.length + externalResults.length,
      results: [...localResults, ...externalResults]
    });
  } catch (err) {
    console.error("Search API Error", err);
    res.status(500).json({ message: "Search failed" });
  }
}
