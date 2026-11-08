import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  linkGoogleAccount,
  unlinkGoogleAccount,
  setPasswordForGoogleUser,
} from '../../lib/googleAuth';
import {
  ShieldCheck,
  Key,
  Bell,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  Unlink,
  Lock,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, firebaseUser, setSecurityPin, toggleTwoFactor } = useAuth();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsReceipts, setSmsReceipts] = useState(true);
  const [whatsappReceipts, setWhatsappReceipts] = useState(false);

  // Google Account Linking & Password Management State
  const [showLinkPrompt, setShowLinkPrompt] = useState(false);
  const [linkPassword, setLinkPassword] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [googleSuccess, setGoogleSuccess] = useState<string | null>(null);
  const [googleError, setGoogleError] = useState<string | null>(null);

  // Add password for Google-first users
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const isGoogleLinked = Boolean(
    firebaseUser?.providerData?.some((p) => p.providerId === 'google.com')
  );
  const hasPasswordProvider = Boolean(
    firebaseUser ? firebaseUser.providerData?.some((p) => p.providerId === 'password') : true
  );

  const handleLinkGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkPassword) {
      setGoogleError('Please enter your current account password to authorize linking.');
      return;
    }

    setIsLinking(true);
    setGoogleError(null);
    setGoogleSuccess(null);

    try {
      await linkGoogleAccount(linkPassword);
      setGoogleSuccess('Google Account linked successfully! You can now sign in with either password or Google.');
      setShowLinkPrompt(false);
      setLinkPassword('');
    } catch (err: any) {
      setGoogleError(err?.message || 'Could not link Google account.');
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    if (!hasPasswordProvider) {
      setGoogleError('Please set a password below before unlinking Google to avoid being locked out.');
      return;
    }

    setIsUnlinking(true);
    setGoogleError(null);
    setGoogleSuccess(null);

    try {
      await unlinkGoogleAccount();
      setGoogleSuccess('Google Account unlinked successfully.');
    } catch (err: any) {
      setGoogleError(err?.message || 'Could not unlink Google account.');
    } finally {
      setIsUnlinking(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsSettingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      await setPasswordForGoogleUser(newPassword);
      setPasswordSuccess('Password added! You can now sign in with either Google or email and password.');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      setPasswordError(err?.message || 'Could not set password. Please try again.');
    } finally {
      setIsSettingPassword(false);
    }
  };


  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setPinError('PIN must be exactly 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setPinError('PIN confirmation does not match');
      return;
    }
    await setSecurityPin(pin);
    setPinSuccess(true);
    setPinError(null);
    setPin('');
    setConfirmPin('');
    setTimeout(() => setPinSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">Security & Account Settings</h2>
        <p className="text-xs text-slate-500">
          Manage your transaction PIN, Two-Factor Authentication, and notification preferences
        </p>
      </div>

      {/* 4-Digit Security PIN */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <Key className="w-5 h-5 text-emerald-700" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Transaction Security PIN</h3>
            <p className="text-[11px] text-slate-500">Required before debiting wallet for any purchase</p>
          </div>
        </div>

        {pinSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Transaction PIN updated successfully!</span>
          </div>
        )}

        {pinError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{pinError}</span>
          </div>
        )}

        <form onSubmit={handleUpdatePin} className="space-y-4 max-w-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New 4-Digit PIN</label>
            <input
              type="password"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono tracking-widest focus:ring-2 focus:ring-emerald-600 focus:outline-hidden text-center font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm 4-Digit PIN</label>
            <input
              type="password"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="••••"
              className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm font-mono tracking-widest focus:ring-2 focus:ring-emerald-600 focus:outline-hidden text-center font-bold"
            />
          </div>

          <button
            type="submit"
            className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors"
          >
            Update Security PIN
          </button>
        </form>
      </div>

      {/* Two-Factor Authentication (2FA) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Two-Factor Authentication (2FA)</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Require an SMS OTP code on your registered phone number ({user?.phone}) whenever you log in or withdraw
            </p>
          </div>
        </div>
        <button
          onClick={toggleTwoFactor}
          className={`py-2 px-4 text-xs font-bold rounded-lg border transition-colors ${
            user?.twoFactorEnabled
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          {user?.twoFactorEnabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>

      {/* Notification Preferences */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Bell className="w-5 h-5 text-emerald-700" />
          <h3 className="text-sm font-bold text-slate-900">Vending & Receipt Notifications</h3>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer text-xs text-slate-700">
            <div>
              <p className="font-semibold text-slate-900">Instant Email Receipts</p>
              <p className="text-slate-500 text-[11px]">Receive official PDF receipt copy after every vending</p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer text-xs text-slate-700 pt-2 border-t border-slate-100">
            <div>
              <p className="font-semibold text-slate-900">SMS Token Delivery</p>
              <p className="text-slate-500 text-[11px]">Send electricity meter tokens & exam PINs via SMS</p>
            </div>
            <input
              type="checkbox"
              checked={smsReceipts}
              onChange={(e) => setSmsReceipts(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
          </label>

          <label className="flex items-center justify-between cursor-pointer text-xs text-slate-700 pt-2 border-t border-slate-100">
            <div>
              <p className="font-semibold text-slate-900">WhatsApp Alert Channel</p>
              <p className="text-slate-500 text-[11px]">Notify via WhatsApp for critical account updates</p>
            </div>
            <input
              type="checkbox"
              checked={whatsappReceipts}
              onChange={(e) => setWhatsappReceipts(e.target.checked)}
              className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
          </label>
        </div>
      </div>

      {/* Google Account Linking & Password Management */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <div className="w-6 h-6 flex items-center justify-center">
            <img src="/google-logo.svg" alt="Google" className="w-5 h-5 shrink-0" width={20} height={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Google Sign-In &amp; Linked Providers</h3>
            <p className="text-[11px] text-slate-500">
              Manage federated identity and password access across devices
            </p>
          </div>
        </div>

        {googleSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{googleSuccess}</span>
          </div>
        )}

        {googleError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{googleError}</span>
          </div>
        )}

        {/* Current Google Status */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-xl gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isGoogleLinked ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-slate-300'}`} />
            <div>
              <p className="text-xs font-bold text-slate-900">
                {isGoogleLinked ? 'Google Account Connected' : 'Google Account Not Linked'}
              </p>
              <p className="text-[11px] text-slate-500">
                {isGoogleLinked
                  ? `Active for ${firebaseUser?.email || user?.email || 'this account'}`
                  : 'Link Google to enjoy instant 1-tap sign in on mobile'}
              </p>
            </div>
          </div>

          <div>
            {isGoogleLinked ? (
              <button
                type="button"
                onClick={handleUnlinkGoogle}
                disabled={isUnlinking}
                className="py-2 px-3.5 bg-white border border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>{isUnlinking ? 'Unlinking...' : 'Unlink Google'}</span>
              </button>
            ) : (
              !showLinkPrompt && (
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkPrompt(true);
                    setGoogleError(null);
                  }}
                  className="py-2 px-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                >
                  <LinkIcon className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Link Google Account</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Password Prompt to Authorize Linking */}
        {showLinkPrompt && !isGoogleLinked && (
          <form onSubmit={handleLinkGoogle} className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-3 animate-in fade-in">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-900">
                Authorize Google Linking
              </label>
              <p className="text-[11px] text-slate-600">
                Enter your current account password to re-authenticate before connecting your Google account.
              </p>
            </div>

            <div className="max-w-sm">
              <input
                type="password"
                required
                value={linkPassword}
                onChange={(e) => setLinkPassword(e.target.value)}
                placeholder="Your current password"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isLinking || !linkPassword}
                className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {isLinking ? 'Verifying & Linking...' : 'Connect with Google'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLinkPrompt(false);
                  setLinkPassword('');
                  setGoogleError(null);
                }}
                className="py-2 px-3 bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Reverse Linking: Add a Password for Google-First Users */}
        {isGoogleLinked && !hasPasswordProvider && (
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex items-start gap-2">
              <Lock className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Add an Account Password</h4>
                <p className="text-[11px] text-slate-500">
                  You registered with Google one-tap sign in. Add a password to sign in via email/password or before unlinking Google.
                </p>
              </div>
            </div>

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {passwordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{passwordError}</span>
              </div>
            )}

            <form onSubmit={handleSetPassword} className="space-y-3 max-w-sm">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                />
              </div>

              <button
                type="submit"
                disabled={isSettingPassword || !newPassword}
                className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
              >
                {isSettingPassword ? 'Setting Password...' : 'Save Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

