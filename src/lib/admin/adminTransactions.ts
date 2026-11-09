import { storage } from '../../services/storage';
import { Transaction, ServiceCategory } from '../../types';

export interface TransactionFilterOptions {
  service?: ServiceCategory | 'all';
  status?: Transaction['status'] | 'all';
  search?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedTransactionsResult {
  transactions: Transaction[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const adminTransactionsService = {
  /**
   * Retrieves all transactions.
   */
  getTransactions(): Transaction[] {
    return storage.getTransactions();
  },

  /**
   * Subscribes to real-time transaction updates.
   */
  subscribeTransactions(callback: (txns: Transaction[]) => void): () => void {
    callback(storage.getTransactions());
    return storage.subscribeAdmin(() => {
      callback(storage.getTransactions());
    });
  },

  /**
   * Filter, search, and paginate transactions according to composite query rules.
   */
  queryTransactions(options: TransactionFilterOptions = {}): PaginatedTransactionsResult {
    const {
      service = 'all',
      status = 'all',
      search = '',
      startDate,
      endDate,
      userId,
      page = 1,
      pageSize = 20,
    } = options;

    let items = storage.getTransactions();

    if (userId) {
      items = items.filter((t) => t.user_id === userId);
    }

    if (service !== 'all') {
      items = items.filter((t) => t.service === service);
    }

    if (status !== 'all') {
      items = items.filter((t) => t.status === status);
    }

    if (startDate) {
      const start = new Date(startDate).getTime();
      items = items.filter((t) => new Date(t.created_at).getTime() >= start);
    }

    if (endDate) {
      const end = new Date(endDate).getTime();
      items = items.filter((t) => new Date(t.created_at).getTime() <= end);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter((t) => {
        const refMatch = t.reference.toLowerCase().includes(q);
        const userMatch = t.user_email?.toLowerCase().includes(q) || t.user_id.toLowerCase().includes(q);
        const provMatch = t.provider.toLowerCase().includes(q);
        const recipientMatch =
          t.recipient_details?.phone?.toLowerCase().includes(q) ||
          t.recipient_details?.meterNo?.toLowerCase().includes(q) ||
          t.recipient_details?.smartcardNo?.toLowerCase().includes(q) ||
          t.recipient_details?.accountNumber?.toLowerCase().includes(q) ||
          t.recipient_details?.customerName?.toLowerCase().includes(q);
        return refMatch || userMatch || provMatch || recipientMatch;
      });
    }

    // Sort descending by created_at
    items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const total = items.length;
    const totalPages = Math.ceil(total / pageSize) || 1;
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const startIndex = (currentPage - 1) * pageSize;
    const paginated = items.slice(startIndex, startIndex + pageSize);

    return {
      transactions: paginated,
      total,
      page: currentPage,
      pageSize,
      totalPages,
    };
  },

  /**
   * Requeries a pending or processing transaction with the upstream provider.
   */
  async requeryTransaction(
    reference: string,
    actorId: string,
    actorName: string
  ): Promise<{ transaction: Transaction; message: string }> {
    const txn = storage.getTransactionByReference(reference);
    if (!txn) {
      throw new Error(`Transaction ${reference} not found`);
    }

    // Simulate provider status check (in real production, calls Cloud Function to VTU API)
    const outcomes: Array<Transaction['status']> = ['success', 'success', 'failed'];
    const newStatus = outcomes[Math.floor(Math.random() * outcomes.length)];

    const before = { ...txn };
    let updatedTxn: Transaction;

    if (newStatus === 'success') {
      updatedTxn = storage.updateTransaction(txn.id, {
        status: 'success',
        completed_at: new Date().toISOString(),
        api_response: { ...txn.api_response, requeryStatus: 'confirmed_success' },
      });
      storage.recordTransactionLifecycle(updatedTxn);
    } else {
      updatedTxn = storage.updateTransaction(txn.id, {
        status: 'failed',
        api_response: { ...txn.api_response, requeryStatus: 'confirmed_failed' },
      });
      // Automatically credit customer back if failed
      storage.executeAtomicWalletCredit(
        txn.user_id,
        txn.amount,
        'refund',
        `REFUND_${txn.reference}`,
        `Reversal for failed order ${txn.reference}`
      );
    }

    storage.recordAdminActivity(
      actorId,
      actorName,
      'requery_transaction',
      `transactions/${txn.id}`,
      before,
      updatedTxn,
      'admin'
    );

    storage.recomputeAdminStats();
    return {
      transaction: updatedTxn,
      message: `Transaction requery completed: status marked as ${updatedTxn.status.toUpperCase()}.`,
    };
  },

  /**
   * Issues an immediate atomic wallet refund for a disputed or failed order.
   */
  async refundTransaction(
    reference: string,
    reason: string,
    actorId: string,
    actorName: string
  ): Promise<{ transaction: Transaction; refundAmountKobo: number }> {
    const txn = storage.getTransactionByReference(reference);
    if (!txn) {
      throw new Error(`Transaction ${reference} not found`);
    }

    if (txn.status === 'refunded') {
      throw new Error('Transaction has already been refunded.');
    }

    const before = { ...txn };
    const refundAmountKobo = txn.amount;

    // 1. Credit the customer's wallet atomically
    storage.executeAtomicWalletCredit(
      txn.user_id,
      refundAmountKobo,
      'refund',
      `REFUND_${txn.reference}`,
      `Manual Admin Refund: ${reason}`
    );

    // 2. Mark transaction as refunded
    const updatedTxn = storage.updateTransaction(txn.id, {
      status: 'refunded',
      api_response: {
        ...txn.api_response,
        refundedAt: new Date().toISOString(),
        refundReason: reason,
        refundedBy: actorName,
      },
    });

    // 3. Record audit activity
    storage.recordAdminActivity(
      actorId,
      actorName,
      'refund_transaction',
      `transactions/${txn.id}`,
      before,
      updatedTxn,
      'admin'
    );

    storage.recomputeAdminStats();

    return { transaction: updatedTxn, refundAmountKobo };
  },

  /**
   * Exports filtered transactions to CSV format and prompts a direct browser download.
   */
  exportToCsv(options: TransactionFilterOptions = {}): string {
    const { transactions } = this.queryTransactions({ ...options, pageSize: 5000 });

    const headers = [
      'Reference',
      'Date (WAT)',
      'Customer Email',
      'Service',
      'Provider',
      'Amount (NGN)',
      'Profit (NGN)',
      'Status',
      'Recipient Info',
      'Gateway',
    ];

    const rows = transactions.map((t) => [
      t.reference,
      `"${new Date(t.created_at).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}"`,
      `"${t.user_email || t.user_id}"`,
      t.service.toUpperCase(),
      `"${t.provider}"`,
      (t.amount / 100).toFixed(2),
      ((t.profit || 0) / 100).toFixed(2),
      t.status.toUpperCase(),
      `"${t.recipient_details?.phone || t.recipient_details?.meterNo || t.recipient_details?.smartcardNo || ''}"`,
      t.payment_method,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    // Trigger signed browser file download
    if (typeof window !== 'undefined') {
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `Meenabty_Datasub_Transactions_${new Date().toISOString().split('T')[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    return csvContent;
  },
};
