import News from '../models/News.js';
import Category from '../models/Category.js';

/**
 * ➕ ADD SHORT NEWS
 */
export async function addNews(req, res, next) {
  try {
    const { title, summary, imageUrl, category, sourceName, sourceUrl, isTrending, status } =
      req.body;

    if (!title || !summary || !imageUrl || !category)
      return res.status(400).json({ message: 'Title, summary, imageUrl, and category required.' });

    const categoryExists = await Category.findById(category);
    if (!categoryExists) return res.status(404).json({ message: 'Category not found.' });

    const news = new News({
      title,
      summary,
      imageUrl,
      category,
      sourceName,
      sourceUrl,
      isTrending,
      status,
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
export async function getNewsByCategory(req, res, next) {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!categoryId)
      return res.status(400).json({ message: 'Category ID required' });

    const skip = (Number(page) - 1) * Number(limit);

    const filter = { category: categoryId, status: 'published' };
    const total = await News.countDocuments(filter);

    const newsList = await News.find(filter)
      .populate('category', 'name')
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    if (!newsList.length)
      return res.status(404).json({ message: 'No news found for this category' });

    res.json({
      message: 'News fetched successfully by category',
      categoryId,
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
