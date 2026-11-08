import React, { useState, useEffect } from 'react';
import { signInVerified, signUpWithVerification } from '../../lib/auth';
import { signInWithGoogle, handleGoogleRedirectResult } from '../../lib/googleAuth';
import { GoogleSignInButton } from '../auth/GoogleSignInButton';
import { GoogleLinkModal } from '../auth/GoogleLinkModal';
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AuthPagesProps {
  initialMode?: 'login' | 'register' | 'forgot';
  verifiedSuccessNotice?: boolean;
  onSuccess: () => void;
  onNavigateMode: (mode: 'login' | 'register' | 'forgot') => void;
  onRequireVerification: (email: string, password?: string) => void;
}

export const AuthPages: React.FC<AuthPagesProps> = ({
  initialMode = 'login',
  verifiedSuccessNotice = false,
  onSuccess,
  onNavigateMode,
  onRequireVerification,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isResolvingRedirect, setIsResolvingRedirect] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkEmail, setLinkEmail] = useState<string | undefined>(undefined);

  // Handle Google Mobile Redirect Result once on mount before onAuthStateChanged guard fires
  useEffect(() => {
    let mounted = true;
    handleGoogleRedirectResult()
      .then((user) => {
        if (!mounted) return;
        if (user) {
          onSuccess();
        }
      })
      .catch((err: any) => {
        if (!mounted) return;
        if (err?.isAccountExistsDifferentCredential) {
          setLinkEmail(err?.email);
          setLinkModalOpen(true);
        } else if (err?.code === 'auth/email-not-verified') {
          onRequireVerification(err?.email || '', '');
        } else if (err?.message) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (mounted) {
          setIsResolvingRedirect(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [onSuccess, onRequireVerification]);

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
    setError(null);
    setIsGoogleLoading(true);

    try {
      const user = await signInWithGoogle();
      if (user) {
        onSuccess();
      }
    } catch (err: any) {
      if (err?.isAccountExistsDifferentCredential) {
        setLinkEmail(err?.email);
        setLinkModalOpen(true);
      } else if (err?.code === 'auth/email-not-verified') {
        onRequireVerification(err?.email || email, '');
      } else if (err?.isPopupBlocked) {
        setError('Please allow popups for this site, then try again — or use email and password below.');
      } else if (err?.message) {
        setError(err.message);
      }
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

  // Prevent UI flicker while redirect result resolves
  if (isResolvingRedirect) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full mb-3" />
        <p className="text-xs font-semibold text-slate-600">Verifying your secure session...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      {/* Account Linking Modal for existing email/password user who attempts Google */}
      <GoogleLinkModal
        isOpen={linkModalOpen}
        email={linkEmail}
        onClose={() => setLinkModalOpen(false)}
        onSignInWithPassword={(prefilledEmail) => {
          setMode('login');
          if (prefilledEmail) setEmail(prefilledEmail);
          setError(null);
        }}
      />

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl space-y-6">
        <div className="text-center space-y-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white font-extrabold text-xl flex items-center justify-center mx-auto mb-2">
            S
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            {mode === 'login' ? 'Sign In to Sayyada' : mode === 'register' ? 'Create Free Account' : 'Reset Password'}
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

        {/* Existing Error Alert Box */}
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-In Button on Login & Register surfaces */}
        {mode !== 'forgot' && (
          <div className="space-y-4">
            <GoogleSignInButton
              onClick={handleGoogleSignIn}
              isLoading={isGoogleLoading}
              disabled={isLoading || isGoogleLoading}
              text={mode === 'register' ? 'Sign up with Google' : 'Continue with Google'}
            />

            <div className="relative flex items-center justify-center">
              <div className="border-t border-slate-200 w-full" />
              <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                or
              </span>
              <div className="border-t border-slate-200 w-full" />
            </div>
          </div>
        )}


        {mode === 'login' ? (
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
              disabled={isLoading}
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
                className="text-xs font-bold text-emerald-800 hover:underline"
              >
                Create Account
              </button>
            </div>
          </form>
        ) : mode === 'register' ? (
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
              By creating an account, you agree to Sayyada Datasub&apos;s Terms &amp; Refund Policy.
            </p>

            <button
              type="submit"
              disabled={isLoading}
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
                className="text-xs font-bold text-emerald-800 hover:underline"
              >
                Sign In
              </button>
            </div>
          </form>
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
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors"
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
                className="text-xs text-slate-500 hover:underline"
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
