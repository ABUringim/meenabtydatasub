import React, { useState } from 'react';
import { signInVerified, signUpWithVerification } from '../../lib/auth';
import { useAuth } from '../../context/AuthContext';
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthPagesProps {
  initialMode?: 'login' | 'register' | 'forgot';
  verifiedSuccessNotice?: boolean;
  onSuccess: () => void;
  onNavigateMode: (mode: 'login' | 'register' | 'forgot') => void;
  onRequireVerification: (email: string, password?: string) => void;
}

const GoogleIcon: React.FC = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

export const AuthPages: React.FC<AuthPagesProps> = ({
  initialMode = 'login',
  verifiedSuccessNotice = false,
  onSuccess,
  onNavigateMode,
  onRequireVerification,
}) => {
  const { loginWithGoogle } = useAuth();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear errors when the user edits fields
  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (error) setError(null);
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (error) setError(null);
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      await loginWithGoogle();
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Google Sign-In could not be completed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);

    try {
      await signInVerified(email, password);
      onSuccess();
    } catch (err: any) {
      if (err?.code === 'auth/email-not-verified') {
        onRequireVerification(err?.email || email, password);
        return;
      }
      setError(err?.message || 'Email or password is incorrect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Creates account in Firebase Auth
      // 2. Dispatches verification email
      // 3. Immediately signs out (no auto-login)
      const registeredEmail = await signUpWithVerification(email, password);
      onRequireVerification(registeredEmail, password);
    } catch (err: any) {
      setError(err?.message || 'An account with this email already exists. Please sign in instead.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-extrabold text-xl flex items-center justify-center mx-auto mb-2">
            M
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {mode === 'login' ? 'Sign In to Meenabty' : mode === 'register' ? 'Create Free Account' : 'Reset Password'}
          </h2>
          <p className="text-xs text-slate-500">
            {mode === 'login'
              ? 'Access your wallet, saved beneficiaries, and transaction receipts'
              : 'Instant access to wholesale data, bill payments, and Paystack wallet funding'}
          </p>
        </div>

        {/* Verification Success Toast (e.g. from /auth?verified=1 landing link) */}
        {verifiedSuccessNotice && mode === 'login' && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>Email verified! You can now sign in.</span>
          </div>
        )}

        {/* Error Alert Box */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {mode === 'login' ? (
          <div className="space-y-4">
            {/* Google Sign-In Button */}
            <button
              type="button"
              disabled={isLoading || isGoogleLoading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GoogleIcon />
              <span>{isGoogleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-slate-400 font-medium uppercase tracking-wider shrink-0">
                or continue with email
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-[11px] text-emerald-700 hover:underline"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:cursor-not-allowed"
              >
                <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Don&apos;t have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setError(null);
                  }}
                  className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        ) : mode === 'register' ? (
          <div className="space-y-4">
            {/* Google Sign-Up Button */}
            <button
              type="button"
              disabled={isLoading || isGoogleLoading}
              onClick={handleGoogleSignIn}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-700 font-semibold text-xs rounded-lg transition-all flex items-center justify-center gap-2.5 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <GoogleIcon />
              <span>{isGoogleLoading ? 'Connecting to Google...' : 'Sign up with Google'}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] text-slate-400 font-medium uppercase tracking-wider shrink-0">
                or register with email
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>

            <form onSubmit={handleSignUpSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name (Optional)</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Abubakar Ringim"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="youremail@example.com"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Create Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="At least 6 characters"
                    minLength={6}
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>
              </div>

              <p className="text-[11px] text-slate-500 leading-normal">
                By creating an account, you agree to Meenabty Datasub&apos;s Terms &amp; Refund Policy.
              </p>

              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:cursor-not-allowed"
              >
                <span>{isLoading ? 'Creating Account...' : 'Complete Registration'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="text-center pt-2">
                <span className="text-xs text-slate-500">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setError(null);
                  }}
                  className="text-xs font-bold text-emerald-800 hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </form>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              setMode('login');
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Your Registered Email</label>
              <input
                type="email"
                required
                placeholder="youremail@example.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Send Reset Link
            </button>
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className="text-xs text-slate-500 hover:underline cursor-pointer"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
