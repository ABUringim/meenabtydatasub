/**
 * Sayyada Datasub — Admin Delete / Deactivate Product Cloud Function
 * Handles soft deactivation and hard deletion of catalog products
 * with static plan-code map drift detection and audit logging.
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { PLAN_CODE_MAP } = require("../vtu/planCodeMap");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

exports.adminDeleteProduct = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }

  // Verify caller is admin or owner
  const callerDoc = await db.collection("users").doc(context.auth.uid).get();
  const callerData = callerDoc.data();
  if (callerData?.role !== "admin" && callerData?.role !== "owner") {
    throw new functions.https.HttpsError("permission-denied", "Staff access required to manage products.");
  }

  const { productId, hard = false } = data;
  if (!productId) {
    throw new functions.https.HttpsError("invalid-argument", "Product ID is required.");
  }

  const productRef = db.collection("products").doc(productId);
  const productDoc = await productRef.get();

  if (!productDoc.exists) {
    throw new functions.https.HttpsError("not-found", `Product '${productId}' not found.`);
  }

  const product = productDoc.data();

  // Before deactivating, warn if the product is still in the static map
  if (!hard && PLAN_CODE_MAP[productId]) {
    // Allow, but log a warning so admins know to remove from the map too
    await db.collection("admin_activity").add({
      actorId: context.auth.uid,
      actorName: callerData.displayName || callerData.name || callerData.email || "Admin",
      action: "deactivate_product_still_in_map",
      target: `products/${productId}`,
      before: { provider_plan_code: product.provider_plan_code },
      after: { active: false },
      severity: "medium",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  if (hard) {
    // Only owner can hard delete
    if (callerData.role !== "owner") {
      throw new functions.https.HttpsError("permission-denied", "Only platform owner can permanently delete products.");
    }
    await productRef.delete();

    await db.collection("admin_activity").add({
      actorId: context.auth.uid,
      actorName: callerData.displayName || callerData.name || callerData.email || "Owner",
      action: "hard_delete_product",
      target: `products/${productId}`,
      before: product,
      after: null,
      severity: "high",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { status: "success", action: "deleted", productId };
  } else {
    // Soft deactivation
    await productRef.update({
      active: false,
      deactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
      deactivatedBy: context.auth.uid,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection("admin_activity").add({
      actorId: context.auth.uid,
      actorName: callerData.displayName || callerData.name || callerData.email || "Admin",
      action: "deactivate_product",
      target: `products/${productId}`,
      before: { active: product.active },
      after: { active: false },
      severity: "low",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { status: "success", action: "deactivated", productId };
  }
});
