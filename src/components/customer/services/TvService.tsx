import React, { useState } from 'react';
import { useWallet } from '../../../context/WalletContext';
import { vtuProvider } from '../../../services/vtuProvider';
import { formatKoboToNgn, generateReference } from '../../../lib/formatters';
import { PinConfirmModal } from '../../shared/PinConfirmModal';
import { Tv, CheckCircle2, AlertCircle, Search, Zap } from 'lucide-react';
import { ProductItem } from '../../../types';

export const TvService: React.FC = () => {
  const { products, vend, balanceKobo, beneficiaries, addBeneficiary } = useWallet();

  const [provider, setProvider] = useState<'DSTV' | 'GOTV' | 'Startimes'>('DSTV');
  const [smartcardNo, setSmartcardNo] = useState<string>('');
  const [selectedBouquetId, setSelectedBouquetId] = useState<string>('');
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveAsBeneficiary, setSaveAsBeneficiary] = useState<boolean>(false);

  const availableBouquets = products.filter(
    (p) => p.service === 'tv' && p.provider === provider && p.active
  );

  const selectedBouquet: ProductItem | undefined =
    availableBouquets.find((b) => b.id === selectedBouquetId) || availableBouquets[0];

  const handleVerify = async () => {
    if (!smartcardNo || smartcardNo.length < 8) {
      setError('Please enter a valid smartcard or IUC number');
      return;
    }
    setIsVerifying(true);
    setError(null);
    try {
      const res = await vtuProvider.verifySmartcard(provider, smartcardNo);
      setVerifiedName(res.customerName);
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      setVerifiedName(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedName) {
      setError('Please verify smartcard/IUC number first');
      return;
    }
    if (!selectedBouquet) {
      setError('Please select a bouquet package');
      return;
    }
    if (selectedBouquet.selling_price > balanceKobo) {
      setError(
        `Insufficient wallet balance. You need ${formatKoboToNgn(
          selectedBouquet.selling_price
        )}, but your balance is ${formatKoboToNgn(balanceKobo)}.`
      );
      return;
    }

    setIsPinModalOpen(true);
  };

  const handleConfirmVend = async () => {
    if (!selectedBouquet) return;
    setIsLoading(true);
    try {
      const reference = generateReference('SD_TV');
      await vend({
        service: 'tv',
        provider,
        amountKobo: selectedBouquet.selling_price,
        costKobo: selectedBouquet.cost_price,
        profitKobo: selectedBouquet.selling_price - selectedBouquet.cost_price,
        reference,
        recipientDetails: {
          smartcardNo,
          customerName: verifiedName || '',
          provider,
          planName: selectedBouquet.name,
        },
      });

      if (saveAsBeneficiary && verifiedName) {
        addBeneficiary({
          type: 'smartcard',
          label: `${verifiedName} (${provider})`,
          value: smartcardNo,
          provider,
          additionalInfo: verifiedName,
        });
      }

      setIsPinModalOpen(false);
      setSmartcardNo('');
      setVerifiedName(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const tvBeneficiaries = beneficiaries.filter((b) => b.type === 'smartcard');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
            <Tv className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Cable TV Subscription</h2>
            <p className="text-xs text-slate-500">
              Instant activation for DStv, GOtv, and StarTimes with zero delay
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
          {/* Provider Switch */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select TV Provider
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['DSTV', 'GOTV', 'Startimes'] as const).map((prov) => (
                <button
                  key={prov}
                  type="button"
                  onClick={() => {
                    setProvider(prov);
                    setSelectedBouquetId('');
                    setVerifiedName(null);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                    provider === prov
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {prov}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Beneficiaries */}
          {tvBeneficiaries.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Saved Smartcards
              </label>
              <div className="flex flex-wrap gap-2">
                {tvBeneficiaries.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setSmartcardNo(b.value);
                      if (['DSTV', 'GOTV', 'Startimes'].includes(b.provider)) {
                        setProvider(b.provider as any);
                      }
                      setVerifiedName(null);
                    }}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                  >
                    {b.label} ({b.value})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Smartcard No with Verify */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Smartcard / IUC Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={smartcardNo}
                onChange={(e) => {
                  setSmartcardNo(e.target.value.replace(/\D/g, ''));
                  setVerifiedName(null);
                }}
                placeholder="Enter 10 to 11 digit Smartcard number"
                className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleVerify}
                disabled={isVerifying || !smartcardNo}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isVerifying ? 'Verifying...' : 'Verify'}</span>
              </button>
            </div>
          </div>

          {verifiedName && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <div>
                <span className="text-slate-500">Customer Name: </span>
                <span className="font-bold text-emerald-950">{verifiedName}</span>
              </div>
            </div>
          )}

          {/* Bouquet Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Package Bouquet
            </label>
            <div className="space-y-2">
              {availableBouquets.map((b) => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBouquetId(b.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    (selectedBouquet?.id === b.id)
                      ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white text-slate-800'
                  }`}
                >
                  <p className="text-xs font-bold">{b.name}</p>
                  <span className="font-mono font-bold text-sm text-emerald-800">
                    {formatKoboToNgn(b.selling_price)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Save Beneficiary */}
          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700">
              <input
                type="checkbox"
                checked={saveAsBeneficiary}
                onChange={(e) => setSaveAsBeneficiary(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span>Save smartcard to beneficiaries</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!verifiedName || !selectedBouquet}
            className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Zap className="w-4 h-4 text-emerald-300" />
            <span>Subscribe {selectedBouquet ? formatKoboToNgn(selectedBouquet.selling_price) : ''}</span>
          </button>
        </form>
      </div>

      <PinConfirmModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onConfirm={handleConfirmVend}
        amountKobo={selectedBouquet?.selling_price || 0}
        recipientDescription={`${provider} (${selectedBouquet?.name}) for ${smartcardNo} (${verifiedName})`}
        isLoading={isLoading}
      />
    </div>
  );
};
