import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { formatNgn } from '../lib/formatters';
import ServiceAccessButton from '../components/services/ServiceAccessButton';
import { Smartphone, Zap } from 'lucide-react';

export default function AirtimePage({ onSelectAmount }) {
  const [network, setNetwork] = useState('MTN');
  const networks = ['MTN', 'Airtel', 'Glo', '9mobile'];
  const presets = [100, 200, 500, 1000, 2000, 5000];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
          <Smartphone className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Airtime VTU Top-Up</h1>
          <p className="text-xs text-slate-500">
            Recharge instant airtime with 2% discount. Click "Buy Now" or "Top Up to Buy".
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {networks.map((net) => (
          <button
            key={net}
            type="button"
            onClick={() => setNetwork(net)}
            className={`py-2 px-4 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              network === net
                ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {net}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map((val) => {
          const payableNgn = Math.round(val * 0.98);
          const product = {
            id: `${network.toLowerCase()}-airtime-${val}`,
            name: `${network} ₦${val.toLocaleString()} Airtime`,
            selling_price: payableNgn * 100, // kobo
            nominalAmount: val,
          };

          return (
            <div
              key={val}
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">{product.name}</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    2% Off
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Face value: ₦{val.toLocaleString()}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="font-mono font-bold text-base text-emerald-800">
                  {formatNgn(payableNgn)}
                </span>
                <ServiceAccessButton
                  product={product}
                  onBuy={(p) => {
                    if (onSelectAmount) onSelectAmount(p);
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

export { AirtimePage };
