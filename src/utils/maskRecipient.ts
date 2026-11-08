/**
 * Formats recipient information safely by masking sensitive parts
 * e.g., '08031234567' -> '0803***4567'
 * e.g., '10293847561' -> '1029***7561'
 * e.g., 'aburingim1997@gmail.com' -> 'abu***@gmail.com'
 */
export function maskRecipient(value?: string | number): string {
  if (!value) return '—';
  const str = String(value).trim();

  // If email
  if (str.includes('@')) {
    const [local, domain] = str.split('@');
    if (local.length <= 3) {
      return `${local[0]}***@${domain}`;
    }
    return `${local.slice(0, 3)}***@${domain}`;
  }

  // If phone, meter, or smartcard number (digits)
  const clean = str.replace(/\s+/g, '');
  if (clean.length >= 8) {
    const start = clean.slice(0, 4);
    const end = clean.slice(-4);
    return `${start}***${end}`;
  }

  if (clean.length >= 6) {
    return `${clean.slice(0, 2)}***${clean.slice(-2)}`;
  }

  return clean;
}
