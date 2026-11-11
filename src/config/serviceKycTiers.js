/**
 * Sayyada Datasub — Service KYC Tier Mapping
 * Defines required verification level per service category.
 * Tier 1: Standard VTU & utility payments (airtime, data, tv, electricity, exam)
 * Tier 2: Higher-risk financial & remittance services (remit, invoice)
 */

export const SERVICE_KYC_TIER = {
  airtime: 1,
  data: 1,
  tv: 1,
  electricity: 1,
  exam: 1,
  remit: 2,       // Requires Tier 2 (Identity verified)
  invoice: 2,     // Requires Tier 2 (Identity verified)
  giftcard: 1,
  transport: 1,
  travel: 1,
};

export default SERVICE_KYC_TIER;
