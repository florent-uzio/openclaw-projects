// ============================================
// Trading Bot Shared Types
// ============================================

// Supported trading pairs - SAFETY: Only XRP by default
export type TradingPair = 'XRP-AED' | 'XRP-USD';

export const ALLOWED_TRADING_PAIRS: TradingPair[] = ['XRP-AED', 'XRP-USD'];

// ============================================
// Trade Types
// ============================================

export type TradeType = 'BUY' | 'SELL';
export type TradeStatus = 'PENDING' | 'FILLED' | 'CANCELLED' | 'FAILED';
export type OrderType = 'LIMIT' | 'MARKET';

export interface Trade {
  id: string;
  pair: TradingPair;
  type: TradeType;
  orderType: OrderType;
  status: TradeStatus;
  price: number;
  amount: number;
  total: number;
  fee: number;
  feeCurrency: string;
  isPaperTrade: boolean;
  createdAt: Date;
  executedAt?: Date;
  externalOrderId?: string;
  notes?: string;
}

export interface TradeCreate {
  pair: TradingPair;
  type: TradeType;
  orderType: OrderType;
  price: number;
  amount: number;
}

// ============================================
// Bot Configuration
// ============================================

export interface BotConfig {
  // Trading pair settings
  tradingPair: TradingPair;
  
  // Mode settings
  paperTrading: boolean;
  
  // Fee settings (as decimal, e.g., 0.002 = 0.2%)
  makerFee: number;
  takerFee: number;
  
  // Capital settings
  startingCapitalUsd: number;
  maxPositionSizePercent: number;
  
  // Trading strategy settings
  buyThresholdPercent: number;    // Buy when price drops X% below MA
  sellThresholdPercent: number;   // Sell when price rises Y% above buy price
  movingAveragePeriod: number;    // Period for calculating MA (in minutes)
  
  // Risk management
  stopLossPercent: number;        // Stop loss trigger (% below buy price)
  maxDailyTrades: number;         // Maximum trades per day
  minProfitPercent: number;       // Minimum profit to trigger sell
  
  // Trade sizing
  minTradeAmountUsd: number;      // Minimum trade amount in USD
  maxTradeAmountUsd: number;      // Maximum trade amount in USD
  
  // Timing
  tradingIntervalSeconds: number; // How often to check for trading opportunities
}

export interface ConfigUpdate {
  paperTrading?: boolean;
  makerFee?: number;
  takerFee?: number;
  buyThresholdPercent?: number;
  sellThresholdPercent?: number;
  movingAveragePeriod?: number;
  stopLossPercent?: number;
  maxDailyTrades?: number;
  minProfitPercent?: number;
  minTradeAmountUsd?: number;
  maxTradeAmountUsd?: number;
  tradingIntervalSeconds?: number;
  maxPositionSizePercent?: number;
}

// ============================================
// Balance & Stats
// ============================================

export interface Balance {
  usd: number;
  xrp: number;
  usdLocked: number;
  xrpLocked: number;
}

export interface BotStats {
  balance: Balance;
  currentPrice: number;
  totalPnl: number;
  totalPnlPercent: number;
  realizedPnl: number;
  unrealizedPnl: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  todayTrades: number;
  todayPnl: number;
  averageTradeProfit: number;
  largestWin: number;
  largestLoss: number;
  startingCapital: number;
  currentValue: number;
}

// ============================================
// Price Data
// ============================================

export interface PriceData {
  pair: TradingPair;
  bid: number;
  ask: number;
  last: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  timestamp: Date;
}

export interface Candle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ============================================
// Bot Status
// ============================================

export type BotStatus = 'RUNNING' | 'PAUSED' | 'STOPPED' | 'ERROR';

export interface BotState {
  status: BotStatus;
  isPaperTrading: boolean;
  lastError?: string;
  lastTradeAt?: Date;
  uptime: number;
  startedAt?: Date;
}

// ============================================
// WebSocket Events
// ============================================

export type WsEventType = 
  | 'PRICE_UPDATE'
  | 'TRADE_EXECUTED'
  | 'BOT_STATUS_CHANGED'
  | 'STATS_UPDATE'
  | 'ERROR'
  | 'CONFIG_CHANGED';

export interface WsEvent<T = unknown> {
  type: WsEventType;
  data: T;
  timestamp: Date;
}

export interface WsPriceUpdate {
  price: PriceData;
  movingAverage: number;
}

export interface WsTradeExecuted {
  trade: Trade;
  stats: BotStats;
}

export interface WsStatsUpdate {
  stats: BotStats;
}

export interface WsBotStatusChanged {
  state: BotState;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface TradeFilters {
  type?: TradeType;
  status?: TradeStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

// ============================================
// Bitoasis API Types
// ============================================

export interface BitoasisTickerResponse {
  pair: string;
  bid: string;
  ask: string;
  last_price: string;
  high: string;
  low: string;
  volume: string;
}

export interface BitoasisOrderResponse {
  id: string;
  pair: string;
  side: 'buy' | 'sell';
  type: 'limit' | 'market';
  price: string;
  amount: string;
  filled_amount: string;
  status: string;
  created_at: string;
}

export interface BitoasisBalanceResponse {
  currency: string;
  available: string;
  locked: string;
}
