import type { BotConfig, TradingPair, ALLOWED_TRADING_PAIRS } from '@openclaw/types';

// ============================================
// Default Bot Configuration
// ============================================

export const DEFAULT_CONFIG: BotConfig = {
  // Trading pair - SAFETY: Only XRP allowed
  tradingPair: 'XRP-AED',
  
  // SAFETY: Paper trading enabled by default
  paperTrading: true,
  
  // Bitoasis fees (approximately 0.2%)
  makerFee: 0.002,
  takerFee: 0.002,
  
  // Capital settings
  startingCapitalUsd: 500,
  maxPositionSizePercent: 50, // Never use more than 50% of capital in one trade
  
  // Trading strategy
  buyThresholdPercent: 1.5,    // Buy when price drops 1.5% below MA
  sellThresholdPercent: 1.0,   // Sell when price rises 1% above buy price
  movingAveragePeriod: 60,     // 60-minute moving average
  
  // Risk management
  stopLossPercent: 3.0,        // Stop loss at 3% below buy price
  maxDailyTrades: 20,          // Maximum 20 trades per day
  minProfitPercent: 0.5,       // Minimum 0.5% profit to trigger sell
  
  // Trade sizing
  minTradeAmountUsd: 10,       // Minimum $10 per trade
  maxTradeAmountUsd: 100,      // Maximum $100 per trade
  
  // Timing
  tradingIntervalSeconds: 30,  // Check every 30 seconds
};

// ============================================
// Validation
// ============================================

export function validateConfig(config: Partial<BotConfig>): string[] {
  const errors: string[] = [];
  
  // Validate trading pair
  if (config.tradingPair) {
    const allowedPairs = ['XRP-AED', 'XRP-USD'];
    if (!allowedPairs.includes(config.tradingPair)) {
      errors.push(`Invalid trading pair: ${config.tradingPair}. Only XRP pairs are allowed.`);
    }
  }
  
  // Validate fees
  if (config.makerFee !== undefined && (config.makerFee < 0 || config.makerFee > 0.1)) {
    errors.push('Maker fee must be between 0 and 10%');
  }
  if (config.takerFee !== undefined && (config.takerFee < 0 || config.takerFee > 0.1)) {
    errors.push('Taker fee must be between 0 and 10%');
  }
  
  // Validate thresholds
  if (config.buyThresholdPercent !== undefined && (config.buyThresholdPercent < 0.1 || config.buyThresholdPercent > 20)) {
    errors.push('Buy threshold must be between 0.1% and 20%');
  }
  if (config.sellThresholdPercent !== undefined && (config.sellThresholdPercent < 0.1 || config.sellThresholdPercent > 20)) {
    errors.push('Sell threshold must be between 0.1% and 20%');
  }
  
  // Validate profitability
  const makerFee = config.makerFee ?? DEFAULT_CONFIG.makerFee;
  const takerFee = config.takerFee ?? DEFAULT_CONFIG.takerFee;
  const minProfit = config.minProfitPercent ?? DEFAULT_CONFIG.minProfitPercent;
  const totalFees = (makerFee + takerFee) * 100;
  
  if (minProfit < totalFees) {
    errors.push(`Minimum profit (${minProfit}%) must be greater than total fees (${totalFees}%)`);
  }
  
  // Validate position size
  if (config.maxPositionSizePercent !== undefined && (config.maxPositionSizePercent < 5 || config.maxPositionSizePercent > 100)) {
    errors.push('Max position size must be between 5% and 100%');
  }
  
  // Validate trade amounts
  if (config.minTradeAmountUsd !== undefined && config.minTradeAmountUsd < 1) {
    errors.push('Minimum trade amount must be at least $1');
  }
  if (config.maxTradeAmountUsd !== undefined && config.minTradeAmountUsd !== undefined) {
    if (config.maxTradeAmountUsd < config.minTradeAmountUsd) {
      errors.push('Maximum trade amount must be greater than minimum');
    }
  }
  
  // Validate stop loss
  if (config.stopLossPercent !== undefined && (config.stopLossPercent < 0.5 || config.stopLossPercent > 50)) {
    errors.push('Stop loss must be between 0.5% and 50%');
  }
  
  return errors;
}

// ============================================
// Environment Config
// ============================================

export interface EnvConfig {
  // API
  port: number;
  nodeEnv: string;
  
  // Bitoasis API
  bitoasisApiKey: string;
  bitoasisApiSecret: string;
  bitoasisBaseUrl: string;
  
  // Database
  databasePath: string;
  
  // CORS
  corsOrigin: string;
}

export function getEnvConfig(): EnvConfig {
  return {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    bitoasisApiKey: process.env.BITOASIS_API_KEY || '',
    bitoasisApiSecret: process.env.BITOASIS_API_SECRET || '',
    bitoasisBaseUrl: process.env.BITOASIS_BASE_URL || 'https://api.bitoasis.net/v1',
    databasePath: process.env.DATABASE_PATH || './data/trading.db',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  };
}

// ============================================
// Safety Checks
// ============================================

export function isSafeToTrade(config: BotConfig): { safe: boolean; reasons: string[] } {
  const reasons: string[] = [];
  
  // Check trading pair is XRP
  if (!config.tradingPair.startsWith('XRP')) {
    reasons.push('SAFETY: Only XRP trading pairs are allowed');
  }
  
  // Check profit margins
  const totalFees = (config.makerFee + config.takerFee) * 100;
  if (config.minProfitPercent <= totalFees) {
    reasons.push(`SAFETY: Minimum profit (${config.minProfitPercent}%) is not higher than fees (${totalFees}%)`);
  }
  
  // Check position sizing
  if (config.maxPositionSizePercent > 75) {
    reasons.push('WARNING: Position size is very high (>75%)');
  }
  
  // Check stop loss
  if (config.stopLossPercent > 10) {
    reasons.push('WARNING: Stop loss is very wide (>10%)');
  }
  
  return {
    safe: reasons.length === 0,
    reasons,
  };
}

export { DEFAULT_CONFIG as defaultConfig };
