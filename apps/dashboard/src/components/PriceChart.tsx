import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface PriceChartProps {
  data: { time: string; price: number }[];
}

export function PriceChart({ data }: PriceChartProps) {
  if (data.length === 0) {
    return <div className="h-64 flex items-center justify-center text-gray-500">Waiting for price data...</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="time" stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} />
        <YAxis stroke="#6b7280" tick={{ fill: '#9ca3af', fontSize: 12 }} domain={['auto', 'auto']} tickFormatter={(v) => `$${v.toFixed(2)}`} />
        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }} formatter={(value: number) => [`$${value.toFixed(4)}`, 'Price']} />
        <Line type="monotone" dataKey="price" stroke="#6366f1" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
