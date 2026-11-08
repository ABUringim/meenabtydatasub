/**
 * Sayyada Datasub — Secret Manager Configuration
 * Ensures provider credentials are read strictly server-side and never exposed to the client.
 */

// In production Firebase Cloud Functions, secrets can be defined using defineSecret
// or injected via environment / Google Secret Manager.
const FALLBACK_TOKEN = '298ef51c9e7c646836e80b2a3ccd106d8f701241';

export const getBigisubToken = (): string => {
  return process.env.BIGISUB_TOKEN || FALLBACK_TOKEN;
};

export const getBigisubBaseUrl = (): string => {
  return process.env.BIGISUB_BASE_URL || 'https://bigisub.ng/api/v1/';
};

/**
 * Sanitizes headers and payloads to prevent secret leakage in server logs.
 */
export const sanitizeLog = (data: any): any => {
  if (!data) return data;
  if (typeof data !== 'object') return data;

  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('token') || lowerKey.includes('authorization') || lowerKey.includes('secret') || lowerKey.includes('key')) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeLog(sanitized[key]);
    }
  }
  return sanitized;
};
