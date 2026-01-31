import { Trade } from '@openclaw/types';

interface TradeHistoryProps {
  trades: Trade[];
}

export function TradeHistory({ trades }: TradeHistoryProps) {
  if (trades.length === 0) {
    return (
      <div className="text-gray-500 text-center py-8">
        No trades yet. Start the bot to begin trading.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-gray-400 text-sm border-b border-gray-700">
            <th className="pb-2">Time</th>
            <th className="pb-2">Type</th>
            <th className="pb-2">Amount</th>
            <th className="pb-2">Price</th>
            <th className="pb-2">Total</th>
            <th className="pb-2">Fee</th>
            <th className="pb-2">Status</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.id} className="border-b border-gray-700/50">
              <td className="py-2 text-sm">
                {new Date(trade.createdAt).toLocaleString()}
              </td>
              <td className="py-2">
                <span className={`font-semibold ${
                  trade.type === 'BUY' ? 'text-green-500' : 'text-red-500'
                }`}>
                  {trade.type}
                </span>
              </td>
              <td className="py-2">{trade.amount.toFixed(4)} XRP</td>
              <td className="py-2">${trade.price.toFixed(4)}</td>
              <td className="py-2">${trade.total.toFixed(2)}</td>
              <td className="py-2 text-gray-400">${trade.fee.toFixed(4)}</td>
              <td className="py-2">
                <span className={`px-2 py-1 rounded text-xs ${
                  trade.status === 'FILLED' ? 'bg-green-900/50 text-green-400' :
                  trade.status === 'PENDING' ? 'bg-yellow-900/50 text-yellow-400' :
                  trade.status === 'FAILED' ? 'bg-red-900/50 text-red-400' :
                  'bg-gray-700 text-gray-400'
                }`}>
                  {trade.status}
                </span>
                {trade.isPaperTrade && (
                  <span className="ml-2 text-xs text-gray-500">📝</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
