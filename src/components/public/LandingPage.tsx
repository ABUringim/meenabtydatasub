import React, { useState } from 'react';
import { NetworkProvider } from '../../types';
import { detectNetwork, formatNgn, generateReference, isValidNigerianPhone } from '../../lib/formatters';
import { paystack } from '../../services/paystack';
import { vtuProvider } from '../../services/vtuProvider';
import { useWallet } from '../../context/WalletContext';
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
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  Lock,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

interface LandingPageProps {
  onNavigate: (view: string) => void;
  onOpenQuickService: (serviceTab: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigate,
  onOpenQuickService,
}) => {
  const { setActiveReceiptTxn } = useWallet();

  // Quick Buy Guest Widget State
  const [quickServiceType, setQuickServiceType] = useState<'airtime' | 'data'>('airtime');
  const [network, setNetwork] = useState<NetworkProvider>('MTN');
  const [phone, setPhone] = useState('');
  const [amountNgn, setAmountNgn] = useState(500);
  const [guestEmail, setGuestEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [quickError, setQuickError] = useState<string | null>(null);

  // FAQ open toggle
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const networks: NetworkProvider[] = ['MTN', 'Airtel', 'Glo', '9mobile'];

  const services = [
    { id: 'service-airtime', title: 'Airtime (VTU)', desc: 'Instant recharge for MTN, Airtel, Glo & 9mobile with 2% discount', icon: Smartphone, color: 'text-emerald-700 bg-emerald-50' },
    { id: 'service-data', title: 'SME & CG Data', desc: 'Cheap 30-day mobile data starting from ₦150 for 500MB', icon: Wifi, color: 'text-blue-700 bg-blue-50' },
    { id: 'service-electricity', title: 'Electricity Tokens', desc: 'Prepaid & postpaid tokens for all 11 DisCos (IKEDC, KEDCO, AEDC)', icon: Zap, color: 'text-amber-700 bg-amber-50' },
    { id: 'service-tv', title: 'Cable TV Bouquets', desc: 'Instant subscription for DStv, GOtv, and StarTimes decoder lines', icon: Tv, color: 'text-purple-700 bg-purple-50' },
    { id: 'service-exam', title: 'School & Exam PINs', desc: 'WAEC Result Checker, NECO Tokens, JAMB UTME & NABTEB e-PINs', icon: GraduationCap, color: 'text-indigo-700 bg-indigo-50' },
    { id: 'service-remit', title: 'Remit Money Transfer', desc: 'Direct wallet transfers to all commercial and microfinance banks in Nigeria', icon: SendHorizontal, color: 'text-teal-700 bg-teal-50' },
    { id: 'service-invoice', title: 'Invoice Settlement', desc: 'Pay federal taxes, state revenues, RRR invoices, and university fees', icon: Receipt, color: 'text-rose-700 bg-rose-50' },
    { id: 'service-giftcard', title: 'Gift Cards Trading', desc: 'Buy & sell Apple, Steam, Amazon & Google Play cards at top Naira rates', icon: Gift, color: 'text-pink-700 bg-pink-50' },
    { id: 'service-transport', title: 'Transport & Tolls', desc: 'Instant top-up for Cowry Cards (Lagos BRT) and Lekki Toll Gate e-Tags', icon: Car, color: 'text-sky-700 bg-sky-50' },
    { id: 'service-travel', title: 'Travel & Hotel Booking', desc: 'Book domestic flights & verified hotel suites directly with Naira wallet', icon: Plane, color: 'text-orange-700 bg-orange-50' },
  ];

  const faqs = [
    {
      q: 'What is Sayyada Datasub and how fast is vending?',
      a: 'Sayyada Datasub is an automated fintech portal for instant VTU telecom recharge, data bundles, and utility bill settlements in Nigeria. Over 99.8% of transactions are delivered within 2 to 5 seconds server-to-server.',
    },
    {
      q: 'What happens if a transaction fails due to operator network downtime?',
      a: 'We operate with atomic zero-loss transactional guarantees. If the telecommunications aggregator reports an operator network timeout, our system automatically refunds 100% of your funds back to your wallet instantly.',
    },
    {
      q: 'Can I purchase airtime without creating an account?',
      a: 'Yes! Our Public Airtime Quick Buy widget allows visitors to enter their phone number and pay directly via Paystack inline (Debit Card, USSD, or Bank Transfer) without mandatory login.',
    },
    {
      q: 'How do I fund my wallet?',
      a: 'You can fund your wallet via Paystack online checkout or by transferring directly to your personal Dedicated Virtual Account (Wema Bank) generated in your customer dashboard.',
    },
    {
      q: 'Are your electricity meter tokens genuine and valid?',
      a: 'Yes. All 20-digit tokens are generated directly from the licensed Nigerian Electricity Distribution Companies (IKEDC, EKEDC, KEDCO, AEDC, IBEDC, PHED, etc.) through regulated aggregator gateways.',
    },
  ];

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    const detected = detectNetwork(val);
    if (detected) setNetwork(detected);
    setQuickError(null);
  };

  const handleGuestQuickBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidNigerianPhone(phone)) {
      setQuickError('Please enter a valid 11-digit phone number');
      return;
    }
    if (!guestEmail || !guestEmail.includes('@')) {
      setQuickError('Please enter a valid email for your receipt');
      return;
    }

    setIsProcessing(true);
    setQuickError(null);

    const amountKobo = amountNgn * 100;
    const ref = generateReference('SD_GUEST');

    try {
      await paystack.processFunding({
        email: guestEmail,
        amountKobo,
        userId: 'usr_guest_checkout',
        onSuccess: async () => {
          // Vend guest service
          const txn = await vtuProvider.vendService({
            service: quickServiceType,
            provider: network,
            amountKobo,
            costKobo: Math.round(amountKobo * 0.96),
            profitKobo: Math.round(amountKobo * 0.04),
            userId: 'usr_guest_checkout',
            reference: ref,
            recipientDetails: {
              phone,
              network,
              guestEmail,
            },
          });
          setActiveReceiptTxn(txn);
        },
        onCancel: () => {
          setQuickError('Payment was cancelled');
        },
      });
    } catch (err: any) {
      setQuickError(err.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Nigeria&apos;s Fastest 24/7 VTU & Bill Payments Portal</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-[1.15] text-balance">
              Instant Airtime, Cheap SME Data & 24/7 Bill Payments in Nigeria
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl">
              Buy MTN, Airtel, Glo & 9mobile data starting from ₦150. Generate 20-digit prepaid electricity tokens,
              renew DStv & GOtv bouquets, and purchase WAEC/JAMB PINs with instant delivery and zero double-charges.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate('customer-dashboard')}
                className="py-3 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                <span>Open Free Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigate('rates')}
                className="py-3 px-5 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs sm:text-sm rounded-xl border border-slate-300 transition-colors"
              >
                View Pricing & Margins
              </button>
              <button
                onClick={() => onNavigate('track-ref')}
                className="py-3 px-4 text-xs sm:text-sm font-semibold text-slate-600 hover:text-emerald-800 transition-colors"
              >
                Track Transaction Ref →
              </button>
            </div>

            {/* Trust Metrics */}
            <div className="pt-6 border-t border-slate-200 grid grid-cols-3 gap-4 text-xs">
              <div>
                <p className="text-xl font-bold font-mono text-slate-900">99.8%</p>
                <p className="text-slate-500 mt-0.5">Success Delivery Rate</p>
              </div>
              <div>
                <p className="text-xl font-bold font-mono text-slate-900">&lt; 3 Secs</p>
                <p className="text-slate-500 mt-0.5">Automated Dispatch</p>
              </div>
              <div>
                <p className="text-xl font-bold font-mono text-slate-900">₦0 Fee</p>
                <p className="text-slate-500 mt-0.5">Auto-Refund Guarantee</p>
              </div>
            </div>
          </div>

          {/* Right Hero: Public Quick Buy Card */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl p-6 relative">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Guest Quick Buy</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold">No Login Required</span>
              </div>

              {quickError && (
                <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                  {quickError}
                </div>
              )}

              <form onSubmit={handleGuestQuickBuy} className="mt-4 space-y-3.5">
                {/* Service toggle */}
                <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setQuickServiceType('airtime')}
                    className={`py-1.5 text-xs font-bold rounded-md transition-colors ${
                      quickServiceType === 'airtime' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    Airtime (2% Off)
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickServiceType('data')}
                    className={`py-1.5 text-xs font-bold rounded-md transition-colors ${
                      quickServiceType === 'data' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600'
                    }`}
                  >
                    1GB Data (₦290)
                  </button>
                </div>

                {/* Network Picker */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Network Provider</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {networks.map((net) => (
                      <button
                        key={net}
                        type="button"
                        onClick={() => setNetwork(net)}
                        className={`py-1.5 text-xs font-bold rounded-md border text-center transition-colors ${
                          network === net
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        {net}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recipient Phone */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Recipient Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="e.g. 08145239871"
                    maxLength={11}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                {/* Amount / Plan */}
                {quickServiceType === 'airtime' ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Airtime Amount (₦)</label>
                    <input
                      type="number"
                      min={50}
                      max={50000}
                      value={amountNgn}
                      onChange={(e) => setAmountNgn(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                    />
                  </div>
                ) : (
                  <div className="p-2.5 bg-emerald-50/70 rounded-lg border border-emerald-200 text-xs">
                    <p className="font-bold text-emerald-950">{network} SME 1GB (30 Days Validity)</p>
                    <p className="text-[11px] text-emerald-800">Fixed Special Guest Rate: ₦290.00</p>
                  </div>
                )}

                {/* Guest Email */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email for Receipt Delivery</label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="your-email@example.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>
                    {isProcessing
                      ? 'Initializing Paystack...'
                      : `Pay with Paystack (${formatNgn(quickServiceType === 'airtime' ? amountNgn : 290)})`}
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 10 Services Showcase Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Multi-Service Catalog</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Complete Digital Top-Up & Utility Bill Vending
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Automated direct API integration with Nigerian telecommunications networks, DisCos, and examination councils
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {services.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => onOpenQuickService(item.id)}
                className="bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-600 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-emerald-800">
                  <span>Vend Now</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Reseller & Rates Preview */}
      <section className="bg-slate-900 text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 space-y-4">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Reseller Pricing</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Designed for Business Resellers & High-Volume Portals
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Connect your business or kiosk to Sayyada Datasub. Benefit from industry-leading wholesale margins,
                instant automated bank transfer funding, and unified REST API webhook integrations.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => onNavigate('rates')}
                  className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors"
                >
                  View Full Reseller Rate Sheet
                </button>
              </div>
            </div>

            <div className="lg:col-span-7 bg-slate-800/80 rounded-2xl p-6 border border-slate-700/80">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 text-slate-400 font-semibold">
                      <th className="py-2 px-3">Service Plan</th>
                      <th className="py-2 px-3">Network</th>
                      <th className="py-2 px-3 text-right">Cost Price</th>
                      <th className="py-2 px-3 text-right">Recommended Retail</th>
                      <th className="py-2 px-3 text-right text-emerald-400">Reseller Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/60 font-mono">
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-semibold text-white">500MB SME Data</td>
                      <td className="py-2.5 px-3 text-slate-300">MTN</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">₦135.00</td>
                      <td className="py-2.5 px-3 text-right text-white">₦150.00</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">+₦15.00 (11%)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-semibold text-white">1.0GB SME Data</td>
                      <td className="py-2.5 px-3 text-slate-300">MTN</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">₦260.00</td>
                      <td className="py-2.5 px-3 text-right text-white">₦290.00</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">+₦30.00 (11.5%)</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-semibold text-white">WAEC Result Checker e-PIN</td>
                      <td className="py-2.5 px-3 text-slate-300">WAEC</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">₦3,500.00</td>
                      <td className="py-2.5 px-3 text-right text-white">₦3,750.00</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">+₦250.00</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 px-3 font-sans font-semibold text-white">NECO Result Token</td>
                      <td className="py-2.5 px-3 text-slate-300">NECO</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">₦1,300.00</td>
                      <td className="py-2.5 px-3 text-right text-white">₦1,450.00</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">+₦150.00</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Everything you need to know about wallet funding, delivery speeds, and refunds
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-900 hover:bg-slate-50 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
