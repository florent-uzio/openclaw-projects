import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StatsService } from './stats.service';
import { BotStats, ApiResponse as ApiRes } from '@openclaw/types';

@ApiTags('stats')
@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @ApiOperation({ summary: 'Get trading statistics' })
  getStats(): ApiRes<BotStats> {
    return { success: true, data: this.statsService.getStats(), timestamp: new Date() };
  }
}
