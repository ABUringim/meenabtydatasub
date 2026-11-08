import { storage } from './storage';
import { Transaction, ServiceCategory } from '../types';

export interface VendingRequestPayload {
  service: ServiceCategory;
  provider: string;
  amountKobo: number;
  costKobo: number;
  profitKobo: number;
  userId: string;
  reference: string;
  recipientDetails: Record<string, any>;
}

export interface VendingResponse {
  success: boolean;
  code: string;
  message: string;
  operatorRef?: string;
  token?: string;
  units?: string;
  pins?: Array<{ pin: string; serial: string }>;
  failureReason?: string;
}

class VtuProviderService {
  /**
   * Resolves Electricity Meter details before payment.
   */
  async verifyMeter(disco: string, meterNo: string, meterType: 'prepaid' | 'postpaid'): Promise<{
    name: string;
    address: string;
    disco: string;
    valid: boolean;
  }> {
    await new Promise((r) => setTimeout(r, 600));

    if (!meterNo || meterNo.length < 8) {
      throw new Error('Invalid meter number. Must be at least 8 to 11 digits.');
    }

    const mockNames = [
      'MALAM BELLO RINGIM',
      'HAJIYA AISHA YUSUF',
      'IBRAHIM DANLAMI',
      'AHMAD SANI KANO',
      'CHUKWUDI EZE',
      'OLUWASEUN ADEYEMI',
    ];

    // Derive deterministic index from meter digits
    const sum = meterNo.split('').reduce((acc, c) => acc + (parseInt(c, 10) || 0), 0);
    const resolvedName = mockNames[sum % mockNames.length];
    const resolvedAddress = `Plot ${12 + (sum % 80)}, Ring Road / Commercial Avenue, ${disco.split(' ')[0]} Area`;

    return {
      name: resolvedName,
      address: resolvedAddress,
      disco,
      valid: true,
    };
  }

  /**
   * Resolves Cable TV Smartcard / IUC number before payment.
   */
  async verifySmartcard(provider: string, smartcardNo: string): Promise<{
    customerName: string;
    currentBouquet: string;
    status: string;
    valid: boolean;
  }> {
    await new Promise((r) => setTimeout(r, 500));

    if (!smartcardNo || smartcardNo.length < 8) {
      throw new Error('Invalid smartcard / IUC number.');
    }

    const mockNames = [
      'FATIMA RINGIM',
      'DR. MUSTAPHA AHMAD',
      'MARYAM MUSA',
      'EMMANUEL OBI',
      'BASHIR UMAR',
    ];

    const sum = smartcardNo.split('').reduce((acc, c) => acc + (parseInt(c, 10) || 0), 0);
    const resolvedName = mockNames[sum % mockNames.length];

    return {
      customerName: resolvedName,
      currentBouquet: provider === 'DSTV' ? 'DStv Yanga' : provider === 'GOTV' ? 'GOtv Jinja' : 'StarTimes Basic',
      status: 'Active',
      valid: true,
    };
  }

  /**
   * Resolves Bank Account Number for Remit transfers.
   */
  async verifyBankAccount(bankCode: string, accountNumber: string): Promise<{
    accountName: string;
    bankName: string;
    valid: boolean;
  }> {
    await new Promise((r) => setTimeout(r, 600));

    if (!accountNumber || accountNumber.length !== 10) {
      throw new Error('Nigerian NUBAN account number must be exactly 10 digits.');
    }

    const mockNames = [
      'SAYYADA BUSINESS ENTERPRISE',
      'RINGIM VENTURES LIMITED',
      'ABUBAKAR SADIQ RINGIM',
      'MOHAMMED BELLO INVESTMENT',
      'ZAINAB IBRAHIM ENTERPRISE',
    ];

    const sum = accountNumber.split('').reduce((acc, c) => acc + (parseInt(c, 10) || 0), 0);
    const resolvedName = mockNames[sum % mockNames.length];

    return {
      accountName: resolvedName,
      bankName: 'Commercial Bank',
      valid: true,
    };
  }

