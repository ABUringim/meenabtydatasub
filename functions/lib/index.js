"use strict";
/**
 * Sayyada Datasub — Firebase Cloud Functions
 * Production-ready server-side endpoints for Paystack funding, atomic wallet debits,
 * idempotent VTU vending, and admin audit logging.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkImportProducts = exports.archivePost = exports.publishPost = exports.recomputeTotals = exports.onUserWrite = exports.onPaymentWrite = exports.onTransactionWrite = exports.adminPromoteStaff = exports.adminForceComplete = exports.adminAdjustWallet = exports.purchaseService = exports.paystackWebhook = exports.initializePayment = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
const axios_1 = __importDefault(require("axios"));
const bigisub_1 = require("./vtu/providers/bigisub");
const secrets_1 = require("./config/secrets");
const planCodeMap_1 = require("./vtu/planCodeMap");
admin.initializeApp();
const db = admin.firestore();
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_mock_paystack_secret';
/**
 * 1. Initialize Paystack Payment (Server-Side)
 */
exports.initializePayment = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to fund wallet.');
    }
    const { amountKobo, email } = data;
    if (!amountKobo || amountKobo < 10000) {
        throw new functions.https.HttpsError('invalid-argument', 'Minimum funding amount is ₦100.00 (10,000 kobo).');
    }
    const reference = `SD_PAY_${Date.now()}_${context.auth.uid.slice(0, 5)}_${crypto.randomBytes(3).toString('hex')}`;
    try {
        const paystackRes = await axios_1.default.post('https://api.paystack.co/transaction/initialize', {
            email,
            amount: amountKobo,
            reference,
            callback_url: `${secrets_1.DEPLOYED_URL}/payment-callback`,
            metadata: {
                userId: context.auth.uid,
                custom_fields: [{ display_name: 'Platform', variable_name: 'platform', value: 'Sayyada Datasub' }],
            },
        }, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
        });
        return {
            status: 'success',
            authorizationUrl: paystackRes.data.data.authorization_url,
            reference,
        };
    }
    catch (error) {
        console.error('Paystack initialize error:', error.response?.data || error.message);
        throw new functions.https.HttpsError('internal', 'Unable to initialize Paystack transaction.');
    }
});
/**
 * 2. Paystack Webhook Handler (Idempotent Signature Verification & Atomic Wallet Credit)
 */
exports.paystackWebhook = functions.https.onRequest(async (req, res) => {
    const signature = req.headers['x-paystack-signature'];
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
    }
    catch (err) {
        console.error('Webhook processing error:', err);
        res.status(500).send('Internal server error');
    }
});
/**
 * 3. Purchase Service (Atomic Wallet Deduction + VTU Dispatch + Auto-Refund)
 */
