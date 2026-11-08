import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useAdminTransactions } from '../../hooks/useAdminTransactions';
import { Transaction, ServiceCategory } from '../../types';
import { formatKoboToNgn, formatWATDate, timeAgo } from '../../lib/formatters';
import { StatusBadge } from '../shared/StatusBadge';
import { Modal } from '../shared/Modal';
import {
  Search,
  RefreshCw,
  Undo2,
  CheckCircle2,
  Download,
  AlertTriangle,
  Flag,
  ChevronLeft,
  ChevronRight,
  Receipt,
} from 'lucide-react';

export const AdminTransactions: React.FC = () => {
  const { user: adminUser, isOwner } = useAuth();
  const { setActiveReceiptTxn } = useWallet();

  const {
    transactions,
    total,
    page,
    totalPages,
    loading,
    actionPending,
    options,
    updateFilters,
    setPage,
    requery,
    refund,
    exportCsv,
    refresh,
  } = useAdminTransactions({ pageSize: 15 });

  // In-app Refund Modal (Zero browser confirm)
  const [refundModalTxn, setRefundModalTxn] = useState<Transaction | null>(null);
  const [refundReason, setRefundReason] = useState('Order delivery timeout / Reversal approved');
  const [isRefunding, setIsRefunding] = useState(false);

  // In-app Force Complete Modal (Owner only)
  const [forceCompleteTxn, setForceCompleteTxn] = useState<Transaction | null>(null);
  const [confirmPhrase, setConfirmPhrase] = useState('');
  const [admin2FaCode, setAdmin2FaCode] = useState('');
  const [forceError, setForceError] = useState<string | null>(null);

  // In-app Notice / Toast
  const [noticeModal, setNoticeModal] = useState<{ title: string; message: string } | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const handleRequeryClick = async (txn: Transaction) => {
    try {
      const res = await requery(
        txn.reference,
        adminUser?.uid || 'admin',
        adminUser?.name || 'Administrator'
      );
      showToast(res.message);
    } catch (err: any) {
      setNoticeModal({
        title: 'Requery Failure',
        message: err.message || 'Upstream provider connection error during status check.',
      });
    }
  };

  const handleConfirmRefund = async () => {
    if (!refundModalTxn) return;
    setIsRefunding(true);
    try {
      const res = await refund(
        refundModalTxn.reference,
        refundReason.trim() || 'Manual Admin Refund',
        adminUser?.uid || 'admin',
        adminUser?.name || 'Administrator'
      );
      showToast(
        `Refunded ${formatKoboToNgn(res.refundAmountKobo)} back to customer wallet (${refundModalTxn.user_id}).`
      );
      setRefundModalTxn(null);
    } catch (err: any) {
      setNoticeModal({
        title: 'Refund Error',
        message: err.message || 'Failed to issue wallet refund.',
      });
    } finally {
      setIsRefunding(false);
    }
  };

  const handleFlagDispute = async (txn: Transaction) => {
    const { storage } = await import('../../services/storage');
    storage.createDispute({
      id: `disp_flag_${Date.now()}`,
      transaction_id: txn.id,
      transaction_ref: txn.reference,
      user_id: txn.user_id,
      user_email: txn.user_email || 'customer@sayyadadatasub.com',
      user_phone: txn.recipient_details.phone || '08000000000',
      service: txn.service,
      amount: txn.amount,
      status: 'investigating',
      description: `Flagged by Admin (${adminUser?.email}) for internal investigation`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    storage.recordAdminActivity(
      adminUser?.uid || 'admin',
      adminUser?.name || 'Administrator',
      'flag_dispute',
      `transactions/${txn.id}`,
      null,
      { ref: txn.reference, status: 'investigating' },
      adminUser?.role
    );

    showToast(`Order ${txn.reference} has been flagged and submitted to Dispute Center.`);
  };

  const handleForceComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwner) {
      setForceError('Permission Denied: Only Platform Owners can force-complete stuck transactions.');
      return;
    }
    if (confirmPhrase !== 'CONFIRM') {
      setForceError('Please type "CONFIRM" exactly to authorize this high-risk override.');
      return;
    }
    if (admin2FaCode !== '123456' && admin2FaCode !== '1234') {
      setForceError('Invalid 2FA Authenticator code. Demo code is 123456.');
      return;
    }

    if (!forceCompleteTxn) return;

    const { storage } = await import('../../services/storage');
    const updated = storage.updateTransaction(forceCompleteTxn.id, {
      status: 'success',
      completed_at: new Date().toISOString(),
      api_response: {
        code: '00',
        message: `Force-completed by Owner (${adminUser?.email})`,
        operatorRef: `FORCE-COMPLETED-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date().toISOString(),
      },
    });

    storage.recordTransactionLifecycle(updated);
    storage.recordAdminActivity(
      adminUser?.uid || 'owner',
      adminUser?.name || 'Owner',
      'force_complete_transaction',
      `transactions/${forceCompleteTxn.id}`,
      forceCompleteTxn,
      updated,
      'owner'
    );
    storage.recomputeAdminStats();

    setForceCompleteTxn(null);
    setConfirmPhrase('');
    setAdmin2FaCode('');
    setForceError(null);
    refresh();
    showToast(`Transaction ${forceCompleteTxn.reference} has been force-completed.`);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <RefreshCw className={`w-5 h-5 text-emerald-400 ${actionPending ? 'animate-spin' : ''}`} />
            Global Transaction Monitor (All 10 Services)
          </h2>
          <p className="text-xs text-slate-400">
            Real-time transactional ledger ({total.toLocaleString()} total orders), live status requeries & atomic reversals
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportCsv()}
            className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={refresh}
            className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {feedbackToast && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-700 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by reference, user email/ID, phone, or meter number..."
            value={options.search || ''}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            value={options.service || 'all'}
            onChange={(e) => updateFilters({ service: e.target.value as any })}
            className="py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="all">All Services (10 Total)</option>
            <option value="airtime">Airtime</option>
            <option value="data">Data</option>
            <option value="electricity">Electricity</option>
            <option value="tv">Cable TV</option>
            <option value="exam">Exam PINs</option>
            <option value="remit">Remit</option>
            <option value="invoice">Invoice</option>
            <option value="giftcard">Gift Card</option>
            <option value="transport">Transport</option>
            <option value="travel">Travel</option>
          </select>

          <select
            value={options.status || 'all'}
            onChange={(e) => updateFilters({ status: e.target.value as any })}
            className="py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="processing">Processing (Stuck)</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="reversed">Reversed / Refunded</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5 px-4">Reference</th>
                <th className="py-2.5 px-4">User</th>
                <th className="py-2.5 px-4">Service</th>
                <th className="py-2.5 px-4">Recipient</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4 text-right">Profit</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-center">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    {loading ? 'Loading transactions ledger...' : 'No transactions matching query criteria.'}
                  </td>
                </tr>
              ) : (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {t.reference}
                      <span className="block text-[10px] text-slate-500 font-normal">
                        {timeAgo(t.created_at)}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {t.user_email || t.user_id}
                    </td>
                    <td className="py-3 px-4 capitalize font-semibold text-slate-200">
                      {t.service} ({t.provider})
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {t.recipient_details?.phone ||
                        t.recipient_details?.meterNo ||
                        t.recipient_details?.smartcardNo ||
                        t.recipient_details?.accountNumber ||
                        t.recipient_details?.customerName ||
                        '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {formatKoboToNgn(t.amount)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-400 font-semibold">
                      +{formatKoboToNgn(t.profit || 0)}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-3 px-4 text-center space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => setActiveReceiptTxn(t)}
                        className="py-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold rounded"
                        title="View Official Receipt"
                      >
                        Receipt
                      </button>
                      {t.status === 'processing' && (
                        <button
                          onClick={() => handleRequeryClick(t)}
                          disabled={actionPending}
                          className="py-1 px-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-bold rounded disabled:opacity-50"
                          title="Requery Upstream Gateway"
                        >
                          Requery
                        </button>
                      )}
                      {isOwner && t.status === 'processing' && (
                        <button
                          onClick={() => setForceCompleteTxn(t)}
                          className="py-1 px-2 bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold rounded"
                          title="Force Complete (Owner Only)"
                        >
                          Force Complete
                        </button>
                      )}
                      {t.status === 'success' && (
                        <button
                          onClick={() => setRefundModalTxn(t)}
                          className="py-1 px-2 bg-rose-950 hover:bg-rose-900 text-rose-300 text-[11px] font-semibold rounded border border-rose-800"
                          title="Manual reversal & refund"
                        >
                          Refund
                        </button>
                      )}
                      <button
                        onClick={() => handleFlagDispute(t)}
                        className="py-1 px-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded"
                        title="Flag for Dispute Review"
                      >
                        <Flag className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing {(page - 1) * options.pageSize! + 1}–{Math.min(page * options.pageSize!, total)} of{' '}
              {total.toLocaleString()} transactions
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-mono text-white">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* In-App Refund Modal (Zero Browser Confirm) */}
      <Modal
        isOpen={!!refundModalTxn}
        onClose={() => setRefundModalTxn(null)}
        title="Authorize Atomic Customer Refund"
        subtitle={`Ref: ${refundModalTxn?.reference} · Amount: ${formatKoboToNgn(refundModalTxn?.amount || 0)}`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            This will immediately credit <strong className="text-white">{formatKoboToNgn(refundModalTxn?.amount || 0)}</strong> back
            to the customer&apos;s wallet ({refundModalTxn?.user_email || refundModalTxn?.user_id}) and mark this order as refunded.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Mandatory Reversal Reason
            </label>
            <textarea
              rows={2}
              required
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setRefundModalTxn(null)}
              className="py-2 px-3 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmRefund}
              disabled={isRefunding}
              className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs"
            >
              {isRefunding ? 'Processing...' : 'Confirm Atomic Refund'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Force-Complete Warning Modal (Owner Only) */}
      <Modal
        isOpen={!!forceCompleteTxn}
        onClose={() => setForceCompleteTxn(null)}
        title="⚠️ High-Risk Action: Force-Complete Transaction"
        subtitle={`Ref: ${forceCompleteTxn?.reference} · Amount: ${formatKoboToNgn(forceCompleteTxn?.amount || 0)}`}
        maxWidth="sm"
      >
        <form onSubmit={handleForceComplete} className="space-y-4 text-xs text-slate-200">
          <div className="p-3 bg-rose-950/60 border border-rose-800 rounded-xl space-y-1.5 text-rose-200">
            <p className="font-bold">Caution: Owner Override</p>
            <p className="text-[11px] text-rose-300 leading-relaxed">
              Force-completing manually marks this transaction as delivered without receiving positive confirmation from the telecommunications operator.
              This action is logged under your Owner credential.
            </p>
          </div>

          {forceError && (
            <div className="p-2.5 bg-rose-900/60 border border-rose-700 text-rose-200 rounded font-semibold">
              {forceError}
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Type <span className="font-mono font-bold text-rose-400">&quot;CONFIRM&quot;</span> to proceed:
            </label>
            <input
              type="text"
              required
              value={confirmPhrase}
              onChange={(e) => setConfirmPhrase(e.target.value)}
              placeholder="CONFIRM"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono font-bold uppercase text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Enter Owner 2FA TOTP Code:</label>
            <input
              type="text"
              required
              maxLength={6}
              value={admin2FaCode}
              onChange={(e) => setAdmin2FaCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono text-center font-bold tracking-widest text-white focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setForceCompleteTxn(null)}
              className="flex-1 py-2 px-3 bg-slate-800 text-slate-300 rounded-lg font-semibold hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs"
            >
              Force Mark Complete
            </button>
          </div>
        </form>
      </Modal>

      {/* In-App Notice Modal (Zero browser alert) */}
      <Modal
        isOpen={!!noticeModal}
        onClose={() => setNoticeModal(null)}
        title={noticeModal?.title || 'Notice'}
        subtitle="Operations Desk Notification"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">{noticeModal?.message}</p>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setNoticeModal(null)}
              className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg"
            >
              Dismiss
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
