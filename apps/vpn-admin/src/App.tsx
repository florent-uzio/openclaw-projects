import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Users, 
  DollarSign, 
  UserCheck, 
  UserX, 
  TrendingUp,
  RefreshCw,
  Shield,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  Power,
  Trash2
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { getSubscriptions, getStats, getDailyStats, toggleClientStatus, Subscription, Stats, DailyStats } from './services/api';
import { useState } from 'react';

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color = 'blue',
  subtext
}: { 
  title: string; 
  value: string | number; 
  icon: React.ComponentType<any>;
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  subtext?: string;
}) {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          {subtext && <p className="text-sm text-slate-400 mt-1">{subtext}</p>}
        </div>
        <div className={`${colors[color]} p-3 rounded-xl`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: React.ComponentType<any>; label: string }> = {
    active: { color: 'bg-green-100 text-green-700', icon: CheckCircle2, label: 'Active' },
    pending: { color: 'bg-yellow-100 text-yellow-700', icon: Clock, label: 'Pending' },
    canceled: { color: 'bg-slate-100 text-slate-600', icon: XCircle, label: 'Canceled' },
    payment_failed: { color: 'bg-red-100 text-red-700', icon: AlertCircle, label: 'Payment Failed' },
    past_due: { color: 'bg-orange-100 text-orange-700', icon: AlertCircle, label: 'Past Due' },
  };

  const { color, icon: Icon, label } = config[status] || config.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

function SubscriptionRow({ 
  subscription, 
  onToggle 
}: { 
  subscription: Subscription;
  onToggle: (id: string, enable: boolean) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const isActive = subscription.status === 'active';

  return (
    <tr className="hover:bg-slate-50 transition">
      <td className="px-6 py-4">
        <div>
          <p className="font-medium text-slate-900">{subscription.email}</p>
          <p className="text-sm text-slate-500">{subscription.stripe_customer_id}</p>
        </div>
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={subscription.status} />
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">
        {subscription.wg_client_name || '—'}
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">
        {format(new Date(subscription.created_at), 'MMM d, yyyy')}
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">
        {subscription.expires_at 
          ? formatDistanceToNow(new Date(subscription.expires_at), { addSuffix: true })
          : '—'}
      </td>
      <td className="px-6 py-4 text-right relative">
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 hover:bg-slate-100 rounded-lg transition"
        >
          <MoreVertical className="w-4 h-4 text-slate-500" />
        </button>
        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-6 top-12 z-20 bg-white rounded-lg shadow-lg border border-slate-200 py-1 min-w-[160px]">
              <button
                onClick={() => {
                  onToggle(subscription.stripe_subscription_id!, !isActive);
                  setShowMenu(false);
                }}
                disabled={!subscription.stripe_subscription_id}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Power className="w-4 h-4" />
                {isActive ? 'Disable VPN' : 'Enable VPN'}
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  );
}

export default function App() {
  const queryClient = useQueryClient();

  const { data: subscriptions = [], isLoading: loadingSubs, refetch: refetchSubs } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: getSubscriptions,
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  });

  const { data: dailyStats = [] } = useQuery({
    queryKey: ['dailyStats'],
    queryFn: () => getDailyStats(30),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enable }: { id: string; enable: boolean }) => toggleClientStatus(id, enable),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const handleToggle = (id: string, enable: boolean) => {
    toggleMutation.mutate({ id, enable });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary-500 p-2 rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">DubaiVPN Admin</h1>
              <p className="text-sm text-slate-500">Subscription Management</p>
            </div>
          </div>
          <button
            onClick={() => refetchSubs()}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition text-sm font-medium text-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${loadingSubs ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Subscribers"
            value={stats?.total ?? '—'}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Active"
            value={stats?.active ?? '—'}
            icon={UserCheck}
            color="green"
            subtext={stats ? `${Math.round((stats.active / stats.total) * 100 || 0)}% of total` : undefined}
          />
          <StatCard
            title="Payment Issues"
            value={(stats?.paymentFailed ?? 0) + (stats?.canceled ?? 0)}
            icon={UserX}
            color="red"
          />
          <StatCard
            title="Monthly Revenue"
            value={stats ? `€${stats.monthlyRevenue}` : '—'}
            icon={DollarSign}
            color="purple"
            subtext={stats ? `${stats.active} × €5` : undefined}
          />
        </div>

        {/* Chart */}
        {dailyStats.length > 0 && (
          <div className="card p-6 mb-8">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              Signups Over Time
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats}>
                  <defs>
                    <linearGradient id="colorSignups" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(val) => format(new Date(val), 'MMM d')}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(val) => format(new Date(val), 'MMMM d, yyyy')}
                    contentStyle={{ borderRadius: 8 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="signups" 
                    stroke="#0ea5e9" 
                    fillOpacity={1}
                    fill="url(#colorSignups)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Subscriptions Table */}
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Subscriptions</h2>
            <p className="text-sm text-slate-500 mt-1">
              {subscriptions.length} total subscribers
            </p>
          </div>
          
          {loadingSubs ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-slate-400" />
              Loading subscriptions...
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p>No subscriptions yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      VPN Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Expires
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {subscriptions.map((sub) => (
                    <SubscriptionRow 
                      key={sub.id} 
                      subscription={sub} 
                      onToggle={handleToggle}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
