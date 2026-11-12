"use strict";
/**
 * Sayyada Datasub — Scheduled BigiSub Provider Health Monitor Cron
 * Runs every 15 minutes, pings BigiSub API, updates admin_settings/vtu.lastHealthCheckStatus,
 * and logs failures to admin_stats/provider to monitor service uptime.
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheckCron = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const vtuProvider_1 = require("../vtu/vtuProvider");
const secrets_1 = require("../config/secrets");
const db = admin.firestore();
exports.healthCheckCron = functions
    .runWith({ secrets: [secrets_1.bigisubTokenSecret] })
    .pubsub.schedule('every 15 minutes')
    .onRun(async () => {
    const timestamp = admin.firestore.FieldValue.serverTimestamp();
    try {
        const res = await vtuProvider_1.vtuProvider.healthCheck();
        // 1. Update admin_settings/vtu.lastHealthCheckStatus
        await db.collection('admin_settings').doc('vtu').set({
            activeProvider: 'bigisub',
            lastHealthCheckStatus: res.status, // "ok" or "down"
            lastHealthCheckAt: timestamp,
            lastHealthCheckLatencyMs: res.latencyMs,
        }, { merge: true });
        if (res.status === 'ok') {
            // Record healthy heartbeat in admin_stats/provider
            await db.collection('admin_stats').doc('provider').set({
                provider: 'bigisub',
                status: 'healthy',
                lastSuccessAt: timestamp,
                avgLatencyMs: res.latencyMs,
                updatedAt: timestamp,
            }, { merge: true });
        }
        else {
            // Log failure to admin_stats/provider to monitor service uptime
            await db.collection('admin_stats').doc('provider').set({
                provider: 'bigisub',
                status: 'down',
                failedCount: admin.firestore.FieldValue.increment(1),
                lastFailureAt: timestamp,
                lastFailureReason: res.message || 'Health check handshake returned degraded status',
                updatedAt: timestamp,
            }, { merge: true });
        }
    }
    catch (err) {
        console.error('Scheduled healthCheckCron exception:', err);
        // Record down status in admin_settings/vtu
        await db.collection('admin_settings').doc('vtu').set({
            activeProvider: 'bigisub',
            lastHealthCheckStatus: 'down',
            lastHealthCheckAt: timestamp,
        }, { merge: true });
        // Log failure to admin_stats/provider to monitor service uptime
        await db.collection('admin_stats').doc('provider').set({
            provider: 'bigisub',
            status: 'down',
            failedCount: admin.firestore.FieldValue.increment(1),
            lastFailureAt: timestamp,
            lastFailureReason: err?.message || 'BigiSub API ping failed or timed out',
            updatedAt: timestamp,
        }, { merge: true });
    }
});
//# sourceMappingURL=healthCheckCron.js.map