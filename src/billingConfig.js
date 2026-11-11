/**
 * Sayyada Datasub — Central Billing Configuration
 * ─────────────────────────────────────────────────
 * Single source of truth for deployed URL, routing mode,
 * and wallet-funding callback URLs.
 *
 * Model: WALLET-ONLY (one_time)
 *   - Customers top up their wallet via Paystack
 *   - Purchases (airtime, data, TV, electricity, exam, etc.)
 *     are paid from wallet balance — pay-per-use
 *   - No subscription tier. No premium plan. No auto-renewal.
 *
 * Rules for this file:
 *   - No imports (plain config only)
 *   - No side effects (no fetch, no Firebase, no Paystack SDK)
 *   - No per-service prices here (those live in Firestore `products`)
 *   - Safe to import from both client and SSR/Node contexts
 *
 * Changing the domain: update DEPLOYED_URL only — all URL
 * helpers regenerate correctly.
 */

// Billing model
export const MODEL_TYPE = "one_time";
export const DEPLOYED_URL = "https://sayyadadatasub.shop";

// Routing
export const IS_HASH_ROUTING =
  typeof window !== "undefined" &&
  window.location.hash.startsWith("#/");

// URL helpers (pure functions, no args)
export function successUrl() {
  const isHash =
    typeof window !== "undefined"
      ? window.location.hash.startsWith("#/")
      : IS_HASH_ROUTING;
  return isHash ? `${DEPLOYED_URL}/#/success` : `${DEPLOYED_URL}/success`;
}

export function cancelUrl() {
  const isHash =
    typeof window !== "undefined"
      ? window.location.hash.startsWith("#/")
      : IS_HASH_ROUTING;
  return isHash ? `${DEPLOYED_URL}/#/failure` : `${DEPLOYED_URL}/failure`;
}

export function dashboardUrl() {
  const isHash =
    typeof window !== "undefined"
      ? window.location.hash.startsWith("#/")
      : IS_HASH_ROUTING;
  return isHash ? `${DEPLOYED_URL}/#/dashboard` : `${DEPLOYED_URL}/dashboard`;
}

export function walletFundingUrl() {
  const isHash =
    typeof window !== "undefined"
      ? window.location.hash.startsWith("#/")
      : IS_HASH_ROUTING;
  return isHash ? `${DEPLOYED_URL}/#/wallet/fund` : `${DEPLOYED_URL}/wallet/fund`;
}
