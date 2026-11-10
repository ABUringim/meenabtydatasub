import React, { useState, useMemo } from 'react';
import { useActivity, ActivityFilterGroup } from '../../../hooks/useActivity';
import { formatKoboToNgn, timeAgo, formatWATDate } from '../../../lib/formatters';
import { EmptyState } from '../EmptyState';
import { ActivityFilterModal, ActivityFilterOptions } from '../modals/ActivityFilterModal';
import {
  Smartphone,
  Wifi,
  Zap,
  Tv,
  GraduationCap,
  SendHorizontal,
  Receipt,
  Gift,
  Car,
  Plane,
  CreditCard,
  UserCheck,
  BookmarkPlus,
  HelpCircle,
  Clock,
  ShieldAlert,
  Layers,
  Filter,
  RotateCcw,
} from 'lucide-react';

export const getActivityIcon = (type: string) => {
  switch (type) {
    case 'fund_wallet':
      return { icon: CreditCard, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    case 'airtime':
      return { icon: Smartphone, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    case 'data':
      return { icon: Wifi, color: 'text-blue-700 bg-blue-50 border-blue-200' };
    case 'electricity':
      return { icon: Zap, color: 'text-amber-700 bg-amber-50 border-amber-200' };
    case 'tv':
      return { icon: Tv, color: 'text-purple-700 bg-purple-50 border-purple-200' };
    case 'exam':
      return { icon: GraduationCap, color: 'text-indigo-700 bg-indigo-50 border-indigo-200' };
    case 'remit':
      return { icon: SendHorizontal, color: 'text-teal-700 bg-teal-50 border-teal-200' };
    case 'invoice':
      return { icon: Receipt, color: 'text-rose-700 bg-rose-50 border-rose-200' };
    case 'giftcard':
      return { icon: Gift, color: 'text-pink-700 bg-pink-50 border-pink-200' };
    case 'transport':
      return { icon: Car, color: 'text-sky-700 bg-sky-50 border-sky-200' };
    case 'travel':
      return { icon: Plane, color: 'text-orange-700 bg-orange-50 border-orange-200' };
    case 'login':
      return { icon: UserCheck, color: 'text-slate-700 bg-slate-50 border-slate-200' };
    case 'beneficiary_added':
      return { icon: BookmarkPlus, color: 'text-teal-700 bg-teal-50 border-teal-200' };
    case 'dispute_raised':
      return { icon: HelpCircle, color: 'text-rose-700 bg-rose-50 border-rose-200' };
    default:
      return { icon: Clock, color: 'text-slate-700 bg-slate-50 border-slate-200' };
  }
};

export const ActivityTab: React.FC = () => {
  const { activities, allActivities, filterGroup, setFilterGroup } = useActivity();
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [customFilter, setCustomFilter] = useState<ActivityFilterOptions>({
    selectedTypes: [],
    startDate: '',
    endDate: '',
  });

  const filterButtons: Array<{ id: ActivityFilterGroup; label: string }> = [
    { id: 'all', label: 'All Activity' },
    { id: 'purchases', label: 'Vending & Purchases' },
    { id: 'funding', label: 'Wallet Funding' },
    { id: 'account', label: 'Account & Security' },
  ];

  const hasCustomFilter =
    customFilter.selectedTypes.length > 0 || Boolean(customFilter.startDate) || Boolean(customFilter.endDate);

  const displayedActivities = useMemo(() => {
    let list = activities;
    if (hasCustomFilter) {
      list = allActivities.filter((item) => {
        if (customFilter.selectedTypes.length > 0 && !customFilter.selectedTypes.includes(item.type)) {
          return false;
        }
        if (customFilter.startDate) {
          const itemTime = new Date(item.created_at).getTime();
          const startTime = new Date(customFilter.startDate).getTime();
          if (itemTime < startTime) return false;
        }
        if (customFilter.endDate) {
          const itemTime = new Date(item.created_at).getTime();
          const endTime = new Date(customFilter.endDate).setHours(23, 59, 59, 999);
          if (itemTime > endTime) return false;
        }
        return true;
      });
    }
    return list;
  }, [activities, allActivities, customFilter, hasCustomFilter]);

  return (
    <div className="space-y-4">
      {/* Category Pills & Filter Button */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {filterButtons.map((btn) => (
            <button
              key={btn.id}
              onClick={() => {
                setFilterGroup(btn.id);
                setCustomFilter({ selectedTypes: [], startDate: '', endDate: '' });
              }}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                filterGroup === btn.id && !hasCustomFilter
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsFilterModalOpen(true)}
            className={`py-1.5 px-3 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1.5 cursor-pointer ${
              hasCustomFilter
                ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className={`w-3.5 h-3.5 ${hasCustomFilter ? 'text-emerald-700' : 'text-slate-500'}`} />
            <span>Filter</span>
            {hasCustomFilter && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
          </button>

          {hasCustomFilter && (
            <button
              onClick={() => setCustomFilter({ selectedTypes: [], startDate: '', endDate: '' })}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Reset custom filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {displayedActivities.length} recorded events
          </span>
        </div>
      </div>

      {/* Chronological Activity Feed */}
      {displayedActivities.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={hasCustomFilter ? 'No matching activity' : 'No activity recorded'}
          description={
            hasCustomFilter
              ? 'No activity records match your active type or date filters. Try resetting the filters.'
              : 'Your timeline feed will display all recharges, wallet top-ups, beneficiaries, and security logins.'
          }
          actionLabel={hasCustomFilter ? 'Reset Filters' : undefined}
          onAction={() => setCustomFilter({ selectedTypes: [], startDate: '', endDate: '' })}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="relative pl-6 sm:pl-8 space-y-6 before:content-[''] before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
            {displayedActivities.map((item) => {
              const { icon: Icon, color } = getActivityIcon(item.type);
              return (
                <div key={item.id} className="relative flex items-start justify-between gap-3 group">
                  {/* Timeline Node Icon */}
                  <div
                    className={`absolute -left-6 sm:-left-8 w-7 h-7 rounded-full border-2 border-white shadow-xs flex items-center justify-center shrink-0 ${color}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>

                  {/* Body */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                      <span title={formatWATDate(item.created_at)}>{timeAgo(item.created_at)}</span>
                      {item.transactionRef && (
                        <>
                          <span>·</span>
                          <span className="font-mono text-slate-500">Ref: {item.transactionRef}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amount / Status Pill */}
                  <div className="text-right shrink-0">
                    {item.amount !== undefined && (
                      <p className="text-xs font-mono font-bold text-slate-900">
                        {formatKoboToNgn(item.amount)}
                      </p>
                    )}
                    <span
                      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 capitalize ${
                        item.status === 'success'
                          ? 'bg-emerald-50 text-emerald-800'
                          : item.status === 'pending'
                          ? 'bg-amber-50 text-amber-800'
                          : 'bg-rose-50 text-rose-800'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Activity Filter Modal */}
      <ActivityFilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        options={customFilter}
        onApply={(opts) => setCustomFilter(opts)}
        onReset={() => setCustomFilter({ selectedTypes: [], startDate: '', endDate: '' })}
      />
    </div>
  );
};
