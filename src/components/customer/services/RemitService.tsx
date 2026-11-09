import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useWallet } from '../../../context/WalletContext';
import { NIGERIAN_BANKS } from '../../../data/initialData';
import { vtuProvider } from '../../../services/vtuProvider';
import { formatNgn, formatKoboToNgn, generateReference } from '../../../lib/formatters';
import { PinConfirmModal } from '../../shared/PinConfirmModal';
import { SendHorizontal, CheckCircle2, AlertCircle, ShieldAlert, Search, Zap } from 'lucide-react';

interface RemitServiceProps {
  onNavigateToKyc?: () => void;
}

export const RemitService: React.FC<RemitServiceProps> = ({ onNavigateToKyc }) => {
  const { user } = useAuth();
  const { vend, balanceKobo, beneficiaries, addBeneficiary } = useWallet();

  const [bankCode, setBankCode] = useState<string>(NIGERIAN_BANKS[0].code);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [accountName, setAccountName] = useState<string | null>(null);
  const [amountNgn, setAmountNgn] = useState<number>(5000);
  const [narration, setNarration] = useState<string>('Funds Transfer');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveAsBeneficiary, setSaveAsBeneficiary] = useState<boolean>(false);

  const selectedBank = NIGERIAN_BANKS.find((b) => b.code === bankCode) || NIGERIAN_BANKS[0];

  const transferFeeNgn = 25;
  const totalPayableNgn = amountNgn + transferFeeNgn;
  const totalPayableKobo = totalPayableNgn * 100;
  const costKobo = amountNgn * 100;
  const profitKobo = transferFeeNgn * 100;

  const isTier2 = user?.tier === 2 && user?.kyc_status === 'verified';

  const handleVerifyAccount = async () => {
    if (!accountNumber || accountNumber.length !== 10) {
      setError('Please enter a valid 10-digit NUBAN account number');
      return;
    }
    setIsVerifying(true);
    setError(null);
    try {
      const res = await vtuProvider.verifyBankAccount(bankCode, accountNumber);
      setAccountName(res.accountName);
    } catch (err: any) {
      setError(err.message || 'Account name could not be resolved');
      setAccountName(null);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTier2) {
      setError('Central Bank of Nigeria (CBN) regulations mandate Tier 2 BVN/NIN verification for inter-bank Remit.');
      return;
    }
    if (!accountName) {
      setError('Please verify account number before proceeding');
      return;
    }
    if (amountNgn < 100) {
      setError('Minimum transfer amount is ₦100');
      return;
    }
    if (totalPayableKobo > balanceKobo) {
      setError(
        `Insufficient wallet balance. Total needed is ${formatKoboToNgn(
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
      const reference = generateReference('SD_REMIT');
      await vend({
        service: 'remit',
        provider: selectedBank.name,
        amountKobo: totalPayableKobo,
        costKobo,
        profitKobo,
        reference,
        recipientDetails: {
          bankName: selectedBank.name,
          bankCode: selectedBank.code,
          accountNumber,
          accountName: accountName || '',
          narration,
        },
      });

      if (saveAsBeneficiary && accountName) {
        addBeneficiary({
          type: 'bank',
          label: `${accountName} (${selectedBank.name.split(' ')[0]})`,
          value: accountNumber,
          provider: selectedBank.name,
          additionalInfo: accountName,
        });
      }

      setIsPinModalOpen(false);
      setAccountNumber('');
      setAccountName(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const bankBeneficiaries = beneficiaries.filter((b) => b.type === 'bank');

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3 pb-4 mb-4 border-b border-slate-100">
          <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700">
            <SendHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Remit — Instant Money Transfer</h2>
            <p className="text-xs text-slate-500">
              Transfer funds from your Meenabty wallet to any commercial or microfinance bank in Nigeria
            </p>
          </div>
        </div>

        {/* Tier 2 Alert if user is Tier 1 */}
        {!isTier2 && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 mb-4">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-amber-950">Tier 2 Verification Required</p>
              <p className="text-amber-800 mt-0.5">
                In compliance with Central Bank of Nigeria (CBN) regulations, money transfers require verified BVN or NIN.
              </p>
              {onNavigateToKyc && (
                <button
                  type="button"
                  onClick={onNavigateToKyc}
                  className="mt-2 px-3 py-1 bg-amber-800 text-white rounded text-xs font-semibold hover:bg-amber-900"
                >
                  Complete Free KYC Verification
                </button>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Bank Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Destination Bank
            </label>
            <select
              value={bankCode}
              onChange={(e) => {
                setBankCode(e.target.value);
                setAccountName(null);
              }}
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            >
              {NIGERIAN_BANKS.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Beneficiaries */}
          {bankBeneficiaries.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                Saved Bank Beneficiaries
              </label>
              <div className="flex flex-wrap gap-2">
                {bankBeneficiaries.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setAccountNumber(b.value);
                      const matchedBank = NIGERIAN_BANKS.find((k) => k.name === b.provider);
                      if (matchedBank) setBankCode(matchedBank.code);
                      setAccountName(b.additionalInfo || b.label);
                    }}
                    className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                  >
                    {b.label} ({b.value})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Account Number with Name Enquiry Verify */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              10-Digit Account Number (NUBAN)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(e.target.value.replace(/\D/g, ''));
                  setAccountName(null);
                }}
                maxLength={10}
                placeholder="e.g. 0123456789"
                className="flex-1 px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
              <button
                type="button"
                onClick={handleVerifyAccount}
                disabled={isVerifying || accountNumber.length !== 10}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{isVerifying ? 'Resolving...' : 'Check Name'}</span>
              </button>
            </div>
          </div>

          {accountName && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <div>
                <span className="text-slate-500">Account Name: </span>
                <span className="font-bold text-emerald-950">{accountName}</span>
              </div>
            </div>
          )}

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Transfer Amount (₦)
            </label>
            <input
              type="number"
              min={100}
              max={5000000}
              value={amountNgn}
              onChange={(e) => setAmountNgn(parseInt(e.target.value, 10) || 0)}
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          {/* Narration */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Transfer Narration / Remarks
            </label>
            <input
              type="text"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="e.g. For supplies / Family support"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs"
            />
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
              <span>Save bank account to beneficiaries</span>
            </label>
          </div>

          {/* Cost Summary */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Transfer Amount:</span>
              <span className="font-mono">{formatNgn(amountNgn)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>NIP Transfer Fee:</span>
              <span className="font-mono">₦{transferFeeNgn}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
              <span>Total Wallet Deduction:</span>
              <span className="font-mono">{formatNgn(totalPayableNgn)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!accountName || !isTier2}
            className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs"
          >
            <Zap className="w-4 h-4 text-emerald-300" />
            <span>Send {formatNgn(totalPayableNgn)}</span>
          </button>
        </form>
      </div>

      <PinConfirmModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onConfirm={handleConfirmVend}
        amountKobo={totalPayableKobo}
        recipientDescription={`Transfer to ${accountName} (${accountNumber} · ${selectedBank.name})`}
        isLoading={isLoading}
      />
    </div>
  );
};
