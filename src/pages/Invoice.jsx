import React, { useState } from 'react';
import { formatNgn } from '../lib/formatters';
import ServiceAccessButton from '../components/services/ServiceAccessButton';
import { FileText, ShieldAlert } from 'lucide-react';

export default function InvoicePage({ onSelectInvoice }) {
  const [invoiceType, setInvoiceType] = useState('commercial');
  const invoiceTypes = [
    { id: 'commercial', name: 'Commercial Vendor Invoice' },
    { id: 'utility', name: 'Corporate Bulk Utility' },
    { id: 'b2b', name: 'B2B Settlement Escrow' },
  ];

  const presets = [
    { id: 'inv-basic', name: 'Invoice Processing ₦50,000', amountNgn: 50000 },
    { id: 'inv-standard', name: 'Invoice Processing ₦150,000', amountNgn: 150000 },
    { id: 'inv-corporate', name: 'Corporate Escrow ₦500,000', amountNgn: 500000 },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
        <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Commercial Invoicing & Settlements</h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
              Tier 2 Required
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Automated corporate invoice financing and verified merchant disbursement.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        {invoiceTypes.map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => setInvoiceType(type.id)}
            className={`py-2 px-4 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              invoiceType === type.id
                ? 'bg-emerald-700 border-emerald-700 text-white shadow-xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {type.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map((item) => {
          const product = {
            id: `invoice-${invoiceType}-${item.amountNgn}`,
            service: 'invoice',
            name: item.name,
            selling_price: item.amountNgn * 100, // kobo
            requiredKycTier: 2,
            active: true,
          };

          return (
            <div
              key={item.id}
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 shadow-xs flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-900">{product.name}</span>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    Verified B2B
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Settlement window: Instant with registered TIN
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <span className="font-mono font-bold text-base text-emerald-800">
                  {formatNgn(item.amountNgn)}
                </span>
                <ServiceAccessButton
                  product={product}
                  onBuy={(p) => {
                    if (onSelectInvoice) onSelectInvoice(p);
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

export { InvoicePage };
