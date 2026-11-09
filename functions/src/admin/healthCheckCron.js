/**
 * Scheduled Cloud Function healthCheckCron (JavaScript)
 * Runs every 15 minutes, pings BigiSub API, updates admin_settings/vtu.lastHealthCheckStatus,
 * and logs failures to admin_stats/provider to monitor service uptime.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { vtuProvider } = require('../vtu/vtuProvider');
const { bigisubTokenSecret } = require('../config/secrets');

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

exports.healthCheckCron = functions
  .runWith({ secrets: [bigisubTokenSecret] })
  .pubsub.schedule('every 15 minutes')
  .onRun(async () => {
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    try {
      const res = await vtuProvider.healthCheck();

      // Update admin_settings/vtu.lastHealthCheckStatus
      await db.collection('admin_settings').doc('vtu').set(
        {
          activeProvider: 'bigisub',
          lastHealthCheckStatus: res.status, // "ok" or "down"
          lastHealthCheckAt: timestamp,
          lastHealthCheckLatencyMs: res.latencyMs,
        },
        { merge: true }
      );

      if (res.status === 'ok') {
        // Record healthy heartbeat in admin_stats/provider
        await db.collection('admin_stats').doc('provider').set(
          {
            provider: 'bigisub',
            status: 'healthy',
            lastSuccessAt: timestamp,
            avgLatencyMs: res.latencyMs,
            updatedAt: timestamp,
          },
          { merge: true }
        );
      } else {
        // Log failure to admin_stats/provider to monitor service uptime
        await db.collection('admin_stats').doc('provider').set(
          {
            provider: 'bigisub',
            status: 'down',
            failedCount: admin.firestore.FieldValue.increment(1),
            lastFailureAt: timestamp,
            lastFailureReason: res.message || 'Health check handshake returned degraded status',
            updatedAt: timestamp,
          },
          { merge: true }
        );
      }
    } catch (err) {
      console.error('Scheduled healthCheckCron exception:', err);

      // Record down status in admin_settings/vtu
      await db.collection('admin_settings').doc('vtu').set(
        {
          activeProvider: 'bigisub',
          lastHealthCheckStatus: 'down',
          lastHealthCheckAt: timestamp,
        },
        { merge: true }
      );

      // Log failure to admin_stats/provider to monitor service uptime
      await db.collection('admin_stats').doc('provider').set(
        {
          provider: 'bigisub',
          status: 'down',
          failedCount: admin.firestore.FieldValue.increment(1),
          lastFailureAt: timestamp,
          lastFailureReason: err ? err.message : 'BigiSub API ping failed or timed out',
          updatedAt: timestamp,
        },
        { merge: true }
      );
    }
  });
