/**
 * Sayyada Datasub — User Profile Initialization Cloud Function
 * Enforces zero-balance fresh-state initialization for all new customer signups.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

exports.ensureUserProfile = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Login required");
  }

  const uid = context.auth.uid;
  const token = context.auth.token || {};
  const userRef = db.doc(`users/${uid}`);
  const userSnap = await userRef.get();

  if (userSnap.exists) {
    const existing = userSnap.data();
    return {
      created: false,
      role: existing.role || "customer",
      walletBalance: existing.wallet_balance ?? 0,
    };
  }

  // Create fresh profile with strictly 0 balance and customer role
  const profile = {
    uid,
    email: token.email || null,
    emailVerified: token.email_verified === true,
    displayName: token.name || (token.email ? token.email.split("@")[0] : "Customer"),
    photoURL: token.picture || null,
    phone: token.phone_number || null,
    role: "customer",          // NEVER "admin"
    kycTier: 1,                // start at Tier 1
    tier: 1,
    kyc_status: "unverified",
    walletBalance: 0,          // MUST BE 0, not 5000 or any positive number
    wallet_balance: 0,
    ledger_balance: 0,
    suspended: false,
    authProvider: token.firebase?.sign_in_provider || "password",
    subscription: null,        // explicit null, not undefined
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  await userRef.set(profile);

  // Initialize atomic wallet document with 0 balance
  await db.doc(`wallets/${uid}`).set({
    balance: 0,
    ledger_balance: 0,
    last_updated: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    created: true,
    role: "customer",
    walletBalance: 0,
  };
});
