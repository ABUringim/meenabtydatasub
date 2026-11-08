import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, CheckCircle2, AlertCircle, Lock, UserCheck } from 'lucide-react';

export const KycPage: React.FC = () => {
  const { user, upgradeKyc } = useAuth();

  const [bvn, setBvn] = useState(user?.bvn || '');
  const [nin, setNin] = useState(user?.nin || '');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isTier2 = user?.tier === 2 && user?.kyc_status === 'verified';

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bvn.length !== 11) {
      setError('Bank Verification Number (BVN) must be exactly 11 digits');
      return;
    }
    if (nin.length !== 11) {
      setError('National Identity Number (NIN) must be exactly 11 digits');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      await upgradeKyc(bvn, nin);
      setSuccessMsg('KYC Tier 2 Verification successful! Your daily limit has been upgraded to ₦5,000,000.00 and Remit transfer is now active.');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">KYC Verification & Account Limits</h2>
        <p className="text-xs text-slate-500">
          In compliance with Central Bank of Nigeria (CBN) AML/CFT regulatory requirements
        </p>
      </div>

      {/* Tier Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Tier 1 Card */}
        <div className={`p-5 rounded-xl border transition-all ${
          user?.tier === 1 ? 'bg-white border-slate-300 shadow-xs ring-2 ring-emerald-600/30' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Tier 1 Account</span>
            {user?.tier === 1 && (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Current Level
              </span>
            )}
          </div>
          <p className="text-2xl font-mono font-bold text-slate-900 mt-2">₦50,000 / day</p>
          <ul className="mt-4 space-y-2 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Email & Phone number verification</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Airtime & Data vending</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Electricity & Cable TV bills</span>
            </li>
            <li className="flex items-center gap-2 text-slate-400">
              <span className="w-4 text-center">✕</span>
              <span>Remit Inter-Bank Transfer (Disabled)</span>
            </li>
          </ul>
        </div>

        {/* Tier 2 Card */}
        <div className={`p-5 rounded-xl border transition-all ${
          isTier2 ? 'bg-white border-emerald-300 shadow-xs ring-2 ring-emerald-600' : 'bg-emerald-50/50 border-emerald-200'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">Tier 2 Verified (CBN Standard)</span>
            {isTier2 && (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                Active & Verified
              </span>
            )}
          </div>
          <p className="text-2xl font-mono font-bold text-emerald-900 mt-2">₦5,000,000 / day</p>
          <ul className="mt-4 space-y-2 text-xs text-emerald-900">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>BVN & NIN Verified Identity</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Full Access to Remit Money Transfer</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Commercial & Institutional Invoice Settlement</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Priority Customer Support Channel</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Verification Form */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100">
          <UserCheck className="w-5 h-5 text-emerald-700" />
          <h3 className="text-sm font-bold text-slate-900">
            {isTier2 ? 'Your Verified Identity Information' : 'Upgrade to Tier 2 (Instant Verification)'}
          </h3>
        </div>

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUpgrade} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              11-Digit Bank Verification Number (BVN)
            </label>
            <input
              type="password"
              maxLength={11}
              disabled={isTier2}
              value={bvn}
              onChange={(e) => setBvn(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter your 11-digit BVN"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-mono tracking-widest focus:ring-2 focus:ring-emerald-600 focus:outline-hidden disabled:bg-slate-100"
            />
            <p className="text-[11px] text-slate-400 mt-1">Dial *565*0# on your registered SIM to check BVN.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              11-Digit National Identification Number (NIN)
            </label>
            <input
              type="text"
              maxLength={11}
              disabled={isTier2}
              value={nin}
              onChange={(e) => setNin(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter your 11-digit NIN"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-mono tracking-widest focus:ring-2 focus:ring-emerald-600 focus:outline-hidden disabled:bg-slate-100"
            />
          </div>

          {!isTier2 && (
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>{isLoading ? 'Verifying with NIBSS & NIMC...' : 'Submit & Upgrade Account (Free)'}</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 pt-3 text-[11px] text-slate-400">
            <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              Your identity credentials are encrypted and validated via NIBSS. Sayyada does not store raw BVN details.
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};
