import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DatabaseService } from '../database/database.service';
import type { TradeFilters, TradeType, TradeStatus } from '@openclaw/types';

@ApiTags('trades')
@Controller('api/trades')
export class TradesController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  @ApiOperation({ summary: 'Get trade history with optional filters' })
  @ApiQuery({ name: 'type', required: false, enum: ['BUY', 'SELL'] })
  @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'FILLED', 'CANCELLED', 'FAILED'] })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'List of trades' })
  getTrades(
    @Query('type') type?: TradeType,
    @Query('status') status?: TradeStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const filters: TradeFilters = {
      type,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page, 10) : 1,
      pageSize: pageSize ? parseInt(pageSize, 10) : 50,
    };

    const result = this.databaseService.getTrades(filters);

    return {
      success: true,
      data: result,
    };
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today\'s trades' })
  @ApiResponse({ status: 200, description: 'List of today\'s trades' })
  getTodayTrades() {
    const trades = this.databaseService.getTodayTrades();
    return {
      success: true,
      data: trades,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific trade by ID' })
  @ApiResponse({ status: 200, description: 'Trade details' })
  @ApiResponse({ status: 404, description: 'Trade not found' })
  getTrade(@Param('id') id: string) {
    const trade = this.databaseService.getTradeById(id);

    if (!trade) {
      return {
        success: false,
        error: 'Trade not found',
      };
    }

    return {
      success: true,
      data: trade,
    };
  }
}
