import { useState, useEffect, useCallback } from 'react';
import { adminUsersService, CustomerQueryOptions, CustomerQueryResult } from '../lib/admin/adminUsers';
import { UserProfile } from '../types';

export function useCustomers(initialOptions: CustomerQueryOptions = {}) {
  const [options, setOptions] = useState<CustomerQueryOptions>(initialOptions);
  const [result, setResult] = useState<CustomerQueryResult>(() =>
    adminUsersService.queryCustomers(initialOptions)
  );
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    const data = adminUsersService.queryCustomers(options);
    setResult(data);
    setLoading(false);
  }, [options]);

  useEffect(() => {
    refresh();
    const unsubscribe = adminUsersService.subscribeUsers(() => {
      refresh();
    });
    return () => unsubscribe();
  }, [refresh]);

  const updateFilters = (newOptions: Partial<CustomerQueryOptions>) => {
    setOptions((prev: CustomerQueryOptions) => ({ ...prev, ...newOptions, page: newOptions.page ?? 1 }));
  };

  const setPage = (page: number) => {
    setOptions((prev: CustomerQueryOptions) => ({ ...prev, page }));
  };

  const toggleSuspend = async (
    uid: string,
    reason: string,
    actorId: string,
    actorName: string
  ): Promise<UserProfile> => {
    const updated = await adminUsersService.toggleSuspendCustomer(uid, reason, actorId, actorName);
    refresh();
    return updated;
  };

  const adjustWallet = async (
    uid: string,
    amountKobo: number,
    type: 'credit' | 'debit',
    reason: string,
    actorId: string,
    actorName: string
  ): Promise<UserProfile> => {
    const updated = await adminUsersService.adjustWalletBalance(
      uid,
      amountKobo,
      type,
      reason,
      actorId,
      actorName
    );
    refresh();
    return updated;
  };

  return {
    users: result.users,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
    totalPages: result.totalPages,
    loading,
    options,
    updateFilters,
    setPage,
    toggleSuspend,
    adjustWallet,
    refresh,
  };
}
