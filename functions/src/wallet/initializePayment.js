const functions = require("firebase-functions");
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

exports.initializePayment = functions
  .runWith({ secrets: ["PAYSTACK_SECRET_KEY"] })
  .https.onCall(async (data, context) => {
    // 1. Auth gate
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Login required");
    }

    // 2. Input validation
    const amount = Number(data?.amount || data?.amountKobo);
    if (!Number.isInteger(amount) || amount < 10_000 || amount > 50_000_000) {
      // min ₦100 = 10000 kobo, max ₦500,000 = 50,000,000 kobo
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Amount must be between ₦100 and ₦500,000"
      );
    }

    // 3. Load user
    const uid = context.auth.uid;
    const userSnap = await db.doc(`users/${uid}`).get();
    if (!userSnap.exists) {
      throw new functions.https.HttpsError("not-found", "User profile not found");
    }
    const user = userSnap.data();

    if (!user.email) {
      throw new functions.https.HttpsError(
        "failed-precondition",
        "Account email required for payment"
      );
    }

    if (user.suspended === true) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "Account suspended"
      );
    }

    // 4. Generate unique reference
    const reference = `SD-${uid.slice(0, 8)}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    // 5. Call Paystack
    const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;
    if (!PAYSTACK_SECRET || !PAYSTACK_SECRET.startsWith("sk_")) {
      console.error("PAYSTACK_SECRET_KEY is missing or invalid");
      throw new functions.https.HttpsError(
        "internal",
        "Payment provider not configured. Please contact support."
      );
    }

    const DEPLOYED_URL =
      process.env.DEPLOYED_URL || "https://sayyadadatasub.com";

    let paystackResponse;
    try {
      const resp = await fetch("https://api.paystack.co/transaction/initialize", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          amount, // in kobo
          reference,
          callback_url: `${DEPLOYED_URL}/success`,
          metadata: {
            type: "wallet_funding",
            uid,
            custom_fields: [
              {
                display_name: "Purpose",
                variable_name: "purpose",
                value: "Wallet top-up",
              },
            ],
          },
        }),
      });
      paystackResponse = await resp.json();
    } catch (err) {
      console.error("Paystack init network error:", err);
      throw new functions.https.HttpsError(
        "unavailable",
        "Payment provider unreachable. Please try again."
      );
    }

    if (!paystackResponse?.status || !paystackResponse?.data?.authorization_url) {
      console.error("Paystack init failed:", paystackResponse);
      throw new functions.https.HttpsError(
        "internal",
        paystackResponse?.message || "Could not initialize payment"
      );
    }

    // 6. Persist pending payment
    await db.collection("payments").doc(reference).set({
      user_id: uid,
      paystack_reference: reference,
      amount,
      status: "pending",
      purpose: "wallet_funding",
      verified: false,
      created_at: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 7. Return the checkout URL
    return {
      authorizationUrl: paystackResponse.data.authorization_url,
      accessCode: paystackResponse.data.access_code,
      reference,
    };
  });
