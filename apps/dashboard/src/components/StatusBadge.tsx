import type { BotStatus } from '@openclaw/types';

interface StatusBadgeProps {
  status: BotStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const statusStyles: Record<BotStatus, string> = {
    RUNNING: 'bg-green-500/20 text-green-400 border-green-500/30',
    PAUSED: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    STOPPED: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    ERROR: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  const statusIcons: Record<BotStatus, string> = {
    RUNNING: '●',
    PAUSED: '❚❚',
    STOPPED: '■',
    ERROR: '⚠',
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-medium border ${statusStyles[status]}`}
    >
      <span className="mr-1">{statusIcons[status]}</span>
      {status}
    </span>
  );
}
