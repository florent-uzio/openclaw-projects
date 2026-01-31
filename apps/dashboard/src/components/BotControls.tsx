import { BotState } from '@openclaw/types';

interface BotControlsProps {
  botState: BotState | null;
  currentPrice: number;
  movingAverage: number;
  onStartStop: () => void;
}

export function BotControls({ botState, currentPrice, movingAverage, onStartStop }: BotControlsProps) {
  const isRunning = botState?.status === 'RUNNING';
  const uptime = botState?.uptime || 0;
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button
            onClick={onStartStop}
            className={`px-6 py-3 rounded-lg font-semibold text-lg transition ${
              isRunning
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isRunning ? '⏹ Stop Bot' : '▶ Start Bot'}
          </button>

          <div>
            <p className="text-sm text-gray-400">Status</p>
            <p className={`font-semibold ${isRunning ? 'text-green-500' : 'text-gray-500'}`}>
              {botState?.status || 'Unknown'}
            </p>
          </div>

          {isRunning && (
            <div>
              <p className="text-sm text-gray-400">Uptime</p>
              <p className="font-mono">
                {hours.toString().padStart(2, '0')}:
                {minutes.toString().padStart(2, '0')}:
                {seconds.toString().padStart(2, '0')}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-sm text-gray-400">Current Price</p>
            <p className="text-xl font-bold">${currentPrice.toFixed(4)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Moving Avg</p>
            <p className="text-xl font-bold">${movingAverage.toFixed(4)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Diff</p>
            <p className={`text-xl font-bold ${
              currentPrice > movingAverage ? 'text-green-500' : 'text-red-500'
            }`}>
              {movingAverage > 0
                ? `${(((currentPrice - movingAverage) / movingAverage) * 100).toFixed(2)}%`
                : '-'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
