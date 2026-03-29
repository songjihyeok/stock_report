import { Controller, Get, Post, Query } from '@nestjs/common';
import { NewsService } from './news.service';
import type { NewsCategory } from '@vb/shared';

@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post('collect')
  async collectNews() {
    const articles = await this.newsService.collectNews();
    return {
      success: true,
      data: {
        collected: articles.length,
        total: this.newsService.getArticleCount(),
      },
    };
  }

  @Get()
  getArticles(
    @Query('limit') limit?: number,
    @Query('category') category?: NewsCategory,
  ) {
    const articles = this.newsService.getArticles(limit || 50, category);
    return {
      success: true,
      data: articles,
      meta: { total: articles.length },
    };
  }

  @Get('categories')
  getCategoryBreakdown() {
    return {
      success: true,
      data: this.newsService.getCategoryBreakdown(),
    };
  }
}
