import React, { useState } from 'react';
import { useWallet } from '../../../context/WalletContext';
import { TRANSPORT_BILLERS } from '../../../data/initialData';
import { formatNgn, formatKoboToNgn, generateReference } from '../../../lib/formatters';
import { PinConfirmModal } from '../../shared/PinConfirmModal';
import { Car, Zap, AlertCircle } from 'lucide-react';

export const TransportService: React.FC = () => {
  const { vend, balanceKobo } = useWallet();

  const [billerId, setBillerId] = useState<string>(TRANSPORT_BILLERS[0].id);
  const [accountOrCardId, setAccountOrCardId] = useState<string>('');
  const [amountNgn, setAmountNgn] = useState<number>(2000);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBiller = TRANSPORT_BILLERS.find((b) => b.id === billerId) || TRANSPORT_BILLERS[0];
  const totalKobo = amountNgn * 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountOrCardId || accountOrCardId.length < 5) {
      setError('Please enter a valid Card ID, e-Tag, or Plate Number');
      return;
    }
    if (amountNgn < selectedBiller.minAmount) {
      setError(`Minimum top-up for ${selectedBiller.name} is ₦${selectedBiller.minAmount.toLocaleString()}`);
      return;
    }
    if (totalKobo > balanceKobo) {
      setError(
        `Insufficient wallet balance. Total needed is ${formatKoboToNgn(
          totalKobo
        )}, but your balance is ${formatKoboToNgn(balanceKobo)}.`
      );
      return;
    }

    setIsPinModalOpen(true);
  };

  const handleConfirmVend = async () => {
    setIsLoading(true);
    try {
      const reference = generateReference('SD_TRANSPORT');
      await vend({
        service: 'transport',
        provider: selectedBiller.name,
        amountKobo: totalKobo,
        costKobo: Math.round(totalKobo * 0.98),
        profitKobo: Math.round(totalKobo * 0.02),
        reference,
        recipientDetails: {
          biller: selectedBiller.name,
          plateNumber: accountOrCardId,
          amountNgn,
        },
      });

      setIsPinModalOpen(false);
      setAccountOrCardId('');
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
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Transport & Toll Payments</h2>
            <p className="text-xs text-slate-500">
              Top up Cowry Transit Card (Lagos BRT & Rail), Lekki Toll Gate e-Tag & interstate passes
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
              Select Transport Service
            </label>
            <select
              value={billerId}
              onChange={(e) => setBillerId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            >
              {TRANSPORT_BILLERS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Identifier Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Cowry Card Number / Lekki e-Tag / Vehicle Plate No.
            </label>
            <input
              type="text"
              value={accountOrCardId}
              onChange={(e) => setAccountOrCardId(e.target.value.toUpperCase())}
              placeholder="e.g. 1049281928 or KAN-492-AB"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Recharge Amount (₦)
            </label>
            <div className="flex gap-2 mb-2">
              {[1000, 2000, 5000, 10000].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmountNgn(val)}
                  className={`py-1.5 px-3 text-xs font-semibold rounded-md border transition-colors ${
                    amountNgn === val
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  ₦{val.toLocaleString()}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={selectedBiller.minAmount}
              max={selectedBiller.maxAmount}
              value={amountNgn}
              onChange={(e) => setAmountNgn(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Zap className="w-4 h-4 text-emerald-300" />
            <span>Top Up {formatNgn(amountNgn)}</span>
          </button>
        </form>
      </div>

      <PinConfirmModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onConfirm={handleConfirmVend}
        amountKobo={totalKobo}
        recipientDescription={`${selectedBiller.name} (${accountOrCardId})`}
        isLoading={isLoading}
      />
    </div>
  );
};
