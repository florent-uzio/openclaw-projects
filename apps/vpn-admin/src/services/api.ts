import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export interface Subscription {
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

export interface Stats {
  total: number;
  active: number;
  pending: number;
  canceled: number;
  paymentFailed: number;
  monthlyRevenue: number;
  recentSignups: number;
}

export interface DailyStats {
  date: string;
  signups: number;
  revenue: number;
}

export async function getSubscriptions(): Promise<Subscription[]> {
  const { data } = await api.get('/admin/subscriptions');
  return data;
}

export async function getStats(): Promise<Stats> {
  const { data } = await api.get('/admin/stats');
  return data;
}

export async function getDailyStats(days: number = 30): Promise<DailyStats[]> {
  const { data } = await api.get(`/admin/stats/daily?days=${days}`);
  return data;
}

export async function toggleClientStatus(subscriptionId: string, enable: boolean): Promise<void> {
  await api.post(`/admin/subscriptions/${subscriptionId}/${enable ? 'enable' : 'disable'}`);
}

export async function deleteSubscription(subscriptionId: string): Promise<void> {
  await api.delete(`/admin/subscriptions/${subscriptionId}`);
}
