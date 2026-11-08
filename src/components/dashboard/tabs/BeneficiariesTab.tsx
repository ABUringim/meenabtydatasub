import React, { useState } from 'react';
import { useBeneficiaries } from '../../../hooks/useBeneficiaries';
import { Beneficiary, BeneficiaryType } from '../../../types';
import { BeneficiaryCard } from '../BeneficiaryCard';
import { BeneficiaryModal } from '../modals/BeneficiaryModal';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal';
import { EmptyState } from '../EmptyState';
import {
  Users,
  Plus,
  Search,
  Phone,
  Zap,
  Tv,
  Building2,
  GraduationCap,
  Car,
} from 'lucide-react';

interface BeneficiariesTabProps {
  onUseBeneficiary?: (serviceTab: string, prefill: any) => void;
}

export const BeneficiariesTab: React.FC<BeneficiariesTabProps> = ({ onUseBeneficiary }) => {
  const {
    beneficiaries,
    allBeneficiaries,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    addBeneficiary,
    updateBeneficiary,
    deleteBeneficiary,
  } = useBeneficiaries();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBeneficiary, setEditingBeneficiary] = useState<Beneficiary | null>(null);
  const [deletingBeneficiary, setDeletingBeneficiary] = useState<Beneficiary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filterTabs: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Categories' },
    { id: 'phone', label: 'Phone Lines' },
    { id: 'meter', label: 'Electricity' },
    { id: 'smartcard', label: 'Cable TV' },
    { id: 'bank', label: 'Bank Accounts' },
    { id: 'exam', label: 'Exam PINs' },
    { id: 'plate', label: 'Toll & Transit' },
  ];

  const handleUse = (b: Beneficiary) => {
    let serviceTab = 'service-data';
    const prefill: Record<string, any> = {};

    switch (b.type) {
      case 'phone':
        serviceTab = 'service-data';
        prefill.phone = b.value;
        prefill.network = b.provider;
        break;
      case 'meter':
        serviceTab = 'service-electricity';
        prefill.meterNo = b.value;
        prefill.disco = b.provider;
        prefill.meterType = b.meta?.meterType || 'prepaid';
        break;
      case 'smartcard':
        serviceTab = 'service-tv';
        prefill.smartcardNo = b.value;
        prefill.provider = b.provider;
        break;
      case 'bank':
        serviceTab = 'service-remit';
        prefill.accountNumber = b.value;
        prefill.bankName = b.provider;
        break;
      case 'exam':
        serviceTab = 'service-exam';
        prefill.phone = b.value;
        prefill.provider = b.provider;
        break;
      case 'plate':
        serviceTab = 'service-transport';
        prefill.plateNumber = b.value;
        break;
    }

    onUseBeneficiary?.(serviceTab, prefill);
  };

  const handleConfirmDelete = () => {
    if (!deletingBeneficiary) return;
    setIsDeleting(true);
    setTimeout(() => {
      deleteBeneficiary(deletingBeneficiary.id);
      setIsDeleting(false);
      setDeletingBeneficiary(null);
    }, 350);
  };

  const handleSaveBeneficiary = (data: {
    type: BeneficiaryType;
    label: string;
    value: string;
    provider: string;
    meta?: Record<string, any>;
    additionalInfo?: string;
  }) => {
    if (editingBeneficiary) {
      updateBeneficiary(editingBeneficiary.id, data);
      setEditingBeneficiary(null);
    } else {
      addBeneficiary(data);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Category Filter Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved beneficiaries by label, number, or provider..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
          />
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Beneficiary</span>
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`py-1.5 px-3 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-600 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Beneficiaries Grid */}
      {beneficiaries.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No beneficiaries found"
          description={
            searchQuery || filterType !== 'all'
              ? 'No beneficiaries match your filter criteria. Try clearing search filters.'
              : 'Save your frequently recharged phone numbers, electricity meter numbers, smartcards, and bank accounts for fast 1-click checkout.'
          }
          actionLabel="Add First Beneficiary"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {beneficiaries.map((b) => (
            <BeneficiaryCard
              key={b.id}
              beneficiary={b}
              onUse={handleUse}
              onEdit={(item) => setEditingBeneficiary(item)}
              onDelete={(item) => setDeletingBeneficiary(item)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Beneficiary Modal */}
      <BeneficiaryModal
        isOpen={isAddModalOpen || Boolean(editingBeneficiary)}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingBeneficiary(null);
        }}
        onSave={handleSaveBeneficiary}
        initialBeneficiary={editingBeneficiary}
      />

      {/* Confirm Delete Modal (ZERO window.confirm) */}
      <ConfirmDeleteModal
        isOpen={Boolean(deletingBeneficiary)}
        onClose={() => setDeletingBeneficiary(null)}
        onConfirm={handleConfirmDelete}
        itemName={deletingBeneficiary ? `${deletingBeneficiary.label} (${deletingBeneficiary.value})` : undefined}
        isDeleting={isDeleting}
      />
    </div>
  );
};
