import { useState, useEffect } from 'react';
import { api } from './services/api';
import { useWebSocket } from './hooks/useWebSocket';
import { StatsCard } from './components/StatsCard';
import { BotControls } from './components/BotControls';
import { PriceChart } from './components/PriceChart';
import { TradeHistory } from './components/TradeHistory';
import { ConfigPanel } from './components/ConfigPanel';
import { BotStats, BotState, BotConfig, Trade } from '@openclaw/types';

function App() {
  const [stats, setStats] = useState<BotStats | null>(null);
  const [botState, setBotState] = useState<BotState | null>(null);
  const [config, setConfig] = useState<BotConfig | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const ws = useWebSocket();

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, stateData, configData, tradesData] = await Promise.all([
          api.getStats(), api.getBotStatus(), api.getConfig(), api.getTrades(),
        ]);
        setStats(statsData);
        setBotState(stateData);
        setConfig(configData);
        setTrades(tradesData.items);
      } catch (error) {
        console.error('Failed to fetch:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => { if (ws.botState) setBotState(ws.botState); }, [ws.botState]);
  useEffect(() => {
    if (ws.lastTrade) {
      api.getStats().then(setStats);
      api.getTrades().then(data => setTrades(data.items));
    }
  }, [ws.lastTrade]);
  useEffect(() => {
    const interval = setInterval(() => api.getStats().then(setStats).catch(console.error), 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStartStop = async () => {
    try {
      const newState = botState?.status === 'RUNNING' ? await api.stopBot() : await api.startBot();
      setBotState(newState);
      setStats(await api.getStats());
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed');
    }
  };

  const handleConfigUpdate = async (updates: Partial<BotConfig>) => {
    try { setConfig(await api.updateConfig(updates)); }
    catch (error) { alert(error instanceof Error ? error.message : 'Failed'); }
  };

  const handleResetBalance = async () => {
    if (!confirm('Reset balance?')) return;
    await api.resetBalance();
    setStats(await api.getStats());
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div>Loading...</div></div>;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">🤖 XRP Trading Bot</h1>
            <p className="text-gray-400">{config?.paperTrading ? '📝 Paper' : '🔴 LIVE'}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${ws.isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-400">{ws.isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>

        {ws.lastError && (
          <div className="bg-red-900/50 border border-red-500 rounded-lg p-4 flex justify-between">
            <span>⚠️ {ws.lastError}</span>
            <button onClick={ws.clearError}>Dismiss</button>
          </div>
        )}

        <BotControls botState={botState} currentPrice={ws.lastPrice?.last || stats?.currentPrice || 0} movingAverage={ws.movingAverage || 0} onStartStop={handleStartStop} />

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard title="Portfolio" value={`$${stats.currentValue.toFixed(2)}`} subtitle={`Start: $${stats.startingCapital}`} />
            <StatsCard title="P&L" value={`$${stats.totalPnl.toFixed(2)}`} subtitle={`${stats.totalPnlPercent.toFixed(2)}%`} positive={stats.totalPnl >= 0} />
            <StatsCard title="Win Rate" value={`${stats.winRate.toFixed(1)}%`} subtitle={`${stats.winningTrades}W/${stats.losingTrades}L`} />
            <StatsCard title="Today" value={`${stats.todayTrades}`} subtitle={`$${stats.todayPnl.toFixed(2)}`} />
          </div>
        )}

        {stats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-gray-400 text-sm">USD</h3>
              <p className="text-2xl font-bold">${stats.balance.usd.toFixed(2)}</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-gray-400 text-sm">XRP</h3>
              <p className="text-2xl font-bold">{stats.balance.xrp.toFixed(4)}</p>
              <p className="text-sm text-gray-400">≈${(stats.balance.xrp * stats.currentPrice).toFixed(2)}</p>
            </div>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Price</h2>
          <PriceChart data={ws.priceHistory} />
        </div>

        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-4">Trades</h2>
          <TradeHistory trades={trades} />
        </div>

        {config && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Config</h2>
            <ConfigPanel config={config} onUpdate={handleConfigUpdate} onResetBalance={handleResetBalance} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
