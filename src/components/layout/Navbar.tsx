import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { formatKoboToNgn } from '../../lib/formatters';
import { NotificationBell } from '../shared/NotificationBell';
import {
  Wallet,
  Menu,
  X,
  ArrowRight,
  PlusCircle,
  LogOut,
} from 'lucide-react';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onOpenFundWallet: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onOpenFundWallet,
}) => {
  const { user, isAdmin, logout } = useAuth();
  const { balanceKobo } = useWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'landing', label: 'Home' },
    { id: 'services-overview', label: 'All Services' },
    { id: 'rates', label: 'Pricing & Rates' },
    { id: 'track-ref', label: 'Track Ref' },
    { id: 'blog', label: 'Fintech Blog' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-extrabold text-lg shadow-sm group-hover:bg-emerald-800 transition-colors">
              M
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 block leading-tight">
                MEENABTY<span className="text-emerald-700">DATASUB</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide block">
                VTU & BILL PAYMENTS
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => onNavigate(link.id)}
              className={`hover:text-emerald-700 transition-colors whitespace-nowrap shrink-0 py-1 ${
                currentView === link.id ? 'text-emerald-700 font-semibold border-b-2 border-emerald-700' : ''
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Primary Actions & User Info */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2">
              {/* Real-time Notification Bell */}
              <NotificationBell onNavigate={onNavigate} />

              {/* Wallet pill */}
              <button
                onClick={onOpenFundWallet}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs transition-colors"
                title="Click to Fund Wallet"
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-700" />
                <span className="font-mono font-bold">{formatKoboToNgn(balanceKobo)}</span>
                <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
              </button>

              <button
                onClick={() => onNavigate(isAdmin ? 'admin-dashboard' : 'customer-dashboard')}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <span>{isAdmin ? 'Admin Panel' : 'Dashboard'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={async () => {
                  await logout();
                  onNavigate('login');
                }}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('login')}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => onNavigate('register')}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors shadow-xs"
              >
                Get Started
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 lg:hidden text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-3 animate-in slide-in-from-top-2">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => {
                  onNavigate(link.id);
                  setMobileMenuOpen(false);
                }}
                className={`px-3 py-2 text-left text-sm rounded-lg font-medium ${
                  currentView === link.id
                    ? 'bg-emerald-50 text-emerald-800 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </div>

          {user && (
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <button
                onClick={() => {
                  onOpenFundWallet();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 px-3 text-xs font-semibold text-emerald-800 bg-emerald-50 rounded-lg border border-emerald-200 flex items-center justify-center gap-2"
              >
                <Wallet className="w-4 h-4 text-emerald-600" />
                <span>Fund Wallet ({formatKoboToNgn(balanceKobo)})</span>
              </button>
              <button
                onClick={() => {
                  onNavigate(isAdmin ? 'admin-dashboard' : 'customer-dashboard');
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2 px-3 text-xs font-semibold text-white bg-slate-900 rounded-lg"
              >
                Open {isAdmin ? 'Admin Console' : 'Customer Dashboard'}
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
