import { Controller, Get, Param, Query } from '@nestjs/common';
import { StocksService } from './stocks.service';

@Controller('stocks')
export class StocksController {
  constructor(private readonly stocksService: StocksService) {}

  @Get('search')
  async searchSymbols(@Query('q') query: string) {
    const results = await this.stocksService.searchSymbols(query || '');
    return { success: true, data: results };
  }

  @Get(':symbol/profile')
  async getProfile(@Param('symbol') symbol: string) {
    const profile = await this.stocksService.getProfile(symbol.toUpperCase());
    return { success: true, data: profile };
  }

  @Get(':symbol/quote')
  async getQuote(@Param('symbol') symbol: string) {
    const quote = await this.stocksService.getQuote(symbol.toUpperCase());
    return { success: true, data: quote };
  }
}
