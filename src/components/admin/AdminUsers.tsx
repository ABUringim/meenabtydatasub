import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCustomers } from '../../hooks/useCustomers';
import { UserProfile, KycTier } from '../../types';
import { formatKoboToNgn, formatWATDate } from '../../lib/formatters';
import { Modal } from '../shared/Modal';
import {
  Search,
  Users,
  ShieldAlert,
  CreditCard,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const { user: adminUser, isOwner } = useAuth();
  const {
    users,
    total,
    page,
    totalPages,
    loading,
    options,
    updateFilters,
    setPage,
    toggleSuspend,
    adjustWallet,
    refresh,
  } = useCustomers({ pageSize: 15 });

  // In-app Alert / Notification Modal (Zero browser alert)
  const [noticeModal, setNoticeModal] = useState<{ title: string; message: string } | null>(null);

  // In-app Suspend Modal (Zero browser confirm)
  const [suspendModalUser, setSuspendModalUser] = useState<UserProfile | null>(null);
  const [suspendReason, setSuspendReason] = useState('');
  const [isSuspending, setIsSuspending] = useState(false);

  // In-app Reset 2FA Modal (Zero browser confirm)
  const [reset2faModalUser, setReset2faModalUser] = useState<UserProfile | null>(null);

  // Wallet adjust modal
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [adjustType, setAdjustType] = useState<'credit' | 'debit'>('credit');
  const [amountNgn, setAmountNgn] = useState<number>(1000);
  const [reason, setReason] = useState<string>('');
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [isAdjusting, setIsAdjusting] = useState(false);

  // User detail drawer/modal
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  const handleOpenSuspend = (u: UserProfile) => {
    if (u.role === 'owner') {
      setNoticeModal({
        title: 'Action Restricted',
        message: 'Platform Owner accounts possess root authorization and cannot be suspended.',
      });
      return;
    }
    setSuspendModalUser(u);
    setSuspendReason(
      u.suspended
        ? 'Account reviewed and reactivated following compliance clearance.'
        : 'Temporary freeze pending KYC identity and dispute investigation.'
    );
  };

  const handleConfirmSuspend = async () => {
    if (!suspendModalUser) return;
    setIsSuspending(true);
    try {
      const updated = await toggleSuspend(
        suspendModalUser.uid,
        suspendReason || 'Administrative override',
        adminUser?.uid || 'admin',
        adminUser?.name || 'Administrator'
      );
      showToast(
        `User ${updated.name} account is now ${updated.suspended ? 'SUSPENDED' : 'ACTIVATED'}.`
      );
      setSuspendModalUser(null);
      if (viewingUser?.uid === updated.uid) {
        setViewingUser(updated);
      }
    } finally {
      setIsSuspending(false);
    }
  };

  const handleOpenReset2FA = (u: UserProfile) => {
    if (!isOwner) {
      setNoticeModal({
        title: 'Owner Privilege Required',
        message: 'Only the Platform Owner can invalidate and reset administrative 2FA TOTP credentials.',
      });
      return;
    }
    setReset2faModalUser(u);
  };

  const handleConfirmReset2FA = async () => {
    if (!reset2faModalUser) return;
    try {
      // Invalidate 2FA in storage and refresh
      const { storage } = await import('../../services/storage');
      const updated = storage.updateUser(reset2faModalUser.uid, { twoFactorEnabled: false });
      storage.recordAdminActivity(
        adminUser?.uid || 'owner',
        adminUser?.name || 'Owner',
        'reset_2fa',
        `users/${reset2faModalUser.uid}`,
        { twoFactorEnabled: true },
        { twoFactorEnabled: false },
        'owner'
      );
      showToast(`2FA keys reset for ${reset2faModalUser.name}. They can now log in and re-enroll.`);
      setReset2faModalUser(null);
      refresh();
      if (viewingUser?.uid === updated.uid) {
        setViewingUser(updated);
      }
    } catch (err: any) {
      setNoticeModal({ title: 'Error', message: err.message || 'Failed to reset 2FA.' });
    }
  };

  const handleApproveKyc = async (u: UserProfile) => {
    const { storage } = await import('../../services/storage');
    const updated = storage.updateUser(u.uid, { tier: 2, kyc_status: 'verified' });
    storage.recordAdminActivity(
      adminUser?.uid || 'admin',
      adminUser?.name || 'Administrator',
      'approve_kyc_tier2',
      `users/${u.uid}`,
      { tier: u.tier },
      { tier: 2, kyc_status: 'verified' },
      adminUser?.role
    );
    showToast(`Approved Tier 2 KYC for ${u.name}.`);
    refresh();
    setViewingUser(updated);
  };

  const handleAdjustWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    if (amountNgn <= 0) {
      setAdjustError('Amount must be greater than ₦0');
      return;
    }
    if (!reason.trim()) {
      setAdjustError('A mandatory reason is required for audit trail compliance.');
      return;
    }

    setIsAdjusting(true);
    setAdjustError(null);
    try {
      const amountKobo = Math.round(amountNgn * 100);
      const updated = await adjustWallet(
        targetUser.uid,
        amountKobo,
        adjustType,
        reason.trim(),
        adminUser?.uid || 'admin',
        adminUser?.name || 'Administrator'
      );

      showToast(
        `Successfully ${adjustType === 'credit' ? 'credited' : 'debited'} ${formatKoboToNgn(
          amountKobo
        )} to ${updated.name}.`
      );
      setTargetUser(null);
      setReason('');
      setAmountNgn(1000);
      if (viewingUser?.uid === updated.uid) {
        setViewingUser(updated);
      }
    } catch (err: any) {
      setAdjustError(err.message || 'Failed to apply wallet adjustment.');
    } finally {
      setIsAdjusting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            User Management & Accounts
          </h2>
          <p className="text-xs text-slate-400">
            Real-time customer directory ({total} total), KYC compliance verifications, and atomic wallet controls
          </p>
        </div>
      </div>

      {feedbackToast && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-700 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackToast}</span>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, email, phone number, or UID..."
            value={options.search || ''}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          <select
            value={options.role || 'all'}
            onChange={(e) => updateFilters({ role: e.target.value as any })}
            className="py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="all">All Roles</option>
            <option value="customer">Customers Only</option>
            <option value="admin">Admins Only</option>
            <option value="owner">Owners Only</option>
          </select>

          <select
            value={options.tier ?? 'all'}
            onChange={(e) => {
              const val = e.target.value === 'all' ? undefined : (parseInt(e.target.value, 10) as KycTier);
              updateFilters({ tier: val });
            }}
            className="py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="all">All KYC Tiers</option>
            <option value="1">Tier 1 (Unverified)</option>
            <option value="2">Tier 2 (Verified)</option>
            <option value="3">Tier 3 (Merchant)</option>
          </select>

          <select
            value={options.status || 'all'}
            onChange={(e) => updateFilters({ status: e.target.value as any })}
            className="py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>

          <select
            value={options.sortBy || 'created_at'}
            onChange={(e) => updateFilters({ sortBy: e.target.value as any })}
            className="py-2 px-3 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="created_at">Sort: Newest First</option>
            <option value="wallet_balance">Sort: Highest Balance</option>
            <option value="name">Sort: Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-2.5 px-4">User Details</th>
                <th className="py-2.5 px-4">Contact</th>
                <th className="py-2.5 px-4">Role & Tier</th>
                <th className="py-2.5 px-4 text-right">Wallet Balance</th>
                <th className="py-2.5 px-4">Account Status</th>
                <th className="py-2.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    {loading ? 'Loading customer accounts...' : 'No users matching selected query criteria.'}
                  </td>
                </tr>
              ) : (
                users.map((u: UserProfile) => (
                  <tr key={u.uid} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">{u.name}</p>
                      <p className="text-[11px] text-slate-500 font-mono">{u.uid}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      <p>{u.email}</p>
                      <p className="font-mono text-[11px] text-slate-500">{u.phone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          u.role === 'owner'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : u.role === 'admin'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {u.role}
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-1">
                        Tier {u.tier} · {u.kyc_status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-white">
                      {formatKoboToNgn(u.wallet_balance)}
                    </td>
                    <td className="py-3 px-4">
                      {u.suspended ? (
                        <span className="px-2 py-0.5 text-[11px] font-semibold text-rose-300 bg-rose-950/60 rounded border border-rose-800">
                          Suspended
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[11px] font-semibold text-emerald-300 bg-emerald-950/60 rounded border border-emerald-800">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center space-x-1.5 whitespace-nowrap">
                      <button
                        onClick={() => setViewingUser(u)}
                        className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded text-[11px] transition-colors"
                      >
                        Profile
                      </button>
                      <button
                        onClick={() => setTargetUser(u)}
                        className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-[11px] transition-colors"
                      >
                        Adjust
                      </button>
                      {u.role !== 'owner' && (
                        <button
                          onClick={() => handleOpenSuspend(u)}
                          className={`py-1 px-2 text-[11px] font-semibold rounded transition-colors ${
                            u.suspended
                              ? 'bg-emerald-950 text-emerald-300 hover:bg-emerald-900 border border-emerald-800'
                              : 'bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-800'
                          }`}
                        >
                          {u.suspended ? 'Activate' : 'Suspend'}
                        </button>
                      )}
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
              Showing {(page - 1) * options.pageSize! + 1}–{Math.min(page * options.pageSize!, total)} of {total} accounts
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

      {/* User Detail & KYC Modal */}
      <Modal
        isOpen={!!viewingUser}
        onClose={() => setViewingUser(null)}
        title={`Customer Record: ${viewingUser?.name}`}
        subtitle={`UID: ${viewingUser?.uid}`}
        maxWidth="md"
      >
        <div className="space-y-4 text-slate-200 text-xs">
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <p className="text-slate-400 font-medium">Email Address</p>
              <p className="font-semibold text-white">{viewingUser?.email}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Phone</p>
              <p className="font-mono font-semibold text-white">{viewingUser?.phone}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Current Balance</p>
              <p className="font-mono font-bold text-emerald-400">
                {formatKoboToNgn(viewingUser?.wallet_balance || 0)}
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">KYC Status</p>
              <p className="font-bold text-white capitalize">
                Tier {viewingUser?.tier} ({viewingUser?.kyc_status})
              </p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">BVN Number</p>
              <p className="font-mono text-slate-300">{viewingUser?.bvn || 'Not submitted'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">NIN Number</p>
              <p className="font-mono text-slate-300">{viewingUser?.nin || 'Not submitted'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Last Login IP</p>
              <p className="font-mono text-slate-400">{viewingUser?.ip_address || '102.89.44.1'}</p>
            </div>
            <div>
              <p className="text-slate-400 font-medium">Registered Date</p>
              <p className="text-slate-300">
                {viewingUser?.created_at ? formatWATDate(viewingUser.created_at) : '—'}
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
            {viewingUser?.tier === 1 && (
              <button
                type="button"
                onClick={() => handleApproveKyc(viewingUser)}
                className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
              >
                Approve Tier 2 Verification
              </button>
            )}

            {isOwner && viewingUser?.twoFactorEnabled && (
              <button
                type="button"
                onClick={() => handleOpenReset2FA(viewingUser)}
                className="py-2 px-3 bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold rounded-lg text-xs hover:bg-amber-500/30"
              >
                Reset User 2FA
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setTargetUser(viewingUser);
                setViewingUser(null);
              }}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-lg text-xs"
            >
              Manual Wallet Adjustment
            </button>
          </div>
        </div>
      </Modal>

      {/* In-App Suspend / Unsuspend Modal (Zero Browser Confirm) */}
      <Modal
        isOpen={!!suspendModalUser}
        onClose={() => setSuspendModalUser(null)}
        title={suspendModalUser?.suspended ? 'Reactivate Customer Account' : 'Suspend Customer Account'}
        subtitle={`Target: ${suspendModalUser?.name} (${suspendModalUser?.email})`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            {suspendModalUser?.suspended
              ? 'This will restore wallet debits, airtime/data vending access, and active API access for this customer.'
              : 'Suspending will freeze all wallet debits, block top-ups, and reject vending attempts immediately.'}
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Mandatory Compliance Reason
            </label>
            <textarea
              rows={2}
              required
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSuspendModalUser(null)}
              className="py-2 px-3 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSuspend}
              disabled={isSuspending}
              className={`py-2 px-4 text-white text-xs font-bold rounded-lg shadow-xs ${
                suspendModalUser?.suspended
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isSuspending
                ? 'Processing...'
                : suspendModalUser?.suspended
                ? 'Confirm Reactivation'
                : 'Confirm Suspension'}
            </button>
          </div>
        </div>
      </Modal>

      {/* In-App Reset 2FA Modal (Zero Browser Confirm) */}
      <Modal
        isOpen={!!reset2faModalUser}
        onClose={() => setReset2faModalUser(null)}
        title="Reset Administrative 2FA Authentication"
        subtitle={`Target: ${reset2faModalUser?.name} (${reset2faModalUser?.email})`}
        maxWidth="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-amber-950/40 border border-amber-800 rounded-xl text-xs text-amber-300">
            <p className="font-bold">Security Key Invalidation</p>
            <p className="text-[11px] text-amber-300/80 mt-1">
              This resets the user&apos;s stored TOTP authenticator secret. The user will be required to re-scan their
              authenticator QR code upon next login.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setReset2faModalUser(null)}
              className="py-2 px-3 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmReset2FA}
              className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs"
            >
              Confirm 2FA Reset
            </button>
          </div>
        </div>
      </Modal>

      {/* Adjust Wallet Modal */}
      <Modal
        isOpen={!!targetUser}
        onClose={() => setTargetUser(null)}
        title={`Atomic Wallet Adjustment: ${targetUser?.name}`}
        subtitle={`Current balance: ${formatKoboToNgn(targetUser?.wallet_balance || 0)}`}
        maxWidth="sm"
      >
        <form onSubmit={handleAdjustWallet} className="space-y-4">
          {adjustError && (
            <div className="p-2.5 bg-rose-950/60 border border-rose-800 rounded text-xs text-rose-300">
              {adjustError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Adjustment Action</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustType('credit')}
                className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                  adjustType === 'credit'
                    ? 'border-emerald-500 bg-emerald-950 text-emerald-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                Credit User (+)
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('debit')}
                className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                  adjustType === 'debit'
                    ? 'border-rose-500 bg-rose-950 text-rose-300'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                }`}
              >
                Debit User (-)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Adjustment Amount (₦)</label>
            <input
              type="number"
              min={100}
              max={10000000}
              value={amountNgn}
              onChange={(e) => setAmountNgn(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm font-mono font-bold text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Mandatory Audit Reason</label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Reconciliation for Bank Transfer / Dispute resolution on Ref #9821"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setTargetUser(null)}
              className="flex-1 py-2 px-3 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAdjusting}
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
            >
              {isAdjusting ? 'Executing...' : 'Apply Atomic Adjustment'}
            </button>
          </div>
        </form>
      </Modal>

      {/* In-App Notice Modal (Zero browser alert) */}
      <Modal
        isOpen={!!noticeModal}
        onClose={() => setNoticeModal(null)}
        title={noticeModal?.title || 'Notice'}
        subtitle="Platform Operational Guardrail"
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
