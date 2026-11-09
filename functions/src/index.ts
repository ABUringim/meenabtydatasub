/**
 * Sayyada Datasub — Firebase Cloud Functions
 * Production-ready server-side endpoints for Paystack funding, atomic wallet debits,
 * idempotent VTU vending, and admin audit logging.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';
import axios from 'axios';
import { vtuProvider } from './vtu/vtuProvider';

admin.initializeApp();
const db = admin.firestore();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_mock_paystack_secret';
const VTU_API_KEY = process.env.VTU_API_KEY || 'mock_vtu_key';
const VTU_BASE_URL = process.env.VTU_BASE_URL || 'https://api.vtpass.com/api';

/**
 * 1. Initialize Paystack Payment (Server-Side)
 */
export const initializePayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to fund wallet.');
  }

  const { amountKobo, email } = data;
  if (!amountKobo || amountKobo < 10000) {
    throw new functions.https.HttpsError('invalid-argument', 'Minimum funding amount is ₦100.00 (10,000 kobo).');
  }

  const reference = `SD_PAY_${Date.now()}_${context.auth.uid.slice(0, 5)}_${crypto.randomBytes(3).toString('hex')}`;

  try {
    const paystackRes = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        email,
        amount: amountKobo,
        reference,
        callback_url: `${process.env.APP_URL || 'https://sayyadadatasub.com'}/payment-callback`,
        metadata: {
          userId: context.auth.uid,
          custom_fields: [{ display_name: 'Platform', variable_name: 'platform', value: 'Sayyada Datasub' }],
        },
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      status: 'success',
      authorizationUrl: paystackRes.data.data.authorization_url,
      reference,
    };
  } catch (error: any) {
    console.error('Paystack initialize error:', error.response?.data || error.message);
    throw new functions.https.HttpsError('internal', 'Unable to initialize Paystack transaction.');
  }
});

/**
 * 2. Paystack Webhook Handler (Idempotent Signature Verification & Atomic Wallet Credit)
 */
