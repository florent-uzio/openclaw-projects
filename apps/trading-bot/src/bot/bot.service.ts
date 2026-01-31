import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { BitoasisService } from '../bitoasis/bitoasis.service';
import { DatabaseService } from '../database/database.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { 
  BotState, 
  BotStatus, 
  Trade, 
  PriceData,
  TradingPair,
  ALLOWED_TRADING_PAIRS 
} from '@openclaw/types';

@Injectable()
export class BotService implements OnModuleInit {
  private readonly logger = new Logger(BotService.name);
  private state: BotState = {
    status: 'STOPPED',
    isPaperTrading: true,
    uptime: 0,
  };
  private startedAt: Date | null = null;
  private intervalName = 'trading-interval';
  private lastPrice: PriceData | null = null;
  private openBuyOrder: Trade | null = null;

  constructor(
    private readonly bitoasis: BitoasisService,
    private readonly db: DatabaseService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly wsGateway: WebsocketGateway,
  ) {}

  async onModuleInit() {
    const config = this.db.getConfig();
    this.state.isPaperTrading = config.paperTrading;
    
    this.logger.log(`🤖 Bot initialized in ${config.paperTrading ? 'PAPER' : 'LIVE'} trading mode`);
    this.logger.log(`📊 Trading pair: ${config.tradingPair}`);
  }

  // ============================================
  // Bot Control
  // ============================================

  async start(): Promise<BotState> {
    if (this.state.status === 'RUNNING') {
      this.logger.warn('Bot is already running');
      return this.getState();
    }

    const config = this.db.getConfig();
    
    // SAFETY CHECK: Verify trading pair is allowed
    if (!ALLOWED_TRADING_PAIRS.includes(config.tradingPair)) {
      throw new Error(`🚫 SAFETY: Trading pair "${config.tradingPair}" is not allowed`);
    }

    // SAFETY CHECK: If live trading, ensure API is configured
    if (!config.paperTrading && !this.bitoasis.isConfigured()) {
      throw new Error('🚫 Cannot start live trading: BitOasis API credentials not configured');
    }

    this.state.status = 'RUNNING';
    this.state.isPaperTrading = config.paperTrading;
    this.state.lastError = undefined;
    this.startedAt = new Date();
    this.state.startedAt = this.startedAt;

    // Start trading interval
    const interval = setInterval(
      () => this.tradingCycle(),
      config.tradingIntervalSeconds * 1000,
    );
    this.schedulerRegistry.addInterval(this.intervalName, interval);

    this.logger.log(`🚀 Bot started in ${config.paperTrading ? 'PAPER' : '🔴 LIVE'} mode`);
    this.logger.log(`⏱️  Trading interval: ${config.tradingIntervalSeconds}s`);

    // Run first cycle immediately
    this.tradingCycle();

    this.broadcastStatusChange();
    return this.getState();
  }

  async stop(): Promise<BotState> {
    if (this.state.status === 'STOPPED') {
      return this.getState();
    }

    try {
      this.schedulerRegistry.deleteInterval(this.intervalName);
    } catch (e) {
      // Interval might not exist
    }

    this.state.status = 'STOPPED';
    this.startedAt = null;
    this.logger.log('🛑 Bot stopped');

    this.broadcastStatusChange();
    return this.getState();
  }

  getState(): BotState {
    return {
      ...this.state,
      uptime: this.startedAt 
        ? Math.floor((Date.now() - this.startedAt.getTime()) / 1000)
        : 0,
    };
  }

  getLastPrice(): PriceData | null {
    return this.lastPrice;
  }

  // ============================================
  // Trading Cycle
  // ============================================

  private async tradingCycle(): Promise<void> {
    const config = this.db.getConfig();

    try {
      // 1. Fetch current price
      const price = await this.bitoasis.getTicker(config.tradingPair);
      this.lastPrice = price;

      // 2. Calculate moving average
      const ma = this.bitoasis.getMovingAverage(
        config.tradingPair,
        config.movingAveragePeriod,
      );

      // Broadcast price update
      this.wsGateway.broadcastPriceUpdate(price, ma || price.last);

      // 3. Check trading conditions
      if (!ma) {
        this.logger.debug('Not enough price history for MA calculation');
        return;
      }

      // Check daily trade limit
      const todayTrades = this.db.getTodayTrades();
      if (todayTrades.length >= config.maxDailyTrades) {
        this.logger.debug(`Daily trade limit reached (${config.maxDailyTrades})`);
        return;
      }

      const balance = this.db.getBalance();
      
      // 4. Trading logic
      await this.evaluateTrading(price, ma, balance, config);

    } catch (error) {
      this.logger.error('Trading cycle error:', error);
      this.state.lastError = error instanceof Error ? error.message : 'Unknown error';
      
      // Don't stop bot on single error, just log it
      this.wsGateway.broadcastError(this.state.lastError);
    }
  }

