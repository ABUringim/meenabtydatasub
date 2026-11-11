import React from 'react';
import { X, ShieldAlert, Mail } from 'lucide-react';

/**
 * KycRequiredModal Component
 * Shows honest notice when user tries to access a service requiring higher KYC tier (e.g. Remittance, Invoicing).
 * Does NOT pretend to perform automated BVN/NIN verification.
 * 
 * @param {Object} props
 * @param {boolean} [props.open]
 * @param {() => void} [props.onClose]
 * @param {string} [props.serviceName]
 * @param {number} [props.requiredTier]
 */
export default function KycRequiredModal({
  open = false,
  onClose = () => {},
  serviceName = 'this service',
  requiredTier = 2,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 relative animate-in zoom-in-95 duration-150 space-y-5">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon + Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Verification Required</h2>
            <p className="text-xs text-slate-500">Tier {requiredTier} Compliance Check</p>
          </div>
        </div>

        {/* Body Message */}
        <div className="space-y-3 text-sm text-slate-600 bg-amber-50/60 p-4 rounded-xl border border-amber-200/60 leading-relaxed">
          <p className="font-semibold text-slate-900 text-xs">
            Access to {serviceName} requires Tier {requiredTier} identity verification.
          </p>
          <p className="text-xs text-slate-600">
            Automated identity verification is currently undergoing CBN regulatory compliance setup and is coming soon.
          </p>
          <p className="text-xs text-slate-600">
            For priority manual verification or inquiries, please contact our support desk:
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 bg-white p-2.5 rounded-lg border border-emerald-200">
            <Mail className="w-4 h-4 text-emerald-700" />
            <a
              href="mailto:support@sayyadadatasub.shop?subject=Tier%202%20Verification%20Request"
              className="hover:underline"
            >
              support@sayyadadatasub.shop
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <a
            href="mailto:support@sayyadadatasub.shop?subject=Tier%202%20Verification%20Request"
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact Support</span>
          </a>
        </div>
      </div>
    </div>
  );
}

export { KycRequiredModal };
