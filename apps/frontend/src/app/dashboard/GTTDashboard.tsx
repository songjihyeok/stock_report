'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import SignOutButton from './SignOutButton';
import type {
  AnalysisReport,
  Theme,
  ThemeStock,
  RecommendedStock,
  PriceTarget,
  StockCandle,
  NewsArticle,
  NewsCategory,
  DashboardSummary,
} from '@vb/shared';

type Tab = 'overview' | 'themes' | 'stocks' | 'recommended' | 'news' | 'report';

const CATEGORY_COLORS: Record<NewsCategory, string> = {
  technology: 'bg-cat-technology/10 text-cat-technology border-cat-technology/20',
  biotech: 'bg-cat-biotech/10 text-cat-biotech border-cat-biotech/20',
  energy: 'bg-cat-energy/10 text-cat-energy border-cat-energy/20',
  politics: 'bg-cat-politics/10 text-cat-politics border-cat-politics/20',
  economy: 'bg-cat-economy/10 text-cat-economy border-cat-economy/20',
  finance: 'bg-cat-finance/10 text-cat-finance border-cat-finance/20',
  society: 'bg-cat-society/10 text-cat-society border-cat-society/20',
  environment: 'bg-cat-environment/10 text-cat-environment border-cat-environment/20',
  other: 'bg-cat-other/10 text-cat-other border-cat-other/20',
};

const CATEGORY_LABELS: Record<NewsCategory, string> = {
  technology: 'Technology',
  biotech: 'Biotech',
  energy: 'Energy',
  politics: 'Politics',
  economy: 'Economy',
  finance: 'Finance',
  society: 'Society',
  environment: 'Environment',
  other: 'Other',
};

const STATUS_COLORS: Record<string, string> = {
  emerging: 'bg-emerging/10 text-emerging border-emerging/20',
  growing: 'bg-growing/10 text-growing border-growing/20',
  peak: 'bg-peak/10 text-peak border-peak/20',
  declining: 'bg-declining/10 text-declining border-declining/20',
  stable: 'bg-stable/10 text-stable border-stable/20',
};

const RISK_COLORS: Record<string, string> = {
  low: 'bg-risk-low/10 text-risk-low',
  medium: 'bg-risk-medium/10 text-risk-medium',
  high: 'bg-risk-high/10 text-risk-high',
  critical: 'bg-risk-critical/10 text-risk-critical',
};

