import { useState, useEffect } from 'react';
import { adminStatsService } from '../lib/admin/adminStats';
import { AdminServiceStat } from '../types';

export function useAdminServiceStats() {
  const [services, setServices] = useState<AdminServiceStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = adminStatsService.subscribeServiceStats((stats) => {
      setServices(stats);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { services, loading };
}