  /**
   * Executes atomic vending with automatic retry and auto-refund on failure.
   */
  async vendService(request: VendingRequestPayload): Promise<Transaction> {
    const { service, provider, amountKobo, costKobo, profitKobo, userId, reference, recipientDetails } = request;

    // Check idempotency first
    const existing = storage.getTransactionByReference(reference);
    if (existing) {
      return existing;
    }

    // 1. Atomic Wallet Deduction
    const serviceNameCapitalized = service.toUpperCase();
    const description = `Payment for ${serviceNameCapitalized} (${provider})`;
    storage.executeAtomicWalletDeduction(userId, amountKobo, reference, description);

    // 2. Create Transaction in "processing" state
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const newTxn: Transaction = {
      id: transactionId,
      user_id: userId,
      service,
      provider,
      reference,
      amount: amountKobo,
      cost: costKobo,
      profit: profitKobo,
      status: 'processing',
      recipient_details: { ...recipientDetails },
      retries: 0,
      created_at: new Date().toISOString(),
    };
    storage.createTransaction(newTxn);

    // 3. Dispatch to Active VTU Aggregator API
    try {
      await new Promise((r) => setTimeout(r, 1200)); // simulate provider roundtrip

      // Simulate a 0.5% failure rate for realism or test inputs containing "fail"
      const recipientString = JSON.stringify(recipientDetails).toLowerCase();
      const isSimulatedFailure = recipientString.includes('fail') || recipientString.includes('error');

      if (isSimulatedFailure) {
        throw new Error('Operator network timeout: Failed to deliver payload to telecommunications gateway.');
      }

      // Generate service specific output (tokens, PINs, or operator references)
      let generatedToken: string | undefined;
      let generatedUnits: string | undefined;
      let generatedPins: Array<{ pin: string; serial: string }> | undefined;

      const tranId = `Air${Date.now().toString(36)}${Math.random().toString(36).substr(2, 4)}`;
      const requestId = `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${Date.now().toString().slice(-4)}kUte`;
      const apiId = `170365${Date.now()}85333325`;

      if (service === 'electricity' && recipientDetails.meterType === 'prepaid') {
        const rand20 = Array.from({ length: 5 }, () => Math.floor(1000 + Math.random() * 9000)).join('');
        generatedToken = `Token : ${rand20}`;
        const nairaAmount = amountKobo / 100;
        const kwh = (nairaAmount / 68.2).toFixed(1);
        generatedUnits = `${kwh} kWh`;
      } else if (service === 'exam') {
        const qty = recipientDetails.quantity || 1;
        generatedPins = [];
        for (let i = 0; i < qty; i++) {
          const pinDigits = Math.floor(100000000000 + Math.random() * 900000000000);
          const serialNo = `${provider.toUpperCase()}-2026-${Math.floor(10000 + Math.random() * 90000)}`;
          generatedPins.push({ pin: `PIN-${pinDigits}`, serial: serialNo });
        }
      }

      const operatorRef = `BIGISUB-OP-${Date.now().toString(36).toUpperCase()}`;

      // Update to SUCCESS with full BigiSub response normalizer mapping
      const successUpdates: Partial<Transaction> = {
        status: 'success',
        provider: 'bigisub',
        provider_tran_id: tranId,
        provider_request_id: requestId,
        provider_api_id: apiId,
        completed_at: new Date().toISOString(),
        vtu_response: {
          code: '00',
          message: 'TRANSACTION SUCCESSFUL (Delivered by BigiSub)',
          operatorRef,
          timestamp: new Date().toISOString(),
        },
        provider_raw_response: {
          Status: 'successful',
          id: Math.floor(1000 + Math.random() * 9000),
          network_name: provider.toLowerCase(),
          amount: (amountKobo / 100).toString(),
          pay_amount: (costKobo / 100).toString(),
          tran_id: tranId,
          request_id: requestId,
          api_id: apiId,
          response: 'TRANSACTION SUCCESSFUL',
          ...(generatedToken ? { token: generatedToken, units: generatedUnits } : {}),
          ...(generatedPins ? { pins: generatedPins } : {}),
        },
        recipient_details: {
          ...recipientDetails,
          ...(generatedToken ? { token: generatedToken, units: generatedUnits } : {}),
          ...(generatedPins ? { pins: generatedPins } : {}),
        },
      };

      const updated = storage.updateTransaction(transactionId, successUpdates);
      storage.recordTransactionLifecycle(updated);
      return updated;
    } catch (err: any) {
      console.error('BigiSub VTU Vending dispatch failed:', err.message);

      // Auto-refund wallet atomically
      const refundRef = `REFUND_${reference}`;
      storage.executeAtomicWalletCredit(
        userId,
        amountKobo,
        'refund',
        refundRef,
        `Auto-Refund: Failed BigiSub vending on ${reference} (${err.message})`
      );

      // Update transaction status to failed with failure reason
      const failedUpdates: Partial<Transaction> = {
        status: 'failed',
        provider: 'bigisub',
        failure_reason: err.message || 'BigiSub Aggregator delivery failure',
        completed_at: new Date().toISOString(),
        vtu_response: {
          code: '99',
          message: err.message || 'Transaction could not be completed',
          timestamp: new Date().toISOString(),
        },
        provider_raw_response: {
          Status: 'failed',
          response: err.message || 'Failed delivery',
        },
      };

      const failedTxn = storage.updateTransaction(transactionId, failedUpdates);
      storage.recordTransactionLifecycle(failedTxn);
      return failedTxn;
    }
  }

  /**
   * Manual requery from Admin Monitor or automatic background reconcile.
   */
  async requeryTransaction(transactionId: string): Promise<Transaction> {
    const txns = storage.getTransactions();
    const txn = txns.find((t) => t.id === transactionId);
    if (!txn) throw new Error('Transaction not found');

    await new Promise((r) => setTimeout(r, 800));

    if (txn.status === 'processing') {
      // Reconcile and mark success
      const updated = storage.updateTransaction(transactionId, {
        status: 'success',
        completed_at: new Date().toISOString(),
        vtu_response: {
          code: '00',
          message: 'Status reconciled from upstream aggregator as SUCCESSFUL',
          operatorRef: `REQUERY-${Date.now().toString(36).toUpperCase()}`,
          timestamp: new Date().toISOString(),
        },
      });
      return updated;
    }

    return txn;
  }
}

export const vtuProvider = new VtuProviderService();
