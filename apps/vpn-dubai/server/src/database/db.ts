import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '../../data/vpn.db');

const sqlite = new Database(dbPath);
sqlite.pragma('journal_mode = WAL');

export const db = {
  init() {
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id TEXT PRIMARY KEY,
        stripe_customer_id TEXT NOT NULL,
        stripe_subscription_id TEXT UNIQUE,
        email TEXT NOT NULL,
        wg_client_id TEXT,
        wg_client_name TEXT,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME
      );

      CREATE INDEX IF NOT EXISTS idx_stripe_sub ON subscriptions(stripe_subscription_id);
      CREATE INDEX IF NOT EXISTS idx_stripe_customer ON subscriptions(stripe_customer_id);
      CREATE INDEX IF NOT EXISTS idx_email ON subscriptions(email);
    `);
    console.log('✅ Database initialized');
  },

  createSubscription(data: {
    id: string;
    stripeCustomerId: string;
    stripeSubscriptionId?: string;
    email: string;
  }) {
    const stmt = sqlite.prepare(`
      INSERT INTO subscriptions (id, stripe_customer_id, stripe_subscription_id, email)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(data.id, data.stripeCustomerId, data.stripeSubscriptionId || null, data.email);
  },

  updateSubscription(stripeSubscriptionId: string, data: Partial<{
    status: string;
    wgClientId: string;
    wgClientName: string;
    expiresAt: string;
  }>) {
    const fields: string[] = [];
    const values: (string | null)[] = [];

    if (data.status) {
      fields.push('status = ?');
      values.push(data.status);
    }
    if (data.wgClientId) {
      fields.push('wg_client_id = ?');
      values.push(data.wgClientId);
    }
    if (data.wgClientName) {
      fields.push('wg_client_name = ?');
      values.push(data.wgClientName);
    }
    if (data.expiresAt) {
      fields.push('expires_at = ?');
      values.push(data.expiresAt);
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(stripeSubscriptionId);

    const stmt = sqlite.prepare(`
      UPDATE subscriptions 
      SET ${fields.join(', ')}
      WHERE stripe_subscription_id = ?
    `);
    return stmt.run(...values);
  },

  getSubscription(stripeSubscriptionId: string) {
    const stmt = sqlite.prepare(`
      SELECT * FROM subscriptions WHERE stripe_subscription_id = ?
    `);
    return stmt.get(stripeSubscriptionId) as SubscriptionRow | undefined;
  },

  getSubscriptionByEmail(email: string) {
    const stmt = sqlite.prepare(`
      SELECT * FROM subscriptions WHERE email = ? ORDER BY created_at DESC LIMIT 1
    `);
    return stmt.get(email) as SubscriptionRow | undefined;
  },

  getSubscriptionByCustomerId(customerId: string) {
    const stmt = sqlite.prepare(`
      SELECT * FROM subscriptions WHERE stripe_customer_id = ? ORDER BY created_at DESC LIMIT 1
    `);
    return stmt.get(customerId) as SubscriptionRow | undefined;
  },
};

export interface SubscriptionRow {
  id: string;
  stripe_customer_id: string;
  stripe_subscription_id: string | null;
  email: string;
  wg_client_id: string | null;
  wg_client_name: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  expires_at: string | null;
}
