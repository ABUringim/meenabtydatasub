import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { useAuth } from '../../context/AuthContext';
import { ServiceCategory } from '../../types';
import { formatKoboToNgn } from '../../lib/formatters';
import {
  TrendingUp,
  Percent,
  Sliders,
  Sparkles,
  Save,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface ServiceMarkup {
  category: ServiceCategory;
  name: string;
  defaultMarkupPercent: number;
  flatFeeNgn: number;
  description: string;
}

const DEFAULT_MARKUPS: ServiceMarkup[] = [
  { category: 'airtime', name: 'Airtime VTU', defaultMarkupPercent: 2.5, flatFeeNgn: 0, description: 'Discount margin passed through aggregator' },
  { category: 'data', name: 'SME & Gifting Data', defaultMarkupPercent: 8.0, flatFeeNgn: 0, description: 'High-frequency margin driver' },
  { category: 'tv', name: 'Cable TV (DSTV/GOTV/StarTimes)', defaultMarkupPercent: 1.5, flatFeeNgn: 50, description: 'Convenience surcharge on subscription validation' },
  { category: 'electricity', name: 'Electricity DisCos', defaultMarkupPercent: 1.8, flatFeeNgn: 100, description: 'STS token generation surcharge' },
  { category: 'exam', name: 'Exam PINs (WAEC/NECO/JAMB)', defaultMarkupPercent: 6.0, flatFeeNgn: 150, description: 'Education voucher clearing margin' },
  { category: 'remit', name: 'Direct Bank Remittance', defaultMarkupPercent: 0, flatFeeNgn: 25, description: 'Interbank settlement processing charge' },
  { category: 'invoice', name: 'Utility & Merchant Invoices', defaultMarkupPercent: 2.0, flatFeeNgn: 100, description: 'Merchant invoice gateway fee' },
  { category: 'giftcard', name: 'Gift Card Trading', defaultMarkupPercent: 5.5, flatFeeNgn: 0, description: 'FX spread margin on secondary market' },
  { category: 'transport', name: 'Transit & Interstate Tolls', defaultMarkupPercent: 3.0, flatFeeNgn: 50, description: 'Toll plaza & interstate bus e-ticketing' },
  { category: 'travel', name: 'Flights & Hotel Bookings', defaultMarkupPercent: 4.0, flatFeeNgn: 200, description: 'Travel agent booking margin' },
];

export const AdminPricing: React.FC = () => {
  const { user, isOwner } = useAuth();
  const settings = storage.getSettings();
  const [markups, setMarkups] = useState<ServiceMarkup[]>(DEFAULT_MARKUPS);
  const [fundingBonus, setFundingBonus] = useState<number>(settings.fundingBonusPercent || 0);
  const [withdrawalFee, setWithdrawalFee] = useState<number>(settings.withdrawalFeeNgn || 50);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Profit Simulator state
  const [simService, setSimService] = useState<ServiceCategory>('data');
  const [simCostNgn, setSimCostNgn] = useState<number>(1000);

  const handleMarkupChange = (category: ServiceCategory, field: 'defaultMarkupPercent' | 'flatFeeNgn', val: number) => {
    setMarkups((prev) =>
      prev.map((m) => (m.category === category ? { ...m, [field]: Math.max(0, val) } : m))
    );
  };

  const handleSavePricing = (e: React.FormEvent) => {
    e.preventDefault();
    storage.updateSettings({
      fundingBonusPercent: fundingBonus,
      withdrawalFeeNgn: withdrawalFee,
    });

    storage.recordAuditLog(
      user?.uid || 'admin',
      user?.email || 'admin@meenabtydatasub.com',
      'PRICING_ENGINE_UPDATE',
      'Global Service Markups & Funding Bonus',
      { markups, fundingBonus, withdrawalFee }
    );

    setSuccessMsg('Platform pricing rules, margins, and wallet bonuses updated successfully.');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Compute simulator outputs
  const currentSimMarkup = markups.find((m) => m.category === simService) || markups[0];
  const simMarginNgn = (simCostNgn * (currentSimMarkup.defaultMarkupPercent / 100)) + currentSimMarkup.flatFeeNgn;
  const simSellingNgn = simCostNgn + simMarginNgn;
  const simRoi = simCostNgn > 0 ? ((simMarginNgn / simCostNgn) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Pricing & Profit Engine
          </h2>
          <p className="text-xs text-slate-400">
            Configure automated service markups, wallet funding incentives, and calculate live platform net margins
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-700 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Live Profit Margin Calculator Widget */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-5 rounded-2xl border border-slate-800 shadow-md">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Real-Time Margin & Vending Profit Simulator
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Target Service</label>
            <select
              value={simService}
              onChange={(e) => setSimService(e.target.value as ServiceCategory)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              {markups.map((m) => (
                <option key={m.category} value={m.category}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Aggregator Cost (₦)</label>
            <input
              type="number"
              min="10"
              step="50"
              value={simCostNgn}
              onChange={(e) => setSimCostNgn(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Customer Selling Price</label>
            <div className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-mono font-bold text-emerald-400">
              ₦{simSellingNgn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">Net Platform Spread</label>
            <div className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs font-mono font-bold text-amber-400 flex items-center justify-between">
              <span>+₦{simMarginNgn.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="text-[10px] text-slate-400 font-normal">({simRoi}% margin)</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSavePricing} className="space-y-6">
        {/* Global Wallet Incentives */}
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            Wallet Funding Incentives & Fees
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Paystack Deposit Bonus (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={fundingBonus}
                  onChange={(e) => setFundingBonus(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">%</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Credited automatically to user wallet upon confirmed Paystack deposit
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Bank Remit / Payout Flat Fee (₦)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={withdrawalFee}
                  onChange={(e) => setWithdrawalFee(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">₦</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Fee charged per outbound interbank NIP transfer transaction
              </p>
            </div>
          </div>
        </div>

        {/* 10 Services Markup Table */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Service Markup & Commission Rules (All 10 Services)
            </h3>
            <span className="text-[11px] text-slate-400">
              Auto-calculates customer retail prices from wholesale aggregator cost
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="py-3 px-4">Service Category</th>
                  <th className="py-3 px-4">Strategy Description</th>
                  <th className="py-3 px-4 w-36">Percent Markup (%)</th>
                  <th className="py-3 px-4 w-36">Fixed Surcharge (₦)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {markups.map((item) => (
                  <tr key={item.category} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">{item.name}</p>
                      <span className="text-[10px] text-emerald-400 font-mono capitalize">{item.category}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {item.description}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="50"
                          value={item.defaultMarkupPercent}
                          onChange={(e) =>
                            handleMarkupChange(item.category, 'defaultMarkupPercent', Number(e.target.value))
                          }
                          className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-emerald-400 text-right focus:ring-1 focus:ring-emerald-500"
                        />
                        <span className="text-slate-500 font-mono">%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <span className="text-slate-500 font-mono">₦</span>
                        <input
                          type="number"
                          step="5"
                          min="0"
                          value={item.flatFeeNgn}
                          onChange={(e) =>
                            handleMarkupChange(item.category, 'flatFeeNgn', Number(e.target.value))
                          }
                          className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-amber-300 text-right focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Dynamic
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <button
            type="submit"
            className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Apply Pricing Engine Rules</span>
          </button>
        </div>
      </form>
    </div>
  );
};
