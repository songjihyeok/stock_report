import { Controller, Get } from '@nestjs/common';
import type { ApiResponse } from '@vb/shared';

@Controller('health')
export class HealthController {
  @Get()
  check(): ApiResponse<{ status: string }> {
    return {
      success: true,
      data: { status: 'ok' },
    };
  }
}
