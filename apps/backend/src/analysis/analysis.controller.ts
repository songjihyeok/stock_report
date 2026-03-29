import { Controller, Get, Post, Param, Query } from '@nestjs/common';
import { AnalysisService } from './analysis.service';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Post('run')
  async runAnalysis() {
    const report = await this.analysisService.runDailyAnalysis();
    return { success: true, data: report };
  }

  @Get('reports')
  getReports(@Query('limit') limit?: number) {
    const reports = this.analysisService.getReports(limit || 10);
    return { success: true, data: reports };
  }

  @Get('reports/latest')
  getLatestReport() {
    const report = this.analysisService.getLatestReport();
    return { success: true, data: report };
  }

  @Get('reports/:id')
  getReportById(@Param('id') id: string) {
    const report = this.analysisService.getReportById(id);
    if (!report) {
      return { success: false, error: 'Report not found' };
    }
    return { success: true, data: report };
  }

  @Get('themes')
  getThemes() {
    const themes = this.analysisService.getAllThemes();
    return { success: true, data: themes };
  }

  @Get('themes/history')
  getThemeHistory(@Query('name') name?: string) {
    const history = this.analysisService.getThemeHistory(name);
    return { success: true, data: history };
  }
}
