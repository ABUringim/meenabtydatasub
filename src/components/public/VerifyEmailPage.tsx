import React, { useState, useEffect } from 'react';
import { resendVerification, recheckVerification } from '../../lib/auth';
import { Mail, CheckCircle2, AlertCircle, RefreshCw, ArrowLeft, Clock } from 'lucide-react';

interface VerifyEmailPageProps {
  email?: string;
  initialPassword?: string;
  onNavigateToLogin: () => void;
  onNavigateToDashboard: () => void;
}

export const VerifyEmailPage: React.FC<VerifyEmailPageProps> = ({
  email = 'your email',
  initialPassword = '',
  onNavigateToLogin,
  onNavigateToDashboard,
}) => {
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // 60-second cooldown timer for resending verification email
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setTimeout(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;

    setIsResending(true);
    setError(null);
    setSuccessNotice(null);

    try {
      await resendVerification(email, initialPassword);
      setSuccessNotice(`A fresh verification link has been sent to ${email}.`);
      setResendCooldown(60);
    } catch (err: any) {
      setError(err?.message || 'Could not resend email. Please try again in a moment.');
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsChecking(true);
    setError(null);
    setSuccessNotice(null);

    try {
      const isVerified = await recheckVerification(email, initialPassword);
      if (isVerified) {
        onNavigateToDashboard();
      } else {
        setError('Still not verified. Please check your inbox and tap the verification link, then try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Could not check verification status. Please refresh the page.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <Mail className="w-6 h-6 text-emerald-700" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Email Verification Required</h2>
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            We have sent you a verification email to <span className="text-slate-900 font-semibold">{email}</span>. Please verify it and log in.
          </p>
        </div>

        {/* Success Notice */}
        {successNotice && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 space-y-2">
          <p className="font-semibold text-slate-700">Next Steps:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Open the verification email and click the confirmation link.</li>
            <li>Didn&apos;t receive it? Check your spam folder, or tap below to resend.</li>
            <li>Verification emails sometimes land in spam or promotions.</li>
          </ul>
        </div>

        <div className="space-y-3 pt-2">
          {/* Prominent Login button specified in prompt: "A Login button that takes the user to the login screen" */}
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <span>Login</span>
            <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
          </button>

          {/* "I've verified my email" check button */}
          <button
            type="button"
            disabled={isChecking}
            onClick={handleCheckVerification}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:cursor-not-allowed"
          >
            <CheckCircle2 className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Checking Verification Status...' : "I've verified my email (Check Status)"}</span>
          </button>

          {/* "Resend verification email" button throttled to 60s */}
          <button
            type="button"
            disabled={resendCooldown > 0 || isResending}
            onClick={handleResend}
            className="w-full py-2 px-4 bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isResending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : resendCooldown > 0 ? (
              <Clock className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>
              {resendCooldown > 0
                ? `Resend available in ${resendCooldown}s`
                : isResending
                ? 'Sending Link...'
                : 'Resend verification email'}
            </span>
          </button>
        </div>

        <div className="text-center pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="text-xs font-semibold text-slate-600 hover:text-emerald-700 inline-flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login Screen</span>
          </button>
        </div>
      </div>
    </div>
  );
};
