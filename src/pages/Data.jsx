import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { formatKoboToNgn } from '../lib/formatters';
import ServiceAccessButton from '../components/services/ServiceAccessButton';
import { Wifi, Zap } from 'lucide-react';

export default function DataPage({ onSelectPlan }) {
  const { products } = useWallet();
  const [selectedNetwork, setSelectedNetwork] = useState('MTN');

  const networks = ['MTN', 'Airtel', 'Glo', '9mobile'];
  const dataPlans = products.filter(
    (p) => p.service === 'data' && p.provider === selectedNetwork && p.active
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
          <Wifi className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Data Bundles</h1>
          <p className="text-xs text-slate-500">
            Select a network and plan. Click "Buy Now" or "Top Up to Buy" if balance is low.
          </p>
        </div>
      </div>

      {/* Network Filter Pills */}
      <div className="flex gap-2">
        {networks.map((net) => (
          <button
            key={net}
            type="button"
            onClick={() => setSelectedNetwork(net)}
            className={`py-2 px-4 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              selectedNetwork === net
                ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {net}
          </button>
        ))}
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dataPlans.map((plan) => (
          <div
            key={plan.id}
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-slate-900">{plan.name}</span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                  {plan.category || 'SME'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Validity: {plan.validity || '30 Days'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="font-mono font-bold text-base text-emerald-800">
                {formatKoboToNgn(plan.selling_price)}
              </span>
              <ServiceAccessButton
                product={plan}
                onBuy={(p) => {
                  if (onSelectPlan) onSelectPlan(p);
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { DataPage };
