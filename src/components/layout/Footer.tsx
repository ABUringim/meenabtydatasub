import React from 'react';
import { ShieldCheck, Phone, Mail, MapPin, ExternalLink } from 'lucide-react';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Col 1: About */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-extrabold text-base">
                M
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                MEENABTY<span className="text-emerald-400">DATASUB</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed pr-6">
              Nigeria&apos;s foremost multi-service digital VTU portal. Fast, reliable telecom & utility vending
              with zero double-charges, atomic wallet deductions, and automated instant refunds on failed network responses.
            </p>
            <div className="flex items-center gap-3 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Bank-Grade 256-Bit SSL Encryption · Paystack Verified Partner</span>
            </div>
          </div>

          {/* Col 2: Services 1-5 */}
          <div className="space-y-3">
            <p className="font-semibold text-white uppercase tracking-wider text-[11px]">Core Services</p>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('service-airtime')} className="hover:text-emerald-400 transition-colors">
                  Instant Airtime (VTU)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('service-data')} className="hover:text-emerald-400 transition-colors">
                  SME & Corporate Data
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('service-electricity')} className="hover:text-emerald-400 transition-colors">
                  Electricity Meter Tokens
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('service-tv')} className="hover:text-emerald-400 transition-colors">
                  Cable TV (DStv, GOtv)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('service-exam')} className="hover:text-emerald-400 transition-colors">
                  WAEC & NECO Result PINs
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Services 6-10 */}
          <div className="space-y-3">
            <p className="font-semibold text-white uppercase tracking-wider text-[11px]">More Fintech</p>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('service-remit')} className="hover:text-emerald-400 transition-colors">
                  Remit Money Transfer
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('service-invoice')} className="hover:text-emerald-400 transition-colors">
                  Commercial Invoice Pay
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('service-giftcard')} className="hover:text-emerald-400 transition-colors">
                  Buy & Sell Gift Cards
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('service-transport')} className="hover:text-emerald-400 transition-colors">
                  Cowry & Toll Card Topup
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('service-travel')} className="hover:text-emerald-400 transition-colors">
                  Travel & Hotel Booking
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Contact & Base */}
          <div className="space-y-3">
            <p className="font-semibold text-white uppercase tracking-wider text-[11px]">Support & Office</p>
            <ul className="space-y-2.5 text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Ring Road Commercial Complex, Kano State, Nigeria</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>+234 814 523 9871</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>support@meenabtydatasub.com</span>
              </li>
              <li className="pt-2">
                <button
                  onClick={() => onNavigate('track-ref')}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg text-center transition-colors"
                >
                  Verify Transaction Ref
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} Meenabty Datasub Integrated Technologies. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('faq')} className="hover:text-slate-300">FAQ</button>
            <span>·</span>
            <button onClick={() => onNavigate('terms')} className="hover:text-slate-300">Terms of Service</button>
            <span>·</span>
            <button onClick={() => onNavigate('privacy')} className="hover:text-slate-300">Privacy & NDPR</button>
            <span>·</span>
            <button onClick={() => onNavigate('admin-login')} className="text-slate-500 hover:text-emerald-400 font-mono text-[10px]">Staff Portal</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
