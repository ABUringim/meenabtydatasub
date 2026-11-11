import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { useServicesAvailability } from './useServicesAvailability';
import { SERVICE_KYC_TIER } from '../config/serviceKycTiers';

/**
 * Entitlement Gate Enum:
 * - 'unauthenticated': User is not logged in
 * - 'suspended': User account is suspended
 * - 'unavailable': Service or product is deactivated/disabled
 * - 'kyc_required': User does not meet required KYC tier for this service
 * - 'insufficient_balance': User wallet balance is lower than product price
 * - 'ready': All gates passed, ready to purchase
 */

/**
 * useAccess Hook — Determines whether a customer is entitled to purchase a product.
 * Evaluates the three primary gates + authentication + wallet balance:
 * 1. Authentication check
 * 2. Suspension gate (users/{uid}.suspended === true)
 * 3. Service availability gate (admin_settings/services.{service}.enabled === false OR product.active === false)
 * 4. KYC tier gate (users/{uid}.kycTier < product.requiredKycTier || SERVICE_KYC_TIER[product.service])
 * 5. Wallet balance gate (walletBalance < product.selling_price)
 * 6. Ready
 *
 * @param {Object} [product]
 * @returns {{
 *   gate: 'unauthenticated' | 'suspended' | 'unavailable' | 'kyc_required' | 'insufficient_balance' | 'ready',
 *   allowed: boolean,
 *   reason: string | null,
 *   requiresAuth: boolean,
 *   requiresVerification: boolean,
 *   requiresTopUp: boolean,
 *   shortfall: number,
 *   requiredTier: number,
 *   currentTier: number,
 * }}
 */
export function useAccess(product = {}) {
  const auth = useAuth();
  const wallet = useWallet();
  const { isServiceEnabled } = useServicesAvailability();

  // 1. Resolve User Authentication
  const user = auth?.user ?? null;
  const isAuth = Boolean(user || auth?.firebaseUser);

  if (!isAuth) {
    return {
      gate: 'unauthenticated',
      allowed: false,
      reason: 'Sign in to purchase services.',
      requiresAuth: true,
      requiresVerification: false,
      requiresTopUp: false,
      shortfall: 0,
      requiredTier: 1,
      currentTier: 0,
    };
  }

  // 2. Suspension Gate
  const isSuspended = Boolean(auth?.suspended ?? user?.suspended);
  if (isSuspended) {
    return {
      gate: 'suspended',
      allowed: false,
      reason: 'Account suspended. Contact support at support@sayyadadatasub.shop',
      requiresAuth: false,
      requiresVerification: false,
      requiresTopUp: false,
      shortfall: 0,
      requiredTier: 1,
      currentTier: user?.tier || 1,
    };
  }

  // 3. Service Availability Gate
  const serviceKey = (product?.service || '').toLowerCase();
  const serviceActive = serviceKey ? isServiceEnabled(serviceKey) : true;
  const productActive = product?.active !== false;

  if (!serviceActive || !productActive) {
    return {
      gate: 'unavailable',
      allowed: false,
      reason: 'This service or plan is temporarily unavailable.',
      requiresAuth: false,
      requiresVerification: false,
      requiresTopUp: false,
      shortfall: 0,
      requiredTier: 1,
      currentTier: user?.tier || 1,
    };
  }

  // 4. KYC Tier Gate
  const userTier = auth?.kycTier ?? user?.tier ?? 1;
  const requiredTier =
    product?.requiredKycTier ??
    (serviceKey && SERVICE_KYC_TIER[serviceKey] ? SERVICE_KYC_TIER[serviceKey] : 1);

  if (userTier < requiredTier) {
    return {
      gate: 'kyc_required',
      allowed: false,
      reason: `This service requires Tier ${requiredTier} verification.`,
      requiresAuth: false,
      requiresVerification: true,
      requiresTopUp: false,
      shortfall: 0,
      requiredTier,
      currentTier: userTier,
    };
  }

  // 5. Wallet Balance Gate
  // Sayyada Datasub stores balances and product selling prices in kobo
  const currentBalanceKobo = wallet?.balanceKobo ?? auth?.walletBalance ?? user?.wallet_balance ?? 0;
  const priceKobo = product?.selling_price ?? product?.priceKobo ?? 0;

  if (currentBalanceKobo < priceKobo) {
    const deficitKobo = Math.max(0, priceKobo - currentBalanceKobo);
    // Convert to Naira (rounded up to nearest Naira, minimum ₦100)
    const shortfallNaira = Math.max(100, Math.ceil(deficitKobo / 100));

    return {
      gate: 'insufficient_balance',
      allowed: false,
      reason: `Insufficient balance. Top up ₦${shortfallNaira.toLocaleString()} to complete this purchase.`,
      requiresAuth: false,
      requiresVerification: false,
      requiresTopUp: true,
      shortfall: shortfallNaira,
      requiredTier,
      currentTier: userTier,
    };
  }

  // 6. All Gates Passed
  return {
    gate: 'ready',
    allowed: true,
    reason: null,
    requiresAuth: false,
    requiresVerification: false,
    requiresTopUp: false,
    shortfall: 0,
    requiredTier,
    currentTier: userTier,
  };
}

export default useAccess;
