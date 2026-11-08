import React, { useState } from 'react';
import { useWallet } from '../../../context/WalletContext';
import { NIGERIAN_DISCOS } from '../../../data/initialData';
import { vtuProvider } from '../../../services/vtuProvider';
import { formatNgn, formatKoboToNgn, generateReference } from '../../../lib/formatters';
import { PinConfirmModal } from '../../shared/PinConfirmModal';
import { Zap, CheckCircle2, AlertCircle, Search } from 'lucide-react';

export const ElectricityService: React.FC = () => {
  const { vend, balanceKobo, beneficiaries, addBeneficiary } = useWallet();

  const [disco, setDisco] = useState<string>(NIGERIAN_DISCOS[3].id); // default KEDCO (Kano)
  const [meterType, setMeterType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [meterNo, setMeterNo] = useState<string>('');
  const [amountNgn, setAmountNgn] = useState<number>(3000);
  const [verifiedName, setVerifiedName] = useState<string | null>(null);
  const [verifiedAddress, setVerifiedAddress] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveAsBeneficiary, setSaveAsBeneficiary] = useState<boolean>(false);

  const selectedDiscoObj = NIGERIAN_DISCOS.find((d) => d.id === disco) || NIGERIAN_DISCOS[0];

  const convenienceFeeNgn = 100;
  const totalPayableNgn = amountNgn + convenienceFeeNgn;
  const totalPayableKobo = totalPayableNgn * 100;
  const costKobo = amountNgn * 100;
  const profitKobo = convenienceFeeNgn * 100;

  const handleVerify = async () => {
    if (!meterNo || meterNo.length < 8) {
      setError('Please enter a valid meter number (8–11 digits)');
      return;
    }
    setIsVerifying(true);
    setError(null);
    try {
      const res = await vtuProvider.verifyMeter(selectedDiscoObj.name, meterNo, meterType);
      setVerifiedName(res.name);
      setVerifiedAddress(res.address);
    } catch (err: any) {
      setError(err.message || 'Failed to verify meter');
      setVerifiedName(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifiedName) {
      setError('Please click "Verify Meter" before proceeding to payment');
      return;
    }
    if (amountNgn < 500) {
      setError('Minimum electricity recharge amount is ₦500');
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
      const reference = generateReference('SD_ELEC');
      await vend({
        service: 'electricity',
        provider: selectedDiscoObj.name,
        amountKobo: totalPayableKobo,
        costKobo,
        profitKobo,
        reference,
        recipientDetails: {
          meterNo,
          meterType,
          disco: selectedDiscoObj.name,
          customerName: verifiedName || '',
          address: verifiedAddress || '',
          amountNgn,
        },
      });

      if (saveAsBeneficiary && verifiedName) {
        addBeneficiary({
          type: 'meter',
          label: `${verifiedName} (${selectedDiscoObj.name.split(' ')[0]})`,
          value: meterNo,
          provider: selectedDiscoObj.id.toUpperCase(),
          additionalInfo: `${verifiedName} (${meterType})`,
        });
      }

      setIsPinModalOpen(false);
      setMeterNo('');
      setVerifiedName(null);
      setVerifiedAddress(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const meterBeneficiaries = beneficiaries.filter((b) => b.type === 'meter');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Electricity Bill Payment (All DisCos)</h2>
            <p className="text-xs text-slate-500">
              Instant 20-digit prepaid meter token generation & postpaid bill settlement
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
          {/* DisCo Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Electricity Distribution Company (DisCo)
            </label>
            <select
              value={disco}
              onChange={(e) => {
                setDisco(e.target.value);
                setVerifiedName(null);
              }}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            >
              {NIGERIAN_DISCOS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} — {d.state}
                </option>
              ))}
            </select>
          </div>

          {/* Meter Type */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Meter Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setMeterType('prepaid');
                  setVerifiedName(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                  meterType === 'prepaid'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                Prepaid (Token Generation)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMeterType('postpaid');
                  setVerifiedName(null);
                }}
                className={`py-2 text-xs font-bold rounded-lg border transition-colors ${
                  meterType === 'postpaid'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                Postpaid (Monthly Bill)
              </button>
            </div>
          </div>

          {/* Quick Saved Meters */}
          {meterBeneficiaries.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Saved Meter Numbers
              </label>
              <div className="flex flex-wrap gap-2">
                {meterBeneficiaries.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setMeterNo(b.value);
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

          {/* Meter Number with Verify button */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Meter Number
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={meterNo}
                onChange={(e) => {
                  setMeterNo(e.target.value.replace(/\D/g, ''));
                  setVerifiedName(null);
                }}
                placeholder="Enter 8 to 11 digit meter number"
                className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleVerify}
                disabled={isVerifying || !meterNo}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isVerifying ? 'Verifying...' : 'Verify Meter'}</span>
              </button>
            </div>
          </div>

          {/* Verified Customer Card */}
          {verifiedName && (
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-300 rounded-lg flex items-start gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-bold text-emerald-950">{verifiedName}</p>
                <p className="text-emerald-800 mt-0.5">{verifiedAddress}</p>
                <p className="text-[11px] text-emerald-700 mt-1 font-semibold">
                  ✓ Meter validated on {selectedDiscoObj.name} network
                </p>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Electricity Amount (₦)
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[1000, 2000, 3000, 5000].map((val) => (
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
                  ₦{val.toLocaleString()}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={500}
              max={500000}
              value={amountNgn}
              onChange={(e) => setAmountNgn(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
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
              <span>Save meter to beneficiaries</span>
            </label>
          </div>

          {/* Fee & Total Summary */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Electricity Value:</span>
              <span className="font-mono">₦{amountNgn.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Convenience Fee:</span>
              <span className="font-mono">₦{convenienceFeeNgn.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Total Wallet Deduction:</span>
              <span className="font-mono">{formatNgn(totalPayableNgn)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!verifiedName}
            className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Zap className="w-4 h-4 text-emerald-300" />
            <span>Generate Token & Pay {formatNgn(totalPayableNgn)}</span>
          </button>
        </form>
      </div>

      <PinConfirmModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onConfirm={handleConfirmVend}
        amountKobo={totalPayableKobo}
        recipientDescription={`${selectedDiscoObj.name} Meter ${meterNo} (${verifiedName})`}
        isLoading={isLoading}
      />
    </div>
  );
};
