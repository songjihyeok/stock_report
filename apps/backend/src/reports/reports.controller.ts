import { Controller, Get } from '@nestjs/common';
import { AnalysisService } from '../analysis/analysis.service';
import { NewsService } from '../news/news.service';
import type { DashboardSummary } from '@vb/shared';

@Controller('dashboard')
export class ReportsController {
  constructor(
    private readonly analysisService: AnalysisService,
    private readonly newsService: NewsService,
  ) {}

  @Get('summary')
  getSummary(): { success: boolean; data: DashboardSummary } {
    const latestReport = this.analysisService.getLatestReport();
    const topThemes = this.analysisService.getAllThemes();
    const recentArticles = this.newsService.getArticles(20);
    const categoryDistribution = this.newsService.getCategoryBreakdown();

    // Build trending keywords from themes
    const keywordCount: Record<string, number> = {};
    for (const theme of topThemes) {
      for (const kw of theme.relatedKeywords) {
        keywordCount[kw] = (keywordCount[kw] || 0) + 1;
      }
    }
    const trendingKeywords = Object.entries(keywordCount)
      .map(([keyword, count]) => ({ keyword, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    const recommendedStocks = latestReport?.recommendedStocks || [];

    return {
      success: true,
      data: {
        latestReport,
        topThemes,
        recommendedStocks,
        recentArticles,
        trendingKeywords,
        categoryDistribution: categoryDistribution as DashboardSummary['categoryDistribution'],
      },
    };
  }
}
