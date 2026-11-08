import { useState, useEffect, useRef } from 'react';
import { adminStatsService } from '../lib/admin/adminStats';
import { AdminTotalsStats } from '../types';

export function useAdminTotals() {
  const [totals, setTotals] = useState<AdminTotalsStats>(() => adminStatsService.getTotals());
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const previousTotalsRef = useRef<AdminTotalsStats>(totals);

  useEffect(() => {
    const unsubscribe = adminStatsService.subscribeTotals((newTotals) => {
      previousTotalsRef.current = totals;
      setTotals(newTotals);
      setLastUpdated(new Date());
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const recompute = async (actorId: string, actorName: string) => {
    setIsLoading(true);
    try {
      const updated = await adminStatsService.recomputeAllTotals(actorId, actorName);
      setTotals(updated);
      setLastUpdated(new Date());
      return updated;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    totals,
    previousTotals: previousTotalsRef.current,
    lastUpdated,
    isLoading,
    recompute,
  };
}
