import React, { useState } from 'react';
import { Modal } from '../../shared/Modal';
import { Transaction } from '../../../types';
import { formatKoboToNgn, formatWATDate } from '../../../lib/formatters';
import { generateReceiptPdf } from '../../../utils/receiptPdf';
import { StatusBadge } from '../../shared/StatusBadge';
import {
  Download,
  Copy,
  Check,
  CheckCircle2,
  Printer,
  Share2,
} from 'lucide-react';

interface ReceiptViewModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptViewModal: React.FC<ReceiptViewModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  const [copiedRef, setCopiedRef] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!transaction) return null;

  const handleCopyRef = () => {
    navigator.clipboard.writeText(transaction.reference);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleDownloadPdf = () => {
    setIsDownloading(true);
    try {
      generateReceiptPdf(transaction);
    } catch (err) {
      console.error('PDF generation error', err);
    } finally {
      setTimeout(() => setIsDownloading(false), 600);
    }
  };

  const recipientString =
    transaction.recipient_details.phone ||
    transaction.recipient_details.meterNo ||
    transaction.recipient_details.smartcardNo ||
    transaction.recipient_details.accountNumber ||
    transaction.recipient_details.customerName ||
    transaction.recipient_details.plateNumber ||
    '—';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Transaction Receipt"
      subtitle={`Official proof of payment for ${transaction.service.toUpperCase()} vending`}
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Printable Receipt Card Body */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">MEENABTY DATASUB</h3>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">Automated Telecom & Utility Hub · Kano, NG</p>
            </div>
            <StatusBadge status={transaction.status} />
          </div>

          {/* Amount Hero */}
          <div className="text-center py-2">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Amount Paid</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-950 mt-0.5">
              {formatKoboToNgn(transaction.amount)}
            </h2>
            <p className="text-[11px] text-slate-400 mt-1">Wallet Deducted · Zero Hidden Surcharges</p>
          </div>

          {/* Electricity Prepaid Token Banner */}
          {transaction.recipient_details.token && (
            <div className="bg-emerald-900 text-white rounded-xl p-4 text-center shadow-xs">
              <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">
                STS Prepaid Meter Token
              </p>
              <div className="flex items-center justify-center gap-2 mt-1">
                <p className="font-mono text-lg sm:text-xl font-extrabold tracking-widest text-emerald-100">
                  {transaction.recipient_details.token}
                </p>
                <button
                  onClick={() => handleCopyToken(transaction.recipient_details.token!)}
                  className="p-1 text-emerald-300 hover:text-white transition-colors"
                  title="Copy Token"
                >
                  {copiedToken ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {transaction.recipient_details.units && (
                <p className="text-xs text-emerald-200 font-semibold mt-1">
                  Units: {transaction.recipient_details.units}
                </p>
              )}
            </div>
          )}

          {/* Exam PINs Display */}
          {transaction.recipient_details.pins && transaction.recipient_details.pins.length > 0 && (
            <div className="bg-indigo-900 text-white rounded-xl p-4 space-y-2">
              <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-300">
                Issued Examination PIN(s)
              </p>
              {transaction.recipient_details.pins.map((p, idx) => (
                <div key={idx} className="flex items-center justify-between font-mono text-xs bg-indigo-950/60 p-2 rounded-lg">
                  <span className="font-bold text-indigo-200">{p.pin}</span>
                  <span className="text-indigo-400 text-[11px]">Serial: {p.serial}</span>
                </div>
              ))}
            </div>
          )}

          {/* Line Items Grid */}
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs">
            <div className="flex items-center justify-between p-2.5">
              <span className="text-slate-500">Service Category</span>
              <span className="font-bold text-slate-900 capitalize">{transaction.service}</span>
            </div>
            <div className="flex items-center justify-between p-2.5">
              <span className="text-slate-500">Service Provider</span>
              <span className="font-bold text-slate-900">{transaction.provider}</span>
            </div>
            <div className="flex items-center justify-between p-2.5">
              <span className="text-slate-500">Recipient / Identifier</span>
              <span className="font-mono font-bold text-slate-900">{recipientString}</span>
            </div>
            {transaction.recipient_details.planName && (
              <div className="flex items-center justify-between p-2.5">
                <span className="text-slate-500">Plan Description</span>
                <span className="font-medium text-slate-800">{transaction.recipient_details.planName}</span>
              </div>
            )}
            {transaction.recipient_details.customerName && (
              <div className="flex items-center justify-between p-2.5">
                <span className="text-slate-500">Account / Customer Name</span>
                <span className="font-medium text-slate-800">{transaction.recipient_details.customerName}</span>
              </div>
            )}
            <div className="flex items-center justify-between p-2.5">
              <span className="text-slate-500">Transaction Reference</span>
              <button
                onClick={handleCopyRef}
                className="font-mono font-bold text-slate-900 hover:text-emerald-700 flex items-center gap-1"
                title="Copy Reference"
              >
                <span>{transaction.reference}</span>
                {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>
            {transaction.vtu_response?.operatorRef && (
              <div className="flex items-center justify-between p-2.5">
                <span className="text-slate-500">Operator Reference</span>
                <span className="font-mono text-slate-700">{transaction.vtu_response.operatorRef}</span>
              </div>
            )}
            <div className="flex items-center justify-between p-2.5">
              <span className="text-slate-500">Date & Time (WAT)</span>
              <span className="font-medium text-slate-700">{formatWATDate(transaction.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={handleCopyRef}
            className="py-2 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5"
          >
            {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedRef ? 'Reference Copied' : 'Copy Reference'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="py-2 px-3.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? 'Generating PDF...' : 'Download Official PDF'}</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
