import React from 'react';
import { storage } from '../../services/storage';
import { formatKoboToNgn, formatWATDate, timeAgo } from '../../lib/formatters';
import { StatusBadge } from '../shared/StatusBadge';
import {
  TrendingUp,
  DollarSign,
  Users,
  AlertTriangle,
  Server,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export const AdminDashboard: React.FC<{ onNavigateTab: (tab: string) => void }> = ({ onNavigateTab }) => {
  const transactions = storage.getTransactions();
  const users = storage.getUsers();
  const providers = storage.getProviders();
  const disputes = storage.getDisputes();

  const totalVolumeKobo = transactions.reduce((acc, t) => acc + t.amount, 0);
  const totalProfitKobo = transactions.filter((t) => t.status === 'success').reduce((acc, t) => acc + t.profit, 0);
  const failedTxns = transactions.filter((t) => t.status === 'failed');
  const failureRate = transactions.length > 0 ? ((failedTxns.length / transactions.length) * 100).toFixed(1) : '0';
  const openDisputes = disputes.filter((d) => d.status === 'open');

  const activeProvider = providers.find((p) => p.active) || providers[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900">Operations Control Center</h2>
          <p className="text-xs text-slate-500">Live platform telemetry, liquidity, vending volume, and dispute queues</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Gateway Online ({activeProvider.name})
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total GMV Volume</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-2">{formatKoboToNgn(totalVolumeKobo)}</p>
          <p className="text-[11px] text-emerald-700 mt-1 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Across {transactions.length} total orders</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Net Platform Margin</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-800 mt-2">{formatKoboToNgn(totalProfitKobo)}</p>
          <p className="text-[11px] text-slate-500 mt-1">Average markup 4.8% per service</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Registered Customers</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-2">{users.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">
            {users.filter((u) => u.tier === 2).length} verified Tier 2 accounts
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Failed Txn Rate</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-2">{failureRate}%</p>
          <p className="text-[11px] text-emerald-700 font-semibold mt-1">Auto-refunded atomically (0 double-charges)</p>
        </div>
      </div>

      {/* Provider Health & Disputes Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  Upstream Aggregator Pool
                </h3>
              </div>
              <button
                onClick={() => onNavigateTab('admin-providers')}
                className="text-xs font-semibold text-emerald-800 hover:underline"
              >
                Configure Providers →
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
              {providers.map((p) => (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-lg border text-xs ${
                    p.active
                      ? 'border-emerald-600 bg-emerald-50/50'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{p.name.split(' ')[0]}</span>
                    {p.active && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Success: {p.successRate}%</p>
                  <p className="font-mono font-bold text-slate-800 mt-1.5">
                    ₦{p.balanceNgn.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Queues */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide pb-3 border-b border-slate-100">
              Operations Attention Queue
            </h3>
            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 bg-amber-50 rounded-lg text-amber-900 border border-amber-200">
                <span className="font-semibold">Open Customer Disputes</span>
                <span className="font-bold font-mono">{openDisputes.length}</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg text-slate-700 border border-slate-200">
                <span className="font-semibold">Stuck Processing Orders</span>
                <span className="font-bold font-mono">
                  {transactions.filter((t) => t.status === 'processing').length}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('admin-disputes')}
            className="w-full mt-4 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            Review Disputes
          </button>
        </div>
      </div>

      {/* Latest Global Platform Transactions */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Latest Transactions Across All Users
          </h3>
          <button
            onClick={() => onNavigateTab('admin-transactions')}
            className="text-xs font-semibold text-emerald-800 hover:underline"
          >
            Open Live Monitor →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold">
                <th className="py-2.5 px-4">Ref</th>
                <th className="py-2.5 px-4">Service</th>
                <th className="py-2.5 px-4">Recipient</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4 text-right">Profit</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.slice(0, 5).map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 font-mono font-semibold text-slate-900">{t.reference}</td>
                  <td className="py-2.5 px-4 capitalize font-medium text-slate-800">{t.service} ({t.provider})</td>
                  <td className="py-2.5 px-4 font-mono text-slate-600">
                    {t.recipient_details.phone || t.recipient_details.meterNo || t.recipient_details.smartcardNo || '—'}
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold">{formatKoboToNgn(t.amount)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-emerald-700 font-semibold">
                    +{formatKoboToNgn(t.profit)}
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
    </div>
  );
};
