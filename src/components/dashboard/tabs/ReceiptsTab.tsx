import React, { useState } from 'react';
import { useReceipts } from '../../../hooks/useReceipts';
import { useWallet } from '../../../context/WalletContext';
import { CustomerReceipt, Transaction } from '../../../types';
import { formatKoboToNgn, formatWATDate } from '../../../lib/formatters';
import { maskRecipient } from '../../../utils/maskRecipient';
import { generateReceiptPdf } from '../../../utils/receiptPdf';
import { ReceiptViewModal } from '../modals/ReceiptViewModal';
import { getServiceIcon } from '../TransactionCard';
import { EmptyState } from '../EmptyState';
import {
  FileText,
  Search,
  Download,
  Copy,
  Check,
  Eye,
  Calendar,
} from 'lucide-react';

export const ReceiptsTab: React.FC = () => {
  const { receipts, transactions, searchQuery, setSearchQuery, serviceFilter, setServiceFilter } =
    useReceipts();
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [copiedRef, setCopiedRef] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleCopy = (ref: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  const handleDownload = (r: CustomerReceipt, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingId(r.id);
    const txn = transactions.find((t) => t.reference === r.transactionRef);
    if (txn) {
      generateReceiptPdf(txn);
    } else {
      // Fallback synthetic transaction
      const fallbackTxn: Transaction = {
        id: r.id,
        user_id: r.user_id,
        service: r.service,
        provider: r.provider,
        reference: r.transactionRef,
        amount: r.amount,
        cost: r.amount * 0.95,
        profit: r.amount * 0.05,
        status: 'success',
        recipient_details: {
          phone: r.recipient,
        },
        retries: 0,
        created_at: r.issuedAt,
        completed_at: r.issuedAt,
      };
      generateReceiptPdf(fallbackTxn);
    }
    setTimeout(() => setDownloadingId(null), 600);
  };

  const handleView = (r: CustomerReceipt) => {
    const txn = transactions.find((t) => t.reference === r.transactionRef);
    if (txn) {
      setSelectedTxn(txn);
    } else {
      const fallbackTxn: Transaction = {
        id: r.id,
        user_id: r.user_id,
        service: r.service,
        provider: r.provider,
        reference: r.transactionRef,
        amount: r.amount,
        cost: r.amount * 0.95,
        profit: r.amount * 0.05,
        status: 'success',
        recipient_details: {
          phone: r.recipient,
        },
        retries: 0,
        created_at: r.issuedAt,
        completed_at: r.issuedAt,
      };
      setSelectedTxn(fallbackTxn);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Service Filter Header */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search receipts by reference, provider, or recipient..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          >
            <option value="all">All Services</option>
            <option value="airtime">Airtime</option>
            <option value="data">Data Bundles</option>
            <option value="electricity">Electricity</option>
            <option value="tv">Cable TV</option>
            <option value="exam">Exam PINs</option>
            <option value="remit">Remit</option>
            <option value="invoice">Invoice</option>
            <option value="giftcard">Gift Cards</option>
            <option value="transport">Transport</option>
            <option value="travel">Travel</option>
          </select>
        </div>
      </div>

      {/* Receipts List */}
      {receipts.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No receipts found"
          description={
            searchQuery || serviceFilter !== 'all'
              ? 'No official receipts match your active query. Try clearing the search term.'
              : 'Official receipts are automatically generated whenever a vending order succeeds. Complete a transaction to view receipts here.'
          }
          actionLabel={searchQuery || serviceFilter !== 'all' ? 'Reset Filters' : undefined}
          onAction={() => {
            setSearchQuery('');
            setServiceFilter('all');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {receipts.map((r) => {
            const { icon: Icon, color } = getServiceIcon(r.service);
            const isDownloading = downloadingId === r.id;
            return (
              <div
                key={r.id}
                onClick={() => handleView(r)}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-emerald-500/50 hover:shadow-xs transition-all flex flex-col justify-between gap-3 cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors capitalize">
                          {r.service} ({r.provider})
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800">
                          Official Receipt
                        </span>
                      </div>
                      <p className="text-xs font-mono text-slate-600 font-medium mt-0.5 truncate">
                        {maskRecipient(r.recipient)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatWATDate(r.issuedAt)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold font-mono text-slate-900">
                      {formatKoboToNgn(r.amount)}
                    </p>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => handleCopy(r.transactionRef, e)}
                    className="font-mono text-[11px] text-slate-500 hover:text-emerald-700 flex items-center gap-1 transition-colors"
                    title="Copy Reference"
                  >
                    <span>{r.transactionRef.slice(0, 16)}...</span>
                    {copiedRef === r.transactionRef ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3 text-slate-400" />
                    )}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleView(r);
                      }}
                      className="py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={(e) => handleDownload(r, e)}
                      disabled={isDownloading}
                      className="py-1.5 px-3 rounded-lg text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex items-center gap-1 transition-colors shadow-xs"
                      title="Download PDF"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isDownloading ? 'Downloading...' : 'PDF'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Modal */}
      <ReceiptViewModal
        isOpen={Boolean(selectedTxn)}
        transaction={selectedTxn}
        onClose={() => setSelectedTxn(null)}
      />
    </div>
  );
};
