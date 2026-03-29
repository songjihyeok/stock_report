import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalysisController } from './analysis.controller';
import { NewsModule } from '../news/news.module';
import { StocksModule } from '../stocks/stocks.module';

@Module({
  imports: [NewsModule, StocksModule],
  providers: [AnalysisService],
  controllers: [AnalysisController],
  exports: [AnalysisService],
})
export class AnalysisModule {}
