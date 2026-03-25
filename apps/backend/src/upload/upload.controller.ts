import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UploadService } from './upload.service';
import type { AuthUser, ApiResponse } from '@vb/shared';

@Controller('upload')
@UseGuards(SupabaseAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: AuthUser,
  ): Promise<ApiResponse<{ path: string; url: string }>> {
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    const result = await this.uploadService.uploadFile(file, user.id);
    return { success: true, data: result };
  }

  @Get()
  async list(@CurrentUser() user: AuthUser): Promise<ApiResponse> {
    const files = await this.uploadService.listFiles(user.id);
    return { success: true, data: files };
  }

  @Delete(':path')
  async remove(
    @Param('path') filePath: string,
    @CurrentUser() user: AuthUser,
  ): Promise<ApiResponse> {
    const fullPath = `${user.id}/${filePath}`;
    await this.uploadService.deleteFile(fullPath);
    return { success: true, message: 'File deleted' };
  }
}
