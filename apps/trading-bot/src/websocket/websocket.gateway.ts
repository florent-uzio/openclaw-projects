import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  WsEvent,
  WsPriceUpdate,
  WsTradeExecuted,
  WsBotStatusChanged,
  PriceData,
  Trade,
  BotState,
  BotConfig,
} from '@openclaw/types';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  },
})
export class WebsocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);
  private connectedClients = 0;

  handleConnection(client: Socket) {
    this.connectedClients++;
    this.logger.log(`Client connected: ${client.id} (${this.connectedClients} total)`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients--;
    this.logger.log(`Client disconnected: ${client.id} (${this.connectedClients} total)`);
  }

  broadcastPriceUpdate(price: PriceData, movingAverage: number): void {
    const event: WsEvent<WsPriceUpdate> = {
      type: 'PRICE_UPDATE',
      data: { price, movingAverage },
      timestamp: new Date(),
    };
    this.server?.emit('PRICE_UPDATE', event);
  }

  broadcastTradeExecuted(trade: Trade): void {
    const event: WsEvent<WsTradeExecuted> = {
      type: 'TRADE_EXECUTED',
      data: { trade, stats: null as any }, // Stats will be fetched by client
      timestamp: new Date(),
    };
    this.server?.emit('TRADE_EXECUTED', event);
    this.logger.log(`📡 Broadcast: Trade executed - ${trade.type} ${trade.amount} @ ${trade.price}`);
  }

  broadcastBotStatusChanged(state: BotState): void {
    const event: WsEvent<WsBotStatusChanged> = {
      type: 'BOT_STATUS_CHANGED',
      data: { state },
      timestamp: new Date(),
    };
    this.server?.emit('BOT_STATUS_CHANGED', event);
    this.logger.log(`📡 Broadcast: Bot status changed to ${state.status}`);
  }

  broadcastConfigChanged(config: BotConfig): void {
    const event: WsEvent<BotConfig> = {
      type: 'CONFIG_CHANGED',
      data: config,
      timestamp: new Date(),
    };
    this.server?.emit('CONFIG_CHANGED', event);
  }

  broadcastError(error: string): void {
    const event: WsEvent<{ message: string }> = {
      type: 'ERROR',
      data: { message: error },
      timestamp: new Date(),
    };
    this.server?.emit('ERROR', event);
  }

  broadcastStatsUpdate(stats: any): void {
    const event: WsEvent<any> = {
      type: 'STATS_UPDATE',
      data: stats,
      timestamp: new Date(),
    };
    this.server?.emit('STATS_UPDATE', event);
  }
}
