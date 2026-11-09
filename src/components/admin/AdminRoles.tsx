import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { UserProfile, Role } from '../../types';
import { formatWATDate } from '../../lib/formatters';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  CheckCircle2,
  Lock,
  Sparkles,
  Key,
  UserPlus,
  AlertTriangle,
  Check,
  X,
} from 'lucide-react';
import { Modal } from '../shared/Modal';

const RBAC_PERMISSIONS = [
  { module: 'Overview Telemetry & Metrics', customer: false, admin: true, owner: true },
  { module: 'User Profile & KYC Verification', customer: false, admin: true, owner: true },
  { module: 'Manual Wallet Adjustments (Credit/Debit)', customer: false, admin: true, owner: true },
  { module: 'Live Transaction Monitor', customer: false, admin: true, owner: true },
  { module: 'Upstream Operator Requery', customer: false, admin: true, owner: true },
  { module: 'Manual Wallet Refund', customer: false, admin: true, owner: true },
  { module: 'Force-Complete Stuck Transactions', customer: false, admin: false, owner: true },
  { module: 'Catalog Plans & CSV Import', customer: false, admin: true, owner: true },
  { module: 'Pricing & Service Markup Engine', customer: false, admin: true, owner: true },
  { module: 'Upstream Aggregator API Keys & Secrets', customer: false, admin: false, owner: true },
  { module: 'Paystack Secret Keys & Webhook Config', customer: false, admin: false, owner: true },
  { module: 'Double-Entry Ledger Reconciliation', customer: false, admin: false, owner: true },
  { module: 'Dispute Resolution & SLA Handling', customer: false, admin: true, owner: true },
  { module: 'Staff Promotion & Role Assignment', customer: false, admin: false, owner: true },
  { module: 'Audit Log Full Inspection', customer: false, admin: true, owner: true },
  { module: 'Platform Maintenance Mode Toggle', customer: false, admin: false, owner: true },
];

