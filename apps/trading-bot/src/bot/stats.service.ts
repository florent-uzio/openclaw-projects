import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { BotService } from './bot.service';
import { BotStats } from '@openclaw/types';

@Injectable()
export class StatsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly botService: BotService,
  ) {}

  getStats(): BotStats {
    const balance = this.db.getBalance();
    const config = this.db.getConfig();
    const lastPrice = this.botService.getLastPrice();
    const currentPrice = lastPrice?.last || 0;
    const xrpValueUsd = balance.xrp * currentPrice;
    const currentValue = balance.usd + xrpValueUsd;
    const { trades } = this.db.getTrades({ status: 'FILLED', pageSize: 10000 });
    const todayTrades = this.db.getTodayTrades();
    const startingCapital = config.startingCapitalUsd;
    const totalPnl = currentValue - startingCapital;
    const totalPnlPercent = (totalPnl / startingCapital) * 100;

    let realizedPnl = 0, winningTrades = 0, losingTrades = 0, largestWin = 0, largestLoss = 0;
    const buyTrades = trades.filter(t => t.type === 'BUY');
    const sellTrades = trades.filter(t => t.type === 'SELL');
    const pairedCount = Math.min(buyTrades.length, sellTrades.length);
    
    for (let i = 0; i < pairedCount; i++) {
      const profit = (sellTrades[i].price - buyTrades[i].price) * sellTrades[i].amount - (buyTrades[i].fee + sellTrades[i].fee);
      realizedPnl += profit;
      if (profit > 0) { winningTrades++; largestWin = Math.max(largestWin, profit); }
      else { losingTrades++; largestLoss = Math.min(largestLoss, profit); }
    }

    let todayPnl = 0;
    const todayBuys = todayTrades.filter(t => t.type === 'BUY');
    const todaySells = todayTrades.filter(t => t.type === 'SELL');
    for (let i = 0; i < Math.min(todayBuys.length, todaySells.length); i++) {
      todayPnl += (todaySells[i].price - todayBuys[i].price) * todaySells[i].amount - (todayBuys[i].fee + todaySells[i].fee);
    }

    const totalTradesCount = winningTrades + losingTrades;
    return {
      balance, currentPrice, totalPnl, totalPnlPercent, realizedPnl,
      unrealizedPnl: totalPnl - realizedPnl, totalTrades: trades.length,
      winningTrades, losingTrades,
      winRate: totalTradesCount > 0 ? (winningTrades / totalTradesCount) * 100 : 0,
      todayTrades: todayTrades.length, todayPnl,
      averageTradeProfit: totalTradesCount > 0 ? realizedPnl / totalTradesCount : 0,
      largestWin, largestLoss, startingCapital, currentValue,
    };
  }
}
