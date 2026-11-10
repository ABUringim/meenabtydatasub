import React, { useState } from 'react';
import { Modal } from '../../shared/Modal';
import { ActivityType } from '../../../types';
import { Filter, RotateCcw, Check } from 'lucide-react';

export interface ActivityFilterOptions {
  selectedTypes: string[];
  startDate?: string;
  endDate?: string;
}

interface ActivityFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: ActivityFilterOptions;
  onApply: (options: ActivityFilterOptions) => void;
  onReset: () => void;
}

const AVAILABLE_ACTIVITY_TYPES: Array<{ id: string; label: string; group: string }> = [
  { id: 'airtime', label: 'Airtime VTU', group: 'Purchases' },
  { id: 'data', label: 'Data Bundles', group: 'Purchases' },
  { id: 'electricity', label: 'Electricity Bills', group: 'Purchases' },
  { id: 'tv', label: 'Cable TV', group: 'Purchases' },
  { id: 'exam', label: 'Exam PINs', group: 'Purchases' },
  { id: 'remit', label: 'Remit / Transfer', group: 'Purchases' },
  { id: 'invoice', label: 'Invoice Payments', group: 'Purchases' },
  { id: 'giftcard', label: 'Gift Cards', group: 'Purchases' },
  { id: 'transport', label: 'Transport / Toll', group: 'Purchases' },
  { id: 'travel', label: 'Travel Booking', group: 'Purchases' },
  { id: 'fund_wallet', label: 'Wallet Funding', group: 'Wallet' },
  { id: 'login', label: 'Security Logins', group: 'Account' },
  { id: 'beneficiary_added', label: 'Saved Beneficiaries', group: 'Account' },
  { id: 'receipt_download', label: 'Receipt Downloads', group: 'Account' },
  { id: 'dispute_raised', label: 'Disputes Raised', group: 'Account' },
];

export const ActivityFilterModal: React.FC<ActivityFilterModalProps> = ({
  isOpen,
  onClose,
  options,
  onApply,
  onReset,
}) => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>(options.selectedTypes || []);
  const [startDate, setStartDate] = useState<string>(options.startDate || '');
  const [endDate, setEndDate] = useState<string>(options.endDate || '');

  const toggleType = (typeId: string) => {
    setSelectedTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  const handleApply = () => {
    onApply({
      selectedTypes,
      startDate,
      endDate,
    });
    onClose();
  };

  const handleReset = () => {
    setSelectedTypes([]);
    setStartDate('');
    setEndDate('');
    onReset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Filter Activity Timeline"
      subtitle="Narrow down chronological timeline records by event types and date range"
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Date Range Inputs */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">Date Range</label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] text-slate-500 mb-1 block">Start Date</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 mb-1 block">End Date</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Multi-Select Event Types */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-700">Event Types (Multi-Select)</label>
            <button
              type="button"
              onClick={() => setSelectedTypes(AVAILABLE_ACTIVITY_TYPES.map((t) => t.id))}
              className="text-[11px] text-emerald-700 hover:underline font-semibold"
            >
              Select All
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-56 overflow-y-auto p-1 border border-slate-100 rounded-xl">
            {AVAILABLE_ACTIVITY_TYPES.map((item) => {
              const isSelected = selectedTypes.includes(item.id);
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => toggleType(item.id)}
                  className={`p-2 rounded-lg text-left text-xs transition-colors flex items-center justify-between gap-1 border ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="py-2 px-3.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Reset</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-3.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="py-2 px-5 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Apply Filter
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ActivityFilterModal;
