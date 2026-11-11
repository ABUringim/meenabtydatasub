import React, { useEffect, useRef, useCallback } from 'react';
import { dashboardUrl, IS_HASH_ROUTING } from '../billingConfig.js';
import { XCircle, ArrowRight } from 'lucide-react';

export const FailurePage = ({ onNavigate }) => {
  const redirectTimerRef = useRef(null);

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

  useEffect(() => {
    // 1.5s countdown from mount
    redirectTimerRef.current = setTimeout(() => {
      doRedirect();
    }, 1500);

    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, [doRedirect]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6 bg-slate-50">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6 text-center animate-in fade-in-50 zoom-in-95">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8 text-rose-600" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Payment cancelled</h2>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Your wallet has not been charged. You can try again from your dashboard.
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={doRedirect}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <span>Return to Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FailurePage;
