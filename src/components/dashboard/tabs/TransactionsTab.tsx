import React, { useState, useMemo } from 'react';
import { Transaction } from '../../../types';
import { useWallet } from '../../../context/WalletContext';
import { TransactionCard } from '../TransactionCard';
import { EmptyState } from '../EmptyState';
import { FilterModal, FilterCriteria } from '../modals/FilterModal';
import { ReceiptViewModal } from '../modals/ReceiptViewModal';
import { ReportIssueModal } from '../modals/ReportIssueModal';
import { RepeatPurchaseModal } from '../modals/RepeatPurchaseModal';
import { formatWATDate } from '../../../lib/formatters';
import {
  Search,
  Filter,
  Download,
  RotateCcw,
  Clock,
  Sparkles,
} from 'lucide-react';

interface TransactionsTabProps {
  onRepeatService?: (serviceTab: string, prefill?: any) => void;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({ onRepeatService }) => {
  const { transactions } = useWallet();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCriteria, setFilterCriteria] = useState<FilterCriteria>({
    service: 'all',
    status: 'all',
    datePreset: 'all',
  });
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [activeReceiptTxn, setActiveReceiptTxn] = useState<Transaction | null>(null);
  const [activeDisputeTxn, setActiveDisputeTxn] = useState<Transaction | null>(null);
  const [activeRepeatTxn, setActiveRepeatTxn] = useState<Transaction | null>(null);

  // Filter logic
  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Search Query
      const q = searchQuery.toLowerCase().trim();
      const refMatches = t.reference.toLowerCase().includes(q);
      const provMatches = t.provider.toLowerCase().includes(q);
      const phoneMatches = t.recipient_details.phone?.includes(q);
      const meterMatches = t.recipient_details.meterNo?.includes(q);
      const smartcardMatches = t.recipient_details.smartcardNo?.includes(q);
      const accMatches = t.recipient_details.accountNumber?.includes(q);
      const nameMatches = t.recipient_details.customerName?.toLowerCase().includes(q);

      const matchesSearch =
        !q ||
        refMatches ||
        provMatches ||
        phoneMatches ||
        meterMatches ||
        smartcardMatches ||
        accMatches ||
        nameMatches;

      if (!matchesSearch) return false;

      // 2. Service
      if (filterCriteria.service !== 'all' && t.service !== filterCriteria.service) {
        return false;
      }

      // 3. Status
      if (filterCriteria.status !== 'all' && t.status !== filterCriteria.status) {
        return false;
      }

      // 4. Date Preset
      if (filterCriteria.datePreset !== 'all') {
        const txTime = new Date(t.created_at).getTime();
        const now = Date.now();
        if (filterCriteria.datePreset === 'today') {
          const startOfToday = new Date().setHours(0, 0, 0, 0);
          if (txTime < startOfToday) return false;
        } else if (filterCriteria.datePreset === '7days') {
          if (txTime < now - 7 * 86400000) return false;
        } else if (filterCriteria.datePreset === '30days') {
          if (txTime < now - 30 * 86400000) return false;
        } else if (filterCriteria.datePreset === 'this_month') {
          const cur = new Date();
          const txDate = new Date(t.created_at);
          if (txDate.getMonth() !== cur.getMonth() || txDate.getFullYear() !== cur.getFullYear()) {
            return false;
          }
        }
      }

      // 5. Amount range
      if (filterCriteria.minAmountNgn && t.amount / 100 < filterCriteria.minAmountNgn) {
        return false;
      }
      if (filterCriteria.maxAmountNgn && t.amount / 100 > filterCriteria.maxAmountNgn) {
        return false;
      }

      return true;
    });
  }, [transactions, searchQuery, filterCriteria]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Reference', 'Date (WAT)', 'Service', 'Provider', 'Amount (NGN)', 'Status', 'Recipient'];
    const rows = filtered.map((t) => [
      t.reference,
      formatWATDate(t.created_at),
      t.service,
      t.provider,
      (t.amount / 100).toFixed(2),
      t.status,
      t.recipient_details.phone ||
        t.recipient_details.meterNo ||
        t.recipient_details.smartcardNo ||
        t.recipient_details.accountNumber ||
        '',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Meenabty_Statement_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRepeatClick = (txn: Transaction) => {
    setActiveRepeatTxn(txn);
  };

  const handleConfirmRepeat = (txn: Transaction) => {
    const serviceTabMap: Record<string, string> = {
      airtime: 'service-airtime',
      data: 'service-data',
      electricity: 'service-electricity',
      tv: 'service-tv',
      exam: 'service-exam',
      remit: 'service-remit',
      invoice: 'service-invoice',
      giftcard: 'service-giftcard',
      transport: 'service-transport',
      travel: 'service-travel',
    };
    const targetTab = serviceTabMap[txn.service] || 'service-data';
    onRepeatService?.(targetTab, txn.recipient_details);
  };

  const hasActiveFilters =
    filterCriteria.service !== 'all' ||
    filterCriteria.status !== 'all' ||
    filterCriteria.datePreset !== 'all' ||
    filterCriteria.minAmountNgn !== undefined ||
    filterCriteria.maxAmountNgn !== undefined;

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by reference, recipient phone, meter, or smartcard..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className={`py-2 px-3.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 ${
              hasActiveFilters
                ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className={`w-3.5 h-3.5 ${hasActiveFilters ? 'text-emerald-700' : 'text-slate-500'}`} />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={() =>
                setFilterCriteria({
                  service: 'all',
                  status: 'all',
                  datePreset: 'all',
                })
              }
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={handleExportCsv}
            className="py-2 px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
            title="Download CSV Statement"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Results Header Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong className="text-slate-800">{filtered.length}</strong> of{' '}
          {transactions.length} transactions
        </span>
        {hasActiveFilters && (
          <span className="text-emerald-700 font-medium">Filtered statement active</span>
        )}
      </div>

      {/* Transactions List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No transactions found"
          description={
            hasActiveFilters || searchQuery
              ? 'No transactions match the specified search or filter criteria. Try clearing filters to see all records.'
              : 'You have not made any digital top-ups or bill payments yet. Select any service to recharge!'
          }
          actionLabel={hasActiveFilters ? 'Clear Filters' : undefined}
          onAction={() => {
            setSearchQuery('');
            setFilterCriteria({ service: 'all', status: 'all', datePreset: 'all' });
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((t) => (
            <TransactionCard
              key={t.id}
              transaction={t}
              onViewReceipt={(txn) => setActiveReceiptTxn(txn)}
              onRepeat={handleRepeatClick}
              onReportIssue={(txn) => setActiveDisputeTxn(txn)}
            />
          ))}
        </div>
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        criteria={filterCriteria}
        onApply={(newCrit) => setFilterCriteria(newCrit)}
        onReset={() =>
          setFilterCriteria({ service: 'all', status: 'all', datePreset: 'all' })
        }
      />

      {/* Receipt Modal */}
      <ReceiptViewModal
        isOpen={Boolean(activeReceiptTxn)}
        transaction={activeReceiptTxn}
        onClose={() => setActiveReceiptTxn(null)}
      />

      {/* Dispute Modal */}
      <ReportIssueModal
        isOpen={Boolean(activeDisputeTxn)}
        transaction={activeDisputeTxn}
        onClose={() => setActiveDisputeTxn(null)}
      />

      {/* Repeat Purchase Confirmation Modal */}
      <RepeatPurchaseModal
        isOpen={Boolean(activeRepeatTxn)}
        transaction={activeRepeatTxn}
        onClose={() => setActiveRepeatTxn(null)}
        onConfirm={handleConfirmRepeat}
      />
    </div>
  );
};
