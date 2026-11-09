import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { formatWATDate, timeAgo } from '../../lib/formatters';
import {
  Activity,
  Shield,
  Search,
  Download,
  Filter,
  Eye,
  Calendar,
  Lock,
  Globe,
  Terminal,
} from 'lucide-react';
import { Modal } from '../shared/Modal';
import { AuditLog } from '../../types';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>(storage.getAuditLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  React.useEffect(() => {
    const unsubscribe = storage.subscribeAdmin(() => {
      setLogs(storage.getAuditLogs());
    });
    return () => unsubscribe();
  }, []);

  const filtered = logs.filter((l) => {
    const matchesSearch =
      l.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.actor_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.ip.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (actionFilter === 'all') return true;
    return l.action.toLowerCase().includes(actionFilter.toLowerCase());
  });

  const handleExportCsv = () => {
    const headers = ['Timestamp_WAT', 'Actor_Email', 'Actor_Role', 'Action', 'Target', 'Client_IP', 'User_Agent'];
    const rows = filtered.map((l) => [
      `"${formatWATDate(l.created_at)}"`,
      `"${l.actor_email}"`,
      `"${l.actor_role || 'admin'}"`,
      `"${l.action}"`,
      `"${l.target.replace(/"/g, '""')}"`,
      `"${l.ip}"`,
      `"${(l.user_agent || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `meenabty_audit_log_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Immutable Security & Compliance Audit Trail
          </h2>
          <p className="text-xs text-slate-400">
            Cryptographically timestamped ledger of all privileged actions, financial interventions, and access events
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 transition-colors flex items-center gap-2"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Export Compliance CSV</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by action, target, actor email, or IP address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All Actions' },
            { id: 'wallet', label: 'Wallet Ledgers' },
            { id: 'force', label: 'Force Completes' },
            { id: 'role', label: 'Role Changes' },
            { id: 'provider', label: 'Providers' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setActionFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                actionFilter === f.id
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No audit records matching query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Timestamp (WAT)</th>
                  <th className="py-3 px-4">Security Action</th>
                  <th className="py-3 px-4">Authorized Actor</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4">Network IP & Origin</th>
                  <th className="py-3 px-4 text-center">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {timeAgo(log.created_at)}
                      <span className="block text-[10px] text-slate-500">{formatWATDate(log.created_at)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{log.actor_email}</p>
                      <span className="text-[10px] font-mono text-amber-400 uppercase">
                        {log.actor_role || 'staff'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate font-mono text-[11px]">
                      {log.target}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {log.ip}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                        title="View Full JSON Audit Payload"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payload Modal */}
      <Modal
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Details"
        subtitle={`Action: ${selectedLog?.action} · ID: ${selectedLog?.id}`}
        maxWidth="md"
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-400">Actor:</span>
              <p className="font-semibold text-white">{selectedLog?.actor_email}</p>
            </div>
            <div>
              <span className="text-slate-400">Time (WAT):</span>
              <p className="font-mono text-white">{selectedLog && formatWATDate(selectedLog.created_at)}</p>
            </div>
            <div>
              <span className="text-slate-400">Client IP:</span>
              <p className="font-mono text-emerald-400">{selectedLog?.ip}</p>
            </div>
            <div>
              <span className="text-slate-400">Target:</span>
              <p className="font-mono text-white truncate">{selectedLog?.target}</p>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-semibold mb-1">Audit Payload / Before & After State</label>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-[11px] text-emerald-300 overflow-x-auto max-h-60">
              {JSON.stringify(
                {
                  before: selectedLog?.before ?? null,
                  after: selectedLog?.after ?? null,
                  userAgent: selectedLog?.user_agent ?? null,
                },
                null,
                2
              )}
            </pre>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setSelectedLog(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
