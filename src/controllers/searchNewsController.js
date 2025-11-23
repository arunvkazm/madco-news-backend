import axios from "axios";
import News from "../models/News.js";
import Category from "../models/Category.js";

export async function searchNews(req, res) {
  try {
    const { q, page = 1, limit = 10 } = req.query;

    if (!q) return res.status(400).json({ message: "Search query is required" });

    const skip = (page - 1) * limit;

    // ✅ Search Articles in Local DB
    const articleResults = await News.find({
      $or: [
        { title: { $regex: q, $options: "i" } },
        { summary: { $regex: q, $options: "i" } }
      ],
      status: "published"
    })
      .populate('category', 'name')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // ✅ Search Categories in Local DB
    const categoryResults = await Category.find({
      $or: [
        { name: { $regex: q, $options: "i" } },
        { description: { $regex: q, $options: "i" } }
      ]
    })
      .limit(10);

    let externalResults = [];

    if (articleResults.length < limit) {
      const remaining = limit - articleResults.length;
      const NEWS_API_KEY = process.env.NEWS_API_KEY;

      if (NEWS_API_KEY) {
        try {
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
        } catch (externalError) {
          console.error("External API Error", externalError);
        }
      }
    }

    return res.json({
      message: "Search results",
      articles: {
        total: articleResults.length + externalResults.length,
        results: [...articleResults, ...externalResults]
      },
      categories: {
        total: categoryResults.length,
        results: categoryResults
      }
    });
  } catch (err) {
    console.error("Search API Error", err);
    res.status(500).json({ message: "Search failed" });
  }
}