  private async evaluateTrading(
    price: PriceData,
    ma: number,
    balance: { usd: number; xrp: number },
    config: ReturnType<DatabaseService['getConfig']>,
  ): Promise<void> {
    const currentPrice = price.last;
    const priceVsMa = ((currentPrice - ma) / ma) * 100;

    this.logger.debug(`Price: ${currentPrice} | MA: ${ma.toFixed(4)} | Diff: ${priceVsMa.toFixed(2)}%`);

    // Check for BUY opportunity
    // Buy when price is X% below moving average
    if (priceVsMa <= -config.buyThresholdPercent && balance.usd >= config.minTradeAmountUsd) {
      await this.executeBuy(price, balance, config);
      return;
    }

    // Check for SELL opportunity
    // Sell when we have XRP and price rises enough to profit
    if (balance.xrp > 0 && this.openBuyOrder) {
      const buyPrice = this.openBuyOrder.price;
      const profitPercent = ((currentPrice - buyPrice) / buyPrice) * 100;
      const minProfit = config.minProfitPercent + (config.takerFee * 100 * 2); // Account for fees

      // Sell if profit target reached OR stop loss triggered
      if (profitPercent >= minProfit) {
        this.logger.log(`📈 Profit target reached: ${profitPercent.toFixed(2)}%`);
        await this.executeSell(price, balance, config, 'PROFIT');
      } else if (profitPercent <= -config.stopLossPercent) {
        this.logger.warn(`📉 Stop loss triggered: ${profitPercent.toFixed(2)}%`);
        await this.executeSell(price, balance, config, 'STOP_LOSS');
      }
    }
  }

  private async executeBuy(
    price: PriceData,
    balance: { usd: number; xrp: number },
    config: ReturnType<DatabaseService['getConfig']>,
  ): Promise<void> {
    // Calculate trade amount
    const maxPositionUsd = balance.usd * (config.maxPositionSizePercent / 100);
    const tradeAmountUsd = Math.min(
      maxPositionUsd,
      config.maxTradeAmountUsd,
      balance.usd * 0.95, // Keep 5% buffer
    );

    if (tradeAmountUsd < config.minTradeAmountUsd) {
      this.logger.debug('Trade amount too small');
      return;
    }

    const xrpAmount = tradeAmountUsd / price.ask;

    this.logger.log(`🟢 BUY Signal: ${xrpAmount.toFixed(4)} XRP @ ${price.ask}`);

    if (config.paperTrading) {
      // Paper trade: just simulate
      const trade = this.db.createTrade(
        {
          pair: config.tradingPair,
          type: 'BUY',
          orderType: 'MARKET',
          price: price.ask,
          amount: xrpAmount,
        },
        true,
      );

      // Update simulated balance
      const fee = tradeAmountUsd * config.takerFee;
      this.db.updateBalance({
        usd: balance.usd - tradeAmountUsd - fee,
        xrp: balance.xrp + xrpAmount,
      });

      this.db.updateTradeStatus(trade.id, 'FILLED');
      this.openBuyOrder = this.db.getTradeById(trade.id);

      this.logger.log(`📝 Paper BUY executed: ${xrpAmount.toFixed(4)} XRP @ ${price.ask}`);
      this.wsGateway.broadcastTradeExecuted(this.openBuyOrder!);
    } else {
      // Live trade
      try {
        const order = await this.bitoasis.createOrder(
          config.tradingPair,
          'BUY',
          'MARKET',
          xrpAmount,
        );

        const trade = this.db.createTrade(
          {
            pair: config.tradingPair,
            type: 'BUY',
            orderType: 'MARKET',
            price: price.ask,
            amount: xrpAmount,
          },
          false,
        );

        this.db.updateTradeStatus(trade.id, 'FILLED', order.id);
        this.openBuyOrder = this.db.getTradeById(trade.id);

        this.logger.log(`💰 LIVE BUY executed: ${xrpAmount.toFixed(4)} XRP @ ${price.ask}`);
        this.wsGateway.broadcastTradeExecuted(this.openBuyOrder!);
      } catch (error) {
        this.logger.error('Live buy order failed:', error);
        throw error;
      }
    }
  }

  private async executeSell(
    price: PriceData,
    balance: { usd: number; xrp: number },
    config: ReturnType<DatabaseService['getConfig']>,
    reason: 'PROFIT' | 'STOP_LOSS',
  ): Promise<void> {
    const xrpAmount = balance.xrp;

    this.logger.log(`🔴 SELL Signal (${reason}): ${xrpAmount.toFixed(4)} XRP @ ${price.bid}`);

    if (config.paperTrading) {
      // Paper trade
      const trade = this.db.createTrade(
        {
          pair: config.tradingPair,
          type: 'SELL',
          orderType: 'MARKET',
          price: price.bid,
          amount: xrpAmount,
        },
        true,
      );

      const saleValue = xrpAmount * price.bid;
      const fee = saleValue * config.takerFee;

      this.db.updateBalance({
        usd: balance.usd + saleValue - fee,
        xrp: 0,
      });

      this.db.updateTradeStatus(trade.id, 'FILLED');
      this.openBuyOrder = null;

      this.logger.log(`📝 Paper SELL executed: ${xrpAmount.toFixed(4)} XRP @ ${price.bid}`);
      this.wsGateway.broadcastTradeExecuted(this.db.getTradeById(trade.id)!);
    } else {
      // Live trade
      try {
        const order = await this.bitoasis.createOrder(
          config.tradingPair,
          'SELL',
          'MARKET',
          xrpAmount,
        );

        const trade = this.db.createTrade(
          {
            pair: config.tradingPair,
            type: 'SELL',
            orderType: 'MARKET',
            price: price.bid,
            amount: xrpAmount,
          },
          false,
        );

        this.db.updateTradeStatus(trade.id, 'FILLED', order.id);
        this.openBuyOrder = null;

        this.logger.log(`💰 LIVE SELL executed: ${xrpAmount.toFixed(4)} XRP @ ${price.bid}`);
        this.wsGateway.broadcastTradeExecuted(this.db.getTradeById(trade.id)!);
      } catch (error) {
        this.logger.error('Live sell order failed:', error);
        throw error;
      }
    }
  }

  private broadcastStatusChange(): void {
    this.wsGateway.broadcastBotStatusChanged(this.getState());
  }
}
