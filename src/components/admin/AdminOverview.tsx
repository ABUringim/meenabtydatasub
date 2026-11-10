import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAdminTotals } from '../../hooks/useAdminTotals';
import { useAdminServiceStats } from '../../hooks/useAdminServiceStats';
import { useDailyStats } from '../../hooks/useDailyStats';
import { useRecentSales } from '../../hooks/useRecentSales';
import { storage } from '../../services/storage';
import { formatKoboToNgn, formatWATDate, timeAgo } from '../../lib/formatters';
import { StatusBadge } from '../shared/StatusBadge';
import { RecomputeStatsModal } from './modals/RecomputeStatsModal';
import { SystemHealthWidget } from './SystemHealthWidget';
import {
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle,
  Activity,
  Clock,
  RefreshCw,
  Wallet,
  ArrowUpRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export const AdminOverview: React.FC<{ onNavigateTab: (tab: string) => void }> = ({ onNavigateTab }) => {
  const { user, isOwner } = useAuth();
  const { totals, lastUpdated, isLoading: isTotalsLoading, recompute } = useAdminTotals();
  const { services, loading: isServicesLoading } = useAdminServiceStats();
  const { dailyStat } = useDailyStats();
  const { recentSales } = useRecentSales(15);

  const disputes = storage.getDisputes();
  const providers = storage.getProviders();
  const paystackConfig = storage.getPaystackConfig();
  const pendingStats = storage.getAdminPendingStats();

  const [timeFilter, setTimeFilter] = useState<'today' | '7d' | '30d' | 'all'>('all');
  const [isRecomputeOpen, setIsRecomputeOpen] = useState(false);
  const [pulseLive, setPulseLive] = useState(false);

  // Trigger brief pulse animation on incoming updates
  useEffect(() => {
    setPulseLive(true);
    const timer = setTimeout(() => setPulseLive(false), 800);
    return () => clearTimeout(timer);
  }, [totals, lastUpdated]);

  // Financial values
  const isFloatLow = totals.totalWalletFloat / 100 < paystackConfig.floatAlertThresholdNgn;

  // Selected view totals depending on filter
  const displayedRevenue =
    timeFilter === 'today' && dailyStat ? dailyStat.revenue : totals.totalRevenue;
  const displayedProfit =
    timeFilter === 'today' && dailyStat ? dailyStat.profit : totals.totalProfit;
  const displayedCount =
    timeFilter === 'today' && dailyStat ? dailyStat.transactionCount : totals.totalTransactions;

  // Failure rate calculation from aggregated service stats
  const totalTxnCount = services.reduce((acc, s) => acc + s.transactionCount, 0);
  const totalFailedCount = services.reduce((acc, s) => acc + s.failedCount, 0);
  const failureRate =
    totalTxnCount > 0 ? ((totalFailedCount / totalTxnCount) * 100).toFixed(1) : '0.0';

  const maxServiceVolume = Math.max(...services.map((s) => s.transactionCount), 1);

  return (
    <div className="space-y-6">
      {/* Header and Time Filters + Recompute Control */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-black text-white tracking-tight">Executive Operations Center</h1>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono">
              <span
                className={`w-2 h-2 rounded-full transition-colors ${
                  pulseLive ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'
                }`}
              />
              <span className="text-slate-300">Live Telemetry</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span>Real-time pre-aggregated ledger telemetry</span>
            <span>•</span>
            <span className="text-emerald-400 font-mono">
              Updated {timeAgo(lastUpdated.toISOString())}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {(['today', '7d', '30d', 'all'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeFilter(period)}
                className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
                  timeFilter === period
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {period === 'all' ? 'All-Time' : period}
              </button>
            ))}
          </div>

          {isOwner && (
            <button
              onClick={() => setIsRecomputeOpen(true)}
              className="py-1.5 px-3 bg-slate-900 hover:bg-slate-850 text-slate-200 border border-slate-700 font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              title="Recompute all pre-aggregated metrics from raw transactions"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
              <span>Recompute Totals</span>
            </button>
          )}
        </div>
      </div>

      {/* System Alert Banners */}
      {isFloatLow && (
        <div className="p-4 bg-amber-950/60 border border-amber-800 rounded-2xl flex items-start justify-between gap-3 text-xs text-amber-200">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-100">Customer Wallet Float Warning</p>
              <p className="mt-0.5 text-amber-300">
                Customer wallet balance aggregate ({formatKoboToNgn(totals.totalWalletFloat)}) is below the warning threshold of ₦
                {paystackConfig.floatAlertThresholdNgn.toLocaleString()}. Inflow from Paystack top-ups:{' '}
                {formatKoboToNgn(totals.totalPaystackInflow || 0)}.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('paystack')}
            className="py-1 px-3 bg-amber-600 hover:bg-amber-700 text-slate-950 font-bold rounded-lg shrink-0"
          >
            Review Paystack
          </button>
        </div>
      )}

      {pendingStats.stuckTransactions > 0 && (
        <div className="p-4 bg-blue-950/60 border border-blue-800 rounded-2xl flex items-center justify-between text-xs text-blue-200">
          <div className="flex items-center gap-2.5">
            <Clock className="w-5 h-5 text-blue-400 shrink-0" />
            <span>
              <strong>{pendingStats.stuckTransactions} stuck transaction(s)</strong> processing over 5 minutes require an upstream operator status check.
            </span>
          </div>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg"
          >
            Requery Feed
          </button>
        </div>
      )}

      {/* Primary KPI Cards with Click-Through Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue */}
        <div
          onClick={() => onNavigateTab('transactions')}
          className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-sm cursor-pointer hover:border-emerald-500/50 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Gross Revenue (GMV)</span>
            <DollarSign className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black font-mono text-white mt-2 tracking-tight">
            {formatKoboToNgn(displayedRevenue)}
          </p>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
            <span>{displayedCount.toLocaleString()} total orders ({timeFilter})</span>
            <span className="text-emerald-400 font-semibold group-hover:underline flex items-center gap-0.5">
              Ledger <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Net Margin */}
        <div
          onClick={() => onNavigateTab('reports')}
          className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-sm cursor-pointer hover:border-teal-500/50 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Net Platform Margin</span>
            <TrendingUp className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black font-mono text-emerald-400 mt-2 tracking-tight">
            {formatKoboToNgn(displayedProfit)}
          </p>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
            <span>Wholesale markup realized</span>
            <span className="text-teal-400 font-semibold group-hover:underline flex items-center gap-0.5">
              P&L Report <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Customer Float */}
        <div
          onClick={() => onNavigateTab('users')}
          className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-sm cursor-pointer hover:border-indigo-500/50 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Customer Wallet Float</span>
            <Wallet className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black font-mono text-indigo-300 mt-2 tracking-tight">
            {formatKoboToNgn(totals.totalWalletFloat)}
          </p>
          <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
            <span>Across {totals.totalCustomers} active wallets</span>
            <span className="text-indigo-400 font-semibold group-hover:underline flex items-center gap-0.5">
              Users <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Failed Transaction Rate */}
        <div
          onClick={() => onNavigateTab('vtu-providers')}
          className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-sm cursor-pointer hover:border-rose-500/50 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Upstream Failure Rate</span>
            <AlertTriangle className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="text-2xl font-black font-mono text-white mt-2 tracking-tight">{failureRate}%</p>
          <div className="flex items-center justify-between mt-1 text-[11px] text-emerald-400 font-semibold">
            <span>100% Auto-Refunded</span>
            <span className="text-rose-400 font-semibold group-hover:underline flex items-center gap-0.5">
              Routing <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Real-time Telemetry & System Health Widget (admin_stats/health) */}
      <SystemHealthWidget onNavigateTab={onNavigateTab} />

      {/* 10 Services Breakdown + Operations Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Service Volume Breakdown Chart */}
        <div className="lg:col-span-7 bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Multi-Service Vending Breakdown (10 Digital Services)
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Aggregated real-time volume, gross revenue & failure rates
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('products')}
              className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Catalog</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3 pt-1">
            {services.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Loading service telemetry...</p>
            ) : (
              services.map((s) => {
                const percent = Math.round((s.transactionCount / maxServiceVolume) * 100);
                return (
                  <div key={s.service} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white capitalize">{s.service}</span>
                        {s.failureRate > 5 && (
                          <span className="text-[10px] text-rose-400 font-mono font-bold bg-rose-500/10 px-1 rounded">
                            {s.failureRate}% err
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-slate-400 text-[11px] flex items-center gap-3">
                        <span className="text-white font-semibold">{formatKoboToNgn(s.totalRevenue)}</span>
                        <span>{s.transactionCount} txns</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percent, 2)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Operations Summary */}
        <div className="lg:col-span-5 bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Operations Command Matrix
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Real-time Queues</span>
            </div>

            <div className="space-y-2.5 mt-3 text-xs">
              <div
                onClick={() => onNavigateTab('disputes')}
                className="p-3 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <p className="font-bold text-white">Customer Disputes in Queue</p>
                  <p className="text-[11px] text-slate-400">Tickets awaiting investigation</p>
                </div>
                <span className="px-2.5 py-1 bg-amber-500/20 text-amber-300 font-mono font-bold rounded-lg border border-amber-500/30">
                  {disputes.filter((d) => d.status === 'open' || d.status === 'investigating').length}
                </span>
              </div>

              <div
                onClick={() => onNavigateTab('vtu-providers')}
                className="p-3 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <p className="font-bold text-white">Active Telecom Aggregators</p>
                  <p className="text-[11px] text-slate-400">VTPass, ClubKash, Interswitch</p>
                </div>
                <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-mono font-bold rounded-lg border border-emerald-500/30">
                  {providers.filter((p) => p.active).length} Healthy
                </span>
              </div>

              <div
                onClick={() => onNavigateTab('users')}
                className="p-3 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <p className="font-bold text-white">Total Customer Accounts</p>
                  <p className="text-[11px] text-slate-400">Verified & active wallet holders</p>
                </div>
                <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 font-mono font-bold rounded-lg border border-indigo-500/30">
                  {totals.totalCustomers}
                </span>
              </div>

              <div
                onClick={() => onNavigateTab('cms')}
                className="p-3 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <p className="font-bold text-white">Educational Guides & Blog CMS</p>
                  <p className="text-[11px] text-slate-400">Public customer support articles</p>
                </div>
                <span className="px-2.5 py-1 bg-slate-800 text-slate-300 font-mono font-bold rounded-lg border border-slate-700">
                  {storage.getBlogPosts().length} Articles
                </span>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 pt-3 border-t border-slate-800">
            Click any section above to navigate directly into operations workflows.
          </p>
        </div>
      </div>

      {/* Live Transaction Feed (Last 15) */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Live Global Vending Feed (Latest Real-Time Transactions)
            </h3>
          </div>
          <button
            onClick={() => onNavigateTab('transactions')}
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
          >
            <span>Full Transaction Monitor</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/60 border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5 px-4">Ref</th>
                <th className="py-2.5 px-4">Customer</th>
                <th className="py-2.5 px-4">Service</th>
                <th className="py-2.5 px-4">Recipient</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4 text-right">Profit</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {recentSales.map((t) => (
                <tr key={t.id} className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-4 font-mono font-bold text-white">{t.reference}</td>
                  <td className="py-2.5 px-4 font-mono text-slate-400 text-[11px]">
                    {t.user_email || t.user_id}
                  </td>
                  <td className="py-2.5 px-4 capitalize font-medium text-slate-200">
                    {t.service} ({t.provider})
                  </td>
                  <td className="py-2.5 px-4 font-mono text-slate-400">
                    {t.recipient_details.phone ||
                      t.recipient_details.meterNo ||
                      t.recipient_details.customerName ||
                      '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-white">
                    {formatKoboToNgn(t.amount)}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-emerald-400 font-semibold">
                    +{formatKoboToNgn(t.profit || 0)}
                  </td>
                  <td className="py-2.5 px-4">
                    <StatusBadge status={t.status} />
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 whitespace-nowrap">{timeAgo(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recompute Stats Modal */}
      <RecomputeStatsModal
        isOpen={isRecomputeOpen}
        onClose={() => setIsRecomputeOpen(false)}
        actorId={user?.uid || 'owner'}
        actorName={user?.name || 'Owner Administrator'}
        onSuccess={() => {
          setIsRecomputeOpen(false);
        }}
      />
    </div>
  );
};
