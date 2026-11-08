import React, { useState } from 'react';
import { useWallet } from '../../../context/WalletContext';
import { formatNgn, formatKoboToNgn, generateReference } from '../../../lib/formatters';
import { PinConfirmModal } from '../../shared/PinConfirmModal';
import { Receipt, CheckCircle2, AlertCircle, Zap, Search } from 'lucide-react';

export const InvoiceService: React.FC = () => {
  const { vend, balanceKobo } = useWallet();

  const [billerCategory, setBillerCategory] = useState<string>('utilities');
  const [billerName, setBillerName] = useState<string>('Lagos State Inland Revenue (LIRS)');
  const [invoiceNo, setInvoiceNo] = useState<string>('');
  const [amountNgn, setAmountNgn] = useState<number>(10000);
  const [verifiedBiller, setVerifiedBiller] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const billers = [
    { id: 'lirs', name: 'Lagos State Internal Revenue Service (LIRS)' },
    { id: 'firs', name: 'Federal Inland Revenue Service (FIRS Tax)' },
    { id: 'kirs', name: 'Kano State Internal Revenue (KIRS Assessment)' },
    { id: 'remita', name: 'Remita Retrieval Reference (RRR Invoice)' },
    { id: 'abu-zaria', name: 'Ahmadu Bello University (ABU Zaria Fees)' },
    { id: 'buk-kano', name: 'Bayero University Kano (BUK Portal Bill)' },
  ];

  const convenienceFeeNgn = 150;
  const totalPayableNgn = amountNgn + convenienceFeeNgn;
  const totalPayableKobo = totalPayableNgn * 100;

  const handleVerifyInvoice = async () => {
    if (!invoiceNo || invoiceNo.length < 6) {
      setError('Please enter a valid invoice or assessment number');
      return;
    }
    setIsVerifying(true);
    setError(null);
    await new Promise((r) => setTimeout(r, 600));
    setVerifiedBiller(`Valid Assessment for Invoice #${invoiceNo.toUpperCase()}`);
    setIsVerifying(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedBiller) {
      setError('Please click "Verify Biller" before proceeding to payment');
      return;
    }
    if (totalPayableKobo > balanceKobo) {
      setError(
        `Insufficient wallet balance. Total required is ${formatKoboToNgn(
          totalPayableKobo
        )}, but your balance is ${formatKoboToNgn(balanceKobo)}.`
      );
      return;
    }

    setIsPinModalOpen(true);
  };

  const handleConfirmVend = async () => {
    setIsLoading(true);
    try {
      const reference = generateReference('SD_INVOICE');
      await vend({
        service: 'invoice',
        provider: billerName,
        amountKobo: totalPayableKobo,
        costKobo: amountNgn * 100,
        profitKobo: convenienceFeeNgn * 100,
        reference,
        recipientDetails: {
          billerId: billerName,
          invoiceNo,
          amountNgn,
        },
      });

      setIsPinModalOpen(false);
      setInvoiceNo('');
      setVerifiedBiller(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Commercial & Institutional Invoice Payment</h2>
            <p className="text-xs text-slate-500">
              Pay federal taxes, state revenue assessments, RRR invoices, and university school fees
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Biller Select */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Biller / Agency
            </label>
            <select
              value={billerName}
              onChange={(e) => {
                setBillerName(e.target.value);
                setVerifiedBiller(null);
              }}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            >
              {billers.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Invoice No with Verify */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Invoice / RRR / Assessment Reference Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => {
                  setInvoiceNo(e.target.value);
                  setVerifiedBiller(null);
                }}
                placeholder="e.g. RRR-2918-4910-2819"
                className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleVerifyInvoice}
                disabled={isVerifying || !invoiceNo}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isVerifying ? 'Checking...' : 'Verify Biller'}</span>
              </button>
            </div>
          </div>

          {verifiedBiller && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <div>
                <span className="font-bold text-emerald-950">{verifiedBiller}</span>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Invoice Amount (₦)
            </label>
            <input
              type="number"
              min={100}
              max={10000000}
              value={amountNgn}
              onChange={(e) => setAmountNgn(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Invoice Value:</span>
              <span className="font-mono">{formatNgn(amountNgn)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Settlement Fee:</span>
              <span className="font-mono">₦{convenienceFeeNgn}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Total Wallet Deduction:</span>
              <span className="font-mono">{formatNgn(totalPayableNgn)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!verifiedBiller}
            className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Zap className="w-4 h-4 text-emerald-300" />
            <span>Pay Invoice ({formatNgn(totalPayableNgn)})</span>
          </button>
        </form>
      </div>

      <PinConfirmModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onConfirm={handleConfirmVend}
        amountKobo={totalPayableKobo}
        recipientDescription={`Invoice Payment to ${billerName} (#${invoiceNo})`}
        isLoading={isLoading}
      />
    </div>
  );
};
