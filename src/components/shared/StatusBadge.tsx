import React from 'react';
import { TransactionStatus } from '../../types';

interface StatusBadgeProps {
  status:
    | TransactionStatus
    | 'verified'
    | 'unverified'
    | 'pending'
    | 'open'
    | 'investigating'
    | 'resolved_refunded'
    | 'rejected'
    | 'escalated_to_owner';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'success':
    case 'verified':
    case 'resolved_refunded':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
          {status === 'resolved_refunded' ? 'Refunded' : status === 'verified' ? 'Verified' : 'Successful'}
        </span>
      );
    case 'processing':
    case 'investigating':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" aria-hidden="true" />
          {status === 'investigating' ? 'Investigating' : 'Processing'}
        </span>
      );
    case 'escalated_to_owner':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-600" aria-hidden="true" />
          Escalated to Owner
        </span>
      );
    case 'failed':
    case 'rejected':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" aria-hidden="true" />
          {status === 'rejected' ? 'Rejected' : 'Failed'}
        </span>
      );
    case 'reversed':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-600" aria-hidden="true" />
          Reversed
        </span>
      );
    case 'pending':
    case 'open':
    case 'unverified':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" aria-hidden="true" />
          {status === 'unverified' ? 'Tier 1' : status === 'open' ? 'Open' : 'Pending'}
        </span>
      );
  }
};
