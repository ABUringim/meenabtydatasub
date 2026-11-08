import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
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
  Clock,
  Users,
  ShieldCheck,
  Settings,
  HelpCircle,
  BarChart3,
  Sliders,
  Server,
  FileText,
  CreditCard,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenFundWallet: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenFundWallet,
  onLogout,
}) => {
  const { user, isAdmin, logout } = useAuth();

  const customerNav = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'service-airtime', label: 'Airtime VTU', icon: Smartphone },
    { id: 'service-data', label: 'Buy Data Bundles', icon: Wifi },
    { id: 'service-electricity', label: 'Electricity Bills', icon: Zap },
    { id: 'service-tv', label: 'Cable TV Subscription', icon: Tv },
    { id: 'service-exam', label: 'School & Exam PINs', icon: GraduationCap },
    { id: 'service-remit', label: 'Remit Transfer', icon: SendHorizontal },
    { id: 'service-invoice', label: 'Invoice Payment', icon: Receipt },
    { id: 'service-giftcard', label: 'Gift Cards', icon: Gift },
    { id: 'service-transport', label: 'Transport & Toll', icon: Car },
    { id: 'service-travel', label: 'Travel & Hotel', icon: Plane },
  ];

  const accountNav = [
    { id: 'transactions', label: 'Transaction History', icon: Clock },
    { id: 'beneficiaries', label: 'Saved Beneficiaries', icon: Users },
    { id: 'kyc', label: 'Profile & KYC Verification', icon: ShieldCheck },
    { id: 'settings', label: 'Security & PIN', icon: Settings },
    { id: 'support', label: 'Support & Disputes', icon: HelpCircle },
  ];

  const adminNav = [
    { id: 'admin-overview', label: 'Admin Overview', icon: BarChart3 },
    { id: 'admin-users', label: 'User Management', icon: Users },
    { id: 'admin-transactions', label: 'Transaction Monitor', icon: Clock },
    { id: 'admin-products', label: 'Products & Pricing', icon: Sliders },
    { id: 'admin-providers', label: 'VTU Providers Config', icon: Server },
    { id: 'admin-disputes', label: 'Dispute Resolutions', icon: HelpCircle },
    { id: 'admin-audit', label: 'Audit Logs', icon: FileText },
  ];

  const activeList = isAdmin ? adminNav : [...customerNav, ...accountNav];

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between p-4">
      <div className="space-y-6">
        {/* Quick Fund Button (Customer only) */}
        {!isAdmin && (
          <button
            onClick={onOpenFundWallet}
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
          >
            <CreditCard className="w-4 h-4" />
            <span>+ Fund Wallet (Paystack)</span>
          </button>
        )}

        {/* Section title */}
        <div>
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            {isAdmin ? 'ADMINISTRATION SUITE' : 'SERVICES & VENDING'}
          </p>
          <nav className="space-y-1">
            {(isAdmin ? adminNav : customerNav).map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {!isAdmin && (
          <div>
            <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              MY ACCOUNT
            </p>
            <nav className="space-y-1">
              {accountNav.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition-colors text-left ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 font-semibold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User profile card & logout */}
      <div className="pt-4 border-t border-slate-100 space-y-2">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
            {user?.name.slice(0, 2).toUpperCase() || 'US'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={async () => {
            await logout();
            onLogout?.();
          }}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
