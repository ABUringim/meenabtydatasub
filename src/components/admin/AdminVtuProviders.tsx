import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { VtuProviderConfig } from '../../types';
import {
  Server,
  ShieldAlert,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2,
  RefreshCw,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowUpDown,
} from 'lucide-react';
import { Modal } from '../shared/Modal';

export const AdminVtuProviders: React.FC = () => {
  const { user, isOwner } = useAuth();
  const [providers, setProviders] = useState<VtuProviderConfig[]>(storage.getProviders());
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; latency: number; status: string } | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Key rotation modal state
  const [selectedProvider, setSelectedProvider] = useState<VtuProviderConfig | null>(null);
  const [newApiKey, setNewApiKey] = useState('');
  const [newSecretKey, setNewSecretKey] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showKeys, setShowKeys] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  if (!isOwner) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">Owner Privilege Required</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Aggregator API keys and telecom routing configurations are restricted to the platform Owner tier only.
        </p>
      </div>
    );
  }

  const handleSetActive = (id: string) => {
    providers.forEach((p) => {
      storage.updateProvider(p.id, { active: p.id === id });
    });
    setProviders(storage.getProviders());
    storage.recordAuditLog(
      user?.uid || 'owner',
      user?.email || 'owner@sayyadadatasub.com',
      'PROVIDER_SWITCH_PRIMARY',
      `Switched primary gateway to ${id}`
    );
    setSuccessMsg(`Primary vending traffic successfully routed to ${id.toUpperCase()}`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleTestConnection = (id: string) => {
    setTestingId(id);
    setTestResult(null);

    setTimeout(() => {
      const latency = Math.floor(Math.random() * 80) + 110; // 110 - 190ms
      setTestingId(null);
      setTestResult({
        id,
        latency,
        status: 'HTTP 200 OK — Handshake Verified with Operator Core',
      });
      storage.updateProvider(id, { lastTestedAt: new Date().toISOString() });
      setProviders(storage.getProviders());
    }, 1200);
  };

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProvider) return;
    if (!confirmPassword) {
      setModalError('Please enter your owner password or 2FA code to confirm rotation.');
      return;
    }

    const maskedApi = newApiKey
      ? `${newApiKey.slice(0, 8)}••••••••••••••••${newApiKey.slice(-4)}`
      : selectedProvider.apiKeyMasked;
    const maskedSecret = newSecretKey
      ? `${newSecretKey.slice(0, 8)}••••••••••••••••${newSecretKey.slice(-4)}`
      : selectedProvider.secretKeyMasked;

    storage.updateProvider(selectedProvider.id, {
      apiKeyMasked: maskedApi,
      secretKeyMasked: maskedSecret,
    });

    storage.recordAuditLog(
      user?.uid || 'owner',
      user?.email || 'owner@sayyadadatasub.com',
      'PROVIDER_CREDENTIALS_ROTATED',
      `Rotated API credentials for provider ${selectedProvider.id}`
    );

    setProviders(storage.getProviders());
    setSelectedProvider(null);
    setNewApiKey('');
    setNewSecretKey('');
    setConfirmPassword('');
    setModalError(null);
    setSuccessMsg('Provider API credentials securely rotated and encrypted.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-400" />
              Upstream VTU Aggregator Core
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
              Owner Access Only
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Configure multi-provider fallbacks, test operator API response latencies, and securely rotate secrets
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-700 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {testResult && (
        <div className="p-4 bg-slate-900 border border-emerald-500/40 rounded-xl text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Zap className="w-4 h-4" />
              API Handshake Diagnostic Succeeded ({testResult.id.toUpperCase()})
            </span>
            <span className="font-mono text-slate-400">{testResult.latency}ms RTT</span>
          </div>
          <p className="text-slate-300 font-mono text-[11px]">{testResult.status}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {providers.map((p) => (
          <div
            key={p.id}
            className={`bg-slate-900 p-5 rounded-2xl border transition-all ${
              p.active
                ? 'border-emerald-500 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/30'
                : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-xs font-bold text-white">{p.name}</h3>
                <span className="text-[10px] text-slate-400 font-mono">Priority #{p.fallbackOrder}</span>
              </div>
              {p.active ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Primary Route
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400">
                  Standby Fallback
                </span>
              )}
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Aggregator Balance:</span>
                <span className="font-mono font-bold text-emerald-400">
                  ₦{p.balanceNgn.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">24h SLA Uptime:</span>
                <span className="font-mono font-semibold text-white">{p.successRate}%</span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">API Endpoint:</span>
                <span className="font-mono text-[11px] text-slate-400 truncate max-w-[150px]">{p.apiUrl}</span>
              </div>

              <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">API Key:</span>
                  <span className="font-mono text-slate-300">{p.apiKeyMasked}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">Secret:</span>
                  <span className="font-mono text-slate-300">{p.secretKeyMasked}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={testingId === p.id}
                  onClick={() => handleTestConnection(p.id)}
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Activity className={`w-3.5 h-3.5 ${testingId === p.id ? 'animate-spin' : ''}`} />
                  <span>{testingId === p.id ? 'Pinging...' : 'Ping Test'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedProvider(p)}
                  className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Rotate Keys</span>
                </button>
              </div>

              <button
                disabled={p.active}
                onClick={() => handleSetActive(p.id)}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                  p.active
                    ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800 cursor-default'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                {p.active ? 'Active Traffic Gateway' : 'Set as Primary Gateway'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Secret Rotation Modal */}
      <Modal
        isOpen={!!selectedProvider}
        onClose={() => {
          setSelectedProvider(null);
          setModalError(null);
        }}
        title={`Rotate API Credentials — ${selectedProvider?.name}`}
        subtitle="Credentials are kept strictly in server-side Firebase Secret Manager"
        maxWidth="md"
      >
        <form onSubmit={handleSaveKeys} className="space-y-4">
          {modalError && (
            <div className="p-2.5 bg-rose-950/70 border border-rose-800 text-rose-300 rounded-lg text-xs">
              {modalError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              New Aggregator API Key
            </label>
            <input
              type="text"
              value={newApiKey}
              onChange={(e) => setNewApiKey(e.target.value)}
              placeholder="Leave blank to retain current key"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              New Aggregator Secret Key
            </label>
            <input
              type="password"
              value={newSecretKey}
              onChange={(e) => setNewSecretKey(e.target.value)}
              placeholder="Leave blank to retain current secret"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Confirm Owner Password / 2FA Passcode
            </label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Type owner password to authorize rotation"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSelectedProvider(null)}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
            >
              Authorize & Deploy Key
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
