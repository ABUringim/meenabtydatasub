import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { NotificationCampaign } from '../../types';
import { formatWATDate } from '../../lib/formatters';
import {
  Bell,
  Send,
  Users,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Mail,
  Megaphone,
} from 'lucide-react';

const QUICK_TEMPLATES = [
  {
    title: 'Weekend Data Discount',
    message: 'MTN 1GB SME Data reduced to ₦270 for all verified users this weekend! Tap to top up your balance now.',
    target: 'all' as const,
    type: 'push' as const,
  },
  {
    title: 'DisCo STS Token Upgrades',
    message: 'AEDC & KEDCO prepaid meters are undergoing STS rollover. Please vend tokens before 11 PM to prevent grid delay.',
    target: 'all' as const,
    type: 'push' as const,
  },
  {
    title: 'KYC Tier 2 Verification Prompt',
    message: 'Unlock unlimited daily bank remittances and higher wallet limits by submitting your NIN/BVN in the KYC tab.',
    target: 'verified_only' as const,
    type: 'email' as const,
  },
];

export const AdminNotifications: React.FC = () => {
  const { user } = useAuth();
  const allUsers = storage.getUsers();
  const [campaigns, setCampaigns] = useState<NotificationCampaign[]>(storage.getNotifications());
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'push' | 'email' | 'in_app_banner'>('push');
  const [target, setTarget] = useState<'all' | 'verified_only' | 'single_user'>('all');
  const [targetUserId, setTargetUserId] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleApplyTemplate = (tpl: typeof QUICK_TEMPLATES[0]) => {
    setTitle(tpl.title);
    setMessage(tpl.message);
    setTarget(tpl.target);
    setType(tpl.type);
  };

  const handleSendCampaign = (e: React.FormEvent) => {
    e.preventDefault();

    let count = allUsers.length;
    if (target === 'verified_only') {
      count = allUsers.filter((u) => u.tier === 2).length;
    } else if (target === 'single_user') {
      count = 1;
    }

    const campaign: NotificationCampaign = {
      id: `notif_${Date.now()}`,
      title,
      message,
      type,
      target,
      targetUserId: target === 'single_user' ? targetUserId : undefined,
      sentAt: new Date().toISOString(),
      recipientCount: count,
      status: 'sent',
    };

    storage.addNotification(campaign);
    storage.recordAuditLog(
      user?.uid || 'admin',
      user?.email || 'admin@sayyadadatasub.com',
      'NOTIFICATION_BROADCAST',
      `Sent ${type} campaign: "${title}" to ${count} recipients`
    );

    setCampaigns(storage.getNotifications());
    setTitle('');
    setMessage('');
    setSuccessMsg(`Broadcast successfully queued and dispatched to ${count} customers.`);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" />
            Customer Notification & Broadcast Center
          </h2>
          <p className="text-xs text-slate-400">
            Dispatch real-time web push alerts, marketing email blasts, and emergency system advisories
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-700 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Quick Templates */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Quick Campaign Templates</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {QUICK_TEMPLATES.map((tpl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyTemplate(tpl)}
              className="text-left p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-xl text-xs transition-colors group"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white group-hover:text-emerald-400">{tpl.title}</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                  {tpl.type}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{tpl.message}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaign Composer Form */}
        <form onSubmit={handleSendCampaign} className="lg:col-span-2 bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-3 border-b border-slate-800">
            Compose Targeted Broadcast
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Campaign Headline</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 50% Off Electricity Settlement Surcharges"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Delivery Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['push', 'email', 'in_app_banner'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize border transition-all ${
                        type === t
                          ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 font-bold'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      {t === 'in_app_banner' ? 'Banner' : t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Segmentation</label>
                <select
                  value={target}
                  onChange={(e) => setTarget(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="all">All Registered Customers ({allUsers.length})</option>
                  <option value="verified_only">Verified Tier 2 Only ({allUsers.filter((u) => u.tier === 2).length})</option>
                  <option value="single_user">Single Specific Customer</option>
                </select>
              </div>
            </div>

            {target === 'single_user' && (
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Target Customer</label>
                <select
                  required
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs"
                >
                  <option value="">Select customer recipient...</option>
                  {allUsers.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.name} ({u.email})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Message Body</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type push notification or email copy here..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Dispatch Broadcast Campaign</span>
          </button>
        </form>

        {/* Live Audience Preview */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-3 border-b border-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              Audience Reach Matrix
            </h3>

            <div className="mt-4 space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">Total Customer Base:</span>
                <span className="font-mono font-bold text-white">{allUsers.length}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">KYC Verified Accounts:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {allUsers.filter((u) => u.tier === 2).length}
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex justify-between">
                <span className="text-slate-400">Unverified Tier 1:</span>
                <span className="font-mono font-bold text-amber-300">
                  {allUsers.filter((u) => u.tier === 1).length}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-[11px] text-emerald-300 leading-relaxed">
            FCM tokens and SendGrid SMTP routes are routed server-side via Firebase Cloud Messaging without exposing credentials to browsers.
          </div>
        </div>
      </div>

      {/* Dispatched History */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-800">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Broadcast Delivery Ledger</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                <th className="py-3 px-4">Headline & Message</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Audience Target</th>
                <th className="py-3 px-4 text-right">Recipients</th>
                <th className="py-3 px-4">Dispatched At</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {campaigns.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40">
                  <td className="py-3 px-4 max-w-sm">
                    <p className="font-bold text-white line-clamp-1">{c.title}</p>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{c.message}</p>
                  </td>
                  <td className="py-3 px-4 uppercase font-mono text-[11px] text-emerald-400">{c.type}</td>
                  <td className="py-3 px-4 text-slate-300 capitalize">{c.target.replace('_', ' ')}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">
                    {c.recipientCount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                    {formatWATDate(c.sentAt || new Date().toISOString())}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      Delivered
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
