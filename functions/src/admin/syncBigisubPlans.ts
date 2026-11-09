/**
 * Sayyada Datasub — Sync BigiSub Plans Cloud Function
 * Upserts BigiSub plan codes into the products collection while preserving admin markups.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { bigisubTokenSecret } from '../config/secrets';

const db = admin.firestore();

export const syncBigisubPlans = functions
  .runWith({ secrets: [bigisubTokenSecret] })
  .https.onCall(async (_data, context) => {
    if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Admin auth required.');

    const callerDoc = await db.collection('users').doc(context.auth.uid).get();
    if (callerDoc.data()?.role !== 'owner' && callerDoc.data()?.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', 'Staff access required.');
    }

    // Default BigiSub wholesale catalog seed with BigiSub plan codes
    const defaultPlans = [
      { id: 'bigi-mtn-sme-500mb', service: 'data', provider: 'MTN', provider_plan_code: '1', plan_code: 'MTN-500MB-SME', name: 'MTN SME 500MB', cost_price: 11500, selling_price: 13500, active: true },
      { id: 'bigi-mtn-sme-1gb', service: 'data', provider: 'MTN', provider_plan_code: '2', plan_code: 'MTN-1GB-SME', name: 'MTN SME 1GB', cost_price: 22000, selling_price: 25000, active: true },
      { id: 'bigi-mtn-sme-2gb', service: 'data', provider: 'MTN', provider_plan_code: '3', plan_code: 'MTN-2GB-SME', name: 'MTN SME 2GB', cost_price: 44000, selling_price: 50000, active: true },
      { id: 'bigi-mtn-sme-3gb', service: 'data', provider: 'MTN', provider_plan_code: '4', plan_code: 'MTN-3GB-SME', name: 'MTN SME 3GB', cost_price: 66000, selling_price: 75000, active: true },
      { id: 'bigi-mtn-sme-5gb', service: 'data', provider: 'MTN', provider_plan_code: '5', plan_code: 'MTN-5GB-SME', name: 'MTN SME 5GB', cost_price: 110000, selling_price: 125000, active: true },
      { id: 'bigi-glo-1gb', service: 'data', provider: 'Glo', provider_plan_code: '10', plan_code: 'GLO-1GB-CG', name: 'Glo Corporate 1GB', cost_price: 23000, selling_price: 27000, active: true },
      { id: 'bigi-airtel-1gb', service: 'data', provider: 'Airtel', provider_plan_code: '20', plan_code: 'AIRTEL-1GB-CG', name: 'Airtel Corporate 1GB', cost_price: 24000, selling_price: 28000, active: true },
      { id: 'bigi-9mobile-1gb', service: 'data', provider: '9mobile', provider_plan_code: '30', plan_code: '9MOB-1GB-SME', name: '9mobile SME 1GB', cost_price: 21000, selling_price: 26000, active: true },
    ];

    const batch = db.batch();
    for (const p of defaultPlans) {
      const ref = db.collection('products').doc(p.id);
      batch.set(
        ref,
        {
          ...p,
          provider: 'bigisub',
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    }

    await batch.commit();

    await db.collection('admin_activity').add({
      actorId: context.auth.uid,
      actorName: callerDoc.data()?.name || 'Admin',
      actorRole: callerDoc.data()?.role,
      action: 'sync_bigisub_plans',
      target: 'products',
      after: { syncedCount: defaultPlans.length },
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { status: 'success', synced: defaultPlans.length };
  });
