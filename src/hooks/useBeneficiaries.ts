import { useState, useMemo } from 'react';
import { useWallet } from '../context/WalletContext';
import { Beneficiary, BeneficiaryType } from '../types';

export const useBeneficiaries = () => {
  const { beneficiaries, addBeneficiary, updateBeneficiary, deleteBeneficiary } = useWallet();
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredBeneficiaries = useMemo(() => {
    return beneficiaries.filter((b) => {
      const matchesType = filterType === 'all' || b.type === filterType;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.label.toLowerCase().includes(q) ||
        b.value.toLowerCase().includes(q) ||
        b.provider.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [beneficiaries, filterType, searchQuery]);

  return {
    beneficiaries: filteredBeneficiaries,
    allBeneficiaries: beneficiaries,
    filterType,
    setFilterType,
    searchQuery,
    setSearchQuery,
    addBeneficiary,
    updateBeneficiary,
    deleteBeneficiary,
  };
};
