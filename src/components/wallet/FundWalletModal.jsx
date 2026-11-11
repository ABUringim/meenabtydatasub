import React, { useState, useEffect, useRef } from 'react';
import { Modal } from '../shared/Modal';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import app from '../../lib/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { CreditCard, AlertCircle, Loader2, ArrowRight, RefreshCw } from 'lucide-react';

export const FundWalletModal = ({
  open = false,
  isOpen = false,
  onClose = () => {},
  prefilledAmount = null,
}) => {
  const isModalOpen = open || isOpen || false;
  const { user } = useAuth();
  const { fundWallet } = useWallet();

  const presets = [500, 1000, 2000, 5000, 10000];

  const [selectedAmount, setSelectedAmount] = useState(1000);
  const [customAmount, setCustomAmount] = useState('1000');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [elapsed, setElapsed] = useState(0);

  const timerRef = useRef(null);
  const abortRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (abortRef.current) clearTimeout(abortRef.current);
    };
  }, []);

  useEffect(() => {
    if (prefilledAmount && prefilledAmount > 0) {
      const sanitized = Math.max(100, Math.min(500000, Math.round(prefilledAmount)));
      setSelectedAmount(sanitized);
      setCustomAmount(sanitized.toString());
    } else if (isModalOpen) {
      setSelectedAmount(1000);
      setCustomAmount('1000');
    }
    setError(null);
    setElapsed(0);
  }, [prefilledAmount, isModalOpen]);

  const handleSelectPreset = (val) => {
    setSelectedAmount(val);
    setCustomAmount(val.toString());
    setError(null);
  };

  const handleCustomChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '');
    setCustomAmount(raw);
    const parsed = parseInt(raw, 10) || 0;
    setSelectedAmount(parsed);
    setError(null);
  };

  const handleFund = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!selectedAmount || selectedAmount < 100) {
      setError('Minimum wallet funding amount is ₦100');
      return;
    }
    if (selectedAmount > 500000) {
      setError('Maximum single top-up limit is ₦500,000');
      return;
    }

    setIsLoading(true);
    setError(null);
    setElapsed(0);

    // Progress ticker (only visible after 5s)
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    const TIMEOUT_MS = 20_000;
    let timedOut = false;

    const timeoutPromise = new Promise((_, reject) => {
      abortRef.current = setTimeout(() => {
        timedOut = true;
        reject(new Error('TIMEOUT'));
      }, TIMEOUT_MS);
    });

    try {
      let authorizationUrl = null;

      try {
        const functions = getFunctions(app);
        const initializePayment = httpsCallable(functions, 'initializePayment');
        const res = await Promise.race([
          initializePayment({
            amount: selectedAmount * 100, // kobo
            amountKobo: selectedAmount * 100,
            email: user?.email,
          }),
          timeoutPromise,
        ]);

        if (!mountedRef.current) return;

        if (res?.data?.authorizationUrl) {
          authorizationUrl = res.data.authorizationUrl;
        }
      } catch (cloudFnErr) {
        if (!mountedRef.current) return;
        if (timedOut || cloudFnErr?.message === 'TIMEOUT') {
          throw new Error('TIMEOUT');
        }
        // Fallback gracefully to simulated/client-side Paystack flow if offline/demo
        console.warn('Direct Cloud Function initializePayment unavailable, using client gateway:', cloudFnErr);
      }

      if (!mountedRef.current) return; // customer closed modal

      if (authorizationUrl) {
        window.location.href = authorizationUrl; // Redirect to Paystack Checkout
        return;
      }

      // Client-side Paystack checkout execution with timeout protection
      await Promise.race([
        fundWallet(selectedAmount),
        timeoutPromise,
      ]);

      if (!mountedRef.current) return;
      if (onClose) onClose();
    } catch (err) {
      if (!mountedRef.current) return;

      if (timedOut || err?.message === 'TIMEOUT') {
        setError(
          'Payment is taking longer than expected. Please retry — you have not been charged.'
        );
      } else {
        setError(
          err?.message?.replace('Firebase: ', '') ||
            'Could not start payment. Please try again.'
        );
      }
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      if (abortRef.current) clearTimeout(abortRef.current);
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  };

  if (!isModalOpen) return null;

  return (
    <Modal
      isOpen={isModalOpen}
      onClose={onClose}
      title="Fund Your Wallet"
      subtitle="Top up instantly via Paystack with zero transaction fees"
      maxWidth="md"
    >
      <form onSubmit={handleFund} className="space-y-5">
        {/* Error Alert with Inline Retry */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 animate-in fade-in space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="flex-1 leading-relaxed">{error}</span>
            </div>
            <div className="pt-1 flex justify-end">
              <button
                type="button"
                onClick={handleFund}
                className="px-3 py-1 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-md transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        )}

        {/* Preset Amounts */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Select Top-Up Amount (₦)
          </label>
          <div className="grid grid-cols-5 gap-2">
            {presets.map((val) => {
              const isSelected = selectedAmount === val;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleSelectPreset(val)}
                  disabled={isLoading}
                  className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all text-center cursor-pointer ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-1 ring-emerald-600'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  ₦{val.toLocaleString()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Amount Input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Or Enter Custom Amount (₦100 – ₦500,000)
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">
              ₦
            </span>
            <input
              type="text"
              inputMode="numeric"
              disabled={isLoading}
              value={customAmount}
              onChange={handleCustomChange}
              placeholder="e.g. 2500"
              className="w-full pl-8 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden disabled:opacity-50"
            />
          </div>
        </div>

        {/* Notice */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Paystack Secure Checkout (Debit Card, Bank Transfer, USSD)</span>
          </div>
          <span className="font-bold text-slate-900 font-mono">
            ₦{(selectedAmount || 0).toLocaleString()}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          {/* Cancel button remains enabled during loading */}
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !selectedAmount || selectedAmount < 100}
            className="flex-1 py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                <span>
                  {elapsed < 5
                    ? 'Connecting to payment…'
                    : `Still connecting… ${elapsed}s`}
                </span>
              </>
            ) : (
              <>
                <span>Fund Wallet</span>
                <ArrowRight className="w-4 h-4 text-emerald-300" />
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FundWalletModal;
