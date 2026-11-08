import React, { useState } from 'react';
import { storage } from '../../services/storage';
import { Transaction } from '../../types';
import { formatKoboToNgn, formatWATDate } from '../../lib/formatters';
import { StatusBadge } from '../shared/StatusBadge';
import { useWallet } from '../../context/WalletContext';
import { Search, CheckCircle2, Clock, AlertCircle, FileText, ArrowRight } from 'lucide-react';

interface ReferenceLookupPageProps {
  onRaiseDispute?: (reference: string) => void;
}

export const ReferenceLookupPage: React.FC<ReferenceLookupPageProps> = ({ onRaiseDispute }) => {
  const { setActiveReceiptTxn } = useWallet();
  const [queryRef, setQueryRef] = useState('');
  const [searchedTxn, setSearchedTxn] = useState<Transaction | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryRef.trim()) return;
    setError(null);
    const found = storage.getTransactionByReference(queryRef.trim());
    setSearchedTxn(found);
    setHasSearched(true);
    if (!found) {
      setError(`No transaction found matching reference "${queryRef.trim()}". Please double-check the code from your receipt or SMS.`);
    }
  };

  const sampleReferences = [
    'SD_TXN_MTN_SME_98231',
    'SD_TXN_ELEC_KEDCO_48123',
    'SD_TXN_EXAM_WAEC_77123',
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Transaction Reference Lookup & Tracker
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
          Verify real-time delivery status, retrieve electricity meter tokens, or inspect operator response codes.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              value={queryRef}
              onChange={(e) => setQueryRef(e.target.value)}
              placeholder="Enter reference e.g. SD_TXN_MTN_..."
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
          <button
            type="submit"
            className="py-3 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-colors shadow-xs"
          >
            Track Status
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
          <span>Try sample references:</span>
          {sampleReferences.map((ref) => (
            <button
              key={ref}
              type="button"
              onClick={() => {
                setQueryRef(ref);
                const found = storage.getTransactionByReference(ref);
                setSearchedTxn(found);
                setHasSearched(true);
                setError(null);
              }}
              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded font-mono text-[11px] text-slate-700 transition-colors"
            >
              {ref}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Transaction Not Found</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Transaction Result Card & Delivery Timeline */}
      {searchedTxn && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[11px] text-slate-400 font-mono">Reference</span>
              <p className="text-base font-bold font-mono text-slate-900">{searchedTxn.reference}</p>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={searchedTxn.status} />
              <button
                onClick={() => setActiveReceiptTxn(searchedTxn)}
                className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 transition-colors"
              >
                View Full Receipt
              </button>
            </div>
          </div>

          {/* Special Token Box */}
          {searchedTxn.recipient_details.token && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-1">
              <p className="text-xs font-semibold text-emerald-900">PREPAID METER TOKEN</p>
              <p className="text-xl sm:text-2xl font-mono font-extrabold text-emerald-950 tracking-wider">
                {searchedTxn.recipient_details.token}
              </p>
              {searchedTxn.recipient_details.units && (
                <p className="text-xs text-emerald-800 font-medium">
                  Allocated Units: {searchedTxn.recipient_details.units}
                </p>
              )}
            </div>
          )}

          {/* Timeline */}
          <div>
            <p className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
              Real-Time Audit Timeline
            </p>
            <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 pl-8">
              <div className="relative">
                <span className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-emerald-100 border-2 border-emerald-600 flex items-center justify-center text-[10px] text-emerald-800 font-bold">
                  ✓
                </span>
                <p className="text-xs font-bold text-slate-900">Order Initiated & Authorized</p>
                <p className="text-[11px] text-slate-500">{formatWATDate(searchedTxn.created_at)}</p>
              </div>

              <div className="relative">
                <span className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-emerald-100 border-2 border-emerald-600 flex items-center justify-center text-[10px] text-emerald-800 font-bold">
                  ✓
                </span>
                <p className="text-xs font-bold text-slate-900">Wallet Balance Debited Atomically</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  Amount: {formatKoboToNgn(searchedTxn.amount)}
                </p>
              </div>

              <div className="relative">
                <span className="absolute -left-8 top-0.5 w-6 h-6 rounded-full bg-emerald-100 border-2 border-emerald-600 flex items-center justify-center text-[10px] text-emerald-800 font-bold">
                  ✓
                </span>
                <p className="text-xs font-bold text-slate-900">Dispatched to Upstream Aggregator Gateway</p>
                <p className="text-[11px] text-slate-500">Provider: {searchedTxn.provider}</p>
              </div>

              <div className="relative">
                <span className={`absolute -left-8 top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold ${
                  searchedTxn.status === 'success'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-rose-100 text-rose-800 border-rose-600'
                }`}>
                  {searchedTxn.status === 'success' ? '✓' : '!'}
                </span>
                <p className="text-xs font-bold text-slate-900">
                  {searchedTxn.status === 'success' ? 'Confirmed by Telecommunications Operator' : 'Network Delivery Failed'}
                </p>
                <p className="text-[11px] text-slate-500">
                  {searchedTxn.vtu_response?.message || 'Delivered to end-user line'}
                </p>
                {searchedTxn.status === 'failed' && onRaiseDispute && (
                  <button
                    onClick={() => onRaiseDispute(searchedTxn.reference)}
                    className="mt-2 py-1 px-2.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded text-xs font-semibold"
                  >
                    Raise Support Dispute on this Transaction
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
