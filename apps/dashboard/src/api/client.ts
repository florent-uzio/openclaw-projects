import axios from 'axios';
import type { ConfigUpdate, TradeFilters } from '@openclaw/types';

const client = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Stats
  getStats: async () => {
    const response = await client.get('/stats');
    return response.data;
  },

  getPriceHistory: async () => {
    const response = await client.get('/stats/price-history');
    return response.data;
  },

  // Trades
  getTrades: async (filters: TradeFilters) => {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.pageSize) params.append('pageSize', filters.pageSize.toString());

    const response = await client.get(`/trades?${params.toString()}`);
    return response.data;
  },

  // Config
  getConfig: async () => {
    const response = await client.get('/config');
    return response.data;
  },

  updateConfig: async (updates: ConfigUpdate) => {
    const response = await client.patch('/config', updates);
    return response.data;
  },

  // Bot control
  startBot: async () => {
    const response = await client.post('/bot/start');
    return response.data;
  },

  stopBot: async () => {
    const response = await client.post('/bot/stop');
    return response.data;
  },

  resetPaperBalance: async () => {
    const response = await client.post('/bot/reset-paper-balance');
    return response.data;
  },
};
