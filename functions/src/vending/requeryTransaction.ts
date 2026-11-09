/**
 * Sayyada Datasub — Requery Transaction Cloud Function
 * Checks status directly from BigiSub using tran_id / request_id before resolving or refunding.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { vtuProvider } from '../vtu/vtuProvider';
import { bigisubTokenSecret } from '../config/secrets';

const db = admin.firestore();

export const requeryTransaction = functions
  .runWith({ secrets: [bigisubTokenSecret] })
  .https.onCall(async (data, context) => {
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
        provider_last_requery_at: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return vtuResult;
  });
