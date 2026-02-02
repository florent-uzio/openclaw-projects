import { Injectable } from '@nestjs/common';
import { DatabaseService, SubscriptionRow } from '../database/database.service';
import { WgEasyService } from '../wg-easy/wg-easy.service';
import Database from 'better-sqlite3';
import * as path from 'path';

@Injectable()
export class AdminService {
  private db: Database.Database;

  constructor(
    private databaseService: DatabaseService,
    private wgEasy: WgEasyService,
  ) {
    // Direct DB access for admin queries
    const dbPath = path.join(__dirname, '../../data/vpn.db');
    this.db = new Database(dbPath);
  }

  getAllSubscriptions(): SubscriptionRow[] {
    const stmt = this.db.prepare(`
      SELECT * FROM subscriptions ORDER BY created_at DESC
    `);
    return stmt.all() as SubscriptionRow[];
  }

  getStats() {
    const subscriptions = this.getAllSubscriptions();
    
    const total = subscriptions.length;
    const active = subscriptions.filter(s => s.status === 'active').length;
    const pending = subscriptions.filter(s => s.status === 'pending').length;
    const canceled = subscriptions.filter(s => s.status === 'canceled').length;
    const paymentFailed = subscriptions.filter(s => 
      s.status === 'payment_failed' || s.status === 'past_due'
    ).length;

    // Monthly revenue = active subscribers × €6
    const monthlyRevenue = active * 6;

    // Recent signups (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentSignups = subscriptions.filter(s => 
      new Date(s.created_at) >= weekAgo
    ).length;

    return {
      total,
      active,
      pending,
      canceled,
      paymentFailed,
      monthlyRevenue,
      recentSignups,
    };
  }

  getDailyStats(days: number = 30) {
    const stmt = this.db.prepare(`
      SELECT 
        date(created_at) as date,
        COUNT(*) as signups
      FROM subscriptions
      WHERE created_at >= date('now', '-' || ? || ' days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `);
    
    const results = stmt.all(days) as { date: string; signups: number }[];
    
    // Fill in missing days with 0
    const dailyData: { date: string; signups: number; revenue: number }[] = [];
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const found = results.find(r => r.date === dateStr);
      dailyData.push({
        date: dateStr,
        signups: found?.signups || 0,
        revenue: (found?.signups || 0) * 6,
      });
    }

    return dailyData;
  }

  async enableClient(stripeSubscriptionId: string): Promise<void> {
    const sub = this.databaseService.getSubscription(stripeSubscriptionId);
    if (!sub?.wg_client_id) {
      throw new Error('VPN client not found');
    }
    await this.wgEasy.enableClient(sub.wg_client_id);
    this.databaseService.updateSubscription(stripeSubscriptionId, { status: 'active' });
  }

  async disableClient(stripeSubscriptionId: string): Promise<void> {
    const sub = this.databaseService.getSubscription(stripeSubscriptionId);
    if (!sub?.wg_client_id) {
      throw new Error('VPN client not found');
    }
    await this.wgEasy.disableClient(sub.wg_client_id);
    this.databaseService.updateSubscription(stripeSubscriptionId, { status: 'disabled' });
  }
}
