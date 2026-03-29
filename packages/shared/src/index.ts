// ============================================
// Shared types & constants for Global Theme Tracer
// ============================================

/** Authenticated user payload from Supabase JWT */
export interface AuthUser {
  id: string;
  email: string;
  role?: string;
}

/** Standard API response wrapper */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** Pagination params */
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

/** Pagination metadata */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Paginated API response */
export interface PaginatedResponse<T = unknown> extends ApiResponse<T[]> {
  meta?: PaginationMeta;
}

/** Upload response */
export interface UploadResult {
  path: string;
  url: string;
}

// Route constants
export const AUTH_ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
} as const;

export const PROTECTED_ROUTES = ['/dashboard'] as const;

// ============================================
// GTT (Global Theme Tracer) Types
// ============================================

export type NewsCategory =
  | 'technology'
  | 'biotech'
  | 'energy'
  | 'politics'
  | 'economy'
  | 'finance'
  | 'society'
  | 'environment'
  | 'other';

export type SentimentScore = 'very_negative' | 'negative' | 'neutral' | 'positive' | 'very_positive';

export type ThemeStatus = 'emerging' | 'growing' | 'peak' | 'declining' | 'stable';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/** Collected news article */
export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  source: string;
  author: string | null;
  url: string;
  imageUrl: string | null;
  publishedAt: string;
  language: string;
  category: NewsCategory;
  sentiment: SentimentScore;
  sentimentConfidence: number;
  createdAt: string;
}

// ============================================
// Stock / Finnhub Types
// ============================================

/** Stock company profile from Finnhub */
export interface StockProfile {
  symbol: string;
  name: string;
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  finnhubIndustry: string;
  logo: string;
  weburl: string;
}

/** Real-time stock quote from Finnhub */
export interface StockQuote {
  symbol: string;
  currentPrice: number;
  change: number;
  percentChange: number;
  highPrice: number;
  lowPrice: number;
  openPrice: number;
  previousClose: number;
  timestamp: number;
}

/** Daily candle data point */
export interface StockCandlePoint {
  date: string;       // YYYY-MM-DD
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Historical daily candle data from Finnhub */
export interface StockCandle {
  symbol: string;
  candles: StockCandlePoint[];
}

/** AI-generated price target for a stock */
export interface PriceTarget {
  currentPrice: number;
  targetLow: number;
  targetMid: number;
  targetHigh: number;
  timeframe: string;
  rationale: string;
  rationaleKo: string;
}

/** Stock recommended for a theme */
export interface ThemeStock {
  symbol: string;
  name: string;
  reason: string;
  reasonKo: string;
  relevanceScore: number;
  profile?: StockProfile;
  quote?: StockQuote;
  candle?: StockCandle;
  priceTarget?: PriceTarget;
}

/** Extracted theme from analysis — with related stocks */
export interface Theme {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  category: NewsCategory;
  status: ThemeStatus;
  confidenceScore: number;
  relatedKeywords: string[];
  relatedArticleIds: string[];
  relatedStocks: ThemeStock[];
  riskLevel: RiskLevel;
  riskFactors: string[];
  opportunities: string[];
  firstDetectedAt: string;
  lastUpdatedAt: string;
}

/** AI-recommended stock based on causal news analysis */
export interface RecommendedStock {
  symbol: string;
  name: string;
  type: 'stock' | 'etf';
  /** Causal reasoning chain: event → impact → recommendation */
  causeTrigger: string;
  causeTriggerKo: string;
  expectedImpact: string;
  expectedImpactKo: string;
  recommendation: string;
  recommendationKo: string;
  /** Sentiment: bullish or bearish */
  direction: 'bullish' | 'bearish';
  confidenceScore: number;
  timeHorizon: 'short' | 'medium' | 'long';
  profile?: StockProfile;
  quote?: StockQuote;
  candle?: StockCandle;
  priceTarget?: PriceTarget;
}

/** Daily analysis report */
export interface AnalysisReport {
  id: string;
  date: string;
  totalArticlesAnalyzed: number;
  summary: string;
  summaryKo: string;
  themes: Theme[];
  recommendedStocks: RecommendedStock[];
  categoryBreakdown: Record<NewsCategory, number>;
  sentimentOverview: Record<SentimentScore, number>;
  keyInsights: string[];
  keyInsightsKo: string[];
  createdAt: string;
}

/** Theme history entry for tracking over time */
export interface ThemeHistory {
  id: string;
  themeName: string;
  date: string;
  status: ThemeStatus;
  confidenceScore: number;
  mentionCount: number;
  sentiment: SentimentScore;
}

/** Dashboard summary */
export interface DashboardSummary {
  latestReport: AnalysisReport | null;
  topThemes: Theme[];
  recommendedStocks: RecommendedStock[];
  recentArticles: NewsArticle[];
  trendingKeywords: { keyword: string; count: number }[];
  categoryDistribution: Record<NewsCategory, number>;
}
