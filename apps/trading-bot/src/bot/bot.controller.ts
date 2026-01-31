import { Controller, Post, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { BotService } from './bot.service';
import { BotState, ApiResponse as ApiRes } from '@openclaw/types';

@ApiTags('bot')
@Controller('bot')
export class BotController {
  constructor(private readonly botService: BotService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get bot status' })
  @ApiResponse({ status: 200, description: 'Returns current bot state' })
  getStatus(): ApiRes<BotState> {
    return {
      success: true,
      data: this.botService.getState(),
      timestamp: new Date(),
    };
  }

  @Post('start')
  @ApiOperation({ summary: 'Start the trading bot' })
  @ApiResponse({ status: 200, description: 'Bot started successfully' })
  @ApiResponse({ status: 400, description: 'Bot already running or configuration error' })
  async start(): Promise<ApiRes<BotState>> {
    try {
      const state = await this.botService.start();
      return {
        success: true,
        data: state,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to start bot',
          timestamp: new Date(),
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post('stop')
  @ApiOperation({ summary: 'Stop the trading bot' })
  @ApiResponse({ status: 200, description: 'Bot stopped successfully' })
  async stop(): Promise<ApiRes<BotState>> {
    const state = await this.botService.stop();
    return {
      success: true,
      data: state,
      timestamp: new Date(),
    };
  }
}
