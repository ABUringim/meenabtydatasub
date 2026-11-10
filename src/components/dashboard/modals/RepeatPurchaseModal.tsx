import React, { useState } from 'react';
import { Modal } from '../../shared/Modal';
import { Transaction } from '../../../types';
import { formatKoboToNgn } from '../../../lib/formatters';
import { maskRecipient } from '../../../utils/maskRecipient';
import { RotateCw, ArrowRight } from 'lucide-react';

interface RepeatPurchaseModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (transaction: Transaction) => void;
}

export const RepeatPurchaseModal: React.FC<RepeatPurchaseModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isPreFilling, setIsPreFilling] = useState(false);

  if (!transaction) return null;

  const rawRecipient =
    transaction.recipient_details.phone ||
    transaction.recipient_details.meterNo ||
    transaction.recipient_details.smartcardNo ||
    transaction.recipient_details.accountNumber ||
    transaction.recipient_details.customerName ||
    transaction.recipient_details.plateNumber ||
    '—';

  const masked = maskRecipient(rawRecipient);

  const handleContinue = () => {
    setIsPreFilling(true);
    setTimeout(() => {
      setIsPreFilling(false);
      onConfirm(transaction);
      onClose();
    }, 400);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Repeat Purchase"
      subtitle="Reorder with your previously saved transaction details"
      maxWidth="sm"
    >
      <div className="space-y-5">
        <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <RotateCw className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-700 leading-relaxed">
            <p className="font-medium text-slate-800">
              Repeat your last <strong className="font-bold text-emerald-950 uppercase">{transaction.provider} {transaction.service}</strong> purchase of{' '}
              <strong className="font-mono font-bold text-slate-900">{formatKoboToNgn(transaction.amount)}</strong> to{' '}
              <strong className="font-mono font-bold text-slate-900">{masked}</strong>?
            </p>
            {transaction.recipient_details.planName && (
              <p className="text-[11px] text-slate-500 mt-1">
                Plan: {transaction.recipient_details.planName}
              </p>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isPreFilling}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleContinue}
            disabled={isPreFilling}
            className="px-5 py-2.5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>{isPreFilling ? 'Pre-filling form...' : 'Continue'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default RepeatPurchaseModal;
