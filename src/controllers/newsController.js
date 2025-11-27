import News from '../models/News.js';
import Category from '../models/Category.js';
import axios from 'axios';
import { uploadToCloudinary } from '../utils/uploadToCloudinary.js';
import Bookmark from '../models/Bookmark.js';



/**
 * ➕ ADD SHORT NEWS
 * Accepts either:
 * - File upload via multer (req.file) - will upload to Cloudinary
 * - imageUrl in request body - already uploaded to Cloudinary
 */
export async function addNews(req, res, next) {
  try {
    const { title, summary, category, sourceName, sourceUrl, isTrending, status, imageUrl } =
      req.body;

    if (!title || !summary || !category)
      return res.status(400).json({ message: 'Title, summary, and category are required.' });

    let finalImageUrl = imageUrl;

    // If file is uploaded, use it; otherwise use imageUrl from body
    if (req.file) {
      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(req.file.path, { folder: 'madco/news' });
      finalImageUrl = uploadResult.url;
    } else if (!imageUrl) {
      return res.status(400).json({ message: 'Either image file or imageUrl is required.' });
    }

    if (!finalImageUrl) {
      return res.status(400).json({ message: 'Image URL is required.' });
    }

    const categoryExists = await Category.findById(category);
    if (!categoryExists) return res.status(404).json({ message: 'Category not found.' });

    const news = new News({
      title,
      summary,
      imageUrl: finalImageUrl,
      category,
      sourceName: sourceName || 'Admin',
      sourceUrl,
      isTrending: isTrending === true || isTrending === 'true',
      status: status || 'draft',
      publishedAt: status === 'published' ? new Date() : null,
    });

    await news.save();
    res.status(201).json({ message: 'News added successfully', news });
  } catch (err) {
    next(err);
  }
}

/**
 * ✏️ UPDATE SHORT NEWS
 */
export async function updateNews(req, res, next) {
  try {
    const { id } = req.params;
    const updates = req.body;

    const news = await News.findById(id);
    if (!news) return res.status(404).json({ message: 'News not found' });

    Object.assign(news, updates);

    if (updates.status === 'published' && !news.publishedAt) {
      news.publishedAt = new Date();
    }

    await news.save();
    res.json({ message: 'News updated successfully', news });
  } catch (err) {
    next(err);
  }
}

/**
 * ❌ DELETE SHORT NEWS
 */
export async function deleteNews(req, res, next) {
  try {
    const { id } = req.params;
    const news = await News.findByIdAndDelete(id);
    if (!news) return res.status(404).json({ message: 'News not found' });

    res.json({ message: 'News deleted successfully', newsId: id });
  } catch (err) {
    next(err);
  }
}

/**
 * 📜 GET ALL SHORT NEWS (with pagination)
 * Query: ?page=1&limit=10&category=...&isTrending=true
 */
