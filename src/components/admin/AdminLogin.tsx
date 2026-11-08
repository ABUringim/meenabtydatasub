import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminSignInWithGoogle } from '../../lib/googleAuth';
import { GoogleSignInButton } from '../auth/GoogleSignInButton';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
  onReturnToHome: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onReturnToHome }) => {
  const { adminLogin } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requires2fa, setRequires2fa] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleAdminLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      const res = await adminSignInWithGoogle();
      if (res && res.requires2FA) {
        setEmail(res.email);
        setRequires2fa(true);
      }
    } catch (err: any) {
      if (err?.code === 'not_admin') {
        setError('This account does not have admin access.');
      } else if (err?.code === 'auth/user-disabled') {
        setError('This administrative account has been disabled. Please contact support@sayyadadatasub.com.');
      } else if (err?.message) {
        setError(err.message);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await adminLogin(email, password, requires2fa ? totpCode : undefined);
      if (res.success) {
        onSuccess();
      } else if (res.requires2fa) {
        setRequires2fa(true);
      } else if (res.error) {
        setError(res.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoOwner = () => {
    setEmail('owner@sayyadadatasub.com');
    setPassword('OwnerSecure2026!');
    setRequires2fa(true);
    setTotpCode('123456');
    setError(null);
  };

  const fillDemoAdmin = () => {
    setEmail('admin@sayyadadatasub.com');
    setPassword('AdminSecure2026!');
    setRequires2fa(true);
    setTotpCode('123456');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6 text-white relative">
        <button
          onClick={onReturnToHome}
          className="absolute left-6 top-6 text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Exit to Public Site</span>
        </button>

        <div className="text-center pt-4 space-y-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-black tracking-tight text-white">
            Sayyada Datasub Security Portal
          </h1>
          <p className="text-xs text-slate-400">
            Administrative & Owner Operations Console · Tier 3 Isolated Route
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/80 border border-rose-800 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!requires2fa && (
          <div className="space-y-4">
            <GoogleSignInButton
              onClick={handleGoogleAdminLogin}
              isLoading={isGoogleLoading}
              disabled={isLoading || isGoogleLoading}
              text="Continue with Google"
            />

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-950 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                or admin credentials
              </span>
              <div className="border-t border-slate-800 w-full" />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!requires2fa ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Authorized Admin Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@sayyadadatasub.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>


              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Admin Passkey
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{isLoading ? 'Authenticating...' : 'Continue to 2FA Challenge'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="space-y-4 animate-in fade-in">
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 rounded-xl text-xs text-emerald-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Mandatory Two-Factor Authentication (2FA)</span>
                </div>
                <p className="text-[11px] text-slate-300">
                  Enter the 6-digit TOTP code from your Google Authenticator or registered email.
                </p>
                <p className="text-[11px] font-mono text-emerald-400 font-semibold">Demo TOTP Code: 123456</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  6-Digit Authenticator Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={totpCode}
                  onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="w-full py-3 bg-slate-900 border border-slate-700 rounded-xl text-lg font-mono text-center font-bold tracking-widest text-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || totpCode.length < 4}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <span>{isLoading ? 'Verifying 2FA...' : 'Authorize Admin Session'}</span>
              </button>

              <button
                type="button"
                onClick={() => setRequires2fa(false)}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-200"
              >
                ← Back to credentials
              </button>
            </div>
          )}
        </form>

        {/* Quick Demo Credentials Box for Evaluation */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <p className="text-[11px] text-slate-500 font-medium text-center">Quick Demo Access (One-Click):</p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={fillDemoOwner}
              className="py-2 px-3 bg-amber-950/40 hover:bg-amber-900/40 border border-amber-800/80 text-amber-300 font-semibold rounded-lg text-center transition-colors"
            >
              Fill Demo Owner
            </button>
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="py-2 px-3 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-800/80 text-indigo-300 font-semibold rounded-lg text-center transition-colors"
            >
              Fill Demo Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
