import axios from 'axios';

export async function fetchExternalNewsByCategory(categoryName, limit = 10) {
  const apiKey = process.env.NEWS_API_KEY;
  const baseUrl = 'https://newsapi.org/v2/top-headlines';

  try {
    const { data } = await axios.get(baseUrl, {
      params: {
        apiKey,
        country: 'in',
        category: categoryName?.toLowerCase() || 'general',
        pageSize: limit,
      },
    });

    if (!data.articles) return [];

    return data.articles.map((item) => ({
      title: item.title,
      summary: item.description,
      imageUrl: item.urlToImage,
      category: categoryName,
      sourceName: item.source.name,
      sourceUrl: item.url,
      publishedAt: item.publishedAt,
      fromExternal: true,
    }));
  } catch (err) {
    console.error('❌ External News API Error:', err.message);
    return [];
  }
}
