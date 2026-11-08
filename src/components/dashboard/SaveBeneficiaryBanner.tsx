import React, { useState } from 'react';
import { useWallet, VendedRecipientPrompt } from '../../context/WalletContext';
import { maskRecipient } from '../../utils/maskRecipient';
import { BookmarkPlus, X, Check } from 'lucide-react';
import { BeneficiaryType } from '../../types';

interface SaveBeneficiaryBannerProps {
  prompt: VendedRecipientPrompt;
  onSaved?: () => void;
}

export const SaveBeneficiaryBanner: React.FC<SaveBeneficiaryBannerProps> = ({
  prompt,
  onSaved,
}) => {
  const { addBeneficiary, dismissBeneficiaryPrompt } = useWallet();
  const [label, setLabel] = useState<string>(() => {
    return `${prompt.provider} ${prompt.service.toUpperCase()}`;
  });
  const [isEditing, setIsEditing] = useState(false);

  const getCategory = (): BeneficiaryType => {
    switch (prompt.service) {
      case 'airtime':
      case 'data':
        return 'phone';
      case 'electricity':
        return 'meter';
      case 'tv':
        return 'smartcard';
      case 'remit':
        return 'bank';
      case 'exam':
        return 'exam';
      case 'transport':
        return 'plate';
      default:
        return 'phone';
    }
  };

  const handleSave = () => {
    addBeneficiary({
      type: getCategory(),
      label: label.trim() || `${prompt.provider} - ${prompt.recipient}`,
      value: prompt.recipient,
      provider: prompt.provider,
      lastUsedAt: new Date().toISOString(),
    });
    dismissBeneficiaryPrompt();
    onSaved?.();
  };

  return (
    <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 border border-emerald-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
          <BookmarkPlus className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold text-emerald-950">
              Save {maskRecipient(prompt.recipient)} as a beneficiary?
            </h4>
            <span className="text-[10px] font-semibold bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded-full capitalize">
              {prompt.provider} · {prompt.service}
            </span>
          </div>
          <p className="text-[11px] text-emerald-800/80 mt-0.5">
            Store this recipient for 1-click instant auto-fill on your next top-up.
          </p>

          {isEditing && (
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Custom label (e.g., Mom's Phone)"
                className="px-2.5 py-1 text-xs bg-white border border-emerald-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="text-[11px] font-medium text-emerald-800 hover:text-emerald-950 underline"
          >
            Edit label
          </button>
        ) : null}
        <button
          onClick={handleSave}
          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Save Beneficiary</span>
        </button>
        <button
          onClick={dismissBeneficiaryPrompt}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-white/80 rounded-lg transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
