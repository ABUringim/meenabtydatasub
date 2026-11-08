import { storage } from '../../services/storage';
import { UserProfile, KycTier, Role } from '../../types';

export interface CustomerQueryOptions {
  search?: string;
  sortBy?: 'created_at' | 'wallet_balance' | 'name' | 'createdAt' | 'lastLogin' | 'walletBalance';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  tier?: KycTier | number;
  status?: 'all' | 'verified' | 'unverified' | 'suspended' | 'active';
  role?: 'all' | Role;
}

export type UserQueryOptions = CustomerQueryOptions;

export interface CustomerQueryResult {
  customers: UserProfile[];
  users: UserProfile[];
  totalCount: number;
  total: number;
  totalPages: number;
  currentPage: number;
  page: number;
  pageSize: number;
}

export type PaginatedUsersResult = CustomerQueryResult;

export const adminUsersService = {
  subscribeUsers(callback: (users: UserProfile[]) => void): () => void {
    callback(storage.getUsers());
    return storage.subscribeAdmin(() => {
      callback(storage.getUsers());
    });
  },

  queryCustomers(options: CustomerQueryOptions = {}): CustomerQueryResult {
    const {
      search = '',
      sortBy = 'created_at',
      sortOrder = 'desc',
      page = 1,
      pageSize = 15,
      tier,
      status = 'all',
      role = 'all',
    } = options;

    let users = storage.getUsers();

    if (role !== 'all') {
      users = users.filter((u) => u.role === role);
    }

    // Filter by search (name, email, phone, uid)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          u.uid.toLowerCase().includes(q)
      );
    }

    // Filter by Tier
    if (tier !== undefined && tier !== null) {
      users = users.filter((u) => u.tier === tier);
    }

    // Filter by Status
    if (status !== 'all') {
      if (status === 'suspended') {
        users = users.filter((u) => u.suspended);
      } else if (status === 'active') {
        users = users.filter((u) => !u.suspended);
      } else if (status === 'verified') {
        users = users.filter((u) => u.kyc_status === 'verified' && !u.suspended);
      } else if (status === 'unverified') {
        users = users.filter((u) => u.kyc_status === 'unverified' && !u.suspended);
      }
    }

    // Sorting
    users.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'wallet_balance' || sortBy === 'walletBalance') {
        comparison = (a.wallet_balance || 0) - (b.wallet_balance || 0);
      } else if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'lastLogin') {
        const timeA = a.last_login ? new Date(a.last_login).getTime() : 0;
        const timeB = b.last_login ? new Date(b.last_login).getTime() : 0;
        comparison = timeA - timeB;
      } else {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        comparison = timeA - timeB;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    const totalCount = users.length;
    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (currentPage - 1) * pageSize;
    const paginated = users.slice(startIndex, startIndex + pageSize);

    return {
      customers: paginated,
      users: paginated,
      totalCount,
      total: totalCount,
      totalPages,
      currentPage,
      page: currentPage,
      pageSize,
    };
  },

  async toggleSuspendCustomer(
    uid: string,
    reasonOrSuspended: string | boolean,
    actorIdOrReason?: string,
    actorNameOrActorId?: string,
    actorName?: string
  ): Promise<UserProfile> {
    const prev = storage.getUser(uid);
    let targetSuspended = !prev?.suspended;
    let reason = 'Administrative action';
    let finalActorId = 'admin';
    let finalActorName = 'Administrator';

    if (typeof reasonOrSuspended === 'boolean') {
      targetSuspended = reasonOrSuspended;
      reason = actorIdOrReason || reason;
      finalActorId = actorNameOrActorId || 'admin';
      finalActorName = actorName || 'Administrator';
    } else {
      reason = reasonOrSuspended;
      finalActorId = actorIdOrReason || 'admin';
      finalActorName = actorNameOrActorId || 'Administrator';
    }

    const updated = storage.updateUser(uid, { suspended: targetSuspended });
    storage.recordAdminActivity(
      finalActorId,
      finalActorName,
      targetSuspended ? 'CUSTOMER_SUSPEND' : 'CUSTOMER_UNSUSPEND',
      `users/${uid}`,
      prev ? { suspended: prev.suspended } : null,
      { suspended: targetSuspended, reason }
    );
    storage.recomputeAdminStats();
    return updated;
  },

  async adjustWalletBalance(
    uid: string,
    amountKobo: number,
    type: 'credit' | 'debit',
    reason: string,
    actorId: string,
    actorName: string
  ): Promise<UserProfile> {
    const ref = `ADMIN_ADJ_${Date.now()}`;
    const user = storage.getUser(uid);
    if (!user) throw new Error('User not found');

    const previousBalance = user.wallet_balance;
    if (type === 'credit') {
      storage.executeAtomicWalletCredit(uid, amountKobo, 'admin_adjustment', ref, reason);
    } else {
      if (user.wallet_balance < amountKobo) {
        throw new Error('User balance is less than requested deduction.');
      }
      storage.executeAtomicWalletDeduction(uid, amountKobo, ref, reason);
    }

    const updated = storage.getUser(uid)!;
    storage.recordAdminActivity(
      actorId,
      actorName,
      `WALLET_${type.toUpperCase()}`,
      `users/${uid}`,
      { wallet_balance: previousBalance },
      { wallet_balance: updated.wallet_balance, reason }
    );
    storage.recomputeAdminStats();
    return updated;
  },
};
