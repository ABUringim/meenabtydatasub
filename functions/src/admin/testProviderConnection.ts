/**
 * Sayyada Datasub — Admin Test Provider Connection Callable
 * Tests connectivity and handshake with BigiSub API without placing orders.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { vtuProvider } from '../vtu/vtuProvider';
import { bigisubTokenSecret } from '../config/secrets';

const db = admin.firestore();

export const testProviderConnection = functions
  .runWith({ secrets: [bigisubTokenSecret] })
  .https.onCall(async (_data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Admin auth required.');

    const adminDoc = await db.collection('admins').doc(context.auth.uid).get();
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    const role = userDoc.data()?.role;
    if (!adminDoc.exists && role !== 'admin' && role !== 'owner') {
      throw new functions.https.HttpsError('permission-denied', 'Staff access required.');
    }

    const result = await vtuProvider.healthCheck();

    // Log diagnostic outcome in admin_settings/vtu
    await db.collection('admin_settings').doc('vtu').set(
      {
        activeProvider: 'bigisub',
        bigisubBaseUrl: 'https://bigisub.ng/api/v1/',
        bigisubTokenSecretName: 'BIGISUB_TOKEN',
        bigisubEnabled: true,
        lastHealthCheckAt: admin.firestore.FieldValue.serverTimestamp(),
        lastHealthCheckStatus: result.status,
        latencyMs: result.latencyMs,
      },
      { merge: true }
    );

    return result;
  });
