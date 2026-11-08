import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { formatKoboToNgn } from '../../lib/formatters';
import { SaveBeneficiaryBanner } from '../dashboard/SaveBeneficiaryBanner';
import { TransactionsTab } from '../dashboard/tabs/TransactionsTab';
import { SpendingTab } from '../dashboard/tabs/SpendingTab';
import { ActivityTab } from '../dashboard/tabs/ActivityTab';
import { ReceiptsTab } from '../dashboard/tabs/ReceiptsTab';
import { BeneficiariesTab } from '../dashboard/tabs/BeneficiariesTab';
import {
  Wallet,
  ArrowUpRight,
  PlusCircle,
  Copy,
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
  PieChart,
  Layers,
  FileText,
  BookmarkCheck,
  Check,
} from 'lucide-react';

interface CustomerDashboardProps {
  onSelectService: (serviceTab: string) => void;
  onOpenFundWallet: () => void;
}

export type CustomerDashboardTab =
  | 'transactions'
  | 'spending'
  | 'activity'
  | 'receipts'
  | 'beneficiaries';

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onSelectService,
  onOpenFundWallet,
}) => {
  const { user } = useAuth();
  const {
    balanceKobo,
    transactions,
    beneficiaries,
    activities,
    receipts,
    recentVendedRecipient,
  } = useWallet();

  const [activeTab, setActiveTab] = useState<CustomerDashboardTab>('transactions');
  const [copiedAccount, setCopiedAccount] = useState(false);

  const handleCopyAccount = () => {
    if (user?.virtual_account?.accountNumber) {
      navigator.clipboard.writeText(user.virtual_account.accountNumber);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  const quickServices = [
    { id: 'service-airtime', label: 'Airtime VTU', icon: Smartphone, color: 'text-emerald-700 bg-emerald-50' },
    { id: 'service-data', label: 'Buy Data', icon: Wifi, color: 'text-blue-700 bg-blue-50' },
    { id: 'service-electricity', label: 'Electricity Bills', icon: Zap, color: 'text-amber-700 bg-amber-50' },
    { id: 'service-tv', label: 'Cable TV', icon: Tv, color: 'text-purple-700 bg-purple-50' },
    { id: 'service-exam', label: 'Exam PINs', icon: GraduationCap, color: 'text-indigo-700 bg-indigo-50' },
    { id: 'service-remit', label: 'Remit Transfer', icon: SendHorizontal, color: 'text-teal-700 bg-teal-50' },
    { id: 'service-invoice', label: 'Pay Invoice', icon: Receipt, color: 'text-rose-700 bg-rose-50' },
    { id: 'service-giftcard', label: 'Gift Cards', icon: Gift, color: 'text-pink-700 bg-pink-50' },
    { id: 'service-transport', label: 'Transport / Toll', icon: Car, color: 'text-sky-700 bg-sky-50' },
    { id: 'service-travel', label: 'Travel & Hotel', icon: Plane, color: 'text-orange-700 bg-orange-50' },
  ];

  // Calculate totals
  const successfulTxns = transactions.filter((t) => t.status === 'success');
  const totalSpentKobo = successfulTxns.reduce((acc, t) => acc + t.amount, 0);

  const tabs: Array<{
    id: CustomerDashboardTab;
    label: string;
    icon: any;
    count?: number;
  }> = [
    { id: 'transactions', label: 'My Transactions', icon: Clock, count: transactions.length },
    { id: 'spending', label: 'Spending Analytics', icon: PieChart },
    { id: 'activity', label: 'Activity Timeline', icon: Layers, count: activities.length },
    { id: 'receipts', label: 'My Receipts', icon: FileText, count: receipts.length },
    { id: 'beneficiaries', label: 'My Beneficiaries', icon: BookmarkCheck, count: beneficiaries.length },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Wallet Balance Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-200 text-xs font-semibold">
                <Wallet className="w-4 h-4 text-emerald-300" />
                <span>ACTIVE WALLET BALANCE</span>
              </div>
              <span className="text-[11px] font-semibold bg-emerald-700/60 text-emerald-200 px-2.5 py-0.5 rounded-full border border-emerald-600/50">
                Tier {user?.tier || 1} Account · {user?.kyc_status === 'verified' ? 'Verified' : 'Unverified'}
              </span>
            </div>

            <div className="mt-3">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-white">
                {formatKoboToNgn(balanceKobo)}
              </span>
            </div>

            <p className="text-xs text-emerald-200/80 mt-1">
              Available for instant 24/7 automated bill payment & telecom vending
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-emerald-700/50 flex flex-wrap items-center justify-between gap-3 relative z-10">
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenFundWallet}
                className="py-2 px-4 bg-white hover:bg-emerald-50 text-emerald-950 font-bold text-xs rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4 text-emerald-700" />
                <span>Fund Wallet (Paystack)</span>
              </button>
              <button
                onClick={() => onSelectService('service-data')}
                className="py-2 px-4 bg-emerald-700/60 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl border border-emerald-600 transition-colors"
              >
                Buy Data
              </button>
            </div>

            <div className="text-right text-[11px] text-emerald-200/70">
              User ID: <span className="font-mono text-white">{user?.uid}</span>
            </div>
          </div>
        </div>

        {/* Dedicated Bank Virtual Account */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <p className="text-xs font-bold text-slate-800">Automated Direct Bank Transfer</p>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Instant Top-Up
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-[11px] text-slate-500">Bank Name</p>
                <p className="text-xs font-bold text-slate-900">{user?.virtual_account?.bankName || 'Wema Bank'}</p>
              </div>

              <div>
                <p className="text-[11px] text-slate-500">Dedicated Account Number</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl font-mono font-extrabold text-slate-900 tracking-wider">
                    {user?.virtual_account?.accountNumber || '9928374102'}
                  </span>
                  <button
                    onClick={handleCopyAccount}
                    className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                    title="Copy Account Number"
                  >
                    {copiedAccount ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                  {copiedAccount && <span className="text-[10px] font-bold text-emerald-700">Copied!</span>}
                </div>
              </div>

              <div>
                <p className="text-[11px] text-slate-500">Beneficiary Name</p>
                <p className="text-xs font-medium text-slate-700 truncate">
                  {user?.virtual_account?.accountName || `SAYYADA-${user?.name.toUpperCase()}`}
                </p>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 mt-4 pt-3 border-t border-slate-100">
            Transfer from any Nigerian banking app. Account auto-credits instantly.
          </p>
        </div>
      </div>

      {/* Non-Blocking Inline Beneficiary Banner (Triggered after successful purchase) */}
      {recentVendedRecipient && (
        <SaveBeneficiaryBanner prompt={recentVendedRecipient} />
      )}

      {/* Quick Services Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900">Select Digital Service to Vend</h2>
          <span className="text-xs text-slate-500">10 Core Services Available</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {quickServices.map((service) => {
            const Icon = service.icon;
            return (
              <button
                key={service.id}
                onClick={() => onSelectService(service.id)}
                className="bg-white border border-slate-200 hover:border-emerald-600 hover:shadow-sm p-4 rounded-xl text-left transition-all group flex flex-col justify-between"
              >
                <div className={`w-9 h-9 rounded-lg ${service.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {service.label}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                    <span>Instant delivery</span>
                    <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <p className="text-[11px] text-slate-500 font-medium">Total Spend (Life)</p>
          <p className="text-lg font-bold font-mono text-slate-900 mt-1">{formatKoboToNgn(totalSpentKobo)}</p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <p className="text-[11px] text-slate-500 font-medium">Orders Completed</p>
          <p className="text-lg font-bold font-mono text-emerald-800 mt-1">{successfulTxns.length}</p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <p className="text-[11px] text-slate-500 font-medium">Platform Success Rate</p>
          <p className="text-lg font-bold font-mono text-slate-900 mt-1">99.8%</p>
        </div>
        <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
          <p className="text-[11px] text-slate-500 font-medium">Saved Beneficiaries</p>
          <p className="text-lg font-bold font-mono text-slate-900 mt-1">{beneficiaries.length}</p>
        </div>
      </div>

      {/* 5-SEGMENTED CUSTOMER DATA COCKPIT */}
      <div className="space-y-4">
        {/* Segmented Control Bar */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-emerald-800/80 text-emerald-100' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div>
          {activeTab === 'transactions' && (
            <TransactionsTab
              onRepeatService={(serviceTab) => onSelectService(serviceTab)}
            />
          )}
          {activeTab === 'spending' && <SpendingTab />}
          {activeTab === 'activity' && <ActivityTab />}
          {activeTab === 'receipts' && <ReceiptsTab />}
          {activeTab === 'beneficiaries' && (
            <BeneficiariesTab
              onUseBeneficiary={(serviceTab) => onSelectService(serviceTab)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
