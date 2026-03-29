import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AnalysisService } from '../analysis/analysis.service';
import { NewsService } from '../news/news.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly analysisService: AnalysisService,
    private readonly newsService: NewsService,
  ) {}

  /**
   * Run daily analysis at 7:00 AM every day
   */
  @Cron('0 7 * * *')
  async handleDailyAnalysis() {
    this.logger.log('Starting scheduled daily analysis...');
    try {
      const report = await this.analysisService.runDailyAnalysis();
      this.logger.log(`Scheduled analysis complete: ${report.themes.length} themes found`);
    } catch (error) {
      this.logger.error(`Scheduled analysis failed: ${error}`);
    }
  }

  /**
   * Collect news every 6 hours
   */
  @Cron('0 */6 * * *')
  async handleNewsCollection() {
    this.logger.log('Starting scheduled news collection...');
    try {
      const articles = await this.newsService.collectNews();
      this.logger.log(`Scheduled news collection complete: ${articles.length} new articles`);
    } catch (error) {
      this.logger.error(`Scheduled news collection failed: ${error}`);
    }
  }
}
