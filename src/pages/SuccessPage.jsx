import React, { useState, useEffect, useRef, useCallback } from 'react';
import { verifyPayment } from '../services/paystack';
import { dashboardUrl, IS_HASH_ROUTING } from '../billingConfig.js';
import { formatKoboToNgn } from '../lib/formatters';
import { CheckCircle2, Clock, AlertCircle, RefreshCw, ArrowRight, LifeBuoy } from 'lucide-react';

export const SuccessPage = ({ onNavigate }) => {
  const [state, setState] = useState('verifying'); // 'verifying' | 'success' | 'pending' | 'failed' | 'missing'
  const [paymentData, setPaymentData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const redirectTimerRef = useRef(null);

  // Helper for safe router navigation
  const doRedirect = useCallback(() => {
    if (onNavigate) {
      onNavigate('customer-dashboard');
      return;
    }
    const targetUrl = dashboardUrl();
    if (typeof window !== 'undefined') {
      try {
        const parsed = new URL(targetUrl);
        const destination = IS_HASH_ROUTING
          ? (parsed.hash || '#/dashboard')
          : (parsed.pathname || '/dashboard');

        if (IS_HASH_ROUTING) {
          window.location.hash = destination.startsWith('#') ? destination : `#${destination}`;
        } else {
          window.history.pushState({}, '', destination);
          window.dispatchEvent(new PopStateEvent('popstate'));
        }
      } catch {
        window.location.assign(targetUrl);
      }
    }
  }, [onNavigate]);

  // Read reference from URL search params (or hash query params)
  const getReferenceFromUrl = useCallback(() => {
    if (typeof window === 'undefined') return '';
    let params = new URLSearchParams(window.location.search);
    let ref = params.get('reference') || params.get('trxref');
    if (!ref && window.location.hash.includes('?')) {
      const hashQuery = window.location.hash.split('?')[1];
      params = new URLSearchParams(hashQuery);
      ref = params.get('reference') || params.get('trxref');
    }
    return ref || '';
  }, []);

  const verifyWithTimeout = useCallback(async (reference) => {
    const TIMEOUT_MS = 20_000;
    let timedOut = false;

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        timedOut = true;
        reject(new Error('TIMEOUT'));
      }, TIMEOUT_MS);
    });

    try {
      return await Promise.race([
        verifyPayment({ reference }),
        timeoutPromise,
      ]);
    } catch (err) {
      if (timedOut || err?.message === 'TIMEOUT') {
        throw new Error('VERIFICATION_TIMEOUT');
      }
      throw err;
    }
  }, []);

  const runVerification = useCallback(async () => {
    if (redirectTimerRef.current) {
      clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }

    const ref = getReferenceFromUrl();
    if (!ref) {
      setState('missing');
      redirectTimerRef.current = setTimeout(() => {
        doRedirect();
      }, 1500);
      return;
    }

    setState('verifying');
    setErrorMessage('');

    try {
      const res = await verifyWithTimeout(ref);
      if (res.status === 'success') {
        setPaymentData(res);
        setState('success');
        // Countdown starts when success state renders
        redirectTimerRef.current = setTimeout(() => {
          doRedirect();
        }, 1500);
      } else if (res.status === 'pending') {
        setState('pending');
        redirectTimerRef.current = setTimeout(() => {
          doRedirect();
        }, 2500);
      } else {
        setState('failed');
        setErrorMessage(res.message || "We couldn't confirm this payment");
      }
    } catch (err) {
      setState('failed');
      if (err?.message === 'VERIFICATION_TIMEOUT') {
        setErrorMessage(
          "We couldn't confirm your payment in time. Your wallet will be credited automatically once Paystack confirms it — usually within 30 seconds. Check your dashboard, or retry now."
        );
      } else {
        setErrorMessage(err?.message || "We couldn't confirm this payment");
      }
    }
  }, [getReferenceFromUrl, verifyWithTimeout, doRedirect]);

  useEffect(() => {
    runVerification();
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, [runVerification]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6 text-center animate-in fade-in-50 zoom-in-95">
        
        {/* State 1: Verifying */}
        {state === 'verifying' && (
          <div className="space-y-4 py-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto">
              <RefreshCw className="w-7 h-7 text-emerald-600 animate-spin" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Verifying payment…</h2>
              <p className="text-xs text-slate-500">
                Confirming transaction securely with Paystack. Please do not close this window.
              </p>
            </div>
          </div>
        )}

        {/* State 2: Success */}
        {state === 'success' && (
          <div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            
            <div className="space-y-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Payment successful</h2>
              <p className="text-xs text-slate-500">
                Your wallet has been funded successfully. Redirecting to your dashboard in a moment…
              </p>
            </div>

            {paymentData && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2 text-left text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Amount Credited</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">
                    {formatKoboToNgn(paymentData.amount || 0)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pt-2 border-t border-slate-200">
                  <span>New Wallet Balance</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {formatKoboToNgn(paymentData.walletBalance || 0)}
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={doRedirect}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Go to Dashboard Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* State 3: Pending */}
        {state === 'pending' && (
          <div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-amber-600" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Processing Payment</h2>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Payment is being processed — check your dashboard in a moment
              </p>
            </div>
            <button
              type="button"
              onClick={doRedirect}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* State 4: Failed */}
        {state === 'failed' && (
          <div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-rose-600" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">We couldn&apos;t confirm this payment</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {errorMessage || "The transaction reference could not be verified by Paystack."}
              </p>
            </div>
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={runVerification}
                className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Verification</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onNavigate) onNavigate('support');
                  else doRedirect();
                }}
                className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LifeBuoy className="w-4 h-4 text-slate-500" />
                <span>Contact Support</span>
              </button>
            </div>
          </div>
        )}

        {/* State 5: Missing Reference */}
        {state === 'missing' && (
          <div className="space-y-5">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-amber-600" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900">Invalid payment link</h2>
              <p className="text-xs text-slate-500">
                No transaction reference was found in the URL. Redirecting to dashboard…
              </p>
            </div>
            <button
              type="button"
              onClick={doRedirect}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default SuccessPage;
