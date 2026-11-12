"use strict";
/**
 * Sayyada Datasub — Bulk Requery Stuck Transactions Callable
 * Scans transactions stuck in 'processing' for > 5 minutes and resolves them.
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
exports.bulkRequeryStuck = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const vtuProvider_1 = require("../vtu/vtuProvider");
const secrets_1 = require("../config/secrets");
const db = admin.firestore();
exports.bulkRequeryStuck = functions
    .runWith({ secrets: [secrets_1.bigisubTokenSecret] })
    .https.onCall(async (_data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Admin auth required.');
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
            const res = await vtuProvider_1.vtuProvider.requery({
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
        }
        catch {
            // Continue loop on individual failures
        }
    }
    return { scanned: snap.docs.length, resolved };
});
//# sourceMappingURL=bulkRequeryStuck.js.map