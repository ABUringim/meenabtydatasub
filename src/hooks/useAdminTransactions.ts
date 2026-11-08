import { useState, useEffect, useCallback } from 'react';
import {
  adminTransactionsService,
  TransactionFilterOptions,
  PaginatedTransactionsResult,
} from '../lib/admin/adminTransactions';
import { Transaction } from '../types';

export function useAdminTransactions(initialOptions: TransactionFilterOptions = {}) {
  const [options, setOptions] = useState<TransactionFilterOptions>(initialOptions);
  const [result, setResult] = useState<PaginatedTransactionsResult>(() =>
    adminTransactionsService.queryTransactions(initialOptions)
  );
  const [loading, setLoading] = useState(false);
  const [actionPending, setActionPending] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    const data = adminTransactionsService.queryTransactions(options);
    setResult(data);
    setLoading(false);
  }, [options]);

  useEffect(() => {
    refresh();
    const unsubscribe = adminTransactionsService.subscribeTransactions(() => {
      refresh();
    });
    return () => unsubscribe();
  }, [refresh]);

  const updateFilters = (newOptions: Partial<TransactionFilterOptions>) => {
    setOptions((prev) => ({ ...prev, ...newOptions, page: newOptions.page ?? 1 }));
  };

  const setPage = (page: number) => {
    setOptions((prev) => ({ ...prev, page }));
  };

  const requery = async (
    reference: string,
    actorId: string,
    actorName: string
  ): Promise<{ transaction: Transaction; message: string }> => {
    setActionPending(true);
    try {
      const res = await adminTransactionsService.requeryTransaction(reference, actorId, actorName);
      refresh();
      return res;
    } finally {
      setActionPending(false);
    }
  };

  const refund = async (
    reference: string,
    reason: string,
    actorId: string,
    actorName: string
  ): Promise<{ transaction: Transaction; refundAmountKobo: number }> => {
    setActionPending(true);
    try {
      const res = await adminTransactionsService.refundTransaction(
        reference,
        reason,
        actorId,
        actorName
      );
      refresh();
      return res;
    } finally {
      setActionPending(false);
    }
  };

  const exportCsv = () => {
    return adminTransactionsService.exportToCsv(options);
  };

  return {
    transactions: result.transactions,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
    loading,
    actionPending,
    options,
    updateFilters,
    setPage,
    requery,
    refund,
    exportCsv,
    refresh,
  };
}
