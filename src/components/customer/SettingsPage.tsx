import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Key, Bell, CheckCircle2, AlertCircle } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, setSecurityPin, toggleTwoFactor } = useAuth();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinSuccess, setPinSuccess] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsReceipts, setSmsReceipts] = useState(true);
  const [whatsappReceipts, setWhatsappReceipts] = useState(false);

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
    </div>
  );
};
