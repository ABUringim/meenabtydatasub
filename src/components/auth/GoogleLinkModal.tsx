import React from 'react';
import { AlertTriangle, Lock, X } from 'lucide-react';

interface GoogleLinkModalProps {
  isOpen: boolean;
  email?: string;
  onClose: () => void;
  onSignInWithPassword: (prefillEmail?: string) => void;
}

/**
 * Account linking modal triggered when auth/account-exists-with-different-credential occurs.
 * Guides user to sign in with password first, then link their Google account from Security Settings.
 */
export const GoogleLinkModal: React.FC<GoogleLinkModalProps> = ({
  isOpen,
  email,
  onClose,
  onSignInWithPassword,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <h3 className="text-base font-bold text-slate-900">
            An account already exists with this email.
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            {email ? (
              <>
                You previously created a Sayyada Datasub account for{' '}
                <span className="font-semibold text-slate-900">{email}</span> with an email and
                password.
              </>
            ) : (
              'You previously created a Sayyada Datasub account with an email and password.'
            )}
          </p>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs text-slate-700">
          <p className="font-semibold text-slate-900">To link your Google sign-in:</p>
          <ol className="list-decimal list-inside space-y-1 text-slate-600">
            <li>Sign in using your password</li>
            <li>
              Go to <span className="font-semibold text-slate-900">Settings → Security</span>
            </li>
            <li>
              Click <span className="font-semibold text-emerald-700">Link Google Account</span>
            </li>
          </ol>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onSignInWithPassword(email);
            }}
            className="px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Sign in with Password</span>
          </button>
        </div>
      </div>
    </div>
  );
};
