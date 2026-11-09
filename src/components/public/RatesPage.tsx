import React, { useState } from 'react';
import { formatNgn } from '../../lib/formatters';
import { Calculator, TrendingUp, Download, CheckCircle2 } from 'lucide-react';

export const RatesPage: React.FC<{ onNavigateToRegister: () => void }> = ({ onNavigateToRegister }) => {
  const [dailyDataGb, setDailyDataGb] = useState<number>(30);
  const [dailyBillsCount, setDailyBillsCount] = useState<number>(10);

  // Profit calculations
  // Average profit on 1GB is ₦30
  // Average profit on a bill transaction is ₦100
  const dailyDataProfitNgn = dailyDataGb * 30;
  const dailyBillsProfitNgn = dailyBillsCount * 100;
  const totalDailyProfitNgn = dailyDataProfitNgn + dailyBillsProfitNgn;
  const monthlyProfitNgn = totalDailyProfitNgn * 30;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Pricing, Margins & Reseller Calculator
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Transparent wholesale pricing for retail users, business agents, and POS shop owners across Nigeria.
        </p>
      </div>

      {/* Interactive Profit Calculator */}
      <div className="bg-gradient-to-br from-emerald-900 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Calculator className="w-4 h-4" />
              <span>Reseller Revenue & Profit Simulator</span>
            </div>

            <h2 className="text-2xl font-bold tracking-tight">
              Estimate Your Monthly Reseller Earnings with Meenabty
            </h2>

            <div className="space-y-5 text-xs">
              <div>
                <div className="flex justify-between font-semibold mb-2">
                  <span>Daily Data Bundles Sold (GB):</span>
                  <span className="font-mono text-emerald-300 font-bold text-sm">{dailyDataGb} GB / day</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="200"
                  step="5"
                  value={dailyDataGb}
                  onChange={(e) => setDailyDataGb(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between font-semibold mb-2">
                  <span>Daily Electricity & TV Bills Paid:</span>
                  <span className="font-mono text-emerald-300 font-bold text-sm">{dailyBillsCount} bills / day</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  step="1"
                  value={dailyBillsCount}
                  onChange={(e) => setDailyBillsCount(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 space-y-4">
            <p className="text-xs font-semibold text-emerald-200 uppercase tracking-wide">Projected Net Returns</p>
            <div>
              <p className="text-3xl sm:text-4xl font-extrabold font-mono text-white">
                {formatNgn(monthlyProfitNgn)}
              </p>
              <p className="text-xs text-slate-300 mt-1">Estimated Net Profit / Month</p>
            </div>

            <div className="pt-3 border-t border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Daily Profit:</span>
                <span className="font-mono text-white font-bold">{formatNgn(totalDailyProfitNgn)}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Annualized Earnings:</span>
                <span className="font-mono text-emerald-300 font-bold">{formatNgn(monthlyProfitNgn * 12)}</span>
              </div>
            </div>

            <button
              onClick={onNavigateToRegister}
              className="w-full py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-lg transition-colors mt-2"
            >
              Start Vending as a Reseller
            </button>
          </div>
        </div>
      </div>

      {/* Comprehensive Rate Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Official Service Pricing Sheet</h3>
            <p className="text-xs text-slate-500">Live prices updated daily based on network operator gateways</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Product Name</th>
                <th className="py-3 px-4">Network / DisCo</th>
                <th className="py-3 px-4 text-right">Wholesale Price</th>
                <th className="py-3 px-4 text-right">Retail Price</th>
                <th className="py-3 px-4 text-center">Validity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr>
                <td className="py-3 px-4 font-sans font-bold text-slate-900">Data</td>
                <td className="py-3 px-4 font-sans text-slate-800">500MB SME Data</td>
                <td className="py-3 px-4 font-sans text-slate-600">MTN</td>
                <td className="py-3 px-4 text-right text-slate-500">₦135.00</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">₦150.00</td>
                <td className="py-3 px-4 text-center font-sans text-slate-500">30 Days</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-sans font-bold text-slate-900">Data</td>
                <td className="py-3 px-4 font-sans text-slate-800">1.0GB SME Data</td>
                <td className="py-3 px-4 font-sans text-slate-600">MTN</td>
                <td className="py-3 px-4 text-right text-slate-500">₦260.00</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">₦290.00</td>
                <td className="py-3 px-4 text-center font-sans text-slate-500">30 Days</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-sans font-bold text-slate-900">Data</td>
                <td className="py-3 px-4 font-sans text-slate-800">2.0GB SME Data</td>
                <td className="py-3 px-4 font-sans text-slate-600">MTN</td>
                <td className="py-3 px-4 text-right text-slate-500">₦520.00</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">₦580.00</td>
                <td className="py-3 px-4 text-center font-sans text-slate-500">30 Days</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-sans font-bold text-slate-900">Data</td>
                <td className="py-3 px-4 font-sans text-slate-800">1.0GB Corporate Gifting</td>
                <td className="py-3 px-4 font-sans text-slate-600">Airtel</td>
                <td className="py-3 px-4 text-right text-slate-500">₦270.00</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">₦310.00</td>
                <td className="py-3 px-4 text-center font-sans text-slate-500">30 Days</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-sans font-bold text-slate-900">Data</td>
                <td className="py-3 px-4 font-sans text-slate-800">1.0GB Corporate Gifting</td>
                <td className="py-3 px-4 font-sans text-slate-600">Glo</td>
                <td className="py-3 px-4 text-right text-slate-500">₦240.00</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">₦280.00</td>
                <td className="py-3 px-4 text-center font-sans text-slate-500">30 Days</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-sans font-bold text-slate-900">Exam PIN</td>
                <td className="py-3 px-4 font-sans text-slate-800">WAEC Result Checker e-PIN</td>
                <td className="py-3 px-4 font-sans text-slate-600">WAEC</td>
                <td className="py-3 px-4 text-right text-slate-500">₦3,500.00</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">₦3,750.00</td>
                <td className="py-3 px-4 text-center font-sans text-slate-500">Instant</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-sans font-bold text-slate-900">Exam PIN</td>
                <td className="py-3 px-4 font-sans text-slate-800">NECO Result Token</td>
                <td className="py-3 px-4 font-sans text-slate-600">NECO</td>
                <td className="py-3 px-4 text-right text-slate-500">₦1,300.00</td>
                <td className="py-3 px-4 text-right font-bold text-slate-900">₦1,450.00</td>
                <td className="py-3 px-4 text-center font-sans text-slate-500">Instant</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
