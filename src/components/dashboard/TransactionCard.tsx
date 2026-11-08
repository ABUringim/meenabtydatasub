import React from 'react';
import { Transaction } from '../../types';
import { formatKoboToNgn, timeAgo, formatWATDate } from '../../lib/formatters';
import { maskRecipient } from '../../utils/maskRecipient';
import { StatusBadge } from '../shared/StatusBadge';
import {
  Smartphone,
  Wifi,
  Zap,
  Tv,
  GraduationCap,
  SendHorizontal,
  Receipt as ReceiptIcon,
  Gift,
  Car,
  Plane,
  RotateCw,
  AlertCircle,
  FileText,
  Copy,
  Check,
} from 'lucide-react';

interface TransactionCardProps {
  transaction: Transaction;
  onViewReceipt: (txn: Transaction) => void;
  onRepeat: (txn: Transaction) => void;
  onReportIssue: (txn: Transaction) => void;
}

export const getServiceIcon = (service: string) => {
  switch (service) {
    case 'airtime':
      return { icon: Smartphone, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    case 'data':
      return { icon: Wifi, color: 'text-blue-700 bg-blue-50 border-blue-200' };
    case 'electricity':
      return { icon: Zap, color: 'text-amber-700 bg-amber-50 border-amber-200' };
    case 'tv':
      return { icon: Tv, color: 'text-purple-700 bg-purple-50 border-purple-200' };
    case 'exam':
      return { icon: GraduationCap, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    case 'remit':
      return { icon: SendHorizontal, color: 'text-teal-700 bg-teal-50 border-teal-200' };
    case 'invoice':
      return { icon: ReceiptIcon, color: 'text-rose-700 bg-rose-50 border-rose-200' };
    case 'giftcard':
      return { icon: Gift, color: 'text-pink-700 bg-pink-50 border-pink-200' };
    case 'transport':
      return { icon: Car, color: 'text-sky-700 bg-sky-50 border-sky-200' };
    case 'travel':
      return { icon: Plane, color: 'text-orange-700 bg-orange-50 border-orange-200' };
    default:
      return { icon: FileText, color: 'text-slate-700 bg-slate-50 border-slate-200' };
  }
};

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  onViewReceipt,
  onRepeat,
  onReportIssue,
}) => {
  const [copiedRef, setCopiedRef] = React.useState(false);
  const { icon: Icon, color } = getServiceIcon(transaction.service);

  const rawRecipient =
    transaction.recipient_details.phone ||
    transaction.recipient_details.meterNo ||
    transaction.recipient_details.smartcardNo ||
    transaction.recipient_details.accountNumber ||
    transaction.recipient_details.customerName ||
    transaction.recipient_details.plateNumber ||
    '—';

  const masked = maskRecipient(rawRecipient);

  const handleCopyRef = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(transaction.reference);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-emerald-500/50 hover:shadow-xs transition-all flex flex-col justify-between gap-3">
      {/* Top row: Icon, Service info, Status & Amount */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 capitalize truncate">
                {transaction.service}
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {transaction.provider}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-600 font-medium mt-0.5 truncate">
              {masked}
            </p>
            <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
              <span title={formatWATDate(transaction.created_at)}>{timeAgo(transaction.created_at)}</span>
              <span>·</span>
              <button
                onClick={handleCopyRef}
                className="font-mono hover:text-emerald-700 flex items-center gap-1 transition-colors"
                title="Click to copy reference"
              >
                <span>{transaction.reference.slice(0, 14)}...</span>
                {copiedRef ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-bold font-mono text-slate-900">
            {formatKoboToNgn(transaction.amount)}
          </p>
          <div className="mt-1 flex justify-end">
            <StatusBadge status={transaction.status} />
          </div>
        </div>
      </div>

      {/* Recipient Details Snippet if Token or Plan */}
      {(transaction.recipient_details.planName || transaction.recipient_details.token) && (
        <div className="px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
          <span className="truncate">
            {transaction.recipient_details.planName || `Token: ${transaction.recipient_details.token}`}
          </span>
          {transaction.recipient_details.units && (
            <span className="font-bold text-emerald-800 shrink-0">{transaction.recipient_details.units}</span>
          )}
        </div>
      )}

      {/* Failure reason if failed */}
      {transaction.status === 'failed' && transaction.failure_reason && (
        <div className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-100 text-[11px] text-rose-700">
          {transaction.failure_reason}
        </div>
      )}

      {/* Action buttons footer */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onViewReceipt(transaction)}
            className="py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            <span>View Receipt</span>
          </button>
          <button
            onClick={() => onRepeat(transaction)}
            className="py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 flex items-center gap-1 transition-colors"
            title="Repeat transaction with same details"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Repeat</span>
          </button>
        </div>

        <button
          onClick={() => onReportIssue(transaction)}
          className="py-1 px-2 rounded text-[11px] font-semibold text-slate-400 hover:text-rose-700 hover:bg-rose-50 transition-colors flex items-center gap-1"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Report Issue</span>
        </button>
      </div>
    </div>
  );
};
