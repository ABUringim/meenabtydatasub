import React, { useState } from 'react';
import { AdminTotalsStats } from '../../../types';
import { adminStatsService } from '../../../lib/admin/adminStats';
import { Modal } from '../../shared/Modal';
import { RefreshCw, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { formatNgnFromKobo } from '../../../lib/formatters';

interface RecomputeStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  actorId: string;
  actorName: string;
  onSuccess: (updated: AdminTotalsStats) => void;
}

export const RecomputeStatsModal: React.FC<RecomputeStatsModalProps> = ({
  isOpen,
  onClose,
  actorId,
  actorName,
  onSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedStats, setCompletedStats] = useState<AdminTotalsStats | null>(null);

  const handleRecompute = async () => {
    setIsProcessing(true);
    try {
      const result = await adminStatsService.recomputeAllTotals(actorId, actorName);
      setCompletedStats(result);
      onSuccess(result);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCompletedStats(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Recompute Aggregated Operational Metrics"
      subtitle="Recalculates pre-aggregated admin totals and service performance from the raw ledger"
      maxWidth="md"
    >
      <div className="space-y-4">
        {!completedStats ? (
          <>
            <div className="p-3 bg-amber-950/40 border border-amber-800/70 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-200">Owner Authorization Notice</p>
                <p className="text-[11px] text-amber-300/80 mt-0.5">
                  This operation reads all historical transactions, active wallets, and Paystack deposits to rebuild
                  the operational cache (`admin_stats/totals`, `services`, and `daily`).
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to trigger a full platform recomputation? This will be recorded in the security audit trail.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isProcessing}
                className="py-2 px-3 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRecompute}
                disabled={isProcessing}
                className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                <span>{isProcessing ? 'Recomputing Totals...' : 'Confirm Recompute'}</span>
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="font-bold text-white">Recomputation Completed Successfully</p>
                <p className="text-[11px] text-emerald-300/80">All live dashboards have received the updated snapshot.</p>
              </div>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Total Successful Revenue:</span>
                <span className="font-mono font-bold text-white">
                  {formatNgnFromKobo(completedStats.totalRevenue)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Total Net Profit:</span>
                <span className="font-mono font-bold text-emerald-400">
                  {formatNgnFromKobo(completedStats.totalProfit)}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Transactions Audited:</span>
                <span className="font-mono text-white">{completedStats.totalTransactions.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Active Customers:</span>
                <span className="font-mono text-white">{completedStats.totalCustomers.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Total Wallet Float Liability:</span>
                <span className="font-mono font-bold text-indigo-400">
                  {formatNgnFromKobo(completedStats.totalWalletFloat)}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
