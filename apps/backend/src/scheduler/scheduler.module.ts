import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { AnalysisModule } from '../analysis/analysis.module';
import { NewsModule } from '../news/news.module';

@Module({
  imports: [AnalysisModule, NewsModule],
  providers: [SchedulerService],
})
export class SchedulerModule {}
