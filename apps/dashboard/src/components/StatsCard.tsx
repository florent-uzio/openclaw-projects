import type { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  icon?: ReactNode;
  prefix?: string;
  suffix?: string;
  subtitle?: string;
  valueColor?: string;
  positive?: boolean;
}

export function StatsCard({
  title,
  value,
  icon,
  prefix = '',
  suffix = '',
  subtitle,
  valueColor,
  positive,
}: StatsCardProps) {
  const color = valueColor || (positive !== undefined ? (positive ? 'text-green-400' : 'text-red-400') : 'text-white');
  
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm text-slate-400">{title}</h3>
        {icon}
      </div>
      <p className={`text-2xl font-bold ${color}`}>
        {prefix}
        {value}
        {suffix}
      </p>
      {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
    </div>
  );
}
