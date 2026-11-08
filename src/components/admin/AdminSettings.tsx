import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { PlatformSettings } from '../../types';
import {
  Settings,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Phone,
  Mail,
  MessageSquare,
  Globe,
  Clock,
  Save,
  Lock,
} from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const { user, isOwner } = useAuth();
  const currentSettings = storage.getSettings();

  const [maintenanceMode, setMaintenanceMode] = useState(currentSettings.maintenanceMode);
  const [maintenanceMessage, setMaintenanceMessage] = useState(currentSettings.maintenanceMessage);
  const [supportPhone, setSupportPhone] = useState(currentSettings.supportPhone);
  const [supportWhatsApp, setSupportWhatsApp] = useState(currentSettings.supportWhatsApp);
  const [supportEmail, setSupportEmail] = useState(currentSettings.supportEmail);
  const [allowlistIps, setAllowlistIps] = useState(currentSettings.allowlistIps.join(', '));
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    const ips = allowlistIps
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    storage.updateSettings({
      maintenanceMode,
      maintenanceMessage,
      supportPhone,
      supportWhatsApp,
      supportEmail,
      allowlistIps: ips,
    });

    storage.recordAuditLog(
      user?.uid || 'admin',
      user?.email || 'admin@sayyadadatasub.com',
      'PLATFORM_SETTINGS_UPDATE',
      `Maintenance: ${maintenanceMode}, Support updated`,
      { maintenanceMode, maintenanceMessage, supportPhone, supportEmail, allowlistIps: ips }
    );

    setSuccessMsg('Platform configuration updated and synchronized across server runtime.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-400" />
            Global Platform Configuration
          </h2>
          <p className="text-xs text-slate-400">
            Control maintenance mode state, support desk routing, IP allowlists, and regional currency standards
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-700 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
        {/* Maintenance Mode Card */}
        <div
          className={`p-5 rounded-2xl border transition-all ${
            maintenanceMode
              ? 'bg-rose-950/40 border-rose-800 shadow-md ring-1 ring-rose-700'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className={`w-5 h-5 ${maintenanceMode ? 'text-rose-400' : 'text-amber-400'}`} />
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Platform Emergency / Maintenance Mode
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  When active, a high-visibility warning banner is shown to public visitors & customers
                </p>
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-bold text-white">
                {maintenanceMode ? 'ACTIVE (SYSTEM LOCKED)' : 'Disabled (Normal Operations)'}
              </span>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500 bg-slate-950 border-slate-700"
              />
            </label>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Customer Broadcast Warning Notice
            </label>
            <textarea
              rows={2}
              required={maintenanceMode}
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              placeholder="e.g. Scheduled server maintenance in progress. Vending will resume shortly."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Customer Support Channels */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-3 border-b border-slate-800">
            Official Customer Support Desk Channels
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Support Phone Line</span>
              </label>
              <input
                type="text"
                required
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp Hotline</span>
              </label>
              <input
                type="text"
                required
                value={supportWhatsApp}
                onChange={(e) => setSupportWhatsApp(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-semibold mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>Escalation Email</span>
              </label>
              <input
                type="email"
                required
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Security & Access Guard */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-3 border-b border-slate-800 flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            IP Access Allowlist & Session Security
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Admin Console IP Allowlist (Comma Separated)
              </label>
              <input
                type="text"
                value={allowlistIps}
                onChange={(e) => setAllowlistIps(e.target.value)}
                placeholder="102.89.44.1, 102.89.44.12, 127.0.0.1"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg font-mono text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Optional security policy. Restricts /admin/* routes to verified office or VPN IP addresses.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400">Inactivity Timeout:</span>
                <p className="font-mono font-bold text-white mt-0.5">30 Minutes (Strict Lock)</p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-400">Timezone & Settlement:</span>
                <p className="font-mono font-bold text-emerald-400 mt-0.5">Africa/Lagos (WAT)</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save Platform Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
