import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { WsEvent, PriceData, Trade, BotState, BotConfig } from '@openclaw/types';

interface WebSocketState {
  isConnected: boolean;
  lastPrice: PriceData | null;
  movingAverage: number | null;
  lastTrade: Trade | null;
  botState: BotState | null;
  lastError: string | null;
}

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null);
  const [state, setState] = useState<WebSocketState>({
    isConnected: false,
    lastPrice: null,
    movingAverage: null,
    lastTrade: null,
    botState: null,
    lastError: null,
  });

  const [priceHistory, setPriceHistory] = useState<{ time: string; price: number }[]>([]);

  useEffect(() => {
    const socket = io(window.location.origin, {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected');
      setState(prev => ({ ...prev, isConnected: true }));
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      setState(prev => ({ ...prev, isConnected: false }));
    });

    socket.on('PRICE_UPDATE', (event: WsEvent<{ price: PriceData; movingAverage: number }>) => {
      const { price, movingAverage } = event.data;
      setState(prev => ({ ...prev, lastPrice: price, movingAverage }));
      
      // Add to price history (keep last 100 points)
      setPriceHistory(prev => {
        const newPoint = {
          time: new Date(price.timestamp).toLocaleTimeString(),
          price: price.last,
        };
        const updated = [...prev, newPoint];
        return updated.slice(-100);
      });
    });

    socket.on('TRADE_EXECUTED', (event: WsEvent<{ trade: Trade }>) => {
      setState(prev => ({ ...prev, lastTrade: event.data.trade }));
    });

    socket.on('BOT_STATUS_CHANGED', (event: WsEvent<{ state: BotState }>) => {
      setState(prev => ({ ...prev, botState: event.data.state }));
    });

    socket.on('CONFIG_CHANGED', (_event: WsEvent<BotConfig>) => {
      // Config changed, components should refetch
    });

    socket.on('ERROR', (event: WsEvent<{ message: string }>) => {
      setState(prev => ({ ...prev, lastError: event.data.message }));
      // Clear error after 5 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, lastError: null }));
      }, 5000);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, lastError: null }));
  }, []);

  return {
    ...state,
    priceHistory,
    clearError,
  };
}
