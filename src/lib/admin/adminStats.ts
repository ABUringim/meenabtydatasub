import { storage } from '../../services/storage';
import {
  AdminTotalsStats,
  AdminServiceStat,
  AdminDailyStat,
  AdminPendingStat,
} from '../../types';

export const adminStatsService = {
  /**
   * Fetches the pre-aggregated admin totals.
   */
  getTotals(): AdminTotalsStats {
    return storage.getAdminTotals();
  },

  /**
   * Subscribes to real-time changes on admin_stats/totals.
   */
  subscribeTotals(callback: (totals: AdminTotalsStats) => void): () => void {
    callback(storage.getAdminTotals());
    return storage.subscribeAdmin(() => {
      callback(storage.getAdminTotals());
    });
  },

  /**
   * Subscribes to per-service statistics (all 10 services).
   */
  subscribeServiceStats(callback: (services: AdminServiceStat[]) => void): () => void {
    callback(storage.getAdminServiceStats());
    return storage.subscribeAdmin(() => {
      callback(storage.getAdminServiceStats());
    });
  },

  /**
   * Subscribes to today's daily stats document.
   */
  subscribeDailyStats(date: string, callback: (daily: AdminDailyStat) => void): () => void {
    callback(storage.getAdminDailyStats(date));
    return storage.subscribeAdmin(() => {
      callback(storage.getAdminDailyStats(date));
    });
  },

  /**
   * Subscribes to stuck transactions and pending disputes.
   */
  subscribePendingStats(callback: (pending: AdminPendingStat) => void): () => void {
    callback(storage.getAdminPendingStats());
    return storage.subscribeAdmin(() => {
      callback(storage.getAdminPendingStats());
    });
  },

  /**
   * Owner-authorized recompute of totals from raw transactional ledger.
   */
  async recomputeAllTotals(actorId: string, actorName: string): Promise<AdminTotalsStats> {
    const updated = storage.recomputeAdminStats();
    storage.recordAdminActivity(
      actorId,
      actorName,
      'recompute_totals',
      'admin_stats/totals',
      null,
      updated,
      'owner'
    );
    return updated;
  },
};
