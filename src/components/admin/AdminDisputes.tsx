import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { DisputeTicket } from '../../types';
import { formatKoboToNgn, formatWATDate, timeAgo } from '../../lib/formatters';
import { StatusBadge } from '../shared/StatusBadge';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Search,
  Filter,
  ArrowUpRight,
  Code,
} from 'lucide-react';
import { Modal } from '../shared/Modal';

export const AdminDisputes: React.FC = () => {
  const { user: adminUser, isOwner } = useAuth();
  const [disputes, setDisputes] = useState<DisputeTicket[]>(storage.getDisputes());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved' | 'escalated'>('all');
  const [selectedDispute, setSelectedDispute] = useState<DisputeTicket | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'escalate'>('approve');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [viewRawPayload, setViewRawPayload] = useState<any | null>(null);

  const refreshList = () => {
    setDisputes(storage.getDisputes());
  };

  const filtered = disputes.filter((d) => {
    const matchesSearch =
      d.transaction_ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.id.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    if (statusFilter === 'open') return d.status === 'open' || d.status === 'investigating';
    if (statusFilter === 'resolved') return d.status === 'resolved_refunded' || d.status === 'rejected';
    if (statusFilter === 'escalated') return d.status === 'escalated_to_owner';
    return true;
  });

  const handleResolve = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    if (actionType === 'approve') {
      storage.executeAtomicWalletCredit(
        selectedDispute.user_id,
        selectedDispute.amount,
        'refund',
        `DISPUTE_REFUND_${selectedDispute.transaction_ref}`,
        `Dispute Approved Refund for ${selectedDispute.transaction_ref} (${adminNotes || 'Operations Desk'})`
      );

      storage.updateDispute(selectedDispute.id, {
        status: 'resolved_refunded',
        admin_notes: adminNotes || 'Approved & refunded to customer wallet',
      });

      storage.recordAuditLog(
        adminUser?.uid || 'admin',
        adminUser?.email || 'admin@meenabtydatasub.com',
        'DISPUTE_APPROVE_REFUND',
        `Ticket ${selectedDispute.id} (${selectedDispute.transaction_ref})`,
        { amount: selectedDispute.amount, notes: adminNotes }
      );

      setSuccessMsg(`Ticket ${selectedDispute.id} approved and ₦${(selectedDispute.amount / 100).toLocaleString()} refunded.`);
    } else if (actionType === 'reject') {
      storage.updateDispute(selectedDispute.id, {
        status: 'rejected',
        admin_notes: adminNotes || 'Dispute rejected upon operator review',
      });

      storage.recordAuditLog(
        adminUser?.uid || 'admin',
        adminUser?.email || 'admin@meenabtydatasub.com',
        'DISPUTE_REJECT',
        `Ticket ${selectedDispute.id} (${selectedDispute.transaction_ref})`,
        { reason: adminNotes }
      );

      setSuccessMsg(`Ticket ${selectedDispute.id} rejected.`);
    } else if (actionType === 'escalate') {
      storage.updateDispute(selectedDispute.id, {
        status: 'escalated_to_owner',
        admin_notes: `[ESCALATED TO OWNER]: ${adminNotes}`,
      });

      storage.recordAuditLog(
        adminUser?.uid || 'admin',
        adminUser?.email || 'admin@meenabtydatasub.com',
        'DISPUTE_ESCALATE_OWNER',
        `Ticket ${selectedDispute.id} (${selectedDispute.transaction_ref})`,
        { reason: adminNotes }
      );

      setSuccessMsg(`Ticket ${selectedDispute.id} escalated to Owner review tier.`);
    }

    setSelectedDispute(null);
    setAdminNotes('');
    refreshList();
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-emerald-400" />
            Dispute Resolution & SLA Center
          </h2>
          <p className="text-xs text-slate-400">
            Review disputed vending transactions, inspect operator diagnostics, and issue instant atomic wallet credits
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-700 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* SLA Status Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Pending Review SLA (&lt; 24h)</p>
          <p className="text-2xl font-mono font-bold text-amber-400 mt-1">
            {disputes.filter((d) => d.status === 'open').length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Target turnaround within 4 business hours</p>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Escalated to Owner</p>
          <p className="text-2xl font-mono font-bold text-purple-400 mt-1">
            {disputes.filter((d) => d.status === 'escalated_to_owner').length}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">High-value or upstream carrier disputes</p>
        </div>

        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <p className="text-xs text-slate-400 font-medium">Total Successfully Refunded</p>
          <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">
            {disputes.filter((d) => d.status === 'resolved_refunded').length}
          </p>
          <p className="text-[11px] text-emerald-400 mt-1">Credited atomically with zero double charges</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Ticket ID, Transaction Ref, or customer email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'open', 'resolved', 'escalated'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                statusFilter === s ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-950 text-slate-400 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Disputes Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            No customer disputes matching query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Ticket</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Reference & Service</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                  <th className="py-3 px-4">Reason / Notes</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-center">Intervention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {d.id}
                      <span className="block text-[10px] text-slate-400 font-normal">{timeAgo(d.created_at)}</span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{d.user_email}</p>
                      <p className="font-mono text-[11px] text-slate-400">{d.user_phone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-mono font-bold text-slate-200">{d.transaction_ref}</p>
                      <span className="text-[10px] text-emerald-400 font-mono capitalize">{d.service}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {formatKoboToNgn(d.amount)}
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <p className="text-slate-300 truncate">{d.description}</p>
                      {d.admin_notes && (
                        <p className="text-[10px] text-amber-400 mt-0.5 truncate font-mono">
                          Admin: {d.admin_notes}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {d.status === 'open' || d.status === 'investigating' || d.status === 'escalated_to_owner' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedDispute(d);
                              setActionType('approve');
                            }}
                            className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px]"
                          >
                            Approve Refund
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDispute(d);
                              setActionType('reject');
                            }}
                            className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-rose-400 font-semibold rounded text-[11px]"
                          >
                            Reject
                          </button>
                          {!isOwner && d.status !== 'escalated_to_owner' && (
                            <button
                              onClick={() => {
                                setSelectedDispute(d);
                                setActionType('escalate');
                              }}
                              className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-purple-400 font-semibold rounded text-[11px]"
                            >
                              Escalate
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      <Modal
        isOpen={!!selectedDispute}
        onClose={() => setSelectedDispute(null)}
        title={
          actionType === 'approve'
            ? 'Authorize Atomic Wallet Refund'
            : actionType === 'reject'
            ? 'Reject Customer Dispute'
            : 'Escalate Dispute to Platform Owner'
        }
        subtitle={`Ticket: ${selectedDispute?.id} · Ref: ${selectedDispute?.transaction_ref}`}
        maxWidth="md"
      >
        <form onSubmit={handleResolve} className="space-y-4">
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-1.5">
            <p className="text-slate-400">Customer Reported Grievance:</p>
            <p className="font-semibold text-white">{selectedDispute?.description}</p>
            <div className="flex justify-between pt-2 border-t border-slate-800">
              <span className="text-slate-400">Refund Liability:</span>
              <span className="font-mono font-bold text-emerald-400">
                {formatKoboToNgn(selectedDispute?.amount || 0)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Admin Review Explanation (Visible in Customer Audit Trail)
            </label>
            <textarea
              required
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Verified with MTN aggregation logs: token generation failed upstream. Full wallet credit granted."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedDispute(null)}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 py-2 text-xs font-bold rounded-lg text-white shadow-xs ${
                actionType === 'approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : actionType === 'reject'
                  ? 'bg-rose-700 hover:bg-rose-800'
                  : 'bg-purple-600 hover:bg-purple-700'
              }`}
            >
              {actionType === 'approve'
                ? 'Execute Atomic Refund'
                : actionType === 'reject'
                ? 'Confirm Rejection'
                : 'Escalate to Owner'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
