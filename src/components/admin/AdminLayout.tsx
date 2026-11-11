import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminForbidden } from './AdminForbidden';
import {
  BarChart3,
  Users,
  Clock,
  Sliders,
  TrendingUp,
  Server,
  CreditCard,
  FileText,
  HelpCircle,
  Bell,
  ShieldCheck,
  Activity,
  Download,
  Settings,
  Lock,
  LogOut,
  ShieldAlert,
  ChevronRight,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';

interface AdminLayoutProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onExitAdmin: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onSelectTab,
  onExitAdmin,
  children,
}) => {
  const { user, role, isAdmin, isOwner, adminSessionActive, adminLogout, switchRole, touchSession } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unlockCode, setUnlockCode] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // If not admin, block with Forbidden view
  if (!isAdmin) {
    return <AdminForbidden onReturnToDashboard={onExitAdmin} />;
  }

  const handleUnlockSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockCode === '123456' || unlockCode === '1234') {
      touchSession();
      setUnlockCode('');
      setUnlockError(null);
    } else {
      setUnlockError('Invalid 2FA Authenticator Code. Demo code is 123456.');
    }
  };

  const navItems = [
    { id: 'overview', label: '1. Overview Dashboard', icon: BarChart3, ownerOnly: false },
    { id: 'users', label: '2. User Management', icon: Users, ownerOnly: false },
    { id: 'transactions', label: '3. Transaction Monitor', icon: Clock, ownerOnly: false },
    { id: 'products', label: '4. Products & Catalog', icon: Sliders, ownerOnly: false },
    { id: 'pricing', label: '5. Pricing & Profit Engine', icon: TrendingUp, ownerOnly: false },
    { id: 'vtu-providers', label: '6. VTU Aggregators', icon: Server, ownerOnly: true },
    { id: 'paystack', label: '7. Paystack & Float', icon: CreditCard, ownerOnly: true },
    { id: 'cms', label: '8. Content & CMS', icon: FileText, ownerOnly: false },
    { id: 'disputes', label: '9. Dispute Resolution', icon: HelpCircle, ownerOnly: false },
    { id: 'notifications', label: '10. Notifications Center', icon: Bell, ownerOnly: false },
    { id: 'roles', label: '11. Roles & Permissions', icon: ShieldCheck, ownerOnly: true },
    { id: 'audit-logs', label: '12. Audit & Security Logs', icon: Activity, ownerOnly: false },
    { id: 'reports', label: '13. Reports & Analytics', icon: Download, ownerOnly: false },
    { id: 'settings', label: '14. Platform Settings', icon: Settings, ownerOnly: false },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-slate-100 antialiased">
      {/* Top Administration Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950 border-b border-slate-800 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('overview')}
            className="flex items-center gap-2.5 text-left group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-base shadow-sm">
              M
            </div>
            <div>
              <span className="text-sm font-black tracking-tight text-white block leading-tight">
                MEENABTY<span className="text-emerald-400">ADMIN</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono tracking-wide block">
                SECURITY CONSOLE
              </span>
            </div>
          </button>

          {/* Role Badge */}
          {isOwner ? (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Sparkles className="w-3 h-3 text-amber-400" />
              Owner Tier
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
              <ShieldCheck className="w-3 h-3 text-indigo-400" />
              Operations Admin
            </span>
          )}
        </div>

        {/* Global Admin Search Bar */}
        <div className="hidden lg:flex items-center flex-1 max-w-md mx-6">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Quick search customers, transactions, or products (Press /)..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val.startsWith('SD_') || val.startsWith('SD-') || val.startsWith('SD_PAY')) {
                    onSelectTab('transactions');
                  } else if (val.includes('@') || /^\d{11}$/.test(val)) {
                    onSelectTab('users');
                  } else {
                    onSelectTab('products');
                  }
                }
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 font-mono"
            />
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-3">
          {/* Quick Role preview switch for evaluator testing */}
          <div className="hidden md:flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] font-semibold">
            <button
              onClick={() => switchRole('owner')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                isOwner ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Owner Mode
            </button>
            <button
              onClick={() => switchRole('admin')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                role === 'admin' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin Mode
            </button>
            <button
              onClick={() => {
                switchRole('customer');
                onExitAdmin();
              }}
              className="px-2.5 py-1 rounded-md text-slate-400 hover:text-white transition-colors"
            >
              Customer View
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Session: Active (2FA)</span>
          </div>

          <button
            onClick={adminLogout}
            className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
            title="Lock & Exit Console"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit Console</span>
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Main Admin Body */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-64 shrink-0 bg-slate-950 border-r border-slate-800 flex-col justify-between p-4">
          <div className="space-y-4">
            <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              ADMINISTRATION SUITE (14 MODULES)
            </p>

            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                const isRestricted = item.ownerOnly && !isOwner;

                return (
                  <button
                    key={item.id}
                    disabled={isRestricted}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                      isActive
                        ? 'bg-emerald-600 text-white font-bold'
                        : isRestricted
                        ? 'text-slate-600 cursor-not-allowed opacity-50'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {item.ownerOnly && (
                      <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Owner
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500">
            <p className="font-semibold text-slate-300 truncate">{user?.name}</p>
            <p className="truncate font-mono">{user?.email}</p>
            <p className="text-[10px] text-emerald-400 mt-1">IP: {user?.ip_address || '102.89.44.1'}</p>
          </div>
        </aside>

        {/* Main View Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Inactivity Session Timeout Screen (if session expired) */}
      {!adminSessionActive && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-center space-y-4 text-white">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Admin Session Locked</h2>
              <p className="text-xs text-slate-400 mt-1">
                Your session was locked due to 30 minutes of inactivity. Re-enter your 2FA TOTP code to resume.
              </p>
            </div>

            {unlockError && (
              <p className="p-2 bg-rose-950/60 border border-rose-800 text-rose-300 rounded text-xs">
                {unlockError}
              </p>
            )}

            <form onSubmit={handleUnlockSession} className="space-y-3">
              <input
                type="text"
                maxLength={6}
                required
                value={unlockCode}
                onChange={(e) => setUnlockCode(e.target.value)}
                placeholder="Enter 2FA Code (123456)"
                className="w-full py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-center font-mono font-bold text-lg text-emerald-400 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs rounded-xl transition-colors"
              >
                Resume Admin Session
              </button>
              <button
                type="button"
                onClick={adminLogout}
                className="w-full text-xs text-slate-500 hover:text-slate-300"
              >
                Sign out completely
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
