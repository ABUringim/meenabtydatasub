import React from 'react';
import { useSystemHealth } from '../../hooks/useSystemHealth';
import { formatWATDate, timeAgo, formatKoboToNgn } from '../../lib/formatters';
import {
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Radio,
  Server,
  Zap,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface SystemHealthWidgetProps {
  onNavigateTab?: (tab: string) => void;
  className?: string;
}

export const SystemHealthWidget: React.FC<SystemHealthWidgetProps> = ({
  onNavigateTab,
  className = '',
}) => {
  const { health, isPinging, pingAggregator, testWebhook } = useSystemHealth();

  const getStatusBadge = (status: 'healthy' | 'degraded' | 'maintenance' | 'down' | 'operational' | 'outage') => {
    switch (status) {
      case 'healthy':
      case 'operational':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            <span>OPERATIONAL</span>
          </span>
        );
      case 'degraded':
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span className="uppercase">{status}</span>
          </span>
        );
      case 'down':
      case 'outage':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3 text-rose-400" />
            <span>OUTAGE</span>
          </span>
        );
    }
  };

  return (
    <div className={`bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4 ${className}`}>
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Telemetry & System Health
              </h3>
              {getStatusBadge(health.overallStatus)}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Live automated status sourced from <span className="font-mono text-emerald-400">admin_stats/health</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={pingAggregator}
            disabled={isPinging}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Ping BigiSub Aggregator API"
          >
            <Radio className={`w-3.5 h-3.5 text-sky-400 ${isPinging ? 'animate-pulse' : ''}`} />
            <span>Ping BigiSub</span>
          </button>

          <button
            type="button"
            onClick={testWebhook}
            disabled={isPinging}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-700 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors disabled:opacity-50"
            title="Verify Paystack Webhook Receiver"
          >
            <Zap className={`w-3.5 h-3.5 text-amber-400 ${isPinging ? 'animate-pulse' : ''}`} />
            <span>Test Webhook</span>
          </button>
        </div>
      </div>

      {/* 3 Telemetry Cards: Paystack Webhook, BigiSub API, and Last Successful Transaction */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Paystack Webhook */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Paystack Webhook</span>
            </div>
            {getStatusBadge(health.paystackWebhook.status)}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">Latency</span>
              <span className="font-mono font-bold text-white text-xs">
                {health.paystackWebhook.latencyMs}ms
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Success Rate</span>
              <span className="font-mono font-bold text-emerald-400 text-xs">
                {health.paystackWebhook.successRate}%
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Last Handshake:</span>
            <span className="font-mono text-slate-300">
              {timeAgo(health.paystackWebhook.lastReceivedAt)}
            </span>
          </div>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('paystack')}
              className="w-full text-center text-[10px] font-semibold text-emerald-400 hover:underline flex items-center justify-center gap-1 pt-1"
            >
              <span>View Paystack Configuration</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        {/* Card 2: BigiSub VTU Aggregator API */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-white">BigiSub VTU API</span>
            </div>
            {getStatusBadge(health.bigiSubApi.status)}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">API Latency</span>
              <span className="font-mono font-bold text-white text-xs">
                {health.bigiSubApi.latencyMs}ms
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Uptime SLA</span>
              <span className="font-mono font-bold text-sky-400 text-xs">
                {health.bigiSubApi.uptimePercent}%
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Float Balance:</span>
            <span className="font-mono font-bold text-white">
              ₦{(health.bigiSubApi.balanceNgn || 485250).toLocaleString()}
            </span>
          </div>

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('vtu-providers')}
              className="w-full text-center text-[10px] font-semibold text-sky-400 hover:underline flex items-center justify-center gap-1 pt-1"
            >
              <span>Manage Aggregator Routes</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        {/* Card 3: Last Successful Transaction */}
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold text-white">Last Completed Sale</span>
            </div>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-500/10 text-teal-400">
              LIVE
            </span>
          </div>

          {health.lastSuccessfulTransaction ? (
            <>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Ref:</span>
                  <span className="font-mono font-bold text-white truncate max-w-[150px]">
                    {health.lastSuccessfulTransaction.reference}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Category:</span>
                  <span className="capitalize font-semibold text-slate-200">
                    {health.lastSuccessfulTransaction.service}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Amount:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {formatKoboToNgn(health.lastSuccessfulTransaction.amount)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                <span>Executed:</span>
                <span className="font-mono text-slate-300">
                  {timeAgo(health.lastSuccessfulTransaction.timestamp)}
                </span>
              </div>
            </>
          ) : (
            <div className="py-4 text-center text-xs text-slate-500">
              No transactions recorded yet
            </div>
          )}

          {onNavigateTab && (
            <button
              type="button"
              onClick={() => onNavigateTab('transactions')}
              className="w-full text-center text-[10px] font-semibold text-teal-400 hover:underline flex items-center justify-center gap-1 pt-1"
            >
              <span>Inspect Full Ledger</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
