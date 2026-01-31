import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { 
  TradingPair, 
  PriceData, 
  BitoasisTickerResponse,
  BitoasisOrderResponse,
  BitoasisBalanceResponse,
  TradeType,
  OrderType,
  ALLOWED_TRADING_PAIRS 
} from '@openclaw/types';
import * as crypto from 'crypto';

@Injectable()
export class BitoasisService implements OnModuleInit {
  private readonly logger = new Logger(BitoasisService.name);
  private readonly baseUrl = 'https://api.bitoasis.net';
  private apiKey: string;
  private apiSecret: string;
  private priceHistory: Map<TradingPair, number[]> = new Map();

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.apiKey = this.configService.get<string>('BITOASIS_API_KEY', '');
    this.apiSecret = this.configService.get<string>('BITOASIS_API_SECRET', '');

    if (!this.apiKey || !this.apiSecret) {
      this.logger.warn('⚠️  BitOasis API credentials not configured. Only paper trading will work.');
    } else {
      this.logger.log('✅ BitOasis API credentials configured');
    }

    // Initialize price history for each pair
    ALLOWED_TRADING_PAIRS.forEach(pair => {
      this.priceHistory.set(pair, []);
    });
  }

  // ============================================
  // SAFETY: Validate trading pair
  // ============================================
  
  private validatePair(pair: string): asserts pair is TradingPair {
    if (!ALLOWED_TRADING_PAIRS.includes(pair as TradingPair)) {
      throw new Error(`🚫 SAFETY: Trading pair "${pair}" is not allowed. Only ${ALLOWED_TRADING_PAIRS.join(', ')} are permitted.`);
    }
  }

  // ============================================
  // API Request Helpers
  // ============================================

  private generateSignature(timestamp: string, method: string, path: string, body: string = ''): string {
    const message = timestamp + method + path + body;
    return crypto
      .createHmac('sha256', this.apiSecret)
      .update(message)
      .digest('hex');
  }

  private async request<T>(
    method: 'GET' | 'POST' | 'DELETE',
    endpoint: string,
    body?: object,
    authenticated: boolean = false,
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (authenticated) {
      if (!this.apiKey || !this.apiSecret) {
        throw new Error('API credentials not configured');
      }
      const timestamp = Date.now().toString();
      const bodyStr = body ? JSON.stringify(body) : '';
      const signature = this.generateSignature(timestamp, method, endpoint, bodyStr);
      
      headers['X-API-KEY'] = this.apiKey;
      headers['X-API-TIMESTAMP'] = timestamp;
      headers['X-API-SIGNATURE'] = signature;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`API Error: ${response.status} - ${error}`);
      throw new Error(`BitOasis API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // ============================================
  // Public API (no auth required)
  // ============================================

  async getTicker(pair: TradingPair): Promise<PriceData> {
    this.validatePair(pair);

    try {
      // BitOasis ticker endpoint format
      const bitoasisPair = pair.replace('-', '').toLowerCase(); // XRP-AED -> xrpaed
      const data = await this.request<BitoasisTickerResponse>('GET', `/v1/ticker/${bitoasisPair}`);
      
      const price: PriceData = {
        pair,
        bid: parseFloat(data.bid),
        ask: parseFloat(data.ask),
        last: parseFloat(data.last_price),
        high24h: parseFloat(data.high),
        low24h: parseFloat(data.low),
        volume24h: parseFloat(data.volume),
        timestamp: new Date(),
      };

      // Store price for moving average calculation
      this.addPriceToHistory(pair, price.last);

      return price;
    } catch (error) {
      this.logger.error(`Failed to get ticker for ${pair}:`, error);
      throw error;
    }
  }

  // ============================================
  // Price History for Moving Average
  // ============================================

  private addPriceToHistory(pair: TradingPair, price: number): void {
    const history = this.priceHistory.get(pair) || [];
    history.push(price);
    
    // Keep last 1000 prices (for flexibility in MA calculation)
    if (history.length > 1000) {
      history.shift();
    }
    
    this.priceHistory.set(pair, history);
  }

  getMovingAverage(pair: TradingPair, periods: number): number | null {
    const history = this.priceHistory.get(pair);
    if (!history || history.length < periods) {
      return null;
    }

    const recentPrices = history.slice(-periods);
    const sum = recentPrices.reduce((a, b) => a + b, 0);
    return sum / recentPrices.length;
  }

  getPriceHistory(pair: TradingPair): number[] {
    return this.priceHistory.get(pair) || [];
  }

  // ============================================
  // Authenticated API (requires API key)
  // ============================================

  async getBalances(): Promise<BitoasisBalanceResponse[]> {
    return this.request<BitoasisBalanceResponse[]>('GET', '/v1/account/balances', undefined, true);
  }

  async createOrder(
    pair: TradingPair,
    side: TradeType,
    type: OrderType,
    amount: number,
    price?: number,
  ): Promise<BitoasisOrderResponse> {
    // SAFETY: Validate pair before creating order
    this.validatePair(pair);
    
    this.logger.log(`📝 Creating ${side} order: ${amount} ${pair} @ ${price || 'market'}`);

    const bitoasisPair = pair.replace('-', '').toLowerCase();
    const body: any = {
      pair: bitoasisPair,
      side: side.toLowerCase(),
      type: type.toLowerCase(),
      amount: amount.toString(),
    };

    if (type === 'LIMIT' && price) {
      body.price = price.toString();
    }

    return this.request<BitoasisOrderResponse>('POST', '/v1/orders', body, true);
  }

  async cancelOrder(orderId: string): Promise<void> {
    await this.request<void>('DELETE', `/v1/orders/${orderId}`, undefined, true);
  }

  async getOrder(orderId: string): Promise<BitoasisOrderResponse> {
    return this.request<BitoasisOrderResponse>('GET', `/v1/orders/${orderId}`, undefined, true);
  }

  async getOpenOrders(pair?: TradingPair): Promise<BitoasisOrderResponse[]> {
    if (pair) {
      this.validatePair(pair);
    }
    const endpoint = pair 
      ? `/v1/orders?pair=${pair.replace('-', '').toLowerCase()}&status=open`
      : '/v1/orders?status=open';
    return this.request<BitoasisOrderResponse[]>('GET', endpoint, undefined, true);
  }

  // ============================================
  // Helper to check if API is configured
  // ============================================

  isConfigured(): boolean {
    return !!(this.apiKey && this.apiSecret);
  }
}
