import React, { useState } from 'react';
import { Modal } from '../../shared/Modal';
import { ServiceCategory, TransactionStatus } from '../../../types';
import { Filter, RotateCcw, Check } from 'lucide-react';

export interface FilterCriteria {
  service: string;
  status: string;
  datePreset: 'all' | 'today' | '7days' | '30days' | 'this_month';
  minAmountNgn?: number;
  maxAmountNgn?: number;
}

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  criteria: FilterCriteria;
  onApply: (newCriteria: FilterCriteria) => void;
  onReset: () => void;
}

const SERVICES: Array<{ id: string; label: string }> = [
  { id: 'all', label: 'All Services' },
  { id: 'airtime', label: 'Airtime' },
  { id: 'data', label: 'Data Bundles' },
  { id: 'electricity', label: 'Electricity Bills' },
  { id: 'tv', label: 'Cable TV' },
  { id: 'exam', label: 'Exam PINs' },
  { id: 'remit', label: 'Remit' },
  { id: 'invoice', label: 'Invoice' },
  { id: 'giftcard', label: 'Gift Cards' },
  { id: 'transport', label: 'Transport / Toll' },
  { id: 'travel', label: 'Travel & Hotel' },
];

export const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  criteria,
  onApply,
  onReset,
}) => {
  const [service, setService] = useState(criteria.service);
  const [status, setStatus] = useState(criteria.status);
  const [datePreset, setDatePreset] = useState(criteria.datePreset);
  const [minAmount, setMinAmount] = useState(criteria.minAmountNgn?.toString() || '');
  const [maxAmount, setMaxAmount] = useState(criteria.maxAmountNgn?.toString() || '');

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    onApply({
      service,
      status,
      datePreset,
      minAmountNgn: minAmount ? parseFloat(minAmount) : undefined,
      maxAmountNgn: maxAmount ? parseFloat(maxAmount) : undefined,
    });
    onClose();
  };

  const handleReset = () => {
    setService('all');
    setStatus('all');
    setDatePreset('all');
    setMinAmount('');
    setMaxAmount('');
    onReset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Filter Transactions"
      subtitle="Refine statement by service category, status, date window, and price range"
      maxWidth="md"
    >
      <form onSubmit={handleApply} className="space-y-4">
        {/* Service Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Service Category
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
            {SERVICES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setService(s.id)}
                className={`py-1.5 px-2.5 rounded-lg text-xs font-medium border text-left transition-colors truncate ${
                  service === s.id
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Status Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Transaction Status
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'success', label: 'Successful' },
              { id: 'processing', label: 'Processing' },
              { id: 'failed', label: 'Failed' },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setStatus(st.id)}
                className={`py-2 text-xs font-semibold rounded-xl border transition-colors ${
                  status === st.id
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Window */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Date Window
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: '7days', label: 'Last 7 Days' },
              { id: '30days', label: 'Last 30 Days' },
              { id: 'this_month', label: 'This Month' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDatePreset(d.id as any)}
                className={`py-1.5 px-2 text-center text-xs font-medium rounded-lg border transition-colors truncate ${
                  datePreset === d.id
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Min Amount (₦)
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 500"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Max Amount (₦)
            </label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 50000"
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Filters</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Filters</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
