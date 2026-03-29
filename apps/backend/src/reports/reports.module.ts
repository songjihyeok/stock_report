import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { AnalysisModule } from '../analysis/analysis.module';
import { NewsModule } from '../news/news.module';

@Module({
  imports: [AnalysisModule, NewsModule],
  controllers: [ReportsController],
})
export class ReportsModule {}
