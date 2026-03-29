import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { NewsService } from '../news/news.service';
import { StocksService } from '../stocks/stocks.service';
import type {
  AnalysisReport,
  Theme,
  ThemeStock,
  PriceTarget,
  RecommendedStock,
  NewsArticle,
  NewsCategory,
  SentimentScore,
  ThemeStatus,
  RiskLevel,
  ThemeHistory,
} from '@vb/shared';

/** Step 1 result: themes + stock symbol recommendations */
interface OpenAIThemeResult {
  themes: {
    name: string;
    nameKo: string;
    description: string;
    category: string;
    status: string;
    confidenceScore: number;
    relatedKeywords: string[];
    relatedArticleIndices: number[];
    relatedStocks: {
      symbol: string;
      name: string;
      reason: string;
      reasonKo: string;
      relevanceScore: number;
    }[];
    riskLevel: string;
    riskFactors: string[];
    opportunities: string[];
  }[];
  summary: string;
  summaryKo: string;
  keyInsights: string[];
  keyInsightsKo: string[];
  sentimentOverview: Record<string, number>;
}

/** Step 4 result: causal stock recommendations */
interface OpenAIRecommendationResult {
  recommendations: {
    symbol: string;
    name: string;
    type: 'stock' | 'etf';
    causeTrigger: string;
    causeTriggerKo: string;
    expectedImpact: string;
    expectedImpactKo: string;
    recommendation: string;
    recommendationKo: string;
    direction: 'bullish' | 'bearish';
    confidenceScore: number;
    timeHorizon: 'short' | 'medium' | 'long';
  }[];
}