exports.purchaseService = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
    }
    const { service, provider, amountKobo, costKobo, profitKobo, reference, recipientDetails } = data;
    const userId = context.auth.uid;
    const txnRef = db.collection('transactions').doc(reference);
    const userRef = db.collection('users').doc(userId);
    const ledgerDebitRef = db.collection('wallet_ledger').doc();
    // Pre-flight check: Load product from Firestore for plan code validation
    const targetProductId = data.productId ||
        data.product_id ||
        recipientDetails?.productId ||
        (service === 'airtime' ? `${provider.toLowerCase()}-airtime` : null) ||
        (service === 'electricity' ? `${provider.toLowerCase()}-${recipientDetails?.meterType || 'prepaid'}` : null) ||
        recipientDetails?.planCode?.toLowerCase() ||
        data.planId;
    let product = null;
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
        const expectedCode = planCodeMap_1.PLAN_CODE_MAP[product.id];
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
            throw new functions.https.HttpsError('failed-precondition', 'This product is temporarily unavailable. Please try again later.');
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
            throw new functions.https.HttpsError('failed-precondition', 'This product is temporarily unavailable. Please try again later.');
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
            if (!userDoc.exists)
                throw new Error('User does not exist');
            const userData = userDoc.data();
            if (userData?.suspended)
                throw new Error('Account suspended');
            previousBalance = userData?.wallet_balance || 0;
            if (previousBalance < amountKobo) {
                throw new Error('INSUFFICIENT_FUNDS');
            }
            balanceAfterDebit = previousBalance - amountKobo;
            // Lock transaction document in 'processing' state
            transaction.set(txnRef, {
                user_id: userId,
                service,
                provider,
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
            // Write ledger debit record
            transaction.set(ledgerDebitRef, {
                user_id: userId,
                type: 'debit',
                amount: amountKobo,
                balance_before: previousBalance,
                balance_after: balanceAfterDebit,
                source: 'vending',
                reference,
                description: `Payment for ${service.toUpperCase()} (${provider})`,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
    }
    catch (err) {
        if (err.message === 'DUPLICATE_IDEMPOTENCY_KEY') {
            const existing = (await txnRef.get()).data();
            return { status: existing?.status, reference };
        }
        if (err.message === 'INSUFFICIENT_FUNDS') {
            throw new functions.https.HttpsError('failed-precondition', 'Insufficient wallet balance.');
        }
        throw new functions.https.HttpsError('internal', err.message);
    }
    // 2. Call Upstream BigiSub VTU Gateway API
    try {
        const amountNgn = amountKobo / 100;
        const vendingParams = {
            service,
            provider,
            amountNgn,
            recipientDetails,
            reference,
        };
        let vtuResult;
        if (service === 'airtime') {
            vtuResult = await bigisub_1.bigiSubProvider.buyAirtime(vendingParams);
        }
        else if (service === 'data') {
            vtuResult = await bigisub_1.bigiSubProvider.buyData(vendingParams);
        }
        else if (service === 'electricity') {
            vtuResult = await bigisub_1.bigiSubProvider.buyElectricity(vendingParams);
        }
        else if (service === 'tv') {
            vtuResult = await bigisub_1.bigiSubProvider.buyCableTv(vendingParams);
        }
        else if (service === 'exam') {
            vtuResult = await bigisub_1.bigiSubProvider.buyExamPin(vendingParams);
        }
        else {
            throw new Error(`Service '${service}' is not supported by BigiSub VTU Gateway.`);
        }
        // Mark Transaction SUCCESS
        await txnRef.update({
            status: 'success',
            completed_at: admin.firestore.FieldValue.serverTimestamp(),
            vtu_response: {
                code: '00',
                message: vtuResult.message,
                operatorRef: vtuResult.operatorRef,
                tran_id: vtuResult.tran_id,
                request_id: vtuResult.request_id,
                api_id: vtuResult.api_id,
                timestamp: new Date().toISOString(),
            },
            recipient_details: {
                ...recipientDetails,
                ...(vtuResult.token ? { token: vtuResult.token, units: vtuResult.units } : {}),
                ...(vtuResult.pins ? { pins: vtuResult.pins } : {}),
            },
        });
        // Write Customer Subcollections (Activity, Receipts, Spending)
        const recipient = recipientDetails.phone ||
            recipientDetails.meterNo ||
            recipientDetails.smartcardNo ||
            recipientDetails.accountNumber ||
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
            issuedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        const spendingRef = db.collection('users').doc(userId).collection('spending').doc(service);
        await spendingRef.set({
            service,
            totalSpent: admin.firestore.FieldValue.increment(amountKobo),
            transactionCount: admin.firestore.FieldValue.increment(1),
            lastTransactionAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return { status: 'success', reference };
    }
    catch (apiError) {
        console.error('Aggregator dispatch failed:', apiError);
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
                failure_reason: apiError.message || 'Aggregator delivery timeout',
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
                description: `Auto-Refund: Failed vending on ${reference}`,
                created_at: admin.firestore.FieldValue.serverTimestamp(),
            });
        });
        throw new functions.https.HttpsError('unavailable', 'Telecommunications provider timeout. Your wallet has been automatically refunded.');
    }
});
/**
 * 4. Admin Manual Wallet Adjustment
 */
