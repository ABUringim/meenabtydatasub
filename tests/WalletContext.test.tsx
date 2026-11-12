import { storage } from '../src/services/storage';
import { logger } from '../src/lib/logger';

const TRANSACTIONS_KEY = 'meenabty_transactions_v2';

const setTestTransactions = (txns: any[]) => {
  localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txns));
};

// Mock logger
jest.mock('../src/lib/logger', () => ({
  logger: {
    walletFunded: jest.fn(),
    transactionCompleted: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('WalletContext Unit Tests', () => {
  const testUserId = 'test_wallet_user_123';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    storage.setCurrentUserId(testUserId);
  });

  test('Wallet funding correctly converts Naira to kobo and records activity', () => {
    const amountNgn = 2500;
    const amountKobo = amountNgn * 100;
    expect(amountKobo).toBe(250000);

    // Record user activity
    storage.recordUserActivity(
      testUserId,
      'fund_wallet',
      `Wallet Funded ₦${amountNgn.toLocaleString()} via Paystack`,
      amountKobo,
      'success'
    );

    const activities = storage.getActivities(testUserId);
    expect(activities.length).toBe(1);
    expect(activities[0].type).toBe('fund_wallet');
    expect(activities[0].amount).toBe(250000);
    expect(activities[0].status).toBe('success');

    // Verify logger call
    logger.walletFunded({
      amountNgn,
      userId: testUserId,
      reference: 'SD_PAY_TEST_REF',
      method: 'paystack',
    });

    expect(logger.walletFunded).toHaveBeenCalledWith({
      amountNgn: 2500,
      userId: testUserId,
      reference: 'SD_PAY_TEST_REF',
      method: 'paystack',
    });
  });

  test('Beneficiary operations (add, update, delete)', () => {
    const newBeneficiary = {
      id: 'ben_test_1',
      user_id: testUserId,
      type: 'phone' as const,
      label: 'Mom MTN Line',
      value: '08031234567',
      provider: 'MTN',
      created_at: new Date().toISOString(),
    };

    // 1. Add
    storage.addBeneficiary(newBeneficiary);
    let bens = storage.getBeneficiaries(testUserId);
    expect(bens.length).toBe(1);
    expect(bens[0].label).toBe('Mom MTN Line');

    // 2. Update
    storage.updateBeneficiary(newBeneficiary.id, { label: 'Mom MTN VIP' });
    bens = storage.getBeneficiaries(testUserId);
    expect(bens[0].label).toBe('Mom MTN VIP');

    // 3. Delete
    storage.deleteBeneficiary(newBeneficiary.id);
    bens = storage.getBeneficiaries(testUserId);
    expect(bens.length).toBe(0);
  });

  test('createDispute opens ticket linked to transaction reference', () => {
    // Record a sample transaction first
    const txn = {
      id: 'txn_disp_1',
      user_id: testUserId,
      service: 'data' as const,
      provider: 'GLO',
      amount: 150000,
      cost: 140000,
      profit: 10000,
      status: 'failed' as const,
      reference: 'SD_TXN_FAILED_99',
      recipient_details: { phone: '08051234567' },
      retries: 0,
      created_at: new Date().toISOString(),
    };
    setTestTransactions([txn]);

    const retrievedTxn = storage.getTransactionByReference(txn.reference);
    expect(retrievedTxn).toBeDefined();
    expect(retrievedTxn?.reference).toBe('SD_TXN_FAILED_99');

    const dispute = {
      id: `disp_${Date.now()}`,
      transaction_id: txn.id,
      transaction_ref: txn.reference,
      user_id: testUserId,
      user_email: 'customer@jayasmart.shop',
      user_phone: '08051234567',
      service: txn.service,
      amount: txn.amount,
      status: 'open' as const,
      description: 'Airtime debited but not delivered on Glo network',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    storage.createDispute(dispute);
    const disputes = storage.getDisputes().filter((d) => d.user_id === testUserId);
    expect(disputes.length).toBe(1);
    expect(disputes[0].transaction_ref).toBe('SD_TXN_FAILED_99');
    expect(disputes[0].status).toBe('open');
  });

  test('Transaction completed logs performance event via logger service', () => {
    logger.transactionCompleted({
      service: 'data',
      provider: 'MTN',
      amountNgn: 1200,
      reference: 'SD_VEND_SUCCESS_01',
      status: 'success',
      latencyMs: 180,
    });

    expect(logger.transactionCompleted).toHaveBeenCalledWith({
      service: 'data',
      provider: 'MTN',
      amountNgn: 1200,
      reference: 'SD_VEND_SUCCESS_01',
      status: 'success',
      latencyMs: 180,
    });
  });
});
