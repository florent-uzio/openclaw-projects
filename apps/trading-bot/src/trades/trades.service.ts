import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Trade, TradeFilters, PaginatedResponse } from '@openclaw/types';

@Injectable()
export class TradesService {
  constructor(private readonly db: DatabaseService) {}

  getTrades(filters: TradeFilters): PaginatedResponse<Trade> {
    const { trades, total } = this.db.getTrades(filters);
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 50;
    return { items: trades, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  getTradeById(id: string): Trade | null {
    return this.db.getTradeById(id);
  }
}
