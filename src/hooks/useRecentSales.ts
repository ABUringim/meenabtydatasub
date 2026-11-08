import { useState, useEffect } from 'react';
import { adminTransactionsService } from '../lib/admin/adminTransactions';
import { Transaction } from '../types';

export function useRecentSales(limit: number = 8) {
  const [recentSales, setRecentSales] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = adminTransactionsService.subscribeTransactions((all) => {
      const successful = all
        .filter((t) => t.status === 'success')
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, limit);
      setRecentSales(successful);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [limit]);

  return { recentSales, loading };
}
