/**
 * Sayyada Datasub — Bulk Requery Stuck Transactions Callable
 * Scans transactions stuck in 'processing' for > 5 minutes and resolves them.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { vtuProvider } from '../vtu/vtuProvider';
import { bigisubTokenSecret } from '../config/secrets';

const db = admin.firestore();

export const bulkRequeryStuck = functions
  .runWith({ secrets: [bigisubTokenSecret] })
  .https.onCall(async (_data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Admin auth required.');

    const callerDoc = await db.collection('users').doc(context.auth.uid).get();
    if (callerDoc.data()?.role !== 'owner' && callerDoc.data()?.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Staff access required.');
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
    const snap = await db
      .collection('transactions')
      .where('status', '==', 'processing')
      .where('created_at', '<=', fiveMinutesAgo)
      .limit(25)
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
            provider_raw_response: res.rawResponse,
          });
          resolved++;
        }
      } catch {
        // Continue loop on individual failures
      }
    }

    return { scanned: snap.docs.length, resolved };
  });
