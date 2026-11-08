import React, { useState } from 'react';
import { Modal } from './Modal';
import { Transaction } from '../../types';
import { formatKoboToNgn, formatWATDate } from '../../lib/formatters';
import { StatusBadge } from './StatusBadge';
import {
  CheckCircle2,
  Copy,
  Check,
  Printer,
  Share2,
  AlertTriangle,
  Zap,
  Key,
} from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onRaiseDispute?: (reference: string) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  onClose,
  onRaiseDispute,
}) => {
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);

  if (!transaction) return null;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(transaction.reference);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleCopyToken = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const rDetails = transaction.recipient_details;

  return (
    <Modal
      isOpen={!!transaction}
      onClose={onClose}
      title="Official Transaction Receipt"
      subtitle={`Ref: ${transaction.reference}`}
      maxWidth="md"
    >
      <div id="printable-receipt" className="space-y-5">
        {/* Header Branding */}
        <div className="text-center pb-4 border-b border-slate-100">
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-lg font-black tracking-tight text-emerald-800">SAYYADA DATASUB</span>
          </div>
          <p className="text-xs text-slate-500">Multi-Service VTU & Fintech Portal · Kano, Nigeria</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <StatusBadge status={transaction.status} />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900">
            {formatKoboToNgn(transaction.amount)}
          </div>
        </div>

        {/* Special Delivery Box (Prepaid Electricity Token or Exam PINs) */}
        {rDetails.token && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-900">
              <Zap className="w-4 h-4 text-emerald-700" />
              <span>PREPAID ELECTRICITY TOKEN</span>
            </div>
            <div className="text-xl md:text-2xl font-mono font-extrabold tracking-wider text-emerald-950 select-all bg-white py-2 px-3 rounded-lg border border-emerald-200">
              {rDetails.token}
            </div>
            {rDetails.units && (
              <p className="text-xs text-emerald-800 font-medium">Estimated Units: {rDetails.units}</p>
            )}
            <button
              onClick={() => handleCopyToken(rDetails.token!)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
            >
              {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-700" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedToken ? 'Token Copied!' : 'Copy 20-Digit Token'}</span>
            </button>
          </div>
        )}

        {rDetails.pins && rDetails.pins.length > 0 && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900">
              <Key className="w-4 h-4 text-blue-700" />
              <span>DELIVERED EXAM PINS & TOKENS</span>
            </div>
            <div className="space-y-2">
              {rDetails.pins.map((p, idx) => (
                <div key={idx} className="bg-white p-2.5 rounded-lg border border-blue-200 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Serial: {p.serial}</p>
                    <p className="text-sm font-mono font-bold text-slate-900 select-all">{p.pin}</p>
                  </div>
                  <button
                    onClick={() => handleCopyToken(`PIN: ${p.pin} | Serial: ${p.serial}`)}
                    className="p-1.5 text-blue-700 hover:bg-blue-100 rounded"
                    title="Copy PIN"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction Meta Details */}
        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2 flex justify-between">
            <span className="text-slate-500">Service Category</span>
            <span className="font-semibold text-slate-900 capitalize">{transaction.service}</span>
          </div>
          <div className="py-2 flex justify-between">
            <span className="text-slate-500">Provider / Network</span>
            <span className="font-semibold text-slate-900">{transaction.provider}</span>
          </div>
          <div className="py-2 flex justify-between">
            <span className="text-slate-500">Transaction Date (WAT)</span>
            <span className="font-medium text-slate-800">{formatWATDate(transaction.created_at)}</span>
          </div>
          <div className="py-2 flex justify-between items-center">
            <span className="text-slate-500">System Reference</span>
            <div className="flex items-center gap-1">
              <span className="font-mono text-slate-800">{transaction.reference}</span>
              <button onClick={handleCopyRef} className="p-1 text-slate-400 hover:text-slate-700">
                {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Recipient Details Breakdown */}
          {rDetails.phone && (
            <div className="py-2 flex justify-between">
              <span className="text-slate-500">Recipient Phone</span>
              <span className="font-mono font-semibold text-slate-900">{rDetails.phone}</span>
            </div>
          )}
          {rDetails.planName && (
            <div className="py-2 flex justify-between">
              <span className="text-slate-500">Bundle Plan</span>
              <span className="font-medium text-slate-900">{rDetails.planName}</span>
            </div>
          )}
          {rDetails.meterNo && (
            <div className="py-2 flex justify-between">
              <span className="text-slate-500">Meter Number ({rDetails.meterType})</span>
              <span className="font-mono font-semibold text-slate-900">{rDetails.meterNo}</span>
            </div>
          )}
          {rDetails.customerName && (
            <div className="py-2 flex justify-between">
              <span className="text-slate-500">Account Holder Name</span>
              <span className="font-semibold text-slate-900">{rDetails.customerName}</span>
            </div>
          )}
          {rDetails.smartcardNo && (
            <div className="py-2 flex justify-between">
              <span className="text-slate-500">Smartcard / IUC</span>
              <span className="font-mono font-semibold text-slate-900">{rDetails.smartcardNo}</span>
            </div>
          )}
          {rDetails.accountNumber && (
            <div className="py-2 flex justify-between">
              <span className="text-slate-500">Bank & Account</span>
              <span className="font-medium text-slate-900">
                {rDetails.accountName} ({rDetails.accountNumber})
              </span>
            </div>
          )}

          {transaction.provider_tran_id && (
            <div className="py-2 flex justify-between">
              <span className="text-slate-500">Gateway Tran ID</span>
              <span className="font-mono text-emerald-800 font-semibold text-[11px]">{transaction.provider_tran_id}</span>
            </div>
          )}

          {transaction.vtu_response?.operatorRef && (
            <div className="py-2 flex justify-between">
              <span className="text-slate-500">Operator Ref</span>
              <span className="font-mono text-slate-600 text-[11px]">{transaction.vtu_response.operatorRef}</span>
            </div>
          )}

          {transaction.failure_reason && (
            <div className="py-2.5 bg-rose-50 -mx-6 px-6 text-rose-800">
              <p className="font-semibold">Reason for Failure:</p>
              <p className="text-[11px] mt-0.5">{transaction.failure_reason}</p>
              <p className="text-[11px] text-emerald-800 font-semibold mt-1">
                ✓ Wallet was automatically refunded atomically.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          <button
            onClick={handlePrint}
            className="flex-1 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Receipt</span>
          </button>
          {transaction.status === 'failed' && onRaiseDispute && (
            <button
              onClick={() => {
                onClose();
                onRaiseDispute(transaction.reference);
              }}
              className="py-2 px-3 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Raise Dispute</span>
            </button>
          )}
          <button
            onClick={onClose}
            className="py-2 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};
