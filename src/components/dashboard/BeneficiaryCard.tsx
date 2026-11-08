import React from 'react';
import { Beneficiary, BeneficiaryType } from '../../types';
import { maskRecipient } from '../../utils/maskRecipient';
import { timeAgo, formatWATDate } from '../../lib/formatters';
import {
  Phone,
  Zap,
  Tv,
  Building2,
  GraduationCap,
  Car,
  Pencil,
  Trash2,
  ArrowRight,
  Clock,
} from 'lucide-react';

interface BeneficiaryCardProps {
  beneficiary: Beneficiary;
  onUse: (b: Beneficiary) => void;
  onEdit: (b: Beneficiary) => void;
  onDelete: (b: Beneficiary) => void;
}

export const getBeneficiaryIcon = (type: BeneficiaryType) => {
  switch (type) {
    case 'phone':
      return { icon: Phone, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    case 'meter':
      return { icon: Zap, color: 'text-amber-700 bg-amber-50 border-amber-200' };
    case 'smartcard':
      return { icon: Tv, color: 'text-purple-700 bg-purple-50 border-purple-200' };
    case 'bank':
      return { icon: Building2, color: 'text-teal-700 bg-teal-50 border-teal-200' };
    case 'exam':
      return { icon: GraduationCap, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    case 'plate':
      return { icon: Car, color: 'text-sky-700 bg-sky-50 border-sky-200' };
    default:
      return { icon: Phone, color: 'text-slate-700 bg-slate-50 border-slate-200' };
  }
};

export const BeneficiaryCard: React.FC<BeneficiaryCardProps> = ({
  beneficiary,
  onUse,
  onEdit,
  onDelete,
}) => {
  const { icon: Icon, color } = getBeneficiaryIcon(beneficiary.type);
  const maskedVal = maskRecipient(beneficiary.value);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-emerald-500/50 hover:shadow-xs transition-all flex flex-col justify-between gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-slate-900 truncate">{beneficiary.label}</h4>
            <p className="text-xs font-mono font-medium text-slate-700 mt-0.5">{maskedVal}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 capitalize">
                {beneficiary.provider} · {beneficiary.type}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(beneficiary)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            title="Edit Beneficiary"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(beneficiary)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Beneficiary"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {beneficiary.additionalInfo && (
        <div className="px-3 py-1.5 rounded-lg bg-slate-50 text-[11px] text-slate-600 truncate">
          {beneficiary.additionalInfo}
        </div>
      )}

      {/* Footer: Last used & One-tap USE button */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px] text-slate-400">
          <Clock className="w-3 h-3" />
          <span>
            {beneficiary.lastUsedAt ? `Used ${timeAgo(beneficiary.lastUsedAt)}` : 'Never used yet'}
          </span>
        </div>

        <button
          onClick={() => onUse(beneficiary)}
          className="py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1 transition-colors shadow-xs"
        >
          <span>Use</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
