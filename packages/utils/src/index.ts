import type { BotConfig, Trade, Candle, PriceData } from '@openclaw/types';

// ============================================
// Price & Math Utilities
// ============================================

/**
 * Calculate simple moving average from candles
 */
export function calculateSMA(candles: Candle[], period: number): number {
  if (candles.length < period) {
    return candles.reduce((sum, c) => sum + c.close, 0) / candles.length;
  }
  const recentCandles = candles.slice(-period);
  return recentCandles.reduce((sum, c) => sum + c.close, 0) / period;
}

/**
 * Calculate exponential moving average
 */
export function calculateEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  if (prices.length < period) {
    return prices.reduce((sum, p) => sum + p, 0) / prices.length;
  }
  
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((sum, p) => sum + p, 0) / period;
  
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  
  return ema;
}

/**
 * Calculate percent change between two values
 */
export function percentChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Calculate trade fee
 */
export function calculateFee(amount: number, feeRate: number): number {
  return amount * feeRate;
}

/**
 * Calculate total cost including fees for a buy order
 */
export function calculateBuyCost(price: number, amount: number, feeRate: number): number {
  const total = price * amount;
  const fee = calculateFee(total, feeRate);
  return total + fee;
}

/**
 * Calculate proceeds after fees for a sell order
 */
export function calculateSellProceeds(price: number, amount: number, feeRate: number): number {
  const total = price * amount;
  const fee = calculateFee(total, feeRate);
  return total - fee;
}

/**
 * Calculate profit/loss for a trade pair
 */
export function calculateProfitLoss(
  buyPrice: number,
  sellPrice: number,
  amount: number,
  buyFeeRate: number,
  sellFeeRate: number
): { profit: number; profitPercent: number } {
  const buyCost = calculateBuyCost(buyPrice, amount, buyFeeRate);
  const sellProceeds = calculateSellProceeds(sellPrice, amount, sellFeeRate);
  const profit = sellProceeds - buyCost;
  const profitPercent = (profit / buyCost) * 100;
  
  return { profit, profitPercent };
}

/**
 * Check if a sell would be profitable given fees
 */
export function isTradeProfit(
  buyPrice: number,
  currentPrice: number,
  makerFee: number,
  takerFee: number,
  minProfitPercent: number
): boolean {
  const { profitPercent } = calculateProfitLoss(buyPrice, currentPrice, 1, takerFee, makerFee);
  return profitPercent >= minProfitPercent;
}

/**
 * Calculate minimum sell price to achieve target profit
 */
export function calculateMinSellPrice(
  buyPrice: number,
  buyFeeRate: number,
  sellFeeRate: number,
  targetProfitPercent: number
): number {
  // Total cost = buyPrice * (1 + buyFeeRate)
  // Target proceeds = totalCost * (1 + targetProfit/100)
  // sellPrice * (1 - sellFeeRate) = targetProceeds
  // sellPrice = targetProceeds / (1 - sellFeeRate)
  
  const totalCost = buyPrice * (1 + buyFeeRate);
  const targetProceeds = totalCost * (1 + targetProfitPercent / 100);
  return targetProceeds / (1 - sellFeeRate);
}

// ============================================
// Trading Logic Utilities
// ============================================

/**
 * Determine if we should buy based on strategy
 */
export function shouldBuy(
  currentPrice: number,
  movingAverage: number,
  buyThresholdPercent: number
): { shouldBuy: boolean; reason: string } {
  const percentBelowMA = percentChange(movingAverage, currentPrice);
  
  if (percentBelowMA <= -buyThresholdPercent) {
    return {
      shouldBuy: true,
      reason: `Price ${currentPrice.toFixed(4)} is ${Math.abs(percentBelowMA).toFixed(2)}% below MA ${movingAverage.toFixed(4)}`,
    };
  }
  
  return {
    shouldBuy: false,
    reason: `Price not low enough. Current: ${currentPrice.toFixed(4)}, MA: ${movingAverage.toFixed(4)}, Need: ${(-buyThresholdPercent).toFixed(2)}% below MA`,
  };
}

/**
 * Determine if we should sell based on strategy
 */
export function shouldSell(
  currentPrice: number,
  buyPrice: number,
  sellThresholdPercent: number,
  stopLossPercent: number,
  config: Pick<BotConfig, 'makerFee' | 'takerFee' | 'minProfitPercent'>
): { shouldSell: boolean; reason: string; isStopLoss: boolean } {
  const percentAboveBuy = percentChange(buyPrice, currentPrice);
  
  // Check stop loss first
  if (percentAboveBuy <= -stopLossPercent) {
    return {
      shouldSell: true,
      reason: `STOP LOSS triggered. Price dropped ${Math.abs(percentAboveBuy).toFixed(2)}% below buy price`,
      isStopLoss: true,
    };
  }
  
  // Check if profit target reached
  if (percentAboveBuy >= sellThresholdPercent) {
    // Verify it's actually profitable after fees
    if (isTradeProfit(buyPrice, currentPrice, config.makerFee, config.takerFee, config.minProfitPercent)) {
      return {
        shouldSell: true,
        reason: `Price ${currentPrice.toFixed(4)} is ${percentAboveBuy.toFixed(2)}% above buy price ${buyPrice.toFixed(4)}`,
        isStopLoss: false,
      };
    }
    return {
      shouldSell: false,
      reason: `Price target reached but not profitable after fees`,
      isStopLoss: false,
    };
  }
  
  return {
    shouldSell: false,
    reason: `Price not high enough. Current: ${currentPrice.toFixed(4)}, Buy: ${buyPrice.toFixed(4)}, Need: +${sellThresholdPercent.toFixed(2)}%`,
    isStopLoss: false,
  };
}

/**
 * Calculate optimal trade size based on config
 */
export function calculateTradeSize(
  availableUsd: number,
  currentPrice: number,
  config: Pick<BotConfig, 'maxPositionSizePercent' | 'minTradeAmountUsd' | 'maxTradeAmountUsd'>
): { amount: number; usdValue: number; canTrade: boolean; reason: string } {
  const maxUsd = Math.min(
    availableUsd * (config.maxPositionSizePercent / 100),
    config.maxTradeAmountUsd
  );
  
  if (maxUsd < config.minTradeAmountUsd) {
    return {
      amount: 0,
      usdValue: 0,
      canTrade: false,
      reason: `Insufficient funds. Available: $${maxUsd.toFixed(2)}, Minimum: $${config.minTradeAmountUsd}`,
    };
  }
  
  const tradeUsd = Math.min(maxUsd, config.maxTradeAmountUsd);
  const amount = tradeUsd / currentPrice;
  
  return {
    amount,
    usdValue: tradeUsd,
    canTrade: true,
    reason: `Trade size: ${amount.toFixed(6)} XRP ($${tradeUsd.toFixed(2)})`,
  };
}

// ============================================
// Formatting Utilities
// ============================================

export function formatCurrency(value: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCrypto(value: number, symbol = 'XRP'): string {
  return `${value.toFixed(6)} ${symbol}`;
}

export function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date);
}

// ============================================
// ID Generation
// ============================================

export function generateTradeId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `trade_${timestamp}_${random}`;
}

export function generateOrderId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `order_${timestamp}_${random}`;
}

// ============================================
// Validation Utilities
// ============================================

export function isValidTradingPair(pair: string): boolean {
  return pair.startsWith('XRP-');
}

export function assertValidTradingPair(pair: string): void {
  if (!isValidTradingPair(pair)) {
    throw new Error(`SAFETY VIOLATION: Invalid trading pair "${pair}". Only XRP pairs are allowed.`);
  }
}
