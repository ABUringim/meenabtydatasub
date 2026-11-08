import React from 'react';
import { TransactionsTab } from '../dashboard/tabs/TransactionsTab';

interface TransactionsPageProps {
  onRaiseDispute?: (reference: string) => void;
  onRepeatService?: (serviceTab: string) => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  onRepeatService,
}) => {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-900">Transaction History</h2>
        <p className="text-xs text-slate-500">
          Complete audit trail of all airtime, data, utility bills, and exam PIN purchases
        </p>
      </div>

      <TransactionsTab onRepeatService={onRepeatService} />
    </div>
  );
};
