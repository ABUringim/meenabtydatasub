import { useState, useEffect } from 'react';
import { adminStatsService } from '../lib/admin/adminStats';
import { AdminDailyStat } from '../types';

export function useDailyStats(date?: string) {
  const targetDate = date || new Date().toISOString().split('T')[0];
  const [dailyStat, setDailyStat] = useState<AdminDailyStat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = adminStatsService.subscribeDailyStats(targetDate, (stat) => {
      setDailyStat(stat);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [targetDate]);

  return { dailyStat, loading };
}
