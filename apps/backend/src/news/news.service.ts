import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { NewsArticle, NewsCategory } from '@vb/shared';

interface NewsApiArticle {
  title: string;
  description: string;
  content: string;
  source: { id: string | null; name: string };
  author: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
}

interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
}

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);
  private readonly newsApiKey: string;
  private readonly newsApiUrl = 'https://newsapi.org/v2';

  // In-memory store (replace with DB in production)
  private articles: NewsArticle[] = [];
  private articleIdCounter = 0;

  constructor(private configService: ConfigService) {
    this.newsApiKey = this.configService.get<string>('newsapi.key', '');
  }

  /**
   * Fetch news from NewsAPI for given categories/queries
   */
  async collectNews(queries?: string[]): Promise<NewsArticle[]> {
    const defaultQueries = [
      'technology AI semiconductor',
      'biotech healthcare pharmaceutical',
      'energy renewable climate',
      'global economy trade finance',
      'geopolitics policy regulation',
    ];

    const searchQueries = queries || defaultQueries;
    const allArticles: NewsArticle[] = [];

    for (const query of searchQueries) {
      try {
        const articles = await this.fetchFromNewsApi(query);
        allArticles.push(...articles);
      } catch (error) {
        this.logger.error(`Failed to fetch news for query "${query}": ${error}`);
      }
    }

    // Deduplicate by URL
    const seen = new Set<string>();
    const deduplicated = allArticles.filter((article) => {
      if (seen.has(article.url)) return false;
      seen.add(article.url);
      return true;
    });

    // Also deduplicate against existing articles
    const existingUrls = new Set(this.articles.map((a) => a.url));
    const newArticles = deduplicated.filter((a) => !existingUrls.has(a.url));

    this.articles.push(...newArticles);
    this.logger.log(`Collected ${newArticles.length} new articles (${deduplicated.length} total fetched, ${allArticles.length} before dedup)`);

    return newArticles;
  }

  private async fetchFromNewsApi(query: string): Promise<NewsArticle[]> {
    if (!this.newsApiKey) {
      this.logger.warn('NEWSAPI_KEY not configured, skipping news collection');
      return [];
    }

    const response = await axios.get<NewsApiResponse>(`${this.newsApiUrl}/everything`, {
      params: {
        q: query,
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: 20,
        apiKey: this.newsApiKey,
      },
    });

    if (response.data.status !== 'ok') {
      throw new Error(`NewsAPI returned status: ${response.data.status}`);
    }

    return response.data.articles
      .filter((a) => a.title && a.description)
      .map((article) => this.mapToNewsArticle(article, query));
  }

  private mapToNewsArticle(article: NewsApiArticle, query: string): NewsArticle {
    const id = `news_${++this.articleIdCounter}_${Date.now()}`;
    const category = this.inferCategory(query, article.title, article.description);

    return {
      id,
      title: article.title,
      description: article.description || '',
      content: article.content || article.description || '',
      source: article.source?.name || 'Unknown',
      author: article.author,
      url: article.url,
      imageUrl: article.urlToImage,
      publishedAt: article.publishedAt,
      language: 'en',
      category,
      sentiment: 'neutral',
      sentimentConfidence: 0,
      createdAt: new Date().toISOString(),
    };
  }

  private inferCategory(query: string, title: string, description: string): NewsCategory {
    const text = `${query} ${title} ${description}`.toLowerCase();

    const categoryKeywords: Record<NewsCategory, string[]> = {
      technology: ['ai', 'semiconductor', 'chip', 'software', 'tech', 'computing', 'data', 'cloud', 'cyber'],
      biotech: ['biotech', 'pharma', 'health', 'medical', 'drug', 'clinical', 'vaccine', 'gene'],
      energy: ['energy', 'renewable', 'solar', 'wind', 'oil', 'gas', 'battery', 'ev', 'climate'],
      politics: ['politic', 'election', 'government', 'policy', 'regulation', 'law', 'congress'],
      economy: ['economy', 'gdp', 'inflation', 'unemployment', 'trade', 'tariff', 'recession'],
      finance: ['stock', 'market', 'investment', 'bank', 'fed', 'interest rate', 'bond', 'crypto'],
      society: ['social', 'education', 'culture', 'population', 'migration', 'urban'],
      environment: ['climate', 'pollution', 'carbon', 'emission', 'sustainability', 'biodiversity'],
      other: [],
    };

    let bestCategory: NewsCategory = 'other';
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const score = keywords.reduce((acc, kw) => acc + (text.includes(kw) ? 1 : 0), 0);
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category as NewsCategory;
      }
    }

    return bestCategory;
  }

  getArticles(limit = 50, category?: NewsCategory): NewsArticle[] {
    let filtered = this.articles;
    if (category) {
      filtered = filtered.filter((a) => a.category === category);
    }
    return filtered
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, limit);
  }

  getArticlesByIds(ids: string[]): NewsArticle[] {
    const idSet = new Set(ids);
    return this.articles.filter((a) => idSet.has(a.id));
  }

  getTodayArticles(): NewsArticle[] {
    const today = new Date().toISOString().slice(0, 10);
    return this.articles.filter((a) => a.createdAt.startsWith(today));
  }

  getCategoryBreakdown(): Record<string, number> {
    const breakdown: Record<string, number> = {};
    for (const article of this.articles) {
      breakdown[article.category] = (breakdown[article.category] || 0) + 1;
    }
    return breakdown;
  }

  getArticleCount(): number {
    return this.articles.length;
  }
}
