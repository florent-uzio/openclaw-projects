import { useState } from 'react';
import { BotConfig, ConfigUpdate } from '@openclaw/types';

interface ConfigPanelProps {
  config: BotConfig;
  onUpdate: (updates: ConfigUpdate) => void;
  onResetBalance: () => void;
}

export function ConfigPanel({ config, onUpdate, onResetBalance }: ConfigPanelProps) {
  const [localConfig, setLocalConfig] = useState(config);

  const handleChange = (key: keyof ConfigUpdate, value: number | boolean) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = (key: keyof ConfigUpdate) => {
    onUpdate({ [key]: localConfig[key as keyof BotConfig] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
        <div>
          <h3 className="font-semibold">Trading Mode</h3>
          <p className="text-sm text-gray-400">
            {localConfig.paperTrading ? 'Paper trading (simulated)' : 'LIVE trading (real money!)'}
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={!localConfig.paperTrading}
            onChange={(e) => {
              if (e.target.checked && !confirm('⚠️ Enable LIVE trading? Real money will be used!')) return;
              handleChange('paperTrading', !e.target.checked);
              onUpdate({ paperTrading: !e.target.checked });
            }}
            className="sr-only peer"
          />
          <div className="w-14 h-7 bg-gray-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-red-600"></div>
          <span className="ml-3 text-sm font-medium">{localConfig.paperTrading ? 'Paper' : 'LIVE'}</span>
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <ConfigInput label="Buy Threshold %" value={localConfig.buyThresholdPercent} onChange={(v) => handleChange('buyThresholdPercent', v)} onBlur={() => handleSave('buyThresholdPercent')} step={0.1} min={0.1} max={10} />
        <ConfigInput label="Sell Threshold %" value={localConfig.sellThresholdPercent} onChange={(v) => handleChange('sellThresholdPercent', v)} onBlur={() => handleSave('sellThresholdPercent')} step={0.1} min={0.1} max={10} />
        <ConfigInput label="Min Profit %" value={localConfig.minProfitPercent} onChange={(v) => handleChange('minProfitPercent', v)} onBlur={() => handleSave('minProfitPercent')} step={0.1} min={0.1} max={10} />
        <ConfigInput label="Stop Loss %" value={localConfig.stopLossPercent} onChange={(v) => handleChange('stopLossPercent', v)} onBlur={() => handleSave('stopLossPercent')} step={0.5} min={1} max={20} />
        <ConfigInput label="MA Period (min)" value={localConfig.movingAveragePeriod} onChange={(v) => handleChange('movingAveragePeriod', v)} onBlur={() => handleSave('movingAveragePeriod')} step={5} min={5} max={240} />
        <ConfigInput label="Max Daily Trades" value={localConfig.maxDailyTrades} onChange={(v) => handleChange('maxDailyTrades', v)} onBlur={() => handleSave('maxDailyTrades')} step={1} min={1} max={100} />
        <ConfigInput label="Min Trade USD" value={localConfig.minTradeAmountUsd} onChange={(v) => handleChange('minTradeAmountUsd', v)} onBlur={() => handleSave('minTradeAmountUsd')} step={5} min={5} max={100} />
        <ConfigInput label="Max Trade USD" value={localConfig.maxTradeAmountUsd} onChange={(v) => handleChange('maxTradeAmountUsd', v)} onBlur={() => handleSave('maxTradeAmountUsd')} step={10} min={10} max={1000} />
        <ConfigInput label="Interval (sec)" value={localConfig.tradingIntervalSeconds} onChange={(v) => handleChange('tradingIntervalSeconds', v)} onBlur={() => handleSave('tradingIntervalSeconds')} step={5} min={10} max={300} />
      </div>

      <div className="p-4 bg-gray-700/50 rounded-lg">
        <h3 className="font-semibold mb-2">Fee Information</h3>
        <p className="text-sm text-gray-400">
          Maker Fee: {(config.makerFee * 100).toFixed(2)}% | Taker Fee: {(config.takerFee * 100).toFixed(2)}% | Min profit needed: {((config.takerFee * 2) * 100 + 0.1).toFixed(2)}%
        </p>
      </div>

      <div className="flex justify-end">
        <button onClick={onResetBalance} className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm">
          Reset Balance to ${config.startingCapitalUsd}
        </button>
      </div>
    </div>
  );
}

interface ConfigInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onBlur: () => void;
  step: number;
  min: number;
  max: number;
}

function ConfigInput({ label, value, onChange, onBlur, step, min, max }: ConfigInputProps) {
  return (
    <div>
      <label className="block text-sm text-gray-400 mb-1">{label}</label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        onBlur={onBlur}
        step={step}
        min={min}
        max={max}
        className="w-full px-3 py-2 bg-gray-700 rounded-lg border border-gray-600 focus:border-primary focus:outline-none"
      />
    </div>
  );
}
