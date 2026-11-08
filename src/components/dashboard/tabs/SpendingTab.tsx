import React from 'react';
import { useSpending } from '../../../hooks/useSpending';
import { formatKoboToNgn } from '../../../lib/formatters';
import { getServiceIcon } from '../TransactionCard';
import {
  Wallet,
  Calendar,
  Zap,
  AlertTriangle,
  TrendingUp,
  BarChart2,
  PieChart,
} from 'lucide-react';

export const SpendingTab: React.FC = () => {
  const {
    totalSpentKobo,
    spentThisMonthKobo,
    failedLast30Days,
    mostUsed,
    serviceBreakdown,
    monthlyTrend,
  } = useSpending();

  // Find max monthly total to scale trend bars
  const maxMonthKobo = Math.max(...monthlyTrend.map((m) => m.totalKobo), 1);

  return (
    <div className="space-y-6">
      {/* Top 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Spent (All-Time)
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold font-mono text-slate-900 mt-2">
            {formatKoboToNgn(totalSpentKobo)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Sum of all successful orders</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              This Month's Spending
            </span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold font-mono text-blue-950 mt-2">
            {formatKoboToNgn(spentThisMonthKobo)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Calendar month to date</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Most-Used Service
            </span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 capitalize truncate">
            {mostUsed ? mostUsed.service : 'None yet'}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {mostUsed ? `${mostUsed.count} recharges (${formatKoboToNgn(mostUsed.totalKobo)})` : 'No orders yet'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Failed (Last 30d)
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold font-mono text-amber-950 mt-2">
            {failedLast30Days}
          </p>
          <p className="text-[11px] text-emerald-700 font-medium mt-1">All 100% auto-refunded</p>
        </div>
      </div>

      {/* Visual Breakdown by Service Category */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Spending Breakdown by Digital Service
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            {serviceBreakdown.length} active service categories
          </span>
        </div>

        {serviceBreakdown.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No spending recorded yet. Once you complete a recharge or bill payment, your analytics will visualize here.
          </div>
        ) : (
          <div className="space-y-3.5">
            {serviceBreakdown.map((item) => {
              const { icon: Icon, color } = getServiceIcon(item.service);
              return (
                <div key={item.service} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-md border flex items-center justify-center ${color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-slate-800 capitalize">{item.service}</span>
                      <span className="text-[11px] text-slate-400">({item.count} orders)</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="font-bold text-slate-900">{formatKoboToNgn(item.totalKobo)}</span>
                      <span className="text-slate-400 text-[11px]">({item.percentage.toFixed(1)}%)</span>
                    </div>
                  </div>

                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(Math.max(item.percentage, 4), 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Monthly Trend (Last 6 Months Visual Bar Chart) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-emerald-700" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              6-Month Spending Trend
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">Cumulative monthly totals</span>
        </div>

        <div className="grid grid-cols-6 gap-2 sm:gap-4 items-end pt-8 pb-2 border-b border-slate-100 min-h-[160px]">
          {monthlyTrend.map((m) => {
            const heightPercent = Math.round((m.totalKobo / maxMonthKobo) * 100);
            return (
              <div key={m.monthKey} className="flex flex-col items-center gap-2 group">
                <span className="text-[10px] font-mono font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  {formatKoboToNgn(m.totalKobo)}
                </span>
                <div className="w-full max-w-[48px] bg-slate-100 rounded-t-xl h-28 flex items-end overflow-hidden p-1">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-800 to-emerald-600 rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                    style={{ height: `${Math.max(heightPercent, 6)}%` }}
                  />
                </div>
                <span className="text-[10px] font-semibold text-slate-600 truncate max-w-full">
                  {m.monthLabel.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
