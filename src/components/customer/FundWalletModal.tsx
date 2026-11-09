import React, { useState } from 'react';
import { Modal } from '../shared/Modal';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { formatNgn } from '../../lib/formatters';
import {
  CreditCard,
  Building2,
  Copy,
  Check,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FundWalletModal: React.FC<FundWalletModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const { fundWallet } = useWallet();

  const [activeTab, setActiveTab] = useState<'paystack' | 'transfer'>('paystack');
  const [amountNgn, setAmountNgn] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState<string>('5000');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);

  const presets = [1000, 2000, 5000, 10000, 20000, 50000];

  const handleSelectPreset = (val: number) => {
    setAmountNgn(val);
    setCustomAmount(val.toString());
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    setCustomAmount(raw);
    const parsed = parseInt(raw, 10) || 0;
    setAmountNgn(parsed);
  };

  const handlePaystackPay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountNgn < 100) return;
    setIsLoading(true);
    try {
      await fundWallet(amountNgn);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAccount = () => {
    if (user?.virtual_account?.accountNumber) {
      navigator.clipboard.writeText(user.virtual_account.accountNumber);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Fund Your Meenabty Wallet"
      subtitle="Instant 24/7 automated wallet credit with zero processing fees"
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Tab switch */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('paystack')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'paystack'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Paystack Inline (Cards, USSD)</span>
          </button>
          <button
            onClick={() => setActiveTab('transfer')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-colors ${
              activeTab === 'transfer'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Direct Bank Transfer (DVA)</span>
          </button>
        </div>

        {activeTab === 'paystack' ? (
          <form onSubmit={handlePaystackPay} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Select or Enter Top-Up Amount (₦)
              </label>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-colors ${
                      amountNgn === preset
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    ₦{preset.toLocaleString()}
                  </button>
                ))}
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  ₦
                </span>
                <input
                  type="text"
                  value={customAmount}
                  onChange={handleCustomChange}
                  className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 font-mono font-bold text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                  placeholder="Enter custom amount"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Minimum funding: ₦100 · Maximum: ₦1,000,000</p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Top-Up Amount:</span>
                <span className="font-mono font-semibold text-slate-900">{formatNgn(amountNgn)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Gateway Fee:</span>
                <span className="font-semibold text-emerald-700">₦0.00 (Free)</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold pt-1.5 border-t border-slate-200">
                <span>Total to Pay:</span>
                <span className="font-mono">{formatNgn(amountNgn)}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || amountNgn < 100}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Connecting to Paystack Gateway...</span>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-emerald-300" />
                  <span>Proceed to Paystack ({formatNgn(amountNgn)})</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Secured by Paystack Payments (PCI-DSS Level 1 Certified)</span>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-3">
              <p className="text-xs font-semibold text-emerald-950">
                Your Dedicated Virtual Account Details
              </p>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Transfer any amount from your bank app (Access, GTB, Kuda, OPay, etc.) directly to this account number.
                Your Meenabty wallet will be credited automatically within 10 seconds.
              </p>

              <div className="bg-white p-3 rounded-lg border border-emerald-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Bank Name</span>
                  <span className="font-bold text-slate-900">{user?.virtual_account?.bankName || 'Wema Bank'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Account Number</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-base font-extrabold text-emerald-900">
                      {user?.virtual_account?.accountNumber || '9928374102'}
                    </span>
                    <button
                      onClick={handleCopyAccount}
                      className="p-1 text-emerald-700 hover:bg-emerald-100 rounded transition-colors"
                      title="Copy account number"
                    >
                      {copiedAccount ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500">Account Name</span>
                  <span className="font-semibold text-slate-900 text-right">
                    {user?.virtual_account?.accountName || `MEENABTY-${user?.name.toUpperCase()}`}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors"
            >
              I Have Made the Transfer
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
