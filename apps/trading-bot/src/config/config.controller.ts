import { Controller, Get, Patch, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BotConfigService } from './config.service';
import { BotConfig, ConfigUpdate, ApiResponse as ApiRes, Balance } from '@openclaw/types';

@ApiTags('config')
@Controller('config')
export class BotConfigController {
  constructor(private readonly configService: BotConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get current configuration' })
  @ApiResponse({ status: 200, description: 'Returns current bot configuration' })
  getConfig(): ApiRes<BotConfig> {
    return {
      success: true,
      data: this.configService.getConfig(),
      timestamp: new Date(),
    };
  }

  @Patch()
  @ApiOperation({ summary: 'Update configuration' })
  @ApiResponse({ status: 200, description: 'Configuration updated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid configuration' })
  updateConfig(@Body() updates: ConfigUpdate): ApiRes<BotConfig> {
    try {
      const config = this.configService.updateConfig(updates);
      return {
        success: true,
        data: config,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update config',
          timestamp: new Date(),
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('reset-balance')
  @ApiOperation({ summary: 'Reset balance to starting capital' })
  @ApiResponse({ status: 200, description: 'Balance reset successfully' })
  resetBalance(): ApiRes<{ balance: Balance }> {
    const result = this.configService.resetBalance();
    return {
      success: true,
      data: result,
      timestamp: new Date(),
    };
  }
}
