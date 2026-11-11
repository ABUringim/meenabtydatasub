import React from 'react';
import { useWallet } from '../context/WalletContext';
import { formatKoboToNgn } from '../lib/formatters';
import ServiceAccessButton from '../components/services/ServiceAccessButton';
import { GraduationCap } from 'lucide-react';

export default function ExamPage({ onSelectExam }) {
  const { products } = useWallet();
  const examProducts = products.filter((p) => p.service === 'exam' && p.active);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
          <GraduationCap className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Exam PINs & Result Checker Tokens</h1>
          <p className="text-xs text-slate-500">
            Instant delivery of WAEC, NECO, JAMB & NABTEB result scratch cards.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {examProducts.map((p) => (
          <div
            key={p.id}
            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col justify-between space-y-3"
          >
            <div>
              <span className="text-xs font-bold text-slate-900">{p.name}</span>
              <p className="text-xs text-slate-500 mt-1">Instant SMS & On-Screen PIN</p>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="font-mono font-bold text-base text-emerald-800">
                {formatKoboToNgn(p.selling_price)}
              </span>
              <ServiceAccessButton
                product={p}
                onBuy={(product) => {
                  if (onSelectExam) onSelectExam(product);
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { ExamPage };