/** Step 3 result: price targets per stock */
interface OpenAIPriceTargetResult {
  stocks: {
    symbol: string;
    targetLow: number;
    targetMid: number;
    targetHigh: number;
    timeframe: string;
    rationale: string;
    rationaleKo: string;
  }[];
}

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);
  private openai: OpenAI | null = null;

  // In-memory stores
  private reports: AnalysisReport[] = [];
  private themeHistory: ThemeHistory[] = [];
  private reportIdCounter = 0;
  private themeIdCounter = 0;

  constructor(
    private configService: ConfigService,
    private newsService: NewsService,
    private stocksService: StocksService,
  ) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY', '');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  /**
   * Run full analysis pipeline: collect news -> analyze -> generate report
   */
  async runDailyAnalysis(): Promise<AnalysisReport> {
    this.logger.log('Starting daily analysis pipeline...');

    // Step 1: Collect fresh news
    await this.newsService.collectNews();

    // Step 2: Get today's articles
    let articles = this.newsService.getTodayArticles();
    if (articles.length === 0) {
      articles = this.newsService.getArticles(50);
    }

    this.logger.log(`Analyzing ${articles.length} articles...`);

    // Step 3: Run AI analysis
    const report = await this.analyzeArticles(articles);

    // Step 4: Update theme history
    this.updateThemeHistory(report);

    this.reports.unshift(report);
    this.logger.log(`Daily analysis complete. Report ID: ${report.id}, Themes: ${report.themes.length}`);

    return report;
  }

  private async analyzeArticles(articles: NewsArticle[]): Promise<AnalysisReport> {
    const reportId = `report_${++this.reportIdCounter}_${Date.now()}`;
    const today = new Date().toISOString().slice(0, 10);

    // Calculate category breakdown
    const categoryBreakdown: Record<NewsCategory, number> = {
      technology: 0, biotech: 0, energy: 0, politics: 0,
      economy: 0, finance: 0, society: 0, environment: 0, other: 0,
    };
    for (const article of articles) {
      categoryBreakdown[article.category]++;
    }

    // Calculate sentiment overview
    const sentimentOverview: Record<SentimentScore, number> = {
      very_negative: 0, negative: 0, neutral: 0, positive: 0, very_positive: 0,
    };

    if (!this.openai) {
      this.logger.warn('OPENAI_API_KEY not configured, skipping analysis');
      return {
        id: reportId,
        date: today,
        totalArticlesAnalyzed: articles.length,
        summary: '',
        summaryKo: '',
        themes: [],
        recommendedStocks: [],
        categoryBreakdown,
        sentimentOverview,
        keyInsights: [],
        keyInsightsKo: [],
        createdAt: new Date().toISOString(),
      };
    }

    return await this.analyzeWithOpenAI(articles, reportId, today, categoryBreakdown);
  }

  private async analyzeWithOpenAI(
    articles: NewsArticle[],
    reportId: string,
    date: string,
    categoryBreakdown: Record<NewsCategory, number>,
  ): Promise<AnalysisReport> {
    const articleSummaries = articles.map((a, i) => (
      `[${i}] [${a.category}] ${a.title}: ${a.description}`
    )).join('\n');

    // ── Step 1: Extract themes + recommend stock symbols ──
    this.logger.log('Step 1/4: Extracting themes and stock recommendations...');
    const themeResult = await this.extractThemes(articleSummaries);

    // ── Step 2: Fetch profile + quote from Finnhub (fast, parallel) ──
    this.logger.log('Step 2/4: Fetching real-time stock data from Finnhub...');
    const themes: Theme[] = [];
    const allEnrichedStocks: ThemeStock[] = [];

    for (const t of themeResult.themes) {
      const aiStocks: ThemeStock[] = (t.relatedStocks || []).map((s) => ({
        symbol: s.symbol.toUpperCase(),
        name: s.name,
        reason: s.reason,
        reasonKo: s.reasonKo,
        relevanceScore: s.relevanceScore,
      }));

      // Quick enrichment: profile + quote only (no candle)
      const enrichedStocks = await this.stocksService.enrichStocksQuick(aiStocks);
      allEnrichedStocks.push(...enrichedStocks);

      themes.push({
        id: `theme_${++this.themeIdCounter}_${Date.now()}`,
        name: t.name,
        nameKo: t.nameKo,
        description: t.description,
        category: (t.category as NewsCategory) || 'other',
        status: (t.status as ThemeStatus) || 'emerging',
        confidenceScore: t.confidenceScore,
        relatedKeywords: t.relatedKeywords,
        relatedArticleIds: (t.relatedArticleIndices || []).map((i) => articles[i]?.id).filter(Boolean),
        relatedStocks: enrichedStocks,
        riskLevel: (t.riskLevel as RiskLevel) || 'medium',
        riskFactors: t.riskFactors,
        opportunities: t.opportunities,
        firstDetectedAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString(),
      });
    }

    // ── Steps 3 + 4 + Candle: run in parallel ──
    // Price targets and recommendations don't need candle data,
    // so candle fetching runs concurrently without blocking.
    this.logger.log('Step 3-4/4: Generating price targets, recommendations, and fetching candles in parallel...');

    const allSymbols = allEnrichedStocks.map((s) => s.symbol);
    const stocksWithQuotes = allEnrichedStocks.filter((s) => s.quote);

    const [priceTargets, recommendedStocks, candleMap] = await Promise.all([
      // Step 3: Price targets
      stocksWithQuotes.length > 0
        ? this.generatePriceTargets(stocksWithQuotes, articleSummaries)
        : Promise.resolve(new Map<string, PriceTarget>()),
      // Step 4: Causal recommendations
      this.generateRecommendations(articleSummaries),
      // Candle data (non-blocking, errors won't affect other steps)
      this.stocksService.fetchCandlesSafe(allSymbols),
    ]);

    // Attach price targets and candle data to stocks in themes
    for (const theme of themes) {
      for (const stock of theme.relatedStocks) {
        const target = priceTargets.get(stock.symbol);
        if (target) stock.priceTarget = target;
        const candle = candleMap.get(stock.symbol);
        if (candle) stock.candle = candle;
      }
    }

    return {
      id: reportId,
      date,
      totalArticlesAnalyzed: articles.length,
      summary: themeResult.summary,
      summaryKo: themeResult.summaryKo,
      themes,
      recommendedStocks,
      categoryBreakdown,
      sentimentOverview: themeResult.sentimentOverview as Record<SentimentScore, number>,
      keyInsights: themeResult.keyInsights,
      keyInsightsKo: themeResult.keyInsightsKo,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Step 1: Extract themes and stock recommendations from news
   */
  private async extractThemes(articleSummaries: string): Promise<OpenAIThemeResult> {
    const prompt = `You are a global market analyst. Analyze the following news articles, extract emerging investment themes, and recommend related stocks for each theme.

NEWS ARTICLES:
${articleSummaries}

Analyze these articles and return a JSON object with this exact structure:
{
  "themes": [
    {
      "name": "Theme name in English",
      "nameKo": "테마 이름 (한국어)",
      "description": "2-3 sentence description of the theme and why it matters",
      "category": "technology|biotech|energy|politics|economy|finance|society|environment|other",
      "status": "emerging|growing|peak|declining|stable",
      "confidenceScore": 0.0-1.0,
      "relatedKeywords": ["keyword1", "keyword2", ...],
      "relatedArticleIndices": [0, 1, ...],
      "relatedStocks": [
        {
          "symbol": "US stock ticker (e.g. NVDA, AAPL)",
          "name": "Company name",
          "reason": "Why this stock is related to the theme (1 sentence)",
          "reasonKo": "이 종목이 테마와 관련된 이유 (한국어, 1문장)",
          "relevanceScore": 0.0-1.0
        }
      ],
      "riskLevel": "low|medium|high|critical",
      "riskFactors": ["risk1", "risk2"],
      "opportunities": ["opportunity1", "opportunity2"]
    }
  ],
  "summary": "Executive summary of today's key developments in English (3-5 sentences)",
  "summaryKo": "오늘의 주요 동향 요약 (한국어, 3-5문장)",
  "keyInsights": ["insight1", "insight2", "insight3"],
  "keyInsightsKo": ["인사이트1", "인사이트2", "인사이트3"],
  "sentimentOverview": {
    "very_negative": 0,
    "negative": 0,
    "neutral": 0,
    "positive": 0,
    "very_positive": 0
  }
}

Focus on:
1. Cross-article correlation (combine signals from multiple news)
2. Emerging themes that span multiple categories
3. Both opportunities AND risks
4. Provide 3-7 themes ranked by confidence
5. For each theme, recommend 3-5 US-listed stocks most directly benefiting from or affected by the theme. Use real, valid ticker symbols only.

Return ONLY valid JSON, no markdown or explanation.`;

    const response = await this.openai!.chat.completions.create({
      model: 'gpt-5.4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('Empty OpenAI response (theme extraction)');

    return JSON.parse(content);
  }

  /**
   * Step 3: Generate price targets using real Finnhub market data + news context
   */
  private async generatePriceTargets(
    stocks: ThemeStock[],
    newsSummary: string,
  ): Promise<Map<string, PriceTarget>> {
    const stockDataLines = stocks.map((s) => {
      const q = s.quote!;
      const p = s.profile;
      return `${s.symbol} (${s.name}): Price=$${q.currentPrice.toFixed(2)}, Change=${q.percentChange >= 0 ? '+' : ''}${q.percentChange.toFixed(2)}%, ` +
        `Open=$${q.openPrice.toFixed(2)}, High=$${q.highPrice.toFixed(2)}, Low=$${q.lowPrice.toFixed(2)}, PrevClose=$${q.previousClose.toFixed(2)}` +
        (p ? `, MarketCap=$${p.marketCapitalization}M, Industry=${p.finnhubIndustry}` : '') +
        ` | Theme reason: ${s.reason}`;
    }).join('\n');

    const prompt = `You are a quantitative equity analyst. Based on the following real-time stock market data and today's news context, generate 3-month price targets for each stock.

REAL-TIME STOCK DATA:
${stockDataLines}

NEWS CONTEXT (summarized):
${newsSummary.slice(0, 2000)}

For each stock, provide conservative (low), base (mid), and optimistic (high) price targets.
Consider: current price momentum, news sentiment impact, sector trends, and market capitalization.

Return a JSON object with this exact structure:
{
  "stocks": [
    {
      "symbol": "TICKER",
      "targetLow": 000.00,
      "targetMid": 000.00,
      "targetHigh": 000.00,
      "timeframe": "3 months",
      "rationale": "1-2 sentence rationale for the price target in English",
      "rationaleKo": "목표 가격에 대한 근거 (한국어, 1-2문장)"
    }
  ]
}

IMPORTANT:
- targetLow < targetMid < targetHigh
- Base targets on realistic analysis, not hype
- Consider both upside catalysts and downside risks from the news
- Use the actual current price as your anchor point

Return ONLY valid JSON, no markdown or explanation.`;

    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-5.4',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty OpenAI response (price targets)');

      const result: OpenAIPriceTargetResult = JSON.parse(content);
      const targetMap = new Map<string, PriceTarget>();

      for (const s of result.stocks) {
        const stock = stocks.find((st) => st.symbol === s.symbol);
        if (stock?.quote) {
          targetMap.set(s.symbol, {
            currentPrice: stock.quote.currentPrice,
            targetLow: s.targetLow,
            targetMid: s.targetMid,
            targetHigh: s.targetHigh,
            timeframe: s.timeframe,
            rationale: s.rationale,
            rationaleKo: s.rationaleKo,
          });
        }
      }

      return targetMap;
    } catch (error) {
      this.logger.error(`Price target generation failed: ${error}`);
      return new Map();
    }
  }

  /**
   * Step 4: Generate causal stock/ETF recommendations from news events
   */
  private async generateRecommendations(articleSummaries: string): Promise<RecommendedStock[]> {
    const prompt = `You are a senior investment strategist. Based on today's news, identify causal chains that lead to specific stock or ETF opportunities.

Think step-by-step:
1. Identify significant events from the news (geopolitical, economic, technological, regulatory)
2. Predict the cascading market impact of each event
3. Recommend specific US-listed stocks or ETFs that would benefit or suffer

NEWS ARTICLES:
${articleSummaries.slice(0, 3000)}

Return a JSON object with this exact structure:
{
  "recommendations": [
    {
      "symbol": "USO",
      "name": "United States Oil Fund",
      "type": "etf",
      "causeTrigger": "Middle East tensions escalating with Iran military actions",
      "causeTriggerKo": "이란 군사 행동으로 중동 긴장 고조",
      "expectedImpact": "Oil supply disruption fears will drive crude prices higher",
      "expectedImpactKo": "원유 공급 차질 우려로 유가 상승 전망",
      "recommendation": "Long USO as oil prices are expected to surge on supply risk",
      "recommendationKo": "공급 리스크로 유가 급등 예상, USO 매수 추천",
      "direction": "bullish",
      "confidenceScore": 0.85,
      "timeHorizon": "short"
    }
  ]
}

IMPORTANT RULES:
- Provide 5-10 recommendations covering diverse events
- Each must have a clear CAUSE → IMPACT → RECOMMENDATION chain
- Include both stocks AND ETFs
- Include both bullish AND bearish opportunities
- Use real, valid US ticker symbols only
- timeHorizon: "short" (1-4 weeks), "medium" (1-3 months), "long" (3-12 months)
- confidenceScore: 0.0-1.0 based on how strong the causal link is

Return ONLY valid JSON, no markdown or explanation.`;

    try {
      const response = await this.openai!.chat.completions.create({
        model: 'gpt-5.4',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('Empty OpenAI response (recommendations)');

      const result: OpenAIRecommendationResult = JSON.parse(content);

      // Enrich with Finnhub data
      const recommendations: RecommendedStock[] = [];
      for (const r of result.recommendations) {
        const [profile, quote] = await Promise.all([
          this.stocksService.getProfile(r.symbol.toUpperCase()),
          this.stocksService.getQuote(r.symbol.toUpperCase()),
        ]);

        recommendations.push({
          symbol: r.symbol.toUpperCase(),
          name: profile?.name || r.name,
          type: r.type,
          causeTrigger: r.causeTrigger,
          causeTriggerKo: r.causeTriggerKo,
          expectedImpact: r.expectedImpact,
          expectedImpactKo: r.expectedImpactKo,
          recommendation: r.recommendation,
          recommendationKo: r.recommendationKo,
          direction: r.direction,
          confidenceScore: r.confidenceScore,
          timeHorizon: r.timeHorizon,
          profile: profile || undefined,
          quote: quote || undefined,
        });

        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      this.logger.log(`Generated ${recommendations.length} causal stock recommendations`);
      return recommendations;
    } catch (error) {
      this.logger.error(`Recommendation generation failed: ${error}`);
      return [];
    }
  }

  private updateThemeHistory(report: AnalysisReport): void {
    for (const theme of report.themes) {
      this.themeHistory.push({
        id: `th_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        themeName: theme.name,
        date: report.date,
        status: theme.status,
        confidenceScore: theme.confidenceScore,
        mentionCount: theme.relatedArticleIds.length,
        sentiment: theme.relatedArticleIds.length > 0 ? 'positive' : 'neutral',
      });
    }
  }

  getReports(limit = 10): AnalysisReport[] {
    return this.reports.slice(0, limit);
  }

  getLatestReport(): AnalysisReport | null {
    return this.reports[0] || null;
  }

  getReportById(id: string): AnalysisReport | null {
    return this.reports.find((r) => r.id === id) || null;
  }

  getThemeHistory(themeName?: string): ThemeHistory[] {
    if (themeName) {
      return this.themeHistory.filter((h) => h.themeName === themeName);
    }
    return this.themeHistory;
  }

  getAllThemes(): Theme[] {
    const latest = this.getLatestReport();
    return latest?.themes || [];
  }
}