export default function GTTDashboard({
  userEmail,
  accessToken,
}: {
  userEmail: string;
  userId: string;
  accessToken: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasMounted = useRef(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await apiFetch<DashboardSummary>('/dashboard/summary', {}, accessToken);
      if (res.success && res.data) {
        setSummary(res.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  const runAnalysis = useCallback(async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await apiFetch<AnalysisReport>('/analysis/run', { method: 'POST' }, accessToken);
      if (res.success) {
        await fetchDashboard();
      } else {
        setError(res.error || 'Analysis failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }, [accessToken, fetchDashboard]);

  useEffect(() => {
    if (hasMounted.current) return;
    hasMounted.current = true;
    fetchDashboard();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-background font-body text-text">
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-heading font-bold text-sm">G</span>
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg text-text leading-tight">Global Theme Tracer</h1>
              <p className="text-xs text-text-secondary">{userEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={runAnalysis}
              disabled={analyzing}
              className="px-4 py-2 bg-secondary text-white text-sm font-medium rounded-lg hover:bg-secondary/90 transition-colors disabled:opacity-50"
            >
              {analyzing ? 'Analyzing...' : 'Run Analysis'}
            </button>
            <SignOutButton />
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1">
            {([
              { key: 'overview', label: 'Overview' },
              { key: 'themes', label: 'Themes' },
              { key: 'stocks', label: 'Related Stocks' },
              { key: 'recommended', label: 'Recommended' },
              { key: 'news', label: 'News Feed' },
              { key: 'report', label: 'Report' },
            ] as { key: Tab; label: string }[]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-secondary text-secondary'
                    : 'border-transparent text-text-secondary hover:text-text'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <LoadingSkeleton />
        ) : !summary?.latestReport ? (
          <EmptyState onRun={runAnalysis} analyzing={analyzing} />
        ) : (
          <>
            {activeTab === 'overview' && <OverviewTab summary={summary} />}
            {activeTab === 'themes' && <ThemesTab themes={summary.latestReport.themes} />}
            {activeTab === 'stocks' && <StocksTab themes={summary.latestReport.themes} />}
            {activeTab === 'recommended' && <RecommendedTab stocks={summary.recommendedStocks} />}
            {activeTab === 'news' && <NewsTab articles={summary.recentArticles} />}
            {activeTab === 'report' && <ReportTab report={summary.latestReport} />}
          </>
        )}
      </main>
    </div>
  );
}

/* ========================= OVERVIEW TAB ========================= */

function OverviewTab({ summary }: { summary: DashboardSummary }) {
  const report = summary.latestReport!;
  const themes = summary.topThemes;

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Articles Analyzed" value={report.totalArticlesAnalyzed} />
        <StatCard label="Themes Found" value={report.themes.length} />
        <StatCard label="Categories" value={Object.values(report.categoryBreakdown).filter((v) => v > 0).length} />
        <StatCard label="Keywords" value={summary.trendingKeywords.length} />
      </div>

      {/* Summary */}
      <section className="bg-surface rounded-xl border border-border p-6">
        <h2 className="font-heading font-semibold text-lg mb-3">Daily Summary</h2>
        <p className="text-text-secondary text-sm leading-relaxed mb-4">{report.summaryKo}</p>
        <p className="text-text-secondary text-xs leading-relaxed italic">{report.summary}</p>
      </section>

      {/* Two columns: Top Themes + Key Insights */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Themes */}
        <section className="bg-surface rounded-xl border border-border p-6">
          <h2 className="font-heading font-semibold text-lg mb-4">Top Themes</h2>
          <div className="space-y-3">
            {themes.slice(0, 5).map((theme) => (
              <ThemeCard key={theme.id} theme={theme} compact />
            ))}
          </div>
        </section>

        {/* Key Insights */}
        <section className="bg-surface rounded-xl border border-border p-6">
          <h2 className="font-heading font-semibold text-lg mb-4">Key Insights</h2>
          <div className="space-y-3">
            {report.keyInsightsKo.map((insight, i) => (
              <div key={i} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-text-secondary leading-relaxed">{insight}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Category Distribution + Trending Keywords */}
      <div className="grid md:grid-cols-2 gap-6">
        <section className="bg-surface rounded-xl border border-border p-6">
          <h2 className="font-heading font-semibold text-lg mb-4">Category Distribution</h2>
          <div className="space-y-2">
            {Object.entries(report.categoryBreakdown)
              .filter(([, count]) => count > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([cat, count]) => (
                <CategoryBar
                  key={cat}
                  category={cat as NewsCategory}
                  count={count}
                  total={report.totalArticlesAnalyzed}
                />
              ))}
          </div>
        </section>

        <section className="bg-surface rounded-xl border border-border p-6">
          <h2 className="font-heading font-semibold text-lg mb-4">Trending Keywords</h2>
          <div className="flex flex-wrap gap-2">
            {summary.trendingKeywords.map(({ keyword, count }) => (
              <span
                key={keyword}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border rounded-full text-xs font-medium text-text"
              >
                {keyword}
                <span className="text-text-secondary">({count})</span>
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/* ========================= THEMES TAB ========================= */

function ThemesTab({ themes }: { themes: Theme[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-lg">Discovered Themes ({themes.length})</h2>
      </div>
      {themes.map((theme) => (
        <ThemeCard key={theme.id} theme={theme} />
      ))}
    </div>
  );
}

/* ========================= NEWS TAB ========================= */

function NewsTab({ articles }: { articles: NewsArticle[] }) {
  const [filter, setFilter] = useState<NewsCategory | 'all'>('all');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);

  const filtered = filter === 'all'
    ? articles
    : articles.filter((a) => a.category === filter);

  const categories = [...new Set(articles.map((a) => a.category))];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            filter === 'all'
              ? 'bg-primary text-white border-primary'
              : 'bg-surface border-border text-text-secondary hover:text-text'
          }`}
        >
          All ({articles.length})
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === cat
                ? 'bg-primary text-white border-primary'
                : `${CATEGORY_COLORS[cat]} border`
            }`}
          >
            {CATEGORY_LABELS[cat]} ({articles.filter((a) => a.category === cat).length})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((article) => (
          <ArticleCard key={article.id} article={article} onClick={() => setSelectedArticle(article)} />
        ))}
      </div>

      {selectedArticle && (
        <ArticleDetailModal article={selectedArticle} onClose={() => setSelectedArticle(null)} />
      )}
    </div>
  );
}

/* ========================= RECOMMENDED TAB ========================= */

function RecommendedTab({ stocks }: { stocks: RecommendedStock[] }) {
  const [dirFilter, setDirFilter] = useState<'all' | 'bullish' | 'bearish'>('all');

  const filtered = dirFilter === 'all' ? stocks : stocks.filter((s) => s.direction === dirFilter);

  if (stocks.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary text-sm">
        No recommendations yet. Run an analysis to get AI-powered stock picks.
      </div>
    );
  }

  const bullishCount = stocks.filter((s) => s.direction === 'bullish').length;
  const bearishCount = stocks.filter((s) => s.direction === 'bearish').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading font-semibold text-lg">AI Stock Picks ({stocks.length})</h2>
        <div className="flex gap-2">
          {([
            { key: 'all', label: `All (${stocks.length})` },
            { key: 'bullish', label: `Bullish (${bullishCount})` },
            { key: 'bearish', label: `Bearish (${bearishCount})` },
          ] as { key: typeof dirFilter; label: string }[]).map((f) => (
            <button
              key={f.key}
              onClick={() => setDirFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                dirFilter === f.key
                  ? 'bg-primary text-white border-primary'
                  : 'bg-surface border-border text-text-secondary hover:text-text'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered
          .sort((a, b) => b.confidenceScore - a.confidenceScore)
          .map((stock, i) => (
            <RecommendedStockCard key={`${stock.symbol}-${i}`} stock={stock} />
          ))}
      </div>
    </div>
  );
}

function RecommendedStockCard({ stock }: { stock: RecommendedStock }) {
  const [expanded, setExpanded] = useState(false);
  const quote = stock.quote;
  const profile = stock.profile;
  const isBullish = stock.direction === 'bullish';
  const isPositive = quote && quote.change >= 0;

  const horizonLabel = { short: '1-4 weeks', medium: '1-3 months', long: '3-12 months' }[stock.timeHorizon];
  const horizonColor = { short: 'text-declining', medium: 'text-peak', long: 'text-secondary' }[stock.timeHorizon];

  return (
    <div className="bg-surface rounded-xl border border-border p-5 hover:border-secondary/30 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {profile?.logo && (
            <img
              src={profile.logo}
              alt={stock.symbol}
              className="w-10 h-10 rounded-lg object-contain bg-white border border-border"
            />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-base">{stock.symbol}</span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                isBullish
                  ? 'bg-accent/10 text-accent border-accent/20'
                  : 'bg-declining/10 text-declining border-declining/20'
              }`}>
                {isBullish ? '▲ Bullish' : '▼ Bearish'}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border border-border bg-background ${
                stock.type === 'etf' ? 'text-secondary' : 'text-text-secondary'
              }`}>
                {stock.type.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-text-secondary">{stock.name}</p>
          </div>
        </div>
        <div className="text-right">
          {quote && (
            <>
              <p className="font-heading font-bold text-base">${quote.currentPrice.toFixed(2)}</p>
              <p className={`text-xs font-semibold ${isPositive ? 'text-accent' : 'text-declining'}`}>
                {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({isPositive ? '+' : ''}{quote.percentChange.toFixed(2)}%)
              </p>
            </>
          )}
          <div className="flex items-center gap-1 mt-1 justify-end">
            <span className={`text-[10px] ${horizonColor}`}>{horizonLabel}</span>
            <span className="text-[10px] text-text-secondary">|</span>
            <span className="text-[10px] font-semibold text-secondary">{Math.round(stock.confidenceScore * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Causal Chain */}
      <div className="p-3 bg-background rounded-lg border border-border mb-3">
        <div className="flex items-start gap-2 mb-2">
          <span className="shrink-0 w-5 h-5 rounded-full bg-declining/10 text-declining flex items-center justify-center text-[10px] font-bold mt-0.5">1</span>
          <div>
            <p className="text-[10px] font-semibold text-text-secondary mb-0.5">Trigger</p>
            <p className="text-xs text-text">{stock.causeTriggerKo}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 mb-2 ml-2 border-l-2 border-border pl-4">
          <span className="shrink-0 w-5 h-5 rounded-full bg-peak/10 text-peak flex items-center justify-center text-[10px] font-bold mt-0.5">2</span>
          <div>
            <p className="text-[10px] font-semibold text-text-secondary mb-0.5">Expected Impact</p>
            <p className="text-xs text-text">{stock.expectedImpactKo}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 ml-4 border-l-2 border-border pl-4">
          <span className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${
            isBullish ? 'bg-accent/10 text-accent' : 'bg-declining/10 text-declining'
          }`}>3</span>
          <div>
            <p className="text-[10px] font-semibold text-text-secondary mb-0.5">Recommendation</p>
            <p className="text-xs text-text font-medium">{stock.recommendationKo}</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-secondary font-medium hover:underline"
      >
        {expanded ? 'Hide English' : 'Show English'}
      </button>

      {expanded && (
        <div className="mt-2 p-3 bg-background rounded-lg text-xs text-text-secondary space-y-1 border border-border">
          <p><span className="font-semibold">Trigger:</span> {stock.causeTrigger}</p>
          <p><span className="font-semibold">Impact:</span> {stock.expectedImpact}</p>
          <p><span className="font-semibold">Action:</span> {stock.recommendation}</p>
        </div>
      )}
    </div>
  );
}

/* ========================= STOCKS TAB ========================= */

function StocksTab({ themes }: { themes: Theme[] }) {
  const themesWithStocks = themes.filter((t) => t.relatedStocks?.length > 0);

  if (themesWithStocks.length === 0) {
    return (
      <div className="text-center py-12 text-text-secondary text-sm">
        No stock recommendations yet. Run an analysis to get related stocks per theme.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {themesWithStocks.map((theme) => (
        <section key={theme.id} className="bg-surface rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Badge className={CATEGORY_COLORS[theme.category]}>
              {CATEGORY_LABELS[theme.category]}
            </Badge>
            <h2 className="font-heading font-semibold text-lg">{theme.nameKo}</h2>
            <span className="text-sm text-text-secondary">({theme.name})</span>
            <ConfidenceMeter score={theme.confidenceScore} />
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {theme.relatedStocks.map((stock) => (
              <StockCard key={stock.symbol} stock={stock} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function StockCard({ stock }: { stock: ThemeStock }) {
  const quote = stock.quote;
  const profile = stock.profile;
  const pt = stock.priceTarget;
  const isPositive = quote && quote.change >= 0;

  return (
    <div className="p-4 bg-background rounded-lg border border-border hover:border-secondary/30 transition-colors">
      {/* Header: logo, symbol, price */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {profile?.logo && (
            <img
              src={profile.logo}
              alt={stock.symbol}
              className="w-8 h-8 rounded-lg object-contain bg-white border border-border"
            />
          )}
          <div>
            <p className="font-heading font-bold text-sm">{stock.symbol}</p>
            <p className="text-[11px] text-text-secondary truncate max-w-[140px]">{stock.name}</p>
          </div>
        </div>
        {quote && (
          <div className="text-right">
            <p className="font-heading font-bold text-sm">${quote.currentPrice.toFixed(2)}</p>
            <p className={`text-[11px] font-semibold ${isPositive ? 'text-accent' : 'text-declining'}`}>
              {isPositive ? '+' : ''}{quote.change.toFixed(2)} ({isPositive ? '+' : ''}{quote.percentChange.toFixed(2)}%)
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-text-secondary leading-relaxed mb-2">{stock.reasonKo}</p>

      {/* Daily Chart + Price Targets */}
      {stock.candle && stock.candle.candles.length > 0 ? (
        <DailyStockChart candle={stock.candle} priceTarget={pt} />
      ) : pt ? (
        <PriceTargetBar target={pt} />
      ) : null}

      {/* Footer: relevance + industry */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-text-secondary">Relevance</span>
          <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-secondary"
              style={{ width: `${stock.relevanceScore * 100}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-secondary">{Math.round(stock.relevanceScore * 100)}%</span>
        </div>
        {profile?.finnhubIndustry && (
          <span className="text-[10px] text-text-secondary">{profile.finnhubIndustry}</span>
        )}
      </div>
    </div>
  );
}

function DailyStockChart({ candle, priceTarget }: { candle: StockCandle; priceTarget?: PriceTarget }) {
  const data = candle.candles;
  const chartW = 280;
  const chartH = 100;
  const padL = 40;
  const padR = 8;
  const padT = 8;
  const padB = 20;
  const innerW = chartW - padL - padR;
  const innerH = chartH - padT - padB;

  // Compute price range
  const closes = data.map((d) => d.close);
  const allPrices = [...closes];
  if (priceTarget) {
    allPrices.push(priceTarget.targetLow, priceTarget.targetHigh);
  }
  const minP = Math.min(...allPrices) * 0.98;
  const maxP = Math.max(...allPrices) * 1.02;
  const rangeP = maxP - minP || 1;

  const toX = (i: number) => padL + (i / (data.length - 1)) * innerW;
  const toY = (p: number) => padT + (1 - (p - minP) / rangeP) * innerH;

  // Build line path
  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d.close).toFixed(1)}`).join(' ');
  // Build area path
  const areaPath = linePath + ` L${toX(data.length - 1).toFixed(1)},${(padT + innerH).toFixed(1)} L${toX(0).toFixed(1)},${(padT + innerH).toFixed(1)} Z`;

  // Color: green if last close >= first close, red otherwise
  const isUp = closes[closes.length - 1] >= closes[0];
  const lineColor = isUp ? '#22c55e' : '#ef4444';
  const fillColor = isUp ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)';

  // Last price
  const lastClose = closes[closes.length - 1];
  const firstClose = closes[0];
  const changePct = ((lastClose - firstClose) / firstClose) * 100;

  // Y-axis ticks (3 levels)
  const yTicks = [minP, minP + rangeP / 2, maxP];

  // X-axis labels (first, mid, last date)
  const xLabels = [
    { i: 0, label: data[0].date.slice(5) },
    { i: Math.floor(data.length / 2), label: data[Math.floor(data.length / 2)]?.date.slice(5) },
    { i: data.length - 1, label: data[data.length - 1].date.slice(5) },
  ];

  return (
    <div className="mt-2 p-3 bg-surface rounded-lg border border-border">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-text-secondary">30-Day Price</span>
        <span className={`text-[11px] font-bold ${isUp ? 'text-accent' : 'text-declining'}`}>
          {changePct >= 0 ? '+' : ''}{changePct.toFixed(1)}%
        </span>
      </div>

      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {yTicks.map((tick, i) => (
          <g key={i}>
            <line x1={padL} x2={chartW - padR} y1={toY(tick)} y2={toY(tick)} stroke="currentColor" className="text-border" strokeWidth="0.5" strokeDasharray="2,2" />
            <text x={padL - 3} y={toY(tick) + 3} textAnchor="end" className="fill-text-secondary" fontSize="7">${tick.toFixed(0)}</text>
          </g>
        ))}

        {/* Price target zones */}
        {priceTarget && (
          <>
            <rect x={padL} y={toY(priceTarget.targetHigh)} width={innerW} height={toY(priceTarget.targetLow) - toY(priceTarget.targetHigh)} fill="rgba(234,179,8,0.08)" />
            <line x1={padL} x2={chartW - padR} y1={toY(priceTarget.targetMid)} y2={toY(priceTarget.targetMid)} stroke="#eab308" strokeWidth="0.8" strokeDasharray="4,3" />
            <text x={chartW - padR + 1} y={toY(priceTarget.targetMid) + 3} fontSize="6" className="fill-peak" fontWeight="bold">T ${priceTarget.targetMid.toFixed(0)}</text>
          </>
        )}

        {/* Area fill */}
        <path d={areaPath} fill={fillColor} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={lineColor} strokeWidth="1.5" strokeLinejoin="round" />

        {/* Last point dot */}
        <circle cx={toX(data.length - 1)} cy={toY(lastClose)} r="2.5" fill={lineColor} />

        {/* X-axis labels */}
        {xLabels.map(({ i, label }) => (
          <text key={i} x={toX(i)} y={chartH - 3} textAnchor="middle" className="fill-text-secondary" fontSize="6.5">{label}</text>
        ))}
      </svg>

      {/* Price target summary below chart */}
      {priceTarget && (
        <div className="mt-2 pt-2 border-t border-border">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-text-secondary">Target ({priceTarget.timeframe})</span>
            <span className={`text-[10px] font-bold ${priceTarget.targetMid >= lastClose ? 'text-accent' : 'text-declining'}`}>
              {priceTarget.targetMid >= lastClose ? '+' : ''}{(((priceTarget.targetMid - lastClose) / lastClose) * 100).toFixed(1)}% expected
            </span>
          </div>
          <div className="flex gap-3 text-[9px]">
            <span className="text-declining">Low ${priceTarget.targetLow.toFixed(0)}</span>
            <span className="text-peak font-bold">Base ${priceTarget.targetMid.toFixed(0)}</span>
            <span className="text-accent">High ${priceTarget.targetHigh.toFixed(0)}</span>
          </div>
          <p className="text-[9px] text-text-secondary leading-relaxed mt-1">{priceTarget.rationaleKo}</p>
        </div>
      )}
    </div>
  );
}

function PriceTargetBar({ target }: { target: PriceTarget }) {
  const { currentPrice, targetLow, targetMid, targetHigh, timeframe, rationaleKo } = target;

  const rangeMin = Math.min(currentPrice, targetLow) * 0.95;
  const rangeMax = targetHigh * 1.05;
  const totalRange = rangeMax - rangeMin || 1;

  const toPercent = (val: number) => ((val - rangeMin) / totalRange) * 100;
  const currentPct = toPercent(currentPrice);
  const lowPct = toPercent(targetLow);
  const midPct = toPercent(targetMid);
  const highPct = toPercent(targetHigh);

  const midVsCurrent = ((targetMid - currentPrice) / currentPrice) * 100;
  const isUpside = midVsCurrent >= 0;

  return (
    <div className="mt-2 p-3 bg-surface rounded-lg border border-border">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-semibold text-text-secondary">Price Target ({timeframe})</span>
        <span className={`text-[11px] font-bold ${isUpside ? 'text-accent' : 'text-declining'}`}>
          {isUpside ? '+' : ''}{midVsCurrent.toFixed(1)}% expected
        </span>
      </div>

      {/* Range bar */}
      <div className="relative h-8 mb-1">
        <div className="absolute top-3 left-0 right-0 h-2 bg-border rounded-full" />
        <div
          className="absolute top-3 h-2 rounded-full bg-gradient-to-r from-declining/40 via-peak/60 to-accent/40"
          style={{ left: `${lowPct}%`, width: `${highPct - lowPct}%` }}
        />
        <div className="absolute top-1.5" style={{ left: `${lowPct}%`, transform: 'translateX(-50%)' }}>
          <div className="w-0.5 h-5 bg-declining/60 mx-auto" />
        </div>
        <div className="absolute top-1" style={{ left: `${midPct}%`, transform: 'translateX(-50%)' }}>
          <div className="w-1 h-6 bg-peak rounded-full mx-auto" />
        </div>
        <div className="absolute top-1.5" style={{ left: `${highPct}%`, transform: 'translateX(-50%)' }}>
          <div className="w-0.5 h-5 bg-accent/60 mx-auto" />
        </div>
        <div className="absolute -top-0.5" style={{ left: `${currentPct}%`, transform: 'translateX(-50%)' }}>
          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-secondary mx-auto" />
          <div className="w-0.5 h-5 bg-secondary mx-auto" />
        </div>
      </div>

      <div className="flex justify-between text-[9px] mb-1">
        <span className="text-declining font-semibold">${targetLow.toFixed(0)}</span>
        <span className="text-peak font-bold">${targetMid.toFixed(0)}</span>
        <span className="text-accent font-semibold">${targetHigh.toFixed(0)}</span>
      </div>
      <div className="flex justify-between text-[8px] text-text-secondary mb-2">
        <span>Conservative</span>
        <span>Base</span>
        <span>Optimistic</span>
      </div>

      <p className="text-[9px] text-text-secondary leading-relaxed border-t border-border pt-2">
        {rationaleKo}
      </p>
    </div>
  );
}

/* ========================= REPORT TAB ========================= */

function ReportTab({ report }: { report: AnalysisReport }) {
  return (
    <div className="space-y-6">
      <section className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading font-semibold text-lg">Daily Analysis Report</h2>
          <span className="text-sm text-text-secondary">{report.date}</span>
        </div>

        <div className="prose prose-sm max-w-none">
          <div className="mb-6">
            <h3 className="font-heading font-semibold text-base mb-2">Executive Summary</h3>
            <p className="text-text-secondary leading-relaxed">{report.summaryKo}</p>
            <p className="text-text-secondary text-xs leading-relaxed mt-2 italic">{report.summary}</p>
          </div>

          <div className="mb-6">
            <h3 className="font-heading font-semibold text-base mb-3">Key Insights</h3>
            <div className="space-y-2">
              {report.keyInsightsKo.map((insight, i) => (
                <div key={i} className="flex gap-3 p-3 bg-background rounded-lg">
                  <span className="text-secondary font-bold text-sm">{i + 1}.</span>
                  <p className="text-sm text-text-secondary">{insight}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-heading font-semibold text-base mb-3">
              Theme Analysis ({report.themes.length} themes)
            </h3>
            <div className="space-y-4">
              {report.themes.map((theme, i) => (
                <div key={theme.id} className="p-4 bg-background rounded-lg border border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-heading font-bold text-secondary">#{i + 1}</span>
                    <div>
                      <h4 className="font-semibold text-sm">{theme.nameKo}</h4>
                      <p className="text-xs text-text-secondary">{theme.name}</p>
                    </div>
                    <div className="ml-auto flex gap-2">
                      <Badge className={STATUS_COLORS[theme.status]}>
                        {theme.status}
                      </Badge>
                      <Badge className={RISK_COLORS[theme.riskLevel]}>
                        Risk: {theme.riskLevel}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-text-secondary mb-3">{theme.description}</p>

                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-accent mb-1">Opportunities</p>
                      <ul className="space-y-1">
                        {theme.opportunities.map((o, j) => (
                          <li key={j} className="text-xs text-text-secondary flex gap-1.5">
                            <span className="text-accent">+</span> {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-declining mb-1">Risk Factors</p>
                      <ul className="space-y-1">
                        {theme.riskFactors.map((r, j) => (
                          <li key={j} className="text-xs text-text-secondary flex gap-1.5">
                            <span className="text-declining">-</span> {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {theme.relatedKeywords.map((kw) => (
                      <span key={kw} className="px-2 py-0.5 bg-surface border border-border rounded text-[10px] text-text-secondary">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-heading font-semibold text-base mb-2">Analysis Metadata</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="p-3 bg-background rounded-lg">
                <p className="text-text-secondary text-xs">Articles Analyzed</p>
                <p className="font-semibold">{report.totalArticlesAnalyzed}</p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-text-secondary text-xs">Themes Found</p>
                <p className="font-semibold">{report.themes.length}</p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-text-secondary text-xs">Report Date</p>
                <p className="font-semibold">{report.date}</p>
              </div>
              <div className="p-3 bg-background rounded-lg">
                <p className="text-text-secondary text-xs">Generated At</p>
                <p className="font-semibold">{new Date(report.createdAt).toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ========================= COMPONENTS ========================= */

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface rounded-xl border border-border p-4">
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      <p className="text-2xl font-heading font-bold text-text">{value}</p>
    </div>
  );
}

function ThemeCard({ theme, compact }: { theme: Theme; compact?: boolean }) {
  const [expanded, setExpanded] = useState(false);

  if (compact) {
    return (
      <div className="p-3 rounded-lg border border-border bg-background">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Badge className={CATEGORY_COLORS[theme.category]}>
              {CATEGORY_LABELS[theme.category]}
            </Badge>
            <Badge className={STATUS_COLORS[theme.status]}>
              {theme.status}
            </Badge>
          </div>
          <ConfidenceMeter score={theme.confidenceScore} />
        </div>
        <h3 className="font-semibold text-sm">{theme.nameKo}</h3>
        <p className="text-xs text-text-secondary">{theme.name}</p>
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge className={CATEGORY_COLORS[theme.category]}>
              {CATEGORY_LABELS[theme.category]}
            </Badge>
            <Badge className={STATUS_COLORS[theme.status]}>
              {theme.status}
            </Badge>
            <Badge className={RISK_COLORS[theme.riskLevel]}>
              Risk: {theme.riskLevel}
            </Badge>
          </div>
          <h3 className="font-heading font-semibold text-base">{theme.nameKo}</h3>
          <p className="text-sm text-text-secondary">{theme.name}</p>
        </div>
        <ConfidenceMeter score={theme.confidenceScore} large />
      </div>

      <p className="text-sm text-text-secondary leading-relaxed mb-4">{theme.description}</p>

      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-secondary font-medium hover:underline mb-3"
      >
        {expanded ? 'Hide Details' : 'Show Details'}
      </button>

      {expanded && (
        <div className="space-y-4 pt-3 border-t border-border">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-accent mb-2">Opportunities</p>
              {theme.opportunities.map((o, i) => (
                <p key={i} className="text-xs text-text-secondary mb-1 flex gap-1.5">
                  <span className="text-accent shrink-0">+</span> {o}
                </p>
              ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-declining mb-2">Risk Factors</p>
              {theme.riskFactors.map((r, i) => (
                <p key={i} className="text-xs text-text-secondary mb-1 flex gap-1.5">
                  <span className="text-declining shrink-0">-</span> {r}
                </p>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-text-secondary mb-2">Related Keywords</p>
            <div className="flex flex-wrap gap-1.5">
              {theme.relatedKeywords.map((kw) => (
                <span key={kw} className="px-2 py-0.5 bg-background border border-border rounded text-[10px] text-text-secondary">
                  {kw}
                </span>
              ))}
            </div>
          </div>

          {theme.relatedStocks?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-secondary mb-2">Related Stocks</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {theme.relatedStocks.map((stock) => (
                  <StockCard key={stock.symbol} stock={stock} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ArticleCard({ article, onClick }: { article: NewsArticle; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className="bg-surface rounded-xl border border-border p-4 hover:border-secondary/30 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-2 mb-2">
        <Badge className={CATEGORY_COLORS[article.category]}>
          {CATEGORY_LABELS[article.category]}
        </Badge>
        <span className="text-xs text-text-secondary">{article.source}</span>
        <span className="text-xs text-text-secondary ml-auto">
          {new Date(article.publishedAt).toLocaleDateString()}
        </span>
      </div>
      <h3 className="font-semibold text-sm mb-1.5">{article.title}</h3>
      <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">{article.description}</p>
      <span className="text-[10px] text-secondary font-medium mt-1.5 inline-block">Read more &rarr;</span>
    </div>
  );
}

function ArticleDetailModal({ article, onClose }: { article: NewsArticle; onClose: () => void }) {
  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface rounded-2xl border border-border shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge className={CATEGORY_COLORS[article.category]}>
                {CATEGORY_LABELS[article.category]}
              </Badge>
              <span className="text-xs text-text-secondary">{article.source}</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-background border border-border flex items-center justify-center text-text-secondary hover:text-text transition-colors"
            >
              &times;
            </button>
          </div>
          <h2 className="font-heading font-bold text-lg leading-snug">{article.title}</h2>
          <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
            {article.author && <span>By {article.author}</span>}
            <span>{new Date(article.publishedAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {article.imageUrl && (
            <img
              src={article.imageUrl}
              alt={article.title}
              className="w-full h-48 object-cover rounded-lg mb-4 border border-border"
            />
          )}

          <p className="text-sm text-text font-medium leading-relaxed mb-4">{article.description}</p>

          <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
            {article.content}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border shrink-0 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-text-secondary hover:text-text transition-colors"
          >
            Close
          </button>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-secondary text-white text-sm font-medium rounded-lg hover:bg-secondary/90 transition-colors"
          >
            View Original &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${className}`}>
      {children}
    </span>
  );
}

function ConfidenceMeter({ score, large }: { score: number; large?: boolean }) {
  const pct = Math.round(score * 100);
  const color = pct >= 80 ? 'text-accent' : pct >= 60 ? 'text-peak' : 'text-text-secondary';

  return (
    <div className={`text-right ${large ? '' : ''}`}>
      <p className={`${large ? 'text-xl' : 'text-sm'} font-heading font-bold ${color}`}>
        {pct}%
      </p>
      <p className="text-[10px] text-text-secondary">confidence</p>
    </div>
  );
}

function CategoryBar({ category, count, total }: { category: NewsCategory; count: number; total: number }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-text-secondary w-24 shrink-0">
        {CATEGORY_LABELS[category]}
      </span>
      <div className="flex-1 h-2 bg-background rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-secondary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-text-secondary w-8 text-right">{count}</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface rounded-xl border border-border p-4 animate-pulse">
            <div className="h-3 w-20 bg-border rounded mb-2" />
            <div className="h-6 w-12 bg-border rounded" />
          </div>
        ))}
      </div>
      <div className="bg-surface rounded-xl border border-border p-6 animate-pulse">
        <div className="h-4 w-32 bg-border rounded mb-4" />
        <div className="space-y-2">
          <div className="h-3 bg-border rounded w-full" />
          <div className="h-3 bg-border rounded w-4/5" />
          <div className="h-3 bg-border rounded w-3/5" />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onRun, analyzing }: { onRun: () => void; analyzing: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mb-6">
        <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
          <span className="text-white font-heading font-bold text-sm">G</span>
        </div>
      </div>
      <h2 className="font-heading font-semibold text-xl text-text mb-2">No Analysis Yet</h2>
      <p className="text-text-secondary text-sm mb-6 text-center max-w-md">
        Run your first analysis to collect global news, extract themes, and generate insights.
        <br />
        첫 분석을 실행하여 글로벌 뉴스를 수집하고 테마를 추출하세요.
      </p>
      <button
        onClick={onRun}
        disabled={analyzing}
        className="px-6 py-3 bg-secondary text-white font-medium rounded-xl hover:bg-secondary/90 transition-colors disabled:opacity-50"
      >
        {analyzing ? 'Analyzing...' : 'Run First Analysis'}
      </button>
    </div>
  );
}
