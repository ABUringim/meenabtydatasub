/**
 * Sayyada Datasub — BigiSub Provider Plan Code Map (STATIC)
 * ─────────────────────────────────────────────────────────
 * Purpose: fail-fast safety check before vending.
 * Firestore `products.provider_plan_code` remains the source of truth.
 * This map is a canary that catches admin misconfiguration.
 *
 * If a product's Firestore `provider_plan_code` does NOT match
 * its entry here, `purchaseService` refunds the wallet and
 * logs a high-severity event — the wrong plan is NEVER vended.
 *
 * When adding or editing a product:
 *   1. Update Firestore `products/{id}.provider_plan_code` (admin panel)
 *   2. Update this map (code commit + review)
 *   3. Deploy both — never deploy one without the other
 *
 * Server-side only — never import from client code.
 */

export const PLAN_CODE_MAP = {
  // ─── DATA PLANS ───────────────────────────────────
  "mtn-1gb-sme-30d": "MTN-1GB-SME-30D",
  "mtn-2gb-sme-30d": "MTN-2GB-SME-30D",
  "airtel-1gb-sme-30d": "AIRTEL-1GB-SME-30D",
  "glo-1gb-sme-30d": "GLO-1GB-SME-30D",
  "9mobile-1gb-sme-30d": "9MOBILE-1GB-SME-30D",

  // Synced BigiSub catalog identifiers
  "bigi-mtn-sme-500mb": "1",
  "bigi-mtn-sme-1gb": "2",
  "bigi-mtn-sme-2gb": "3",
  "bigi-mtn-sme-3gb": "4",
  "bigi-mtn-sme-5gb": "5",
  "bigi-glo-1gb": "10",
  "bigi-airtel-1gb": "20",
  "bigi-9mobile-1gb": "30",

  // ─── TV PLANS ─────────────────────────────────────
  "dstv-compact": "DSTV-COMPACT",
  "dstv-premium": "DSTV-PREMIUM",
  "gotv-max": "GOTV-MAX",
  "startimes-nova": "STARTIMES-NOVA",

  // ─── ELECTRICITY (validation-only, no plan code) ──
  // Electricity is a variable-amount service; the plan code
  // here is the DisCo identifier, not a fixed-amount plan.
  "ikeja-electric-prepaid": "IKEJA-ELECTRIC",
  "ikeja-electric-postpaid": "IKEJA-ELECTRIC",
  "eko-electric-prepaid": "EKO-ELECTRIC",
  "eko-electric-postpaid": "EKO-ELECTRIC",

  // ─── AIRTIME (network identifier) ────────────────
  "mtn-airtime": "MTN",
  "airtel-airtime": "AIRTEL",
  "glo-airtime": "GLO",
  "9mobile-airtime": "9MOBILE",

  // ─── EXAM PINS ────────────────────────────────────
  "waec-result-checker": "WAEC-RESULT",
  "neco-result-checker": "NECO-RESULT",
  "jamb-pin": "JAMB-UTME",
  "nabteb-pin": "NABTEB",
};

// CommonJS compatibility export for environments using require()
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PLAN_CODE_MAP };
}

export default PLAN_CODE_MAP;
