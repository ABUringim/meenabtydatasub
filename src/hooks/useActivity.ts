import { useState, useMemo } from 'react';
import { useWallet } from '../context/WalletContext';
import { CustomerActivity, ActivityType } from '../types';

export type ActivityFilterGroup = 'all' | 'purchases' | 'funding' | 'account';

export const useActivity = () => {
  const { activities } = useWallet();
  const [filterGroup, setFilterGroup] = useState<ActivityFilterGroup>('all');

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      if (filterGroup === 'all') return true;
      if (filterGroup === 'funding') {
        return act.type === 'fund_wallet';
      }
      if (filterGroup === 'account') {
        return act.type === 'login' || act.type === 'beneficiary_added' || act.type === 'dispute_raised';
      }
      if (filterGroup === 'purchases') {
        return (
          act.type === 'airtime' ||
          act.type === 'data' ||
          act.type === 'electricity' ||
          act.type === 'tv' ||
          act.type === 'exam' ||
          act.type === 'remit' ||
          act.type === 'invoice' ||
          act.type === 'giftcard' ||
          act.type === 'transport' ||
          act.type === 'travel'
        );
      }
      return true;
    });
  }, [activities, filterGroup]);

  return {
    activities: filteredActivities,
    allActivities: activities,
    filterGroup,
    setFilterGroup,
  };
};
