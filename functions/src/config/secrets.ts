/**
 * Sayyada Datasub — Firebase Secret Manager Configuration
 * Ensures provider credentials are read strictly server-side and never exposed to the client.
 */

import { defineSecret } from 'firebase-functions/params';

// Firebase Secret Manager parameter declaration
export const bigisubTokenSecret = defineSecret('BIGISUB_TOKEN');

export const getBigisubToken = (): string => {
  // In Cloud Functions environment, access via defineSecret value() or process.env
  try {
    const val = bigisubTokenSecret.value();
    if (val) return val;
  } catch {
    // Fall back to process.env if outside active Cloud Function lifecycle
  }
  return process.env.BIGISUB_TOKEN || '';
};

export const getBigisubBaseUrl = (): string => {
  return process.env.BIGISUB_BASE_URL || 'https://bigisub.ng/api/v1/';
};

/**
 * Sanitizes headers and payloads to prevent secret leakage in server logs.
 * Never prints authorization headers or tokens.
 */
export const sanitizeLog = (data: any): any => {
  if (!data) return data;
  if (typeof data !== 'object') return data;

  const sanitized = Array.isArray(data) ? [...data] : { ...data };
  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('token') ||
      lowerKey.includes('authorization') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('key') ||
      lowerKey.includes('password')
    ) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeLog(sanitized[key]);
    }
  }
  return sanitized;
};