export async function getAllNews(req, res, next) {
  try {
    const { category, isTrending, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (isTrending) filter.isTrending = isTrending === 'true';

    const skip = (Number(page) - 1) * Number(limit);

    const total = await News.countDocuments(filter);
    const newsList = await News.find(filter)
      .populate('category', 'name')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      message: 'News fetched successfully',
      currentPage: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      totalItems: total,
      count: newsList.length,
      news: newsList,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 🔍 GET SINGLE NEWS
 */
export async function getNewsById(req, res, next) {
  try {
    const { id } = req.params;
    const news = await News.findById(id).populate('category', 'name');
    if (!news) return res.status(404).json({ message: 'News not found' });

    res.json({ message: 'News fetched successfully', news });
  } catch (err) {
    next(err);
  }
}

/**
 * 📂 GET ALL NEWS BY CATEGORY ID (with pagination)
 * Query: ?page=1&limit=10
 */
/**
 * 📂 GET ALL NEWS BY CATEGORY ID (local + third-party)
 */
// export async function getNewsByCategory(req, res, next) {
//   try {
//     const { categoryId } = req.params;
//     const { page = 1, limit = 10 } = req.query;

//     console.log("📩 Incoming Request:");
//     console.log("➡️ Category ID:", categoryId);
//     console.log("➡️ Page:", page, "Limit:", limit);

//     if (!categoryId) {
//       return res.status(400).json({ message: "Category ID required" });
//     }

//     // 1️⃣ Get category name from DB
//     const category = await Category.findById(categoryId);
//     if (!category) {
//       console.log("❌ Category not found for ID:", categoryId);
//       return res.status(404).json({ message: "Category not found" });
//     }

//     console.log("✅ Category Found:", category.name);

//     const skip = (Number(page) - 1) * Number(limit);

//     // 2️⃣ Fetch local DB news
//     const filter = { category: categoryId, status: "published" };
//     const total = await News.countDocuments(filter);

//     const localNews = await News.find(filter)
//       .populate("category", "name")
//       .sort({ publishedAt: -1 })
//       .skip(skip)
//       .limit(Number(limit));

//     console.log(`🗞️ Local News Found: ${localNews.length}/${limit}`);

//     let externalNews = [];

//     // 3️⃣ Map your custom categories to valid NewsAPI categories
//     const categoryMap = {
//       Trending: "general",
//       Business: "business",
//       Entertainment: "entertainment",
//       Health: "health",
//       Science: "science",
//       Sports: "sports",
//       Technology: "technology",
//     };

//     const mappedCategory =
//       categoryMap[category.name] || "general"; // default fallback

//     console.log(
//       `🌍 Category Mapping → "${category.name}" → "${mappedCategory}"`
//     );

//     // 4️⃣ Fetch from NewsAPI if not enough local news
//     if (localNews.length < limit) {
//       const remaining = limit - localNews.length;
//       const NEWS_API_KEY = process.env.NEWS_API_KEY;

//       const newsApiUrl = `https://newsapi.org/v2/top-headlines?category=${mappedCategory}&language=en&pageSize=${remaining}&apiKey=${NEWS_API_KEY}`;

//       console.log("🌐 Fetching from NewsAPI:", newsApiUrl);

//       try {
//         const { data } = await axios.get(newsApiUrl);

//         if (data.articles && data.articles.length > 0) {
//           console.log(`✅ External News Found: ${data.articles.length}`);
//           externalNews = data.articles.map((a) => ({
//             title: a.title,
//             summary: a.description || "",
//             imageUrl: a.urlToImage,
//             sourceName: a.source?.name || "Unknown",
//             sourceUrl: a.url,
//             publishedAt: a.publishedAt,
//             category: { _id: categoryId, name: category.name },
//             isTrending: false,
//             status: "published",
//             isExternal: true,
//           }));
//         } else {
//           console.log("⚠️ No articles returned from NewsAPI");
//         }
//       } catch (err) {
//         console.error("🚨 NewsAPI fetch error:", err.message);
//       }
//     } else {
//       console.log("✅ Enough local news, skipping NewsAPI call");
//     }

//     // 5️⃣ Merge both sources
//     const combinedNews = [...localNews, ...externalNews];

//     console.log(
//       `📦 Combined News Count: ${combinedNews.length} (Local: ${localNews.length}, External: ${externalNews.length})`
//     );

//     if (!combinedNews.length) {
//       console.log("❌ No news found for this category");
//       return res
//         .status(404)
//         .json({ message: "No news found for this category" });
//     }

//     res.json({
//       message: "News fetched successfully by category",
//       categoryId,
//       categoryName: category.name,
//       currentPage: Number(page),
//       totalItems: total + externalNews.length,
//       count: combinedNews.length,
//       news: combinedNews,
//     });
//   } catch (err) {
//     console.error("❌ getNewsByCategory error:", err.message);
//     next(err);
//   }
// }

export async function getNewsByCategory(req, res) {
  try {
    const userId = req.user.id;
    const { categoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const currentPage = Number(page);
    const pageSize = Number(limit);
    const skip = (currentPage - 1) * pageSize;

    // 1️⃣ Fetch category name (no description)
    const category = await Category.findById(categoryId, "name");
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    // 2️⃣ Count for pagination summary
    const totalItems = await News.countDocuments({
      category: categoryId,
      status: "published",
    });

    const totalPages = Math.ceil(totalItems / pageSize);

    // 3️⃣ Fetch paginated news
    const news = await News.find({
      category: categoryId,
      status: "published",
    })
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(pageSize);

    // 4️⃣ Fetch bookmarked news IDs for user (single query)
    const userBookmarks = await Bookmark.find({ user: userId }, "newsRef externalId");
    const bookmarkedSet = new Set(
      userBookmarks.map(b => b.newsRef?.toString() || b.externalId)
    );

    // 5️⃣ Inject bookmark flag into response
    const formattedNews = news.map(item => ({
      id: item._id,
      title: item.title,
      summary: item.summary,
      imageUrl: item.imageUrl,
      sourceUrl: item.sourceUrl,
      sourceName: item.sourceName,
      publishedAt: item.publishedAt,
      isBookmarked: bookmarkedSet.has(item._id.toString()),
    }));

    // 6️⃣ Final response format
    res.json({
      message: "News fetched successfully",
      category: {
        id: category._id,
        name: category.name,
      },
      news: formattedNews,
      pagination: {
        totalItems,
        totalPages,
        currentPage,
        limit: pageSize,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
}

