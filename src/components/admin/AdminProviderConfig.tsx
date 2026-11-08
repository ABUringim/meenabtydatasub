import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { VtuProviderConfig } from '../../types';
import { Server, CheckCircle2, ShieldCheck, Zap, RefreshCw } from 'lucide-react';

export const AdminProviderConfig: React.FC = () => {
  const [providers, setProviders] = useState<VtuProviderConfig[]>(storage.getProviders());
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSetActive = (id: string) => {
    providers.forEach((p) => {
      storage.updateProvider(p.id, { active: p.id === id });
    });
    setProviders(storage.getProviders());
    setSuccessMsg(`Active VTU aggregator switched successfully.`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleToggleSandbox = (p: VtuProviderConfig) => {
    storage.updateProvider(p.id, { isSandbox: !p.isSandbox });
    setProviders(storage.getProviders());
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">VTU Aggregator Provider Configuration</h2>
        <p className="text-xs text-slate-500">
          Switch active telecom gateways, toggle sandbox testing modes, and inspect upstream API wallet balances
        </p>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {providers.map((p) => (
          <div
            key={p.id}
            className={`bg-white p-5 rounded-xl border transition-all ${
              p.active ? 'border-emerald-600 shadow-sm ring-2 ring-emerald-600/20' : 'border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-900">{p.name}</span>
              {p.active ? (
                <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-100 rounded">
                  Active Gateway
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-medium text-slate-500 bg-slate-100 rounded">
                  Standby
                </span>
              )}
            </div>

            <div className="mt-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Aggregator Balance:</span>
                <span className="font-mono font-bold text-slate-900">₦{p.balanceNgn.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Historical Uptime:</span>
                <span className="font-mono font-semibold text-emerald-700">{p.successRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Test / Sandbox Mode:</span>
                <button
                  onClick={() => handleToggleSandbox(p)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    p.isSandbox ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {p.isSandbox ? 'Enabled' : 'Live Mode'}
                </button>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                disabled={p.active}
                onClick={() => handleSetActive(p.id)}
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  p.active
                    ? 'bg-emerald-50 text-emerald-800 cursor-default'
                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                }`}
              >
                {p.active ? 'Currently Routing Orders' : 'Route All Vending Here'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-semibold text-slate-900">
          <ShieldCheck className="w-4 h-4 text-emerald-700" />
          <span>Server-Side Secret Key & API Abstraction Notice</span>
        </div>
        <p className="leading-relaxed">
          Aggregator API keys and Paystack secret keys are held exclusively in server environment variables
          (Firebase Secrets & Cloud Functions). The client application never receives raw API credentials,
          eliminating client-side compromise vectors.
        </p>
      </div>
    </div>
  );
};
