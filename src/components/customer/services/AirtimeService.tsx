import React, { useState } from 'react';
import { useWallet } from '../../../context/WalletContext';
import { NetworkProvider } from '../../../types';
import { detectNetwork, formatNgn, generateReference, isValidNigerianPhone } from '../../../lib/formatters';
import { PinConfirmModal } from '../../shared/PinConfirmModal';
import { Smartphone, Zap, AlertCircle } from 'lucide-react';

export const AirtimeService: React.FC = () => {
  const { vend, balanceKobo, beneficiaries, addBeneficiary } = useWallet();

  const [network, setNetwork] = useState<NetworkProvider>('MTN');
  const [phone, setPhone] = useState('');
  const [amountNgn, setAmountNgn] = useState<number>(500);
  const [saveAsBeneficiary, setSaveAsBeneficiary] = useState(false);
  const [beneficiaryLabel, setBeneficiaryLabel] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const networks: NetworkProvider[] = ['MTN', 'Airtel', 'Glo', '9mobile'];
  const presets = [100, 200, 500, 1000, 2000, 5000];

  // 2% Discount on Airtime
  const discountPercent = 2;
  const payableNgn = Math.round(amountNgn * (1 - discountPercent / 100));
  const payableKobo = payableNgn * 100;
  const costKobo = Math.round(amountNgn * 0.96 * 100);
  const profitKobo = payableKobo - costKobo;

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    const detected = detectNetwork(val);
    if (detected) {
      setNetwork(detected);
    }
    setError(null);
  };

  const handleSelectBeneficiary = (bVal: string, bProv: string) => {
    setPhone(bVal);
    if (networks.includes(bProv as NetworkProvider)) {
      setNetwork(bProv as NetworkProvider);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidNigerianPhone(phone)) {
      setError('Please enter a valid 11-digit Nigerian phone number (e.g. 08031234567)');
      return;
    }
    if (amountNgn < 50) {
      setError('Minimum airtime amount is ₦50');
      return;
    }
    if (payableKobo > balanceKobo) {
      setError(`Insufficient wallet balance. You need ₦${payableNgn.toLocaleString()}, but your balance is ₦${(balanceKobo / 100).toLocaleString()}. Please fund your wallet.`);
      return;
    }

    setIsPinModalOpen(true);
  };

  const handleConfirmVend = async () => {
    setIsLoading(true);
    try {
      const reference = generateReference('SD_AIRTIME');
      await vend({
        service: 'airtime',
        provider: network,
        amountKobo: payableKobo,
        costKobo,
        profitKobo,
        reference,
        recipientDetails: {
          phone,
          network,
          nominalAmount: amountNgn,
        },
      });

      if (saveAsBeneficiary && beneficiaryLabel.trim()) {
        addBeneficiary({
          type: 'phone',
          label: beneficiaryLabel.trim(),
          value: phone,
          provider: network,
        });
      }

      setIsPinModalOpen(false);
      setPhone('');
      setBeneficiaryLabel('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const phoneBeneficiaries = beneficiaries.filter((b) => b.type === 'phone');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Instant Airtime Top-Up (VTU)</h2>
            <p className="text-xs text-slate-500">
              Recharge any Nigerian network with instant 2% discount cashback
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
          {/* Network Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Mobile Network
            </label>
            <div className="grid grid-cols-4 gap-2">
              {networks.map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => setNetwork(net)}
                  className={`py-2.5 px-3 text-xs font-bold rounded-lg border transition-all text-center ${
                    network === net
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {net}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Beneficiaries */}
          {phoneBeneficiaries.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Saved Phone Contacts
              </label>
              <div className="flex flex-wrap gap-2">
                {phoneBeneficiaries.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelectBeneficiary(b.value, b.provider)}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                  >
                    {b.label} ({b.value})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Recipient Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="e.g. 08031234567"
              maxLength={11}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Amount presets & custom input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Airtime Value (₦)
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
              {presets.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setAmountNgn(val)}
                  className={`py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                    amountNgn === val
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  ₦{val}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={50}
              max={100000}
              value={amountNgn}
              onChange={(e) => setAmountNgn(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Save as Beneficiary Checkbox */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={saveAsBeneficiary}
                onChange={(e) => setSaveAsBeneficiary(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Save this number to my beneficiaries</span>
            </label>
            {saveAsBeneficiary && (
              <input
                type="text"
                placeholder="Beneficiary Label (e.g. Brother's Line)"
                value={beneficiaryLabel}
                onChange={(e) => setBeneficiaryLabel(e.target.value)}
                className="mt-2 w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            )}
          </div>

          {/* Price Breakdown */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Nominal Airtime:</span>
              <span className="font-mono">₦{amountNgn.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Instant Discount (2%):</span>
              <span>-₦{(amountNgn - payableNgn).toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Amount Deducted from Wallet:</span>
              <span className="font-mono">{formatNgn(payableNgn)}</span>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Zap className="w-4 h-4 text-emerald-300" />
            <span>Pay {formatNgn(payableNgn)}</span>
          </button>
        </form>
      </div>

      <PinConfirmModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onConfirm={handleConfirmVend}
        amountKobo={payableKobo}
        recipientDescription={`${network} Airtime to ${phone}`}
        isLoading={isLoading}
      />
    </div>
  );
};
