import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import type { StockProfile, StockQuote, StockCandle, StockCandlePoint, ThemeStock } from '@vb/shared';

interface AlphaVantageDailyResponse {
  'Time Series (Daily)': Record<string, {
    '1. open': string;
    '2. high': string;
    '3. low': string;
    '4. close': string;
    '5. volume': string;
  }>;
}

interface FinnhubSearchResult {
  count: number;
  result: {
    description: string;
    displaySymbol: string;
    symbol: string;
    type: string;
  }[];
}

interface FinnhubProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  ticker: string;
  finnhubIndustry: string;
  logo: string;
  weburl: string;
}

interface FinnhubQuote {
  c: number; // current price
  d: number; // change
  dp: number; // percent change
  h: number; // high
  l: number; // low
  o: number; // open
  pc: number; // previous close
  t: number; // timestamp
}

@Injectable()
export class StocksService {
  private readonly logger = new Logger(StocksService.name);
  private readonly apiKey: string;
  private readonly avApiKey: string;
  private readonly baseUrl = 'https://finnhub.io/api/v1';
  private readonly avBaseUrl = 'https://www.alphavantage.co/query';

  // Simple cache to avoid rate limits
  private profileCache = new Map<string, { data: StockProfile; expiry: number }>();
  private quoteCache = new Map<string, { data: StockQuote; expiry: number }>();
  private candleCache = new Map<string, { data: StockCandle; expiry: number }>();

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('finnhub.key', '');
    this.avApiKey = this.configService.get<string>('alphavantage.key', '');
  }

  /**
   * Search for stock symbols matching a keyword
   */
  async searchSymbols(query: string): Promise<{ symbol: string; name: string }[]> {
    if (!this.apiKey) {
      this.logger.warn('FINNHUB_API_KEY not configured');
      return [];
    }

    try {
      const response = await axios.get<FinnhubSearchResult>(`${this.baseUrl}/search`, {
        params: { q: query, token: this.apiKey },
      });

      return response.data.result
        .filter((r) => r.type === 'Common Stock')
        .slice(0, 5)
        .map((r) => ({ symbol: r.symbol, name: r.description }));
    } catch (error) {
      this.logger.error(`Symbol search failed for "${query}": ${error}`);
      return [];
    }
  }

  /**
   * Get company profile for a symbol
   */
  async getProfile(symbol: string): Promise<StockProfile | null> {
    const cached = this.profileCache.get(symbol);
    if (cached && cached.expiry > Date.now()) return cached.data;

    if (!this.apiKey) return null;

    try {
      const response = await axios.get<FinnhubProfile>(`${this.baseUrl}/stock/profile2`, {
        params: { symbol, token: this.apiKey },
      });

      const d = response.data;
      if (!d.name) return null;

      const profile: StockProfile = {
        symbol: d.ticker || symbol,
        name: d.name,
        country: d.country,
        currency: d.currency,
        exchange: d.exchange,
        ipo: d.ipo,
        marketCapitalization: d.marketCapitalization,
        finnhubIndustry: d.finnhubIndustry,
        logo: d.logo,
        weburl: d.weburl,
      };

      // Cache for 1 hour
      this.profileCache.set(symbol, { data: profile, expiry: Date.now() + 3600000 });
      return profile;
    } catch (error) {
      this.logger.error(`Profile fetch failed for ${symbol}: ${error}`);
      return null;
    }
  }

  /**
   * Get real-time quote for a symbol
   */
  async getQuote(symbol: string): Promise<StockQuote | null> {
    const cached = this.quoteCache.get(symbol);
    if (cached && cached.expiry > Date.now()) return cached.data;

    if (!this.apiKey) return null;

    try {
      const response = await axios.get<FinnhubQuote>(`${this.baseUrl}/quote`, {
        params: { symbol, token: this.apiKey },
      });

      const d = response.data;
      if (!d.c) return null;

      const quote: StockQuote = {
        symbol,
        currentPrice: d.c,
        change: d.d,
        percentChange: d.dp,
        highPrice: d.h,
        lowPrice: d.l,
        openPrice: d.o,
        previousClose: d.pc,
        timestamp: d.t,
      };

      // Cache for 5 minutes
      this.quoteCache.set(symbol, { data: quote, expiry: Date.now() + 300000 });
      return quote;
    } catch (error) {
      this.logger.error(`Quote fetch failed for ${symbol}: ${error}`);
      return null;
    }
  }

  /**
   * Get daily candle data for the last 30 days (via Alpha Vantage)
   */
  async getCandle(symbol: string, days = 30): Promise<StockCandle | null> {
    const cached = this.candleCache.get(symbol);
    if (cached && cached.expiry > Date.now()) return cached.data;

    if (!this.avApiKey) {
      this.logger.warn('ALPHA_VANTAGE_API_KEY not configured, skipping candle data');
      return null;
    }

    try {
      const response = await axios.get<AlphaVantageDailyResponse>(this.avBaseUrl, {
        params: {
          function: 'TIME_SERIES_DAILY',
          symbol,
          outputsize: 'compact',
          apikey: this.avApiKey,
        },
      });

      const timeSeries = response.data['Time Series (Daily)'];
      if (!timeSeries) {
        this.logger.warn(`No candle data from Alpha Vantage for ${symbol}`);
        return null;
      }

      const candles: StockCandlePoint[] = Object.entries(timeSeries)
        .map(([date, values]) => ({
          date,
          open: parseFloat(values['1. open']),
          high: parseFloat(values['2. high']),
          low: parseFloat(values['3. low']),
          close: parseFloat(values['4. close']),
          volume: parseFloat(values['5. volume']),
        }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-days);

      const candle: StockCandle = { symbol, candles };

      // Cache for 1 hour
      this.candleCache.set(symbol, { data: candle, expiry: Date.now() + 3600000 });
      return candle;
    } catch (error) {
      this.logger.error(`Alpha Vantage candle fetch failed for ${symbol}: ${error}`);
      return null;
    }
  }

  /**
   * Quick enrichment: profile + quote only (no candle). Fully parallel.
   */
  async enrichStocksQuick(stocks: ThemeStock[]): Promise<ThemeStock[]> {
    if (!this.apiKey) return stocks;

    const results = await Promise.all(
      stocks.map(async (stock) => {
        const [profile, quote] = await Promise.all([
          this.getProfile(stock.symbol),
          this.getQuote(stock.symbol),
        ]);
        return {
          ...stock,
          name: profile?.name || stock.name,
          profile: profile || undefined,
          quote: quote || undefined,
        };
      }),
    );

    return results;
  }

  /**
   * Fetch candle data for multiple symbols in parallel.
   * Never throws — returns partial results. Failed/rate-limited requests are silently skipped.
   */
  async fetchCandlesSafe(symbols: string[]): Promise<Map<string, StockCandle>> {
    const candleMap = new Map<string, StockCandle>();
    const unique = [...new Set(symbols)];

    // Separate cached vs uncached
    const uncached: string[] = [];
    for (const symbol of unique) {
      const cached = this.candleCache.get(symbol);
      if (cached && cached.expiry > Date.now()) {
        candleMap.set(symbol, cached.data);
      } else {
        uncached.push(symbol);
      }
    }

    if (uncached.length === 0) return candleMap;

    // Fire all requests in parallel — accept partial results
    const results = await Promise.allSettled(
      uncached.map((symbol) => this.getCandle(symbol)),
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      if (result.status === 'fulfilled' && result.value) {
        candleMap.set(uncached[i], result.value);
      } else {
        this.logger.warn(`Candle skipped for ${uncached[i]}: ${result.status === 'rejected' ? result.reason : 'no data'}`);
      }
    }

    this.logger.log(`Candles fetched: ${candleMap.size}/${unique.length} (${uncached.length} requested in parallel)`);
    return candleMap;
  }

  /**
   * Full enrichment with profile, quote, and candle data (all parallel)
   */
  async enrichStocks(stocks: ThemeStock[]): Promise<ThemeStock[]> {
    if (!this.apiKey) return stocks;

    const symbols = stocks.map((s) => s.symbol);

    // Fetch everything in parallel
    const [quickStocks, candleMap] = await Promise.all([
      this.enrichStocksQuick(stocks),
      this.fetchCandlesSafe(symbols),
    ]);

    return quickStocks.map((stock) => ({
      ...stock,
      candle: candleMap.get(stock.symbol) || undefined,
    }));
  }
}
