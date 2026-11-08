import { NetworkProvider } from '../types';

/**
 * Formats kobo amount to Nigerian Naira (₦).
 * 100 kobo = ₦1.00
 */
export function formatKoboToNgn(kobo: number, showKobo = true): string {
  const ngn = (kobo || 0) / 100;
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: showKobo ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(ngn);
}

export const formatNgnFromKobo = formatKoboToNgn;

/**
 * Formats raw Naira amount.
 */
export function formatNgn(amount: number, showDecimals = true): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

/**
 * Formats ISO date into Nigerian WAT (Africa/Lagos) localized string.
 */
export function formatWATDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('en-NG', {
    timeZone: 'Africa/Lagos',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/**
 * Relative time calculation.
 */
export function timeAgo(dateStr: string): string {
  if (!dateStr) return '';
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  if (diffSecs < 60) return `${Math.max(1, diffSecs)}s ago`;
  const diffMins = Math.floor(diffSecs / 60);
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

/**
 * Automatically detects Nigerian mobile network based on prefix.
 */
export function detectNetwork(phone: string): NetworkProvider | null {
  const clean = phone.replace(/\D/g, '');
  const prefix = clean.startsWith('234')
    ? '0' + clean.slice(3, 6)
    : clean.slice(0, 4);

  const mtnPrefixes = ['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906', '0913', '0916'];
  const airtelPrefixes = ['0802', '0808', '0708', '0812', '0701', '0902', '0901', '0904', '0907', '0912'];
  const gloPrefixes = ['0805', '0807', '0705', '0815', '0811', '0905', '0915'];
  const nineMobilePrefixes = ['0809', '0817', '0818', '0909', '0908'];

  if (mtnPrefixes.includes(prefix)) return 'MTN';
  if (airtelPrefixes.includes(prefix)) return 'Airtel';
  if (gloPrefixes.includes(prefix)) return 'Glo';
  if (nineMobilePrefixes.includes(prefix)) return '9mobile';

  return null;
}

/**
 * Validates Nigerian phone numbers (11 digits e.g. 080..., or +234...).
 */
export function isValidNigerianPhone(phone: string): boolean {
  const clean = phone.replace(/\D/g, '');
  if (clean.length === 11 && clean.startsWith('0')) return true;
  if (clean.length === 13 && clean.startsWith('234')) return true;
  return false;
}

/**
 * Generates an idempotent transaction reference.
 */
export function generateReference(prefix = 'SD_TXN'): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
}
