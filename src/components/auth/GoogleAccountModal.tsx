import React, { useState } from 'react';
import { X, UserPlus, Check, ArrowRight } from 'lucide-react';

interface GoogleAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (email: string, name: string) => Promise<void> | void;
  isLoading?: boolean;
}

export const GoogleAccountModal: React.FC<GoogleAccountModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
  isLoading = false,
}) => {
  const [selectedEmail, setSelectedEmail] = useState<string>('aburingimmultipurposeco@gmail.com');
  const [selectedName, setSelectedName] = useState<string>('Abubakar Ringim');
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customEmail, setCustomEmail] = useState<string>('');
  const [customName, setCustomName] = useState<string>('');
  const [customError, setCustomError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleConfirmDefault = () => {
    onSelectAccount(selectedEmail, selectedName);
  };

  const handleConfirmCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setCustomError('Please enter a valid Google email address.');
      return;
    }
    const derivedName = customName.trim() || customEmail.split('@')[0];
    onSelectAccount(customEmail.trim(), derivedName);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all">
        {/* Header with Google Brand */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <img
                src="/google-logo.svg"
                alt="Google"
                className="w-5 h-5 shrink-0"
                width={20}
                height={20}
              />
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Google Identity
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900">Choose an account</h3>
            <p className="text-xs text-slate-500">to continue to Sayyada Datasub</p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {!isCustomMode ? (
            <div className="space-y-3">
              {/* Primary Account Card */}
              <button
                type="button"
                onClick={handleConfirmDefault}
                disabled={isLoading}
                className="w-full p-4 rounded-xl border-2 border-emerald-600 bg-emerald-50/40 hover:bg-emerald-50 transition-all flex items-center justify-between text-left cursor-pointer group shadow-xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-full bg-emerald-700 text-white font-extrabold text-base flex items-center justify-center shadow-xs shrink-0">
                    A
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 group-hover:text-emerald-800 transition-colors truncate">
                      Abubakar Ringim
                    </p>
                    <p className="text-xs text-slate-600 truncate font-mono">
                      aburingimmultipurposeco@gmail.com
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-200/70 text-emerald-900 text-[10px] font-bold rounded-full">
                      Active Account
                    </span>
                  </div>
                </div>
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              </button>

              {/* Use Another Account Option */}
              <button
                type="button"
                onClick={() => {
                  setIsCustomMode(true);
                  setCustomError(null);
                }}
                disabled={isLoading}
                className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center gap-3 text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">Use another Google account</p>
                  <p className="text-[11px] text-slate-500">Sign in with a different email</p>
                </div>
              </button>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleConfirmDefault}
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <span>{isLoading ? 'Connecting to Google...' : 'Continue as Abubakar Ringim'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConfirmCustom} className="space-y-4">
              {customError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                  {customError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Google Email Address
                </label>
                <input
                  type="email"
                  required
                  value={customEmail}
                  onChange={(e) => {
                    setCustomEmail(e.target.value);
                    if (customError) setCustomError(null);
                  }}
                  placeholder="yourname@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name (Optional)
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Amina Bello"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCustomMode(false)}
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !customEmail}
                  className="flex-1 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>{isLoading ? 'Connecting...' : 'Continue'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* Privacy Note */}
          <p className="text-[11px] text-slate-400 text-center leading-relaxed pt-2 border-t border-slate-100">
            To continue, Google will share your verified name, email address, and language preference with Sayyada Datasub.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GoogleAccountModal;
