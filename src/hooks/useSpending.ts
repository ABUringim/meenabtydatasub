import { useMemo } from 'react';
import { useWallet } from '../context/WalletContext';
import { ServiceCategory } from '../types';

export interface ServiceBreakdownItem {
  service: ServiceCategory;
  totalKobo: number;
  count: number;
  percentage: number;
  lastDate: string;
}

export interface MonthlyTrendItem {
  monthKey: string;
  monthLabel: string;
  totalKobo: number;
  count: number;
}

export const useSpending = () => {
  const { transactions, spending } = useWallet();

  const metrics = useMemo(() => {
    const successfulTxns = transactions.filter((t) => t.status === 'success');
    const failedTxns = transactions.filter((t) => t.status === 'failed');

    // 1. Total spent all-time
    const totalSpentKobo = successfulTxns.reduce((sum, t) => sum + t.amount, 0);

    // 2. Total spent this month
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const thisMonthTxns = successfulTxns.filter((t) => {
      const d = new Date(t.created_at);
      return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
    const spentThisMonthKobo = thisMonthTxns.reduce((sum, t) => sum + t.amount, 0);

    // 3. Failed transactions last 30 days
    const thirtyDaysAgo = Date.now() - 30 * 86400000;
    const failedLast30Days = failedTxns.filter((t) => new Date(t.created_at).getTime() >= thirtyDaysAgo).length;

    // 4. Per-service breakdown
    const serviceMap = new Map<ServiceCategory, { total: number; count: number; lastDate: string }>();

    for (const t of successfulTxns) {
      const cur = serviceMap.get(t.service) || { total: 0, count: 0, lastDate: t.created_at };
      cur.total += t.amount;
      cur.count += 1;
      if (new Date(t.created_at).getTime() > new Date(cur.lastDate).getTime()) {
        cur.lastDate = t.created_at;
      }
      serviceMap.set(t.service, cur);
    }

    const serviceBreakdown: ServiceBreakdownItem[] = Array.from(serviceMap.entries())
      .map(([service, val]) => ({
        service,
        totalKobo: val.total,
        count: val.count,
        percentage: totalSpentKobo > 0 ? (val.total / totalSpentKobo) * 100 : 0,
        lastDate: val.lastDate,
      }))
      .sort((a, b) => b.totalKobo - a.totalKobo);

    // 5. Most-used service
    const mostUsed = serviceBreakdown.length > 0 ? serviceBreakdown[0] : null;

    // 6. Monthly trend (last 6 months)
    const months: MonthlyTrendItem[] = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth();
      const label = `${monthNames[m]} ${y}`;
      const monthKey = `${y}-${String(m + 1).padStart(2, '0')}`;

      const monthTxns = successfulTxns.filter((t) => {
        const txDate = new Date(t.created_at);
        return txDate.getFullYear() === y && txDate.getMonth() === m;
      });

      const totalKobo = monthTxns.reduce((sum, t) => sum + t.amount, 0);

      months.push({
        monthKey,
        monthLabel: label,
        totalKobo,
        count: monthTxns.length,
      });
    }

    return {
      totalSpentKobo,
      spentThisMonthKobo,
      failedLast30Days,
      mostUsed,
      serviceBreakdown,
      monthlyTrend: months,
      rawSpending: spending,
    };
  }, [transactions, spending]);

  return metrics;
};
