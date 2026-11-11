import React, { useState } from 'react';
import { formatNgn } from '../lib/formatters';
import ServiceAccessButton from '../components/services/ServiceAccessButton';
import { Send, ShieldAlert } from 'lucide-react';

export default function RemitPage({ onSelectRemit }) {
  const [currency, setCurrency] = useState('CAD');
  const corridors = [
    { code: 'CAD', name: 'Canada (CAD)', rate: 1150 },
    { code: 'GBP', name: 'United Kingdom (GBP)', rate: 2050 },
    { code: 'USD', name: 'United States (USD)', rate: 1620 },
    { code: 'EUR', name: 'Eurozone (EUR)', rate: 1750 },
  ];

  const presetAmounts = [50, 100, 250, 500, 1000];
  const selectedCorridor = corridors.find((c) => c.code === currency) || corridors[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700">
          <Send className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">International Remittance</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              Tier 2 Required
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Outbound direct bank transfer to diaspora corridors. Requires Tier 2 compliance.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {corridors.map((c) => (
          <button
            key={c.code}
            type="button"
            onClick={() => setCurrency(c.code)}
            className={`py-2 px-4 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              currency === c.code
                ? 'bg-blue-700 border-blue-700 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {presetAmounts.map((amt) => {
          const totalNgn = amt * selectedCorridor.rate;
          const product = {
            id: `remit-${currency.toLowerCase()}-${amt}`,
            service: 'remit',
            name: `Send ${amt} ${currency}`,
            selling_price: totalNgn * 100, // kobo
            requiredKycTier: 2,
            active: true,
          };

          return (
            <div
              key={amt}
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">{product.name}</span>
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    FX Corridor
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Rate: ₦{selectedCorridor.rate.toLocaleString()} / {currency}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="font-mono font-bold text-base text-emerald-800">
                  {formatNgn(totalNgn)}
                </span>
                <ServiceAccessButton
                  product={product}
                  onBuy={(p) => {
                    if (onSelectRemit) onSelectRemit(p);
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

export { RemitPage };
