import React, { useState } from 'react';
import { useWallet } from '../../../context/WalletContext';
import { NetworkProvider, ProductItem } from '../../../types';
import { detectNetwork, formatKoboToNgn, generateReference, isValidNigerianPhone } from '../../../lib/formatters';
import { PinConfirmModal } from '../../shared/PinConfirmModal';
import { DataPricePredictorWidget } from './DataPricePredictorWidget';
import { Wifi, Zap, AlertCircle } from 'lucide-react';

export const DataService: React.FC = () => {
  const { products, vend, balanceKobo, beneficiaries, addBeneficiary } = useWallet();

  const [network, setNetwork] = useState<NetworkProvider>('MTN');
  const [dataType, setDataType] = useState<string>('SME');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [phone, setPhone] = useState('');
  const [saveAsBeneficiary, setSaveAsBeneficiary] = useState(false);
  const [beneficiaryLabel, setBeneficiaryLabel] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const networks: NetworkProvider[] = ['MTN', 'Airtel', 'Glo', '9mobile'];

  // Filter plans by selected network
  const availablePlans = products.filter(
    (p) => p.service === 'data' && p.provider === network && p.active
  );

  const selectedPlan: ProductItem | undefined =
    availablePlans.find((p) => p.id === selectedPlanId) || availablePlans[0];

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    const detected = detectNetwork(val);
    if (detected && detected !== network) {
      setNetwork(detected);
      setSelectedPlanId('');
    }
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) {
      setError('Please select a valid data bundle plan');
      return;
    }
    if (!isValidNigerianPhone(phone)) {
      setError('Please enter a valid 11-digit Nigerian phone number');
      return;
    }
    if (selectedPlan.selling_price > balanceKobo) {
      setError(
        `Insufficient wallet balance. You need ${formatKoboToNgn(
          selectedPlan.selling_price
        )}, but your balance is ${formatKoboToNgn(balanceKobo)}. Please fund your wallet.`
      );
      return;
    }

    setIsPinModalOpen(true);
  };

  const handleConfirmVend = async () => {
    if (!selectedPlan) return;
    setIsLoading(true);
    try {
      const reference = generateReference('SD_DATA');
      await vend({
        service: 'data',
        provider: network,
        amountKobo: selectedPlan.selling_price,
        costKobo: selectedPlan.cost_price,
        profitKobo: selectedPlan.selling_price - selectedPlan.cost_price,
        reference,
        recipientDetails: {
          phone,
          network,
          planName: selectedPlan.name,
          planCode: selectedPlan.plan_code,
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
      {/* AI-Powered Price Predictor & Volatility Radar Widget */}
      <DataPricePredictorWidget
        network={network}
        selectedPlan={selectedPlan}
      />

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
            <Wifi className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Buy Cheap Data Bundles</h2>
            <p className="text-xs text-slate-500">
              Instant SME, Corporate Gifting & Direct data with 30 days validity
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
                  onClick={() => {
                    setNetwork(net);
                    setSelectedPlanId('');
                  }}
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
                Saved Contacts
              </label>
              <div className="flex flex-wrap gap-2">
                {phoneBeneficiaries.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setPhone(b.value);
                      if (networks.includes(b.provider as NetworkProvider)) {
                        setNetwork(b.provider as NetworkProvider);
                      }
                    }}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                  >
                    {b.label} ({b.value})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recipient Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Recipient Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="e.g. 08145239871"
              maxLength={11}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Data Plan Dropdown */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Choose Data Plan ({network})
            </label>
            <div className="space-y-2">
              {availablePlans.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    (selectedPlan?.id === plan.id)
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                  }`}
                >
                  <div>
                    <p className="text-xs font-bold">{plan.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {plan.category || 'SME'} · Validity: {plan.validity || '30 Days'}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-sm text-emerald-800">
                      {formatKoboToNgn(plan.selling_price)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Beneficiary */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={saveAsBeneficiary}
                onChange={(e) => setSaveAsBeneficiary(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Save this phone number to beneficiaries</span>
            </label>
            {saveAsBeneficiary && (
              <input
                type="text"
                placeholder="Beneficiary Label (e.g. My iPad / Friend)"
                value={beneficiaryLabel}
                onChange={(e) => setBeneficiaryLabel(e.target.value)}
                className="mt-2 w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            )}
          </div>

          {selectedPlan && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="flex justify-between text-slate-600">
                <span>Selected Bundle:</span>
                <span className="font-semibold text-slate-900">{selectedPlan.name}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Validity:</span>
                <span>{selectedPlan.validity || '30 Days'}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Wallet Price:</span>
                <span className="font-mono">{formatKoboToNgn(selectedPlan.selling_price)}</span>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!selectedPlan}
            className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Zap className="w-4 h-4 text-emerald-300" />
            <span>Pay {selectedPlan ? formatKoboToNgn(selectedPlan.selling_price) : ''}</span>
          </button>
        </form>
      </div>

      <PinConfirmModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onConfirm={handleConfirmVend}
        amountKobo={selectedPlan?.selling_price || 0}
        recipientDescription={`${network} Data Bundle to ${phone}`}
        isLoading={isLoading}
      />
    </div>
  );
};
