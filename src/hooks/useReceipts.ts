import { useState, useMemo } from 'react';
import { useWallet } from '../context/WalletContext';
import { CustomerReceipt } from '../types';

export const useReceipts = () => {
  const { receipts, transactions } = useWallet();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const matchesService = serviceFilter === 'all' || r.service === serviceFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.transactionRef.toLowerCase().includes(q) ||
        r.recipient.toLowerCase().includes(q) ||
        r.provider.toLowerCase().includes(q);
      return matchesService && matchesSearch;
    });
  }, [receipts, serviceFilter, searchQuery]);

  return {
    receipts: filteredReceipts,
    allReceipts: receipts,
    transactions,
    searchQuery,
    setSearchQuery,
    serviceFilter,
    setServiceFilter,
  };
};
