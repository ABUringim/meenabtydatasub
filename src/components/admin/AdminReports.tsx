import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { formatKoboToNgn, formatWATDate } from '../../lib/formatters';
import {
  Download,
  TrendingUp,
  DollarSign,
  PieChart,
  Users,
  AlertTriangle,
  Calendar,
  FileSpreadsheet,
} from 'lucide-react';
import { ServiceCategory } from '../../types';

export const AdminReports: React.FC = () => {
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'all'>('30d');
  const allTxns = storage.getTransactions();
  const allUsers = storage.getUsers();

  const now = Date.now();
  const filteredTxns = allTxns.filter((t) => {
    if (period === 'all') return true;
    const diff = now - new Date(t.created_at).getTime();
    if (period === 'today') return diff <= 86400000;
    if (period === '7d') return diff <= 7 * 86400000;
    if (period === '30d') return diff <= 30 * 86400000;
    return true;
  });

  const totalGmvKobo = filteredTxns.reduce((s, t) => s + t.amount, 0);
  const successfulTxns = filteredTxns.filter((t) => t.status === 'success');
  const totalCostKobo = successfulTxns.reduce((s, t) => s + (t.cost || t.amount * 0.95), 0);
  const totalProfitKobo = successfulTxns.reduce((s, t) => s + (t.profit || 0), 0);
  const failedTxns = filteredTxns.filter((t) => t.status === 'failed');

  // Breakdown by service
  const serviceBreakdown = filteredTxns.reduce((acc, t) => {
    if (!acc[t.service]) {
      acc[t.service] = { count: 0, volumeKobo: 0, profitKobo: 0 };
    }
    acc[t.service].count += 1;
    acc[t.service].volumeKobo += t.amount;
    if (t.status === 'success') {
      acc[t.service].profitKobo += t.profit || 0;
    }
    return acc;
  }, {} as Record<ServiceCategory, { count: number; volumeKobo: number; profitKobo: number }>);

  // Top users by transaction count
  const userVolMap = filteredTxns.reduce((acc, t) => {
    acc[t.user_id] = (acc[t.user_id] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const topUsers = Object.entries(userVolMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([uid, volKobo]) => {
      const u = allUsers.find((user) => user.uid === uid);
      return {
        uid,
        name: u?.name || 'Customer Account',
        email: u?.email || uid,
        volumeKobo: volKobo,
      };
    });

  const handleExportCsv = () => {
    const headers = ['Txn_Reference', 'Date_WAT', 'Service', 'Provider', 'Amount_NGN', 'Profit_NGN', 'Status'];
    const rows = filteredTxns.map((t) => [
      `"${t.reference}"`,
      `"${formatWATDate(t.created_at)}"`,
      `"${t.service}"`,
      `"${t.provider}"`,
      `"${(t.amount / 100).toFixed(2)}"`,
      `"${(t.profit / 100).toFixed(2)}"`,
      `"${t.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `meenabty_financial_report_${period}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-400" />
            Financial Reports & Business Intelligence
          </h2>
          <p className="text-xs text-slate-400">
            Export comprehensive revenue statements, audit carrier costs, and monitor service margin performance
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['today', '7d', '30d', 'all'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-lg font-semibold uppercase text-[10px] transition-colors ${
                  period === p ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCsv}
            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Gross Merchandise Value (GMV)</p>
          <p className="text-2xl font-mono font-bold text-white mt-2">{formatKoboToNgn(totalGmvKobo)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Across {filteredTxns.length} transactions</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Upstream Wholesale Cost</p>
          <p className="text-2xl font-mono font-bold text-slate-300 mt-2">{formatKoboToNgn(totalCostKobo)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Carrier cost across telecom gateways</p>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Platform Net Margin</p>
          <p className="text-2xl font-mono font-bold text-emerald-400 mt-2">{formatKoboToNgn(totalProfitKobo)}</p>
          <p className="text-[11px] text-emerald-400 font-semibold mt-1">
            {totalGmvKobo > 0 ? ((totalProfitKobo / totalGmvKobo) * 100).toFixed(1) : 0}% net take rate
          </p>
        </div>

        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Failed Vending Rate</p>
          <p className="text-2xl font-mono font-bold text-amber-300 mt-2">
            {filteredTxns.length > 0 ? ((failedTxns.length / filteredTxns.length) * 100).toFixed(1) : 0}%
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{failedTxns.length} failed / refunded</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Category Performance Table */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-800">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Volume & Profit by Service</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-2.5 px-4">Service</th>
                  <th className="py-2.5 px-4 text-center">Orders</th>
                  <th className="py-2.5 px-4 text-right">Volume</th>
                  <th className="py-2.5 px-4 text-right">Net Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {Object.entries(serviceBreakdown).map(([srv, data]) => (
                  <tr key={srv} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-4 font-bold text-white capitalize">{srv}</td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-300">{data.count}</td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-200">
                      {formatKoboToNgn(data.volumeKobo)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-bold text-emerald-400">
                      +{formatKoboToNgn(data.profitKobo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top 5 High-Volume Customers */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Transacting Accounts</h3>
            <span className="text-[11px] text-slate-400 font-mono">By Spend</span>
          </div>

          <div className="p-4 divide-y divide-slate-800">
            {topUsers.map((u, i) => (
              <div key={u.uid} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-emerald-400">
                    #{i + 1}
                  </div>
                  <div>
                    <p className="font-bold text-white text-xs">{u.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{u.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-emerald-400 text-xs">
                    {formatKoboToNgn(u.volumeKobo)}
                  </p>
                  <span className="text-[10px] text-slate-400">Accumulated</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