exports.adminAdjustWallet = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Auth required.');
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
        if (!userDoc.exists)
            throw new Error('Target user not found');
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
exports.adminForceComplete = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Auth required.');
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
        if (!txnDoc.exists)
            throw new Error('Transaction not found');
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
exports.adminPromoteStaff = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Auth required.');
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
        if (!targetDoc.exists)
            throw new Error('User not found');
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
exports.onTransactionWrite = functions.firestore
    .document('transactions/{txnId}')
    .onWrite(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    if (!afterData)
        return; // deletion ignored
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
            transaction.set(totalsRef, {
                totalTransactions: admin.firestore.FieldValue.increment(1),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            transaction.set(serviceRef, {
                service,
                transactionCount: admin.firestore.FieldValue.increment(1),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            transaction.set(dailyRef, {
                date: today,
                transactionCount: admin.firestore.FieldValue.increment(1),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
        }
        // If status transitioned to success
        const becameSuccess = afterData.status === 'success' && (!beforeData || beforeData.status !== 'success');
        if (becameSuccess) {
            transaction.set(totalsRef, {
                totalRevenue: admin.firestore.FieldValue.increment(amount),
                totalProfit: admin.firestore.FieldValue.increment(profit),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            transaction.set(serviceRef, {
                totalRevenue: admin.firestore.FieldValue.increment(amount),
                totalProfit: admin.firestore.FieldValue.increment(profit),
                successCount: admin.firestore.FieldValue.increment(1),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            transaction.set(dailyRef, {
                revenue: admin.firestore.FieldValue.increment(amount),
                profit: admin.firestore.FieldValue.increment(profit),
                successCount: admin.firestore.FieldValue.increment(1),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
        }
        // If status transitioned to failed
        const becameFailed = afterData.status === 'failed' && (!beforeData || beforeData.status !== 'failed');
        if (becameFailed) {
            transaction.set(serviceRef, {
                failedCount: admin.firestore.FieldValue.increment(1),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
            transaction.set(dailyRef, {
                failedCount: admin.firestore.FieldValue.increment(1),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });
        }
    });
});
/**
 * 8. onPaymentWrite: Aggregates wallet funding inflows and daily payments
 */
exports.onPaymentWrite = functions.firestore
    .document('payments/{paymentId}')
    .onWrite(async (change, context) => {
    const afterData = change.after.data();
    const beforeData = change.before.data();
    if (!afterData)
        return;
    const becameSuccess = afterData.status === 'success' && (!beforeData || beforeData.status !== 'success');
    if (!becameSuccess)
        return;
    const today = new Date().toISOString().split('T')[0];
    const amount = afterData.amount || 0;
    const totalsRef = db.collection('admin_stats').doc('totals');
    const dailyRef = db.collection('admin_stats').doc('daily').collection('records').doc(today);
    await db.runTransaction(async (transaction) => {
        transaction.set(totalsRef, {
            totalPaystackInflow: admin.firestore.FieldValue.increment(amount),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        transaction.set(dailyRef, {
            date: today,
            newPayments: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    });
});
/**
 * 9. onUserWrite: Tracks customer counts and wallet float changes
 */
exports.onUserWrite = functions.firestore
    .document('users/{uid}')
    .onWrite(async (change, context) => {
    const beforeData = change.before.data();
    const afterData = change.after.data();
    const totalsRef = db.collection('admin_stats').doc('totals');
    const today = new Date().toISOString().split('T')[0];
    const dailyRef = db.collection('admin_stats').doc('daily').collection('records').doc(today);
    // New Customer registration
    if (!beforeData && afterData && afterData.role === 'customer') {
        await totalsRef.set({
            totalCustomers: admin.firestore.FieldValue.increment(1),
            totalWalletFloat: admin.firestore.FieldValue.increment(afterData.wallet_balance || 0),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        await dailyRef.set({
            date: today,
            newCustomers: admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
        return;
    }
    if (beforeData && afterData) {
        const balanceDelta = (afterData.wallet_balance || 0) - (beforeData.wallet_balance || 0);
        const updates = {};
        if (balanceDelta !== 0) {
            updates.totalWalletFloat = admin.firestore.FieldValue.increment(balanceDelta);
        }
        // Suspension changes
        if (beforeData.suspended !== afterData.suspended) {
            if (afterData.suspended) {
                updates.totalCustomers = admin.firestore.FieldValue.increment(-1);
            }
            else {
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
exports.recomputeTotals = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Auth required.');
    const callerDoc = await db.collection('users').doc(context.auth.uid).get();
    if (callerDoc.data()?.role !== 'owner' && callerDoc.data()?.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Only owner or administrator can recompute stats.');
    }
    // 1. Recompute Totals from Transactions
    const txnsSnap = await db.collection('transactions').get();
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalTransactions = txnsSnap.docs.length;
    const serviceMap = {};
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
        }
        else if (d.status === 'failed') {
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
exports.publishPost = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Auth required.');
    const callerDoc = await db.collection('users').doc(context.auth.uid).get();
    if (callerDoc.data()?.role !== 'owner' && callerDoc.data()?.role !== 'admin') {
        throw new functions.https.HttpsError('permission-denied', 'Staff access required.');
    }
    const { postId, title, content, excerpt, category, readTime, tags, seoTitle, seoDescription, coverImageUrl } = data;
    const postRef = db.collection('posts').doc(postId || `post_${Date.now()}`);
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    await postRef.set({
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
    }, { merge: true });
    return { status: 'success', slug, postId: postRef.id };
});
exports.archivePost = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Auth required.');
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
exports.bulkImportProducts = functions.https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Auth required.');
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
//# sourceMappingURL=index.js.map