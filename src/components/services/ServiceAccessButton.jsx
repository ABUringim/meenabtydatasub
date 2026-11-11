import React, { useState } from 'react';
import { useAccess } from '../../hooks/useAccess';
import FundWalletModal from '../wallet/FundWalletModal';
import KycRequiredModal from '../kyc/KycRequiredModal';
import { Zap, PlusCircle, ShieldAlert, Ban, Lock, LogIn } from 'lucide-react';

/**
 * ServiceAccessButton Component
 * Consumes useAccess(product) to render the exact button state and text:
 * 1. "Sign in to buy" -> redirects/prompts login
 * 2. "Account Suspended" -> disabled, with tooltip
 * 3. "Unavailable" -> disabled
 * 4. "Verify to Unlock" -> opens KycRequiredModal
 * 5. "Top Up to Buy" -> opens FundWalletModal with shortfall prefilled
 * 6. "Buy Now" -> calls onBuy(product)
 *
 * @param {Object} props
 * @param {any} [props.product]
 * @param {(product?: any) => void} [props.onBuy]
 * @param {() => void} [props.onRequireAuth]
 * @param {string} [props.className]
 */
export default function ServiceAccessButton({
  product = {},
  onBuy = (_product) => {},
  onRequireAuth = () => {},
  className = '',
}) {
  const access = useAccess(product);
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [kycModalOpen, setKycModalOpen] = useState(false);

  // 1. Unauthenticated State
  if (access.gate === 'unauthenticated') {
    return (
      <button
        type="button"
        onClick={() => {
          if (onRequireAuth) onRequireAuth();
        }}
        className={
          className ||
          'py-2 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer'
        }
        title="Sign in to your account to purchase"
      >
        <LogIn className="w-3.5 h-3.5 text-slate-400" />
        <span>Sign in to buy</span>
      </button>
    );
  }

  // 2. Suspended State
  if (access.gate === 'suspended') {
    return (
      <button
        type="button"
        disabled
        className={
          className ||
          'py-2 px-3.5 bg-rose-50 text-rose-500 border border-rose-200 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-not-allowed opacity-90'
        }
        title={access.reason || 'Account suspended. Contact support at support@sayyadadatasub.shop'}
      >
        <Ban className="w-3.5 h-3.5 text-rose-500" />
        <span>Account Suspended</span>
      </button>
    );
  }

  // 3. Unavailable State
  if (access.gate === 'unavailable') {
    return (
      <button
        type="button"
        disabled
        className={
          className ||
          'py-2 px-3.5 bg-slate-100 text-slate-400 border border-slate-200 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 cursor-not-allowed opacity-80'
        }
        title="This service or plan is currently unavailable."
      >
        <Lock className="w-3.5 h-3.5 text-slate-400" />
        <span>Unavailable</span>
      </button>
    );
  }

  // 4. KYC Required State
  if (access.gate === 'kyc_required') {
    return (
      <>
        <button
          type="button"
          onClick={() => setKycModalOpen(true)}
          className={
            className ||
            'py-2 px-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer'
          }
          title={`Tier ${access.requiredTier} verification is required to unlock this service.`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-indigo-600" />
          <span>Verify to Unlock</span>
        </button>

        <KycRequiredModal
          open={kycModalOpen}
          onClose={() => setKycModalOpen(false)}
          serviceName={product?.name || product?.service || 'this service'}
          requiredTier={access.requiredTier}
        />
      </>
    );
  }

  // 5. Insufficient Balance State
  if (access.gate === 'insufficient_balance') {
    return (
      <>
        <button
          type="button"
          onClick={() => setFundModalOpen(true)}
          className={
            className ||
            'py-2 px-3.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer'
          }
          title={`Wallet balance is insufficient. Click to fund ₦${access.shortfall.toLocaleString()}`}
        >
          <PlusCircle className="w-3.5 h-3.5 text-amber-700" />
          <span>Top Up to Buy</span>
        </button>

        <FundWalletModal
          open={fundModalOpen}
          onClose={() => setFundModalOpen(false)}
          prefilledAmount={access.shortfall}
        />
      </>
    );
  }

  // 6. Ready State
  return (
    <button
      type="button"
      onClick={() => onBuy && onBuy(product)}
      className={
        className ||
        'py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer'
      }
    >
      <Zap className="w-3.5 h-3.5 text-emerald-300" />
      <span>Buy Now</span>
    </button>
  );
}

export { ServiceAccessButton };
