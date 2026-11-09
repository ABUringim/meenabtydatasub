import React from 'react';
import {
  Smartphone,
  Wifi,
  Zap,
  Tv,
  GraduationCap,
  SendHorizontal,
  Receipt,
  Gift,
  Car,
  Plane,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const ServicesOverview: React.FC<{ onSelectService: (id: string) => void }> = ({ onSelectService }) => {
  const serviceCategories = [
    {
      id: 'service-airtime',
      name: 'Airtime VTU (All Networks)',
      icon: Smartphone,
      color: 'bg-emerald-50 text-emerald-700',
      description: 'Recharge MTN, Airtel, Glo, and 9mobile with instant 2% automated cash back discount. Supports bulk recharge.',
      bullets: ['Auto network prefix detection', '2% cashback applied at checkout', 'Minimum recharge from ₦50'],
    },
    {
      id: 'service-data',
      name: 'Mobile Internet Data Bundles',
      icon: Wifi,
      color: 'bg-blue-50 text-blue-700',
      description: 'Cheapest Nigerian SME & Corporate Gifting data. 30 days validity on MTN, Airtel, Glo, and 9mobile.',
      bullets: ['MTN SME 1GB @ ₦290', 'Instant balance check code sent via SMS', '30 days standard validity'],
    },
    {
      id: 'service-electricity',
      name: 'Electricity Bills (All 11 DisCos)',
      icon: Zap,
      color: 'bg-amber-50 text-amber-700',
      description: 'Pay for prepaid meter tokens & postpaid monthly settlements for IKEDC, EKEDC, AEDC, KEDCO, IBEDC, and more.',
      bullets: ['Free meter account name lookup', 'Instant 20-digit token generation', 'Prepaid & Postpaid supported'],
    },
    {
      id: 'service-tv',
      name: 'Cable TV Subscriptions',
      icon: Tv,
      color: 'bg-purple-50 text-purple-700',
      description: 'Renew your DStv, GOtv, and StarTimes decoders with zero activation delay. Verify account holder name first.',
      bullets: ['Smartcard/IUC name verification', 'Instant signal re-connection', 'All bouquets & add-ons'],
    },
    {
      id: 'service-exam',
      name: 'School & Examination PINs',
      icon: GraduationCap,
      color: 'bg-indigo-50 text-indigo-700',
      description: 'Official result checker PINs & tokens for WAEC, NECO, JAMB UTME registration, and NABTEB examinations.',
      bullets: ['Instant serial & PIN delivery', 'Bulk school purchases supported', 'SMS delivery backup'],
    },
    {
      id: 'service-remit',
      name: 'Remit — Inter-Bank Transfers',
      icon: SendHorizontal,
      color: 'bg-teal-50 text-teal-700',
      description: 'Transfer funds from your Meenabty wallet to any Nigerian commercial or microfinance bank account (NIP).',
      bullets: ['Live NUBAN name enquiry', 'Low flat NIP transfer fee of ₦25', 'Tier 2 BVN/NIN compliance'],
    },
    {
      id: 'service-invoice',
      name: 'Commercial Invoice & Tax Settlements',
      icon: Receipt,
      color: 'bg-rose-50 text-rose-700',
      description: 'Pay federal taxes (FIRS), state assessments (LIRS, KIRS), Remita RRR invoices, and university fees.',
      bullets: ['Instant Biller validation', 'Official printable settlement receipts', 'RRR & State ID verification'],
    },
    {
      id: 'service-giftcard',
      name: 'Digital Gift Cards (Buy & Sell)',
      icon: Gift,
      color: 'bg-pink-50 text-pink-700',
      description: 'Exchange Apple, Steam, Amazon, Google Play, and Razer Gold cards into instant Naira cash or vice-versa.',
      bullets: ['Competitive live USD/NGN rates', 'Instant wallet credit upon verification', 'Wide denomination range'],
    },
    {
      id: 'service-transport',
      name: 'Transport & Toll Subscriptions',
      icon: Car,
      color: 'bg-sky-50 text-sky-700',
      description: 'Recharge Lagos Cowry BRT & Metro rail cards, Lekki Toll Gate e-Tags, and interstate mobility travel passes.',
      bullets: ['Instant Cowry card top-up', 'LCC e-Tag toll settlement', 'Interstate travel vouchers'],
    },
    {
      id: 'service-travel',
      name: 'Domestic Flights & Hotel Vouchers',
      icon: Plane,
      color: 'bg-orange-50 text-orange-700',
      description: 'Book domestic Nigerian flights (Air Peace, Max Air) and reserve verified hotel suites directly with Naira.',
      bullets: ['Direct flight ticketing', 'Verified partner hotel suites', '24/7 travel desk support'],
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Comprehensive Service Catalog
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Explore all 10 digital top-up, telecom, utility, and fintech vending services supported on Meenabty Datasub.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {serviceCategories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.id}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl ${cat.color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{cat.name}</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{cat.description}</p>
                <ul className="space-y-1.5 text-xs text-slate-700 mb-6">
                  {cat.bullets.map((b, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">24/7 Automated Dispatch</span>
                <button
                  onClick={() => onSelectService(cat.id)}
                  className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span>Launch Service</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
