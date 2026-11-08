import React, { useState } from 'react';
import { useWallet } from '../../../context/WalletContext';
import { GIFT_CARDS } from '../../../data/initialData';
import { formatNgn, formatKoboToNgn, generateReference } from '../../../lib/formatters';
import { PinConfirmModal } from '../../shared/PinConfirmModal';
import { Gift, Zap, AlertCircle, TrendingUp } from 'lucide-react';

export const GiftCardService: React.FC = () => {
  const { vend, balanceKobo } = useWallet();

  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [selectedCardId, setSelectedCardId] = useState<string>(GIFT_CARDS[0].id);
  const [usdAmount, setUsdAmount] = useState<number>(50);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const selectedCard = GIFT_CARDS.find((c) => c.id === selectedCardId) || GIFT_CARDS[0];

  const totalNgn = usdAmount * selectedCard.rateNgn;
  const totalKobo = totalNgn * 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usdAmount < selectedCard.min || usdAmount > selectedCard.max) {
      setError(`Denomination must be between $${selectedCard.min} and $${selectedCard.max}`);
      return;
    }
    if (mode === 'buy' && totalKobo > balanceKobo) {
      setError(
        `Insufficient wallet balance. Total required is ${formatKoboToNgn(
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
      const reference = generateReference(mode === 'buy' ? 'SD_GC_BUY' : 'SD_GC_SELL');
      await vend({
        service: 'giftcard',
        provider: selectedCard.name,
        amountKobo: totalKobo,
        costKobo: Math.round(totalKobo * 0.95),
        profitKobo: Math.round(totalKobo * 0.05),
        reference,
        recipientDetails: {
          cardType: selectedCard.name,
          cardValue: `$${usdAmount} USD`,
          mode,
          exchangeRate: `₦${selectedCard.rateNgn}/$`,
        },
      });

      setIsPinModalOpen(false);
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
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Digital Gift Cards (Buy & Sell)</h2>
            <p className="text-xs text-slate-500">
              Trade Apple, Steam, Amazon, Google Play & Razer Gold codes at top Nigerian Naira market rates
            </p>
          </div>
        </div>

        {/* Mode Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg mb-4">
          <button
            type="button"
            onClick={() => setMode('buy')}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${
              mode === 'buy' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Buy Gift Card (Instant e-Code)
          </button>
          <button
            type="button"
            onClick={() => setMode('sell')}
            className={`flex-1 py-2 text-xs font-bold rounded-md transition-colors ${
              mode === 'sell' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Sell / Redeem Gift Card to Naira
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Card Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Card Brand
            </label>
            <div className="space-y-2">
              {GIFT_CARDS.map((card) => (
                <div
                  key={card.id}
                  onClick={() => setSelectedCardId(card.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    selectedCardId === card.id
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold">{card.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Min: ${card.min} · Max: ${card.max}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-xs font-mono font-bold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded">
                      <TrendingUp className="w-3 h-3" />
                      ₦{card.rateNgn}/$
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* USD Denomination */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Card Denomination (USD $)
            </label>
            <div className="flex gap-2 mb-2">
              {[25, 50, 100, 200].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setUsdAmount(val)}
                  className={`py-1.5 px-3 text-xs font-semibold rounded-md border transition-colors ${
                    usdAmount === val
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={selectedCard.min}
              max={selectedCard.max}
              value={usdAmount}
              onChange={(e) => setUsdAmount(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Card Value:</span>
              <span className="font-semibold">${usdAmount} USD</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Applied Rate:</span>
              <span className="font-mono">₦{selectedCard.rateNgn} per $1</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Total Naira Settlement:</span>
              <span className="font-mono">{formatNgn(totalNgn)}</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Zap className="w-4 h-4 text-emerald-300" />
            <span>
              {mode === 'buy' ? 'Buy Gift Card' : 'Sell for Cash'} ({formatNgn(totalNgn)})
            </span>
          </button>
        </form>
      </div>

      <PinConfirmModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onConfirm={handleConfirmVend}
        amountKobo={totalKobo}
        recipientDescription={`${mode === 'buy' ? 'Purchase' : 'Redeem'} ${selectedCard.name} ($${usdAmount})`}
        isLoading={isLoading}
      />
    </div>
  );
};