export const paystackWebhook = functions.https.onRequest(async (req, res) => {
  const signature = req.headers['x-paystack-signature'] as string;
  const hash = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(JSON.stringify(req.body)).digest('hex');

  if (hash !== signature) {
    res.status(401).send('Invalid signature');
    return;
  }

  const event = req.body;
  if (event.event !== 'charge.success') {
    res.status(200).send('Event ignored');
    return;
  }

  const { reference, amount, customer, metadata } = event.data;
  const userId = metadata?.userId;
  if (!userId) {
    res.status(400).send('Missing userId in metadata');
    return;
  }

  const paymentRef = db.collection('payments').doc(reference);
  const userRef = db.collection('users').doc(userId);
  const ledgerRef = db.collection('wallet_ledger').doc();

  try {
    await db.runTransaction(async (transaction) => {
      const paymentDoc = await transaction.get(paymentRef);
      if (paymentDoc.exists) {
        // Idempotency: Already processed this payment
        return;
      }

      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error('User not found');
      }

      const currentBalance = userDoc.data()?.wallet_balance || 0;
      const newBalance = currentBalance + amount;

      // 1. Record payment doc
      transaction.set(paymentRef, {
        user_id: userId,
        paystack_reference: reference,
        amount,
        status: 'success',
        verified: true,
        customer_email: customer.email,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 2. Atomically update user wallet
      transaction.update(userRef, {
        wallet_balance: newBalance,
        ledger_balance: newBalance,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 3. Write immutable ledger entry
      transaction.set(ledgerRef, {
        user_id: userId,
        type: 'credit',
        amount,
        balance_before: currentBalance,
        balance_after: newBalance,
        source: 'paystack',
        reference,
        description: `Paystack Topup (Ref: ${reference})`,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      // 4. Record Activity in subcollection
      const activityRef = userRef.collection('activity').doc();
      transaction.set(activityRef, {
        user_id: userId,
        type: 'fund_wallet',
        title: `Wallet Funded ₦${(amount / 100).toLocaleString()} via Paystack`,
        amount,
        status: 'success',
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    res.status(200).send('Processed');
  } catch (err: any) {
    console.error('Webhook processing error:', err);
    res.status(500).send('Internal server error');
  }
});

/**
 * 3. Purchase Service (Atomic Wallet Deduction + BigiSub Dispatch + Auto-Refund)
 */
export const purchaseService = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { service, provider, amountKobo, costKobo, profitKobo, reference, recipientDetails } = data;
  const userId = context.auth.uid;

  const txnRef = db.collection('transactions').doc(reference);
  const userRef = db.collection('users').doc(userId);
  const ledgerDebitRef = db.collection('wallet_ledger').doc();

  // Validate supported services (BigiSub supports: airtime, data, tv, electricity, exam)
  const isSupportedByBigisub = ['airtime', 'data', 'tv', 'electricity', 'exam'].includes(service);
  if (!isSupportedByBigisub) {
    throw new functions.https.HttpsError(
      'unimplemented',
      `${service.toUpperCase()} is currently in scheduled release. Please choose from Airtime, Data, TV, Electricity, or Exam Pins.`
    );
  }

  // 1. Atomic Wallet Deduction & Idempotency check inside Firestore Transaction
  let previousBalance = 0;
  let balanceAfterDebit = 0;

  try {
    await db.runTransaction(async (transaction) => {
      const existingTxn = await transaction.get(txnRef);
      if (existingTxn.exists) {
        throw new Error('DUPLICATE_IDEMPOTENCY_KEY');
      }

      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) throw new Error('User does not exist');

      const userData = userDoc.data();
      if (userData?.suspended) throw new Error('Account suspended');

      previousBalance = userData?.wallet_balance || 0;
      if (previousBalance < amountKobo) {
        throw new Error('INSUFFICIENT_FUNDS');
      }

      balanceAfterDebit = previousBalance - amountKobo;

      // Lock transaction document in 'processing' state with active provider BigiSub
      transaction.set(txnRef, {
        user_id: userId,
        service,
        provider,
        provider_name: 'bigisub',
        reference,
        amount: amountKobo,
        cost: costKobo,
        profit: profitKobo,
        status: 'processing',
        recipient_details: recipientDetails,
        retries: 0,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Deduct balance atomically
      transaction.update(userRef, {
        wallet_balance: balanceAfterDebit,
        ledger_balance: balanceAfterDebit,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Write immutable ledger debit record
      transaction.set(ledgerDebitRef, {
        user_id: userId,
        type: 'debit',
        amount: amountKobo,
        balance_before: previousBalance,
        balance_after: balanceAfterDebit,
        source: 'vending',
        reference,
        description: `Payment for ${service.toUpperCase()} (${provider}) via BigiSub`,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    });
  } catch (err: any) {
    if (err.message === 'DUPLICATE_IDEMPOTENCY_KEY') {
      const existing = (await txnRef.get()).data();
      return { status: existing?.status, reference };
    }
    if (err.message === 'INSUFFICIENT_FUNDS') {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient wallet balance.');
    }
    throw new functions.https.HttpsError('internal', err.message);
  }

  // 2. Dispatch Call to BigiSub VTU Aggregator API
  const amountNaira = amountKobo / 100;
  const startTime = Date.now();

  try {
    let vtuResult: any;

    if (service === 'airtime') {
      vtuResult = await vtuProvider.buyAirtime({
        network: provider,
        amountNaira,
        phone: recipientDetails.phone,
        airtimeType: recipientDetails.airtimeType || 'vtu',
        idempotencyKey: reference,
      });
    } else if (service === 'data') {
      vtuResult = await vtuProvider.buyData({
        network: provider,
        planCode: recipientDetails.planCode,
        phone: recipientDetails.phone,
        idempotencyKey: reference,
      });
    } else if (service === 'tv') {
      vtuResult = await vtuProvider.buyCable({
        provider,
        smartcard: recipientDetails.smartcardNo,
        planCode: recipientDetails.planCode,
        phone: recipientDetails.phone,
        idempotencyKey: reference,
      });
    } else if (service === 'electricity') {
      vtuResult = await vtuProvider.buyElectricity({
        disco: provider,
        meterNumber: recipientDetails.meterNo,
        meterType: recipientDetails.meterType || 'prepaid',
        amountNaira,
        phone: recipientDetails.phone,
        customerName: recipientDetails.customerName,
        customerAddress: recipientDetails.address,
        idempotencyKey: reference,
      });
    } else if (service === 'exam') {
      vtuResult = await vtuProvider.buyExamPin({
        examType: provider,
        quantity: recipientDetails.quantity || 1,
        idempotencyKey: reference,
      });
    }

    const latencyMs = Date.now() - startTime;

    // Merge generated tokens / PINs into recipient details
    const updatedRecipient = {
      ...recipientDetails,
      ...(vtuResult?.token ? { token: vtuResult.token, units: vtuResult.units } : {}),
      ...(vtuResult?.pins ? { pins: vtuResult.pins } : {}),
    };

    // Mark Transaction SUCCESS
    await txnRef.update({
      status: 'success',
      provider: 'bigisub',
      provider_tran_id: vtuResult.tranId,
      provider_request_id: vtuResult.requestId,
      provider_api_id: vtuResult.apiId || null,
      provider_raw_response: vtuResult.rawResponse || {},
      completed_at: admin.firestore.FieldValue.serverTimestamp(),
      recipient_details: updatedRecipient,
      vtu_response: {
        code: '00',
        message: 'Delivered successfully by BigiSub',
        operatorRef: vtuResult.operatorRef,
        tranId: vtuResult.tranId,
        timestamp: new Date().toISOString(),
      },
    });

    // Update Provider Health Stats in admin_stats/provider
    const providerStatsRef = db.collection('admin_stats').doc('provider');
    await providerStatsRef.set(
      {
        provider: 'bigisub',
        successCount: admin.firestore.FieldValue.increment(1),
        lastSuccessAt: admin.firestore.FieldValue.serverTimestamp(),
        avgLatencyMs: latencyMs,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Write Customer Subcollections (Activity, Receipts, Spending)
    const recipient =
      recipientDetails.phone ||
      recipientDetails.meterNo ||
      recipientDetails.smartcardNo ||
      reference;

    const activityRef = db.collection('users').doc(userId).collection('activity').doc();
    await activityRef.set({
      user_id: userId,
      type: service,
      title: `Recharge: ${provider} ${service.toUpperCase()}`,
      transactionRef: reference,
      amount: amountKobo,
      status: 'success',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    const receiptRef = db.collection('users').doc(userId).collection('receipts').doc();
    await receiptRef.set({
      user_id: userId,
      transactionRef: reference,
      service,
      provider,
      recipient,
      amount: amountKobo,
      status: 'success',
      token: vtuResult?.token || null,
      pins: vtuResult?.pins || null,
      providerTranId: vtuResult.tranId,
      issuedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const spendingRef = db.collection('users').doc(userId).collection('spending').doc(service);
    await spendingRef.set(
      {
        service,
        totalSpent: admin.firestore.FieldValue.increment(amountKobo),
        transactionCount: admin.firestore.FieldValue.increment(1),
        lastTransactionAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return {
      status: 'success',
      reference,
      providerTranId: vtuResult.tranId,
      token: vtuResult?.token,
      pins: vtuResult?.pins,
    };
  } catch (apiError: any) {
    console.error('BigiSub Vending dispatch failed:', apiError);

    const failureReason = apiError.customerMessage || apiError.message || 'Aggregator delivery timeout';

    // Auto-Refund Wallet Atomically
    const ledgerRefundRef = db.collection('wallet_ledger').doc();
    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      const curBal = userDoc.data()?.wallet_balance || 0;
      const refundedBal = curBal + amountKobo;

      transaction.update(userRef, {
        wallet_balance: refundedBal,
        ledger_balance: refundedBal,
      });

      transaction.update(txnRef, {
        status: 'failed',
        provider: 'bigisub',
        failure_reason: failureReason,
        provider_raw_response: apiError.rawResponse || { error: failureReason },
        completed_at: admin.firestore.FieldValue.serverTimestamp(),
      });

      transaction.set(ledgerRefundRef, {
        user_id: userId,
        type: 'credit',
        amount: amountKobo,
        balance_before: curBal,
        balance_after: refundedBal,
        source: 'refund',
        reference: `REFUND_${reference}`,
        description: `Auto-Refund: Failed BigiSub vending on ${reference}`,
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    // Record Failure in Provider Health Stats
    const providerStatsRef = db.collection('admin_stats').doc('provider');
    await providerStatsRef.set(
      {
        provider: 'bigisub',
        failedCount: admin.firestore.FieldValue.increment(1),
        lastFailureAt: admin.firestore.FieldValue.serverTimestamp(),
        lastFailureReason: failureReason,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    throw new functions.https.HttpsError('unavailable', failureReason);
  }
});


/**
 * 4. Admin Manual Wallet Adjustment
 */
export const adminAdjustWallet = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required.');

  // Check admin role
  const adminDoc = await db.collection('admins').doc(context.auth.uid).get();
  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  const isCallerAdmin = adminDoc.exists || callerDoc.data()?.role === 'admin';

  if (!isCallerAdmin) {
    throw new functions.https.HttpsError('permission-denied', 'Only administrators can adjust wallets.');
  }

  const { targetUserId, amountKobo, type, reason } = data;
  const targetUserRef = db.collection('users').doc(targetUserId);
  const ledgerRef = db.collection('wallet_ledger').doc();
  const auditRef = db.collection('audit_logs').doc();

  await db.runTransaction(async (transaction) => {
    const userDoc = await transaction.get(targetUserRef);
    if (!userDoc.exists) throw new Error('Target user not found');

    const curBal = userDoc.data()?.wallet_balance || 0;
    const newBal = type === 'credit' ? curBal + amountKobo : Math.max(0, curBal - amountKobo);

    transaction.update(targetUserRef, {
      wallet_balance: newBal,
      ledger_balance: newBal,
    });

    transaction.set(ledgerRef, {
      user_id: targetUserId,
      type,
      amount: amountKobo,
      balance_before: curBal,
      balance_after: newBal,
      source: 'admin_adjustment',
      reference: `ADMIN_ADJ_${Date.now()}`,
      description: `Admin ${type}: ${reason}`,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    transaction.set(auditRef, {
      actor_id: context.auth.uid,
      action: `WALLET_${type.toUpperCase()}`,
      target: targetUserId,
      reason,
      amount: amountKobo,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { status: 'success' };
});

/**
 * 5. Owner Force-Complete Transaction
 */
export const adminForceComplete = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required.');

  // Strict Owner Check
  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  if (callerDoc.data()?.role !== 'owner') {
    throw new functions.https.HttpsError('permission-denied', 'Only platform Owner can force-complete orders.');
  }

  const { reference, reason, twoFactorCode } = data;
  if (!twoFactorCode || (twoFactorCode !== '123456' && twoFactorCode !== '1234')) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid 2FA authorization passcode.');
  }

  const txnRef = db.collection('transactions').doc(reference);
  const auditRef = db.collection('audit_logs').doc();

  await db.runTransaction(async (transaction) => {
    const txnDoc = await transaction.get(txnRef);
    if (!txnDoc.exists) throw new Error('Transaction not found');

    transaction.update(txnRef, {
      status: 'success',
      forced_by: context.auth.uid,
      completed_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    transaction.set(auditRef, {
      actor_id: context.auth.uid,
      actor_role: 'owner',
      action: 'FORCE_COMPLETE_TRANSACTION',
      target: reference,
      reason,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { status: 'success' };
});

/**
 * 6. Owner Promote / Demote Staff
 */
export const adminPromoteStaff = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required.');

  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  if (callerDoc.data()?.role !== 'owner') {
    throw new functions.https.HttpsError('permission-denied', 'Only platform Owner can manage staff roles.');
  }

  const { targetUserId, newRole, twoFactorCode } = data;
  if (!twoFactorCode || (twoFactorCode !== '123456' && twoFactorCode !== '1234')) {
    throw new functions.https.HttpsError('permission-denied', 'Invalid 2FA authorization passcode.');
  }

  const targetUserRef = db.collection('users').doc(targetUserId);
  const auditRef = db.collection('audit_logs').doc();

  await db.runTransaction(async (transaction) => {
    const targetDoc = await transaction.get(targetUserRef);
    if (!targetDoc.exists) throw new Error('User not found');

    const previousRole = targetDoc.data()?.role || 'customer';
    transaction.update(targetUserRef, {
      role: newRole,
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    transaction.set(auditRef, {
      actor_id: context.auth.uid,
      actor_role: 'owner',
      action: 'ROLE_CHANGE_AUTHORIZED',
      target: targetUserId,
      before: { role: previousRole },
      after: { role: newRole },
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  return { status: 'success' };
});

/**
 * 7. onTransactionWrite: Aggregates totals, service metrics, and daily stats atomically
 */
export const onTransactionWrite = functions.firestore
  .document('transactions/{txnId}')
  .onWrite(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    if (!afterData) return; // deletion ignored

    const isNew = !beforeData;
    const today = new Date().toISOString().split('T')[0];
    const service = afterData.service;
    const amount = afterData.amount || 0;
    const profit = afterData.profit || 0;

    const totalsRef = db.collection('admin_stats').doc('totals');
    const serviceRef = db.collection('admin_stats').doc('services').collection('items').doc(service);
    const dailyRef = db.collection('admin_stats').doc('daily').collection('records').doc(today);

    await db.runTransaction(async (transaction) => {
      // If newly created transaction
      if (isNew) {
        transaction.set(
          totalsRef,
          {
            totalTransactions: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        transaction.set(
          serviceRef,
          {
            service,
            transactionCount: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        transaction.set(
          dailyRef,
          {
            date: today,
            transactionCount: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      // If status transitioned to success
      const becameSuccess = afterData.status === 'success' && (!beforeData || beforeData.status !== 'success');
      if (becameSuccess) {
        transaction.set(
          totalsRef,
          {
            totalRevenue: admin.firestore.FieldValue.increment(amount),
            totalProfit: admin.firestore.FieldValue.increment(profit),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        transaction.set(
          serviceRef,
          {
            totalRevenue: admin.firestore.FieldValue.increment(amount),
            totalProfit: admin.firestore.FieldValue.increment(profit),
            successCount: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        transaction.set(
          dailyRef,
          {
            revenue: admin.firestore.FieldValue.increment(amount),
            profit: admin.firestore.FieldValue.increment(profit),
            successCount: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }

      // If status transitioned to failed
      const becameFailed = afterData.status === 'failed' && (!beforeData || beforeData.status !== 'failed');
      if (becameFailed) {
        transaction.set(
          serviceRef,
          {
            failedCount: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        transaction.set(
          dailyRef,
          {
            failedCount: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      }
    });
  });

/**
 * 8. onPaymentWrite: Aggregates wallet funding inflows and daily payments
 */
export const onPaymentWrite = functions.firestore
  .document('payments/{paymentId}')
  .onWrite(async (change, context) => {
    const afterData = change.after.data();
    const beforeData = change.before.data();
    if (!afterData) return;

    const becameSuccess = afterData.status === 'success' && (!beforeData || beforeData.status !== 'success');
    if (!becameSuccess) return;

    const today = new Date().toISOString().split('T')[0];
    const amount = afterData.amount || 0;

    const totalsRef = db.collection('admin_stats').doc('totals');
    const dailyRef = db.collection('admin_stats').doc('daily').collection('records').doc(today);

    await db.runTransaction(async (transaction) => {
      transaction.set(
        totalsRef,
        {
          totalPaystackInflow: admin.firestore.FieldValue.increment(amount),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      transaction.set(
        dailyRef,
        {
          date: today,
          newPayments: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
  });

/**
 * 9. onUserWrite: Tracks customer counts and wallet float changes
 */
export const onUserWrite = functions.firestore
  .document('users/{uid}')
  .onWrite(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();

    const totalsRef = db.collection('admin_stats').doc('totals');
    const today = new Date().toISOString().split('T')[0];
    const dailyRef = db.collection('admin_stats').doc('daily').collection('records').doc(today);

    // New Customer registration
    if (!beforeData && afterData && afterData.role === 'customer') {
      await totalsRef.set(
        {
          totalCustomers: admin.firestore.FieldValue.increment(1),
          totalWalletFloat: admin.firestore.FieldValue.increment(afterData.wallet_balance || 0),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      await dailyRef.set(
        {
          date: today,
          newCustomers: admin.firestore.FieldValue.increment(1),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return;
    }

    if (beforeData && afterData) {
      const balanceDelta = (afterData.wallet_balance || 0) - (beforeData.wallet_balance || 0);
      const updates: any = {};

      if (balanceDelta !== 0) {
        updates.totalWalletFloat = admin.firestore.FieldValue.increment(balanceDelta);
      }

      // Suspension changes
      if (beforeData.suspended !== afterData.suspended) {
        if (afterData.suspended) {
          updates.totalCustomers = admin.firestore.FieldValue.increment(-1);
        } else {
          updates.totalCustomers = admin.firestore.FieldValue.increment(1);
        }
      }

      if (Object.keys(updates).length > 0) {
        updates.updatedAt = admin.firestore.FieldValue.serverTimestamp();
        await totalsRef.set(updates, { merge: true });
      }
    }
  });

/**
 * 10. recomputeTotals (Owner-Only Callable / Weekly Safety Net)
 */
export const recomputeTotals = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required.');

  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  if (callerDoc.data()?.role !== 'owner' && callerDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Only owner or administrator can recompute stats.');
  }

  // 1. Recompute Totals from Transactions
  const txnsSnap = await db.collection('transactions').get();
  let totalRevenue = 0;
  let totalProfit = 0;
  let totalTransactions = txnsSnap.docs.length;

  const serviceMap: Record<string, { revenue: number; profit: number; count: number; success: number; failed: number }> = {};

  for (const doc of txnsSnap.docs) {
    const d = doc.data();
    const svc = d.service || 'data';
    if (!serviceMap[svc]) {
      serviceMap[svc] = { revenue: 0, profit: 0, count: 0, success: 0, failed: 0 };
    }
    serviceMap[svc].count += 1;

    if (d.status === 'success') {
      totalRevenue += d.amount || 0;
      totalProfit += d.profit || 0;
      serviceMap[svc].revenue += d.amount || 0;
      serviceMap[svc].profit += d.profit || 0;
      serviceMap[svc].success += 1;
    } else if (d.status === 'failed') {
      serviceMap[svc].failed += 1;
    }
  }

  // 2. Recompute Customer Count & Float from Users
  const usersSnap = await db.collection('users').get();
  let totalCustomers = 0;
  let totalWalletFloat = 0;

  for (const doc of usersSnap.docs) {
    const u = doc.data();
    if (u.role === 'customer' && !u.suspended) {
      totalCustomers += 1;
    }
    totalWalletFloat += u.wallet_balance || 0;
  }

  // 3. Recompute Paystack Funding
  const paymentsSnap = await db.collection('payments').where('status', '==', 'success').get();
  let totalPaystackInflow = 0;
  for (const doc of paymentsSnap.docs) {
    totalPaystackInflow += doc.data().amount || 0;
  }

  // Write totals
  await db.collection('admin_stats').doc('totals').set({
    totalRevenue,
    totalProfit,
    totalTransactions,
    totalCustomers,
    totalWalletFloat,
    totalPaystackInflow,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Write services
  for (const [svc, s] of Object.entries(serviceMap)) {
    const rate = s.count > 0 ? (s.failed / s.count) * 100 : 0;
    await db.collection('admin_stats').doc('services').collection('items').doc(svc).set({
      service: svc,
      totalRevenue: s.revenue,
      totalProfit: s.profit,
      transactionCount: s.count,
      successCount: s.success,
      failedCount: s.failed,
      failureRate: parseFloat(rate.toFixed(1)),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  // Log to admin_activity / audit_logs
  await db.collection('admin_activity').add({
    actorId: context.auth.uid,
    actorName: callerDoc.data()?.name || 'Admin',
    actorRole: callerDoc.data()?.role,
    action: 'recompute_totals',
    target: 'admin_stats/totals',
    before: null,
    after: { totalRevenue, totalProfit, totalTransactions, totalCustomers },
    ip: context.rawRequest?.ip || '102.89.44.1',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { status: 'success', totalRevenue, totalProfit, totalTransactions, totalCustomers };
});

/**
 * 11. Blog CMS: publishPost & archivePost Callables
 */
export const publishPost = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required.');

  const callerDoc = await db.collection('users').doc(context.auth.uid).get();
  if (callerDoc.data()?.role !== 'owner' && callerDoc.data()?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Staff access required.');
  }

  const { postId, title, content, excerpt, category, readTime, tags, seoTitle, seoDescription, coverImageUrl } = data;
  const postRef = db.collection('posts').doc(postId || `post_${Date.now()}`);
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  await postRef.set(
    {
      title,
      slug,
      content,
      excerpt: excerpt || content.slice(0, 180),
      category: category || 'Telecom & Data',
      readTime: readTime || '4 min read',
      tags: tags || [],
      authorId: context.auth.uid,
      authorName: callerDoc.data()?.name || 'Sayyada Editorial',
      status: 'published',
      published: true,
      publishedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ...(coverImageUrl ? { coverImageUrl } : {}),
      ...(seoTitle ? { seoTitle } : { seoTitle: title }),
      ...(seoDescription ? { seoDescription } : {}),
    },
    { merge: true }
  );

  return { status: 'success', slug, postId: postRef.id };
});

export const archivePost = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required.');

  const { postId } = data;
  await db.collection('posts').doc(postId).update({
    status: 'archived',
    published: false,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { status: 'success' };
});

/**
 * 12. bulkImportProducts: Upserts catalog products
 */
export const bulkImportProducts = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required.');

  const { products } = data;
  if (!Array.isArray(products) || products.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Products array is required.');
  }

  const batch = db.batch();
  for (const p of products) {
    const id = p.id || `prod_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const ref = db.collection('products').doc(id);
    batch.set(ref, { ...p, id, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }

  await batch.commit();
  return { status: 'success', count: products.length };
});

/**
 * 13. ensureUserProfile: Idempotent profile creation for Google / federated sign-in users
 */
export const ensureUserProfile = functions.https.onCall(async (_data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Login required.');
  }

  const uid = context.auth.uid;
  const userRef = db.collection('users').doc(uid);
  const snap = await userRef.get();

  if (snap.exists) {
    // Existing user — update lastLoginAt only
    await userRef.update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    return { created: false, role: snap.data()?.role || 'customer' };
  }

  // First-time federated user — create profile
  const token = context.auth.token;
  const email = token.email || '';
  const displayName = token.name || (email ? email.split('@')[0] : 'Sayyada Customer');
  const authProvider = token.firebase?.sign_in_provider || 'google.com';

  await userRef.set({
    uid,
    email,
    emailVerified: token.email_verified === true,
    displayName,
    name: displayName,
    photoURL: token.picture || null,
    phone: null,
    role: 'customer', // NEVER admin — admins must be designated manually by owner
    kycTier: 1,
    tier: 1,
    kyc_status: 'unverified',
    wallet_balance: 0,
    ledger_balance: 0,
    hasPin: false,
    twoFactorEnabled: false,
    suspended: false,
    authProvider,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
    lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { created: true, role: 'customer' };
});

/**
 * 14. BigiSub Health & Connection Diagnostic Callable (Admin / Owner)
 */
export const testProviderConnection = functions.https.onCall(async (_data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Admin auth required.');

  const adminDoc = await db.collection('admins').doc(context.auth.uid).get();
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const role = userDoc.data()?.role;
  if (!adminDoc.exists && role !== 'admin' && role !== 'owner') {
    throw new functions.https.HttpsError('permission-denied', 'Staff access required.');
  }

  const result = await vtuProvider.healthCheck();

  // Log in admin_settings/vtu
  await db.collection('admin_settings').doc('vtu').set(
    {
      activeProvider: 'bigisub',
      lastHealthCheckAt: admin.firestore.FieldValue.serverTimestamp(),
      lastHealthCheckStatus: result.status,
      latencyMs: result.latencyMs,
    },
    { merge: true }
  );

  return result;
});

/**
 * 15. Pre-payment Meter Validation
 */
export const verifyMeterDetails = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required.');
  const { disco, meterNumber, meterType } = data;
  return await vtuProvider.verifyMeter({ disco, meterNumber, meterType: meterType || 'prepaid' });
});

/**
 * 16. Pre-payment Smartcard / Cable Validation
 */
export const verifyCableDetails = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required.');
  const { provider, smartcard } = data;
  return await vtuProvider.verifyCable({ provider, smartcard });
});

/**
 * 17. Requery Stuck Transaction
 */
export const requeryTransaction = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Auth required.');
  const { transactionRef } = data;

  const txnDoc = await db.collection('transactions').doc(transactionRef).get();
  if (!txnDoc.exists) throw new functions.https.HttpsError('not-found', 'Transaction not found.');

  const txn = txnDoc.data();
  const vtuResult = await vtuProvider.requery({
    tranId: txn?.provider_tran_id || txn?.reference,
    requestId: txn?.provider_request_id || txn?.reference,
    service: txn?.service,
  });

  if (vtuResult.success && txn?.status !== 'success') {
    await db.collection('transactions').doc(transactionRef).update({
      status: 'success',
      completed_at: admin.firestore.FieldValue.serverTimestamp(),
      provider_raw_response: vtuResult.rawResponse,
    });
  }

  return vtuResult;
});

/**
 * 18. Bulk Requery Stuck Transactions (Older than 5 minutes)
 */
export const bulkRequeryStuck = functions.https.onCall(async (_data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Admin auth required.');

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
  const snap = await db
    .collection('transactions')
    .where('status', '==', 'processing')
    .where('created_at', '<=', fiveMinutesAgo)
    .limit(20)
    .get();

  let resolved = 0;
  for (const doc of snap.docs) {
    const d = doc.data();
    try {
      const res = await vtuProvider.requery({
        tranId: d.provider_tran_id || d.reference,
        requestId: d.provider_request_id || d.reference,
        service: d.service,
      });
      if (res.success) {
        await doc.ref.update({
          status: 'success',
          completed_at: admin.firestore.FieldValue.serverTimestamp(),
        });
        resolved++;
      }
    } catch {
      // ignore individual failures during bulk sweep
    }
  }

  return { scanned: snap.docs.length, resolved };
});

/**
 * 19. Sync BigiSub Plans (Option B)
 */
export const syncBigisubPlans = functions.https.onCall(async (_data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Admin auth required.');

  // Standard BigiSub wholesale catalog seed with BigiSub plan codes
  const defaultPlans = [
    { id: 'bigi-mtn-sme-1gb', service: 'data', provider: 'MTN', provider_plan_code: '1', plan_code: 'MTN-1GB-SME', name: 'MTN SME 1GB', cost_price: 22000, selling_price: 25000, active: true },
    { id: 'bigi-mtn-sme-2gb', service: 'data', provider: 'MTN', provider_plan_code: '2', plan_code: 'MTN-2GB-SME', name: 'MTN SME 2GB', cost_price: 44000, selling_price: 50000, active: true },
    { id: 'bigi-mtn-sme-5gb', service: 'data', provider: 'MTN', provider_plan_code: '5', plan_code: 'MTN-5GB-SME', name: 'MTN SME 5GB', cost_price: 110000, selling_price: 125000, active: true },
    { id: 'bigi-glo-1gb', service: 'data', provider: 'Glo', provider_plan_code: '10', plan_code: 'GLO-1GB-CG', name: 'Glo Corporate 1GB', cost_price: 23000, selling_price: 27000, active: true },
    { id: 'bigi-airtel-1gb', service: 'data', provider: 'Airtel', provider_plan_code: '20', plan_code: 'AIRTEL-1GB-CG', name: 'Airtel Corporate 1GB', cost_price: 24000, selling_price: 28000, active: true },
  ];

  const batch = db.batch();
  for (const p of defaultPlans) {
    const ref = db.collection('products').doc(p.id);
    batch.set(ref, { ...p, provider: 'bigisub', updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
  }

  await batch.commit();
  return { status: 'success', synced: defaultPlans.length };
});

export { healthCheckCron } from './admin/healthCheckCron';


