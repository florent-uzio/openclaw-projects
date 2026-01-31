import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Database from 'better-sqlite3';
import { Trade, TradeCreate, TradeStatus, TradeFilters, BotConfig, Balance } from '@openclaw/types';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private db: Database.Database;

  onModuleInit() {
    const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'trading.db');
    
    // Ensure data directory exists
    const dir = path.dirname(dbPath);
    require('fs').mkdirSync(dir, { recursive: true });
    
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initTables();
    console.log(`📦 Database initialized at ${dbPath}`);
  }

  onModuleDestroy() {
    this.db.close();
  }

  private initTables() {
    // Trades table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS trades (
        id TEXT PRIMARY KEY,
        pair TEXT NOT NULL,
        type TEXT NOT NULL,
        order_type TEXT NOT NULL,
        status TEXT NOT NULL,
        price REAL NOT NULL,
        amount REAL NOT NULL,
        total REAL NOT NULL,
        fee REAL NOT NULL,
        fee_currency TEXT NOT NULL,
        is_paper_trade INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        executed_at TEXT,
        external_order_id TEXT,
        notes TEXT
      )
    `);

    // Config table (single row)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS config (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        trading_pair TEXT NOT NULL DEFAULT 'XRP-AED',
        paper_trading INTEGER NOT NULL DEFAULT 1,
        maker_fee REAL NOT NULL DEFAULT 0.002,
        taker_fee REAL NOT NULL DEFAULT 0.002,
        starting_capital_usd REAL NOT NULL DEFAULT 500,
        max_position_size_percent REAL NOT NULL DEFAULT 50,
        buy_threshold_percent REAL NOT NULL DEFAULT 1.0,
        sell_threshold_percent REAL NOT NULL DEFAULT 1.5,
        moving_average_period INTEGER NOT NULL DEFAULT 60,
        stop_loss_percent REAL NOT NULL DEFAULT 5.0,
        max_daily_trades INTEGER NOT NULL DEFAULT 20,
        min_profit_percent REAL NOT NULL DEFAULT 0.5,
        min_trade_amount_usd REAL NOT NULL DEFAULT 10,
        max_trade_amount_usd REAL NOT NULL DEFAULT 100,
        trading_interval_seconds INTEGER NOT NULL DEFAULT 30
      )
    `);

    // Balance table (simulated for paper trading)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS balance (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        usd REAL NOT NULL DEFAULT 500,
        xrp REAL NOT NULL DEFAULT 0,
        usd_locked REAL NOT NULL DEFAULT 0,
        xrp_locked REAL NOT NULL DEFAULT 0
      )
    `);

    // Initialize default config if not exists
    const configExists = this.db.prepare('SELECT COUNT(*) as count FROM config').get() as { count: number };
    if (configExists.count === 0) {
      this.db.prepare('INSERT INTO config (id) VALUES (1)').run();
    }

    // Initialize default balance if not exists
    const balanceExists = this.db.prepare('SELECT COUNT(*) as count FROM balance').get() as { count: number };
    if (balanceExists.count === 0) {
      const startingCapital = process.env.STARTING_CAPITAL_USD || '500';
      this.db.prepare('INSERT INTO balance (id, usd) VALUES (1, ?)').run(parseFloat(startingCapital));
    }
  }

  // ============================================
  // Trade Operations
  // ============================================

  createTrade(trade: TradeCreate, isPaperTrade: boolean): Trade {
    const id = uuidv4();
    const now = new Date().toISOString();
    const fee = trade.price * trade.amount * 0.002; // Default 0.2% fee
    const total = trade.type === 'BUY' 
      ? (trade.price * trade.amount) + fee
      : (trade.price * trade.amount) - fee;

    this.db.prepare(`
      INSERT INTO trades (
        id, pair, type, order_type, status, price, amount, total, fee, fee_currency,
        is_paper_trade, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, trade.pair, trade.type, trade.orderType, 'PENDING', trade.price, trade.amount,
      total, fee, 'USD', isPaperTrade ? 1 : 0, now
    );

    return this.getTradeById(id)!;
  }

  updateTradeStatus(id: string, status: TradeStatus, externalOrderId?: string): Trade | null {
    const executedAt = status === 'FILLED' ? new Date().toISOString() : null;
    
    this.db.prepare(`
      UPDATE trades 
      SET status = ?, executed_at = ?, external_order_id = ?
      WHERE id = ?
    `).run(status, executedAt, externalOrderId || null, id);

    return this.getTradeById(id);
  }

  getTradeById(id: string): Trade | null {
    const row = this.db.prepare('SELECT * FROM trades WHERE id = ?').get(id) as any;
    return row ? this.mapRowToTrade(row) : null;
  }

  getTrades(filters: TradeFilters = {}): { trades: Trade[]; total: number } {
    let query = 'SELECT * FROM trades WHERE 1=1';
    const params: any[] = [];

    if (filters.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.startDate) {
      query += ' AND created_at >= ?';
      params.push(filters.startDate.toISOString());
    }
    if (filters.endDate) {
      query += ' AND created_at <= ?';
      params.push(filters.endDate.toISOString());
    }

    // Get total count
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const { count: total } = this.db.prepare(countQuery).get(...params) as { count: number };

    // Add pagination and ordering
    query += ' ORDER BY created_at DESC';
    const page = filters.page || 1;
    const pageSize = filters.pageSize || 50;
    query += ` LIMIT ? OFFSET ?`;
    params.push(pageSize, (page - 1) * pageSize);

    const rows = this.db.prepare(query).all(...params) as any[];
    const trades = rows.map(row => this.mapRowToTrade(row));

    return { trades, total };
  }

  getTodayTrades(): Trade[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const rows = this.db.prepare(`
      SELECT * FROM trades 
      WHERE created_at >= ? AND status = 'FILLED'
      ORDER BY created_at DESC
    `).all(today.toISOString()) as any[];

    return rows.map(row => this.mapRowToTrade(row));
  }

  private mapRowToTrade(row: any): Trade {
    return {
      id: row.id,
      pair: row.pair,
      type: row.type,
      orderType: row.order_type,
      status: row.status,
      price: row.price,
      amount: row.amount,
      total: row.total,
      fee: row.fee,
      feeCurrency: row.fee_currency,
      isPaperTrade: row.is_paper_trade === 1,
      createdAt: new Date(row.created_at),
      executedAt: row.executed_at ? new Date(row.executed_at) : undefined,
      externalOrderId: row.external_order_id || undefined,
      notes: row.notes || undefined,
    };
  }

  // ============================================
  // Config Operations
  // ============================================

  getConfig(): BotConfig {
    const row = this.db.prepare('SELECT * FROM config WHERE id = 1').get() as any;
    return {
      tradingPair: row.trading_pair,
      paperTrading: row.paper_trading === 1,
      makerFee: row.maker_fee,
      takerFee: row.taker_fee,
      startingCapitalUsd: row.starting_capital_usd,
      maxPositionSizePercent: row.max_position_size_percent,
      buyThresholdPercent: row.buy_threshold_percent,
      sellThresholdPercent: row.sell_threshold_percent,
      movingAveragePeriod: row.moving_average_period,
      stopLossPercent: row.stop_loss_percent,
      maxDailyTrades: row.max_daily_trades,
      minProfitPercent: row.min_profit_percent,
      minTradeAmountUsd: row.min_trade_amount_usd,
      maxTradeAmountUsd: row.max_trade_amount_usd,
      tradingIntervalSeconds: row.trading_interval_seconds,
    };
  }

  updateConfig(updates: Partial<BotConfig>): BotConfig {
    const setClauses: string[] = [];
    const params: any[] = [];

    if (updates.paperTrading !== undefined) {
      setClauses.push('paper_trading = ?');
      params.push(updates.paperTrading ? 1 : 0);
    }
    if (updates.makerFee !== undefined) {
      setClauses.push('maker_fee = ?');
      params.push(updates.makerFee);
    }
    if (updates.takerFee !== undefined) {
      setClauses.push('taker_fee = ?');
      params.push(updates.takerFee);
    }
    if (updates.buyThresholdPercent !== undefined) {
      setClauses.push('buy_threshold_percent = ?');
      params.push(updates.buyThresholdPercent);
    }
    if (updates.sellThresholdPercent !== undefined) {
      setClauses.push('sell_threshold_percent = ?');
      params.push(updates.sellThresholdPercent);
    }
    if (updates.movingAveragePeriod !== undefined) {
      setClauses.push('moving_average_period = ?');
      params.push(updates.movingAveragePeriod);
    }
    if (updates.stopLossPercent !== undefined) {
      setClauses.push('stop_loss_percent = ?');
      params.push(updates.stopLossPercent);
    }
    if (updates.maxDailyTrades !== undefined) {
      setClauses.push('max_daily_trades = ?');
      params.push(updates.maxDailyTrades);
    }
    if (updates.minProfitPercent !== undefined) {
      setClauses.push('min_profit_percent = ?');
      params.push(updates.minProfitPercent);
    }
    if (updates.minTradeAmountUsd !== undefined) {
      setClauses.push('min_trade_amount_usd = ?');
      params.push(updates.minTradeAmountUsd);
    }
    if (updates.maxTradeAmountUsd !== undefined) {
      setClauses.push('max_trade_amount_usd = ?');
      params.push(updates.maxTradeAmountUsd);
    }
    if (updates.tradingIntervalSeconds !== undefined) {
      setClauses.push('trading_interval_seconds = ?');
      params.push(updates.tradingIntervalSeconds);
    }
    if (updates.maxPositionSizePercent !== undefined) {
      setClauses.push('max_position_size_percent = ?');
      params.push(updates.maxPositionSizePercent);
    }

    if (setClauses.length > 0) {
      const query = `UPDATE config SET ${setClauses.join(', ')} WHERE id = 1`;
      this.db.prepare(query).run(...params);
    }

    return this.getConfig();
  }

  // ============================================
  // Balance Operations
  // ============================================

  getBalance(): Balance {
    const row = this.db.prepare('SELECT * FROM balance WHERE id = 1').get() as any;
    return {
      usd: row.usd,
      xrp: row.xrp,
      usdLocked: row.usd_locked,
      xrpLocked: row.xrp_locked,
    };
  }

  updateBalance(balance: Partial<Balance>): Balance {
    const setClauses: string[] = [];
    const params: any[] = [];

    if (balance.usd !== undefined) {
      setClauses.push('usd = ?');
      params.push(balance.usd);
    }
    if (balance.xrp !== undefined) {
      setClauses.push('xrp = ?');
      params.push(balance.xrp);
    }
    if (balance.usdLocked !== undefined) {
      setClauses.push('usd_locked = ?');
      params.push(balance.usdLocked);
    }
    if (balance.xrpLocked !== undefined) {
      setClauses.push('xrp_locked = ?');
      params.push(balance.xrpLocked);
    }

    if (setClauses.length > 0) {
      const query = `UPDATE balance SET ${setClauses.join(', ')} WHERE id = 1`;
      this.db.prepare(query).run(...params);
    }

    return this.getBalance();
  }

  resetBalance(startingUsd: number): Balance {
    this.db.prepare('UPDATE balance SET usd = ?, xrp = 0, usd_locked = 0, xrp_locked = 0 WHERE id = 1').run(startingUsd);
    return this.getBalance();
  }
}