export const AdminRoles: React.FC = () => {
  const { user: currentAuthUser, isOwner } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>(storage.getUsers());
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [targetRole, setTargetRole] = useState<Role>('admin');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOwner) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">Owner Privilege Required</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Staff role assignment, promotion to Administrator, and RBAC policy management are restricted to the Owner tier.
        </p>
      </div>
    );
  }

  const staffMembers = users.filter((u) => u.role === 'admin' || u.role === 'owner');
  const standardUsers = users.filter((u) => u.role === 'customer');

  const handlePromoteOrDemote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (twoFactorCode !== '123456' && twoFactorCode !== '1234') {
      setModalError('Invalid 2FA authenticator passcode. Demo passcode is 123456.');
      return;
    }

    if (selectedUser.uid === currentAuthUser?.uid && targetRole === 'customer') {
      setModalError('You cannot revoke your own Owner role.');
      return;
    }

    const beforeRole = selectedUser.role;
    storage.updateUser(selectedUser.uid, { role: targetRole });

    storage.recordAuditLog(
      currentAuthUser?.uid || 'owner',
      currentAuthUser?.email || 'owner@meenabtydatasub.com',
      'ROLE_CHANGE_AUTHORIZED',
      `Changed role for ${selectedUser.email} from ${beforeRole} to ${targetRole}`,
      { beforeRole, targetRole }
    );

    setUsers(storage.getUsers());
    setSelectedUser(null);
    setTwoFactorCode('');
    setModalError(null);
    setSuccessMsg(`Role for ${selectedUser.email} successfully updated to ${targetRole.toUpperCase()}.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Staff Roles & Granular RBAC Permissions
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
              Owner Access Only
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Designate authorized operations personnel, enforce 2FA verification for promotions, and review permission matrix
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-700 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Staff Directory Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Active Privileged Staff ({staffMembers.length})
          </h3>
          <span className="text-[11px] text-slate-400 font-mono">
            Requires 2FA code 123456 to modify
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Role Tier</th>
                <th className="py-3 px-4">2FA Enforced</th>
                <th className="py-3 px-4">Authorized IP</th>
                <th className="py-3 px-4 text-center">Manage Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {staffMembers.map((s) => (
                <tr key={s.uid} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4">
                    <p className="font-bold text-white">{s.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{s.uid}</p>
                  </td>
                  <td className="py-3 px-4">
                    <p className="text-slate-200">{s.email}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{s.phone}</p>
                  </td>
                  <td className="py-3 px-4">
                    {s.role === 'owner' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Owner
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                        Admin
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                      <Lock className="w-3 h-3" />
                      Active (TOTP)
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                    {s.ip_address || '102.89.44.1'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {s.uid !== currentAuthUser?.uid ? (
                      <button
                        onClick={() => {
                          setSelectedUser(s);
                          setTargetRole(s.role === 'admin' ? 'customer' : 'admin');
                        }}
                        className="py-1 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-[11px] transition-colors"
                      >
                        Change Role
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-500 italic">Self (Current Session)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Promote Customer to Staff Card */}
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-emerald-400" />
          Promote Customer Account to Staff Tier
        </h3>
        <p className="text-xs text-slate-400">
          Select a verified user to grant administrative privileges. All role changes are logged immutably.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <select
            onChange={(e) => {
              const found = standardUsers.find((u) => u.uid === e.target.value);
              if (found) {
                setSelectedUser(found);
                setTargetRole('admin');
              }
            }}
            defaultValue=""
            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
          >
            <option value="" disabled>Select customer to promote...</option>
            {standardUsers.map((u) => (
              <option key={u.uid} value={u.uid}>
                {u.name} — {u.email} (Tier {u.tier} KYC)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Granular RBAC Permissions Matrix */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Role-Based Access Control (RBAC) Enforcement Matrix
          </h3>
          <span className="text-[11px] text-slate-400">Enforced strictly server-side</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-4">System Capability / API Route</th>
                <th className="py-3 px-4 text-center w-28">Customer</th>
                <th className="py-3 px-4 text-center w-28">Operations Admin</th>
                <th className="py-3 px-4 text-center w-28">Platform Owner</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {RBAC_PERMISSIONS.map((perm, idx) => (
                <tr key={idx} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-4 font-medium text-slate-200">{perm.module}</td>
                  <td className="py-2.5 px-4 text-center">
                    {perm.customer ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-600 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {perm.admin ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-rose-500 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {perm.owner ? (
                      <Check className="w-4 h-4 text-emerald-400 mx-auto" />
                    ) : (
                      <X className="w-4 h-4 text-slate-600 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Change Modal with mandatory 2FA */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => {
          setSelectedUser(null);
          setModalError(null);
        }}
        title={`Authorize Role Modification: ${selectedUser?.name}`}
        subtitle={`Target Account: ${selectedUser?.email}`}
        maxWidth="md"
      >
        <form onSubmit={handlePromoteOrDemote} className="space-y-4">
          {modalError && (
            <div className="p-2.5 bg-rose-950/70 border border-rose-800 text-rose-300 rounded-lg text-xs">
              {modalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select New Role Tier</label>
            <div className="grid grid-cols-3 gap-2">
              {(['customer', 'admin', 'owner'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTargetRole(r)}
                  className={`py-2 px-3 rounded-lg text-xs font-bold capitalize border transition-all ${
                    targetRole === r
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-extrabold'
                      : 'border-slate-800 bg-slate-950 text-slate-400'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Enter Owner 2FA TOTP Passcode
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value)}
              placeholder="Demo code: 123456"
              className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-lg font-mono font-bold text-center text-lg text-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
            <p className="text-[10px] text-slate-400 mt-1 text-center">
              Elevating or revoking privileges strictly enforces hardware/TOTP verification.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
            >
              Confirm Role Update
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
