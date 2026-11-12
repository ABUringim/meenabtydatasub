"use strict";
/**
 * Sayyada Datasub — Requery Transaction Cloud Function
 * Checks status directly from BigiSub using tran_id / request_id before resolving or refunding.
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
exports.requeryTransaction = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const vtuProvider_1 = require("../vtu/vtuProvider");
const secrets_1 = require("../config/secrets");
const db = admin.firestore();
exports.requeryTransaction = functions
    .runWith({ secrets: [secrets_1.bigisubTokenSecret] })
    .https.onCall(async (data, context) => {
    if (!context.auth)
        throw new functions.https.HttpsError('unauthenticated', 'Auth required.');
    const { transactionRef } = data;
    const txnDoc = await db.collection('transactions').doc(transactionRef).get();
    if (!txnDoc.exists)
        throw new functions.https.HttpsError('not-found', 'Transaction not found.');
    const txn = txnDoc.data();
    const vtuResult = await vtuProvider_1.vtuProvider.requery({
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
//# sourceMappingURL=requeryTransaction.js.map