/**
 * Sayyada Datasub — Vending Cloud Function
 * Implements atomic wallet debit, BigiSub provider dispatch, idempotency,
 * and automated refund-on-failure.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { vtuProvider } from '../vtu/vtuProvider';
import { bigisubTokenSecret } from '../config/secrets';
import { PLAN_CODE_MAP } from '../vtu/planCodeMap';

const db = admin.firestore();

export const purchaseService = functions
  .runWith({ secrets: [bigisubTokenSecret] })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { service, provider, amountKobo, costKobo, profitKobo, reference, recipientDetails } = data;
    const userId = context.auth.uid;

    const txnRef = db.collection('transactions').doc(reference);
    const userRef = db.collection('users').doc(userId);
    const ledgerDebitRef = db.collection('wallet_ledger').doc();

    // Enforce honest scope: BigiSub supports airtime, data, tv, electricity, exam
    const isSupportedByBigisub = ['airtime', 'data', 'tv', 'electricity', 'exam'].includes(service);
    if (!isSupportedByBigisub) {
      throw new functions.https.HttpsError(
        'unimplemented',
        `${service.toUpperCase()} is reserved for separate provider integration and remains Coming Soon.`
      );
    }

    // Pre-flight check: Load product from Firestore for plan code validation
    const targetProductId =
      data.productId ||
      data.product_id ||
      recipientDetails?.productId ||
      (service === 'airtime' ? `${provider.toLowerCase()}-airtime` : null) ||
      (service === 'electricity' ? `${provider.toLowerCase()}-${recipientDetails?.meterType || 'prepaid'}` : null) ||
      recipientDetails?.planCode?.toLowerCase() ||
      data.planId;

    let product: any = null;
    if (targetProductId) {
      const pDoc = await db.collection('products').doc(targetProductId).get();
      if (pDoc.exists) {
        product = { id: pDoc.id, ...pDoc.data() };
      }
    }

    if (!product && recipientDetails?.planCode) {
      const qSnap = await db
        .collection('products')
        .where('provider_plan_code', '==', recipientDetails.planCode)
        .limit(1)
        .get();
      if (!qSnap.empty) {
        product = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() };
      }
    }

    if (product) {
      if (product.active !== true) {
        throw new functions.https.HttpsError('failed-precondition', 'Product unavailable');
      }

      const expectedCode = (PLAN_CODE_MAP as Record<string, string>)[product.id];
      const actualCode = product.provider_plan_code;

      // Fail-fast: refuse to vend on a misconfigured plan
      if (!expectedCode) {
        await db.collection('admin_activity').add({
          actorId: 'system',
          actorName: 'planCodeMap_check',
          action: 'plan_code_missing_in_map',
          target: `products/${product.id}`,
          before: { provider_plan_code: actualCode },
          after: null,
          severity: 'high',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        throw new functions.https.HttpsError(
          'failed-precondition',
          'This product is temporarily unavailable. Please try again later.'
        );
      }

      if (expectedCode !== actualCode) {
        await db.collection('admin_activity').add({
          actorId: 'system',
          actorName: 'planCodeMap_check',
          action: 'plan_code_mismatch',
          target: `products/${product.id}`,
          before: { expected: expectedCode, actual: actualCode },
          after: null,
          severity: 'critical',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        throw new functions.https.HttpsError(
          'failed-precondition',
          'This product is temporarily unavailable. Please try again later.'
        );
      }
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

        // Enforce KYC Tier Entitlement check
        const requiredKycTier =
          product?.requiredKycTier ?? (service === 'remit' || service === 'invoice' ? 2 : 1);
        const userKycTier = userData?.tier || userData?.kycTier || 1;
        if (userKycTier < requiredKycTier) {
          throw new Error('KYC_TIER_REQUIRED');
        }

        previousBalance = userData?.wallet_balance || 0;
        if (previousBalance < amountKobo) {
          throw new Error('INSUFFICIENT_FUNDS');
        }

        balanceAfterDebit = previousBalance - amountKobo;

        // Create transaction in 'processing' state with provider 'bigisub'
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

        // Write immutable ledger entry
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
      if (err.message === 'KYC_TIER_REQUIRED') {
        throw new functions.https.HttpsError('permission-denied', 'This service requires Tier 2 identity verification.');
      }
      if (err.message === 'INSUFFICIENT_FUNDS') {
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient wallet balance.');
      }
      throw new functions.https.HttpsError('internal', err.message);
    }

    // 2. Outbound Dispatch to BigiSub via Provider Abstraction Layer
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

      // Merge generated electricity token or exam PINs into recipient details
      const updatedRecipient = {
        ...recipientDetails,
        ...(vtuResult?.token ? { token: vtuResult.token, units: vtuResult.units } : {}),
        ...(vtuResult?.pins ? { pins: vtuResult.pins } : {}),
      };

      // 3. Update Transaction to SUCCESS
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
          message: 'TRANSACTION SUCCESSFUL (Delivered by BigiSub)',
          operatorRef: vtuResult.operatorRef,
          tranId: vtuResult.tranId,
          timestamp: new Date().toISOString(),
        },
      });

      // 4. Update Provider Health Stats in admin_stats/provider
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

      // 5. Write User Receipts, Activity, and Spending
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

      // Update provider error metrics
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
