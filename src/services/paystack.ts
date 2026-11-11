import { storage } from './storage';

export interface PaystackInitParams {
  email: string;
  amountKobo: number;
  userId: string;
  metadata?: Record<string, any>;
  onSuccess: (reference: string) => void;
  onCancel: () => void;
}

class PaystackService {
  /**
   * Initializes real Paystack transaction via server-side proxy and redirects
   * the customer to Paystack's official checkout page.
   */
  async processFunding(params: PaystackInitParams): Promise<{ reference: string; status: 'success' }> {
    const { email, amountKobo, userId } = params;

    const res = await fetch('/api/paystack/initialize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        amountKobo,
        userId,
        metadata: params.metadata,
      }),
    });

    const data = await res.json();
    if (!res.ok || !data?.authorizationUrl) {
      throw new Error(data?.message || 'Payment provider could not initialize transaction. Please try again.');
    }

    // Direct browser redirect to Paystack's secure checkout page
    if (typeof window !== 'undefined' && data.authorizationUrl) {
      window.location.href = data.authorizationUrl;
    }

    return { reference: data.reference, status: 'success' };
  }

  /**
   * Verifies payment reference idempotently against Paystack and confirms wallet credit.
   */
  async verifyPayment(input: string | { reference: string }): Promise<{
    status: 'success' | 'failed' | 'pending';
    amount?: number;
    walletBalance?: number;
    message?: string;
  }> {
    const reference = typeof input === 'string' ? input : input?.reference;
    if (!reference || reference.trim() === '' || reference === 'invalid') {
      return { status: 'failed', message: "We couldn't confirm this payment" };
    }

    try {
      const res = await fetch('/api/paystack/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      });

      const data = await res.json();

      if (!res.ok || data.status !== 'success') {
        if (data.status === 'pending') {
          return { status: 'pending', message: 'Payment is being processed — check your dashboard in a moment' };
        }
        return { status: 'failed', message: data.message || "We couldn't confirm this payment with Paystack" };
      }

      const currentUserId = storage.getCurrentUserId() || data.metadata?.userId;
      const user = currentUserId ? storage.getUser(currentUserId) : null;
      const verifiedAmount = Number(data.amount || 0);

      // Check if reference was already credited in ledger (idempotent)
      if (currentUserId && user) {
        const ledger = storage.getLedger(currentUserId);
        const existingEntry = ledger.find((l) => l.reference === reference);

        if (existingEntry) {
          return {
            status: 'success',
            amount: existingEntry.amount,
            walletBalance: user.wallet_balance ?? existingEntry.balance_after,
          };
        }

        const creditResult = storage.executeAtomicWalletCredit(
          user.uid,
          verifiedAmount,
          'paystack',
          reference,
          `Paystack Topup (Ref: ${reference})`
        );

        return {
          status: 'success',
          amount: verifiedAmount,
          walletBalance: creditResult.balanceAfter,
        };
      }

      return {
        status: 'success',
        amount: verifiedAmount,
      };
    } catch (err: any) {
      return {
        status: 'failed',
        message: err.message || "Failed to reach verification gateway.",
      };
    }
  }
}

export const paystack = new PaystackService();
export const verifyPayment = (input: string | { reference: string }) => paystack.verifyPayment(input);

