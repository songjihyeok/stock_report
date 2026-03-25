import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'uploads';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
];

@Injectable()
export class UploadService {
  private supabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    this.supabase = createClient(
      this.configService.get<string>('supabase.url')!,
      this.configService.get<string>('supabase.secretKey')!,
    );
  }

  async uploadFile(
    file: Express.Multer.File,
    userId: string,
  ): Promise<{ path: string; url: string }> {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    const ext = file.originalname.split('.').pop();
    const filePath = `${userId}/${Date.now()}.${ext}`;

    const { error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(`Upload failed: ${error.message}`);
    }

    const { data: urlData } = this.supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return { path: filePath, url: urlData.publicUrl };
  }

  async listFiles(userId: string): Promise<{ name: string; id: string | null; created_at: string | null }[]> {
    const { data, error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .list(userId, { sortBy: { column: 'created_at', order: 'desc' } });

    if (error) {
      throw new BadRequestException(`Failed to list files: ${error.message}`);
    }

    return data;
  }

  async deleteFile(filePath: string) {
    const { error } = await this.supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      throw new BadRequestException(`Delete failed: ${error.message}`);
    }
  }
}
