import React, { useState } from 'react';
import { NIGERIAN_DISCOS } from '../data/initialData';
import { formatNgn } from '../lib/formatters';
import ServiceAccessButton from '../components/services/ServiceAccessButton';
import { Zap } from 'lucide-react';

export default function ElectricityPage({ onSelectDisco }) {
  const [meterType, setMeterType] = useState('prepaid');
  const presetAmounts = [1000, 2000, 3000, 5000, 10000];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="p-2.5 rounded-xl bg-amber-50 text-amber-700">
          <Zap className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Electricity Bill Payment & Tokens</h1>
          <p className="text-xs text-slate-500">
            Instant STS prepaid token generation and postpaid bill settlement.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {['prepaid', 'postpaid'].map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setMeterType(type)}
            className={`py-2 px-4 rounded-lg text-xs font-bold capitalize border transition-colors cursor-pointer ${
              meterType === type
                ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {type} Meter
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {NIGERIAN_DISCOS.map((disco) => {
          const product = {
            id: `${disco.id}-${meterType}`,
            name: `${disco.name} (${meterType})`,
            selling_price: 310000, // standard default ₦3,100 (including ₦100 fee) in kobo
          };

          return (
            <div
              key={disco.id}
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <span className="text-xs font-bold text-slate-900">{disco.name}</span>
                <p className="text-xs text-slate-500 mt-1">Coverage: {disco.states.slice(0, 3).join(', ')}</p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="font-mono font-bold text-xs text-slate-600">
                  Instant Token
                </span>
                <ServiceAccessButton
                  product={product}
                  onBuy={(p) => {
                    if (onSelectDisco) onSelectDisco(p);
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { ElectricityPage };
