import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import KycRequiredModal from '../kyc/KycRequiredModal';
import { ShieldCheck, ShieldAlert, Ban } from 'lucide-react';

/**
 * KycBadge Component
 * Shows customer KYC verification status in the navbar:
 * - Suspended: Red badge "Suspended"
 * - Tier 2: Green badge "Verified" (ShieldCheck)
 * - Tier 1: Gray/Amber badge "Verify" (ShieldAlert, opens KycRequiredModal)
 */
export default function KycBadge() {
  const { user, suspended, kycTier } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  if (!user) return null;

  const isSuspended = Boolean(suspended ?? user.suspended);
  const currentTier = kycTier ?? user.tier ?? 1;

  if (isSuspended) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 border border-rose-300 shadow-xs"
        title="Account is currently suspended"
      >
        <Ban className="w-3 h-3 text-rose-600" />
        <span>Suspended</span>
      </span>
    );
  }

  if (currentTier >= 2) {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs"
        title="Tier 2 Verified Account"
      >
        <ShieldCheck className="w-3 h-3 text-emerald-600" />
        <span>Verified</span>
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors cursor-pointer shadow-xs"
        title="Tier 1 Account — Click to view verification requirements"
      >
        <ShieldAlert className="w-3 h-3 text-amber-600" />
        <span>Verify</span>
      </button>

      <KycRequiredModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        serviceName="Tier 2 Features"
        requiredTier={2}
      />
    </>
  );
}

export { KycBadge };
