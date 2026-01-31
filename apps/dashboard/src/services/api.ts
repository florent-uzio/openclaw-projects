import { BotState, BotStats, BotConfig, Trade, PaginatedResponse, ApiResponse, ConfigUpdate } from '@openclaw/types';

const API_BASE = '/api';

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data: ApiResponse<T> = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'API request failed');
  }

  return data.data as T;
}

export const api = {
  // Bot control
  getBotStatus: () => fetchApi<BotState>('/bot/status'),
  startBot: () => fetchApi<BotState>('/bot/start', { method: 'POST' }),
  stopBot: () => fetchApi<BotState>('/bot/stop', { method: 'POST' }),

  // Stats
  getStats: () => fetchApi<BotStats>('/stats'),

  // Trades
  getTrades: (page = 1, pageSize = 50) =>
    fetchApi<PaginatedResponse<Trade>>(`/trades?page=${page}&pageSize=${pageSize}`),

  // Config
  getConfig: () => fetchApi<BotConfig>('/config'),
  updateConfig: (updates: ConfigUpdate) =>
    fetchApi<BotConfig>('/config', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),
  resetBalance: () =>
    fetchApi<{ balance: any }>('/config/reset-balance', { method: 'POST' }),
};
