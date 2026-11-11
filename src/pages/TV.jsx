import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { formatKoboToNgn } from '../lib/formatters';
import ServiceAccessButton from '../components/services/ServiceAccessButton';
import { Tv } from 'lucide-react';

export default function TVPage({ onSelectBouquet }) {
  const { products } = useWallet();
  const [provider, setProvider] = useState('DSTV');

  const providers = ['DSTV', 'GOTV', 'Startimes'];
  const bouquets = products.filter(
    (p) => p.service === 'tv' && p.provider === provider && p.active
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
          <Tv className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cable TV Subscriptions</h1>
          <p className="text-xs text-slate-500">
            Instant activation for DSTV, GOTV, and Startimes bouquets.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {providers.map((prov) => (
          <button
            key={prov}
            type="button"
            onClick={() => setProvider(prov)}
            className={`py-2 px-4 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              provider === prov
                ? 'bg-purple-700 border-purple-700 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {prov}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {bouquets.map((b) => (
          <div
            key={b.id}
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col justify-between space-y-3"
          >
            <div>
              <span className="text-xs font-bold text-slate-900">{b.name}</span>
              <p className="text-xs text-slate-500 mt-1">30 Days Standard Access</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="font-mono font-bold text-base text-emerald-800">
                {formatKoboToNgn(b.selling_price)}
              </span>
              <ServiceAccessButton
                product={b}
                onBuy={(product) => {
                  if (onSelectBouquet) onSelectBouquet(product);
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { TVPage };
