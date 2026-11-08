/**
 * BigiSub Error Mapping Engine
 * Translates upstream API error states and HTTP response codes into user-friendly, safe messages.
 * Never exposes raw internal errors to customers.
 */

export interface BigisubMappedError {
  customerMessage: string;
  internalCode: string;
  shouldRefund: boolean;
  shouldRetry: boolean;
  alertOwner: boolean;
  rawError?: any;
}

export const mapBigisubError = (error: any): BigisubMappedError => {
  const status = error?.response?.status;
  const data = error?.response?.data || error?.data || {};
  const rawMsg = (
    data.detail ||
    data.response ||
    data.message ||
    data.error ||
    error.message ||
    ''
  ).toLowerCase();

  // 1. HTTP 401 / 403: Authentication failure (token invalid or revoked)
  if (status === 401 || status === 403) {
    return {
      customerMessage: 'Service is temporarily unavailable. Please try again later.',
      internalCode: 'BIGISUB_AUTH_FAILURE',
      shouldRefund: true,
      shouldRetry: false,
      alertOwner: true,
      rawError: rawMsg,
    };
  }

  // 2. HTTP 429: Upstream rate limit
  if (status === 429) {
    return {
      customerMessage: 'Too many requests — please try again in a moment.',
      internalCode: 'BIGISUB_RATE_LIMITED',
      shouldRefund: false,
      shouldRetry: true,
      alertOwner: false,
      rawError: rawMsg,
    };
  }

  // 3. HTTP 5xx: Upstream server crash
  if (status && status >= 500) {
    return {
      customerMessage: 'Service is temporarily unavailable. Please try again later.',
      internalCode: 'BIGISUB_UPSTREAM_5XX',
      shouldRefund: false, // leave processing for requery before blind refund
      shouldRetry: false,
      alertOwner: false,
      rawError: rawMsg,
    };
  }

  // 4. Client timeout or network breakdown
  if (error.code === 'ECONNABORTED' || rawMsg.includes('timeout')) {
    return {
      customerMessage: "Your purchase is processing. We'll notify you shortly.",
      internalCode: 'BIGISUB_TIMEOUT',
      shouldRefund: false, // wait for requery
      shouldRetry: false,
      alertOwner: false,
      rawError: rawMsg,
    };
  }

  // 5. Explicit "failed" payloads from BigiSub
  if (rawMsg.includes('balance') || rawMsg.includes('insufficient')) {
    return {
      customerMessage: 'Service is temporarily unavailable. Please try again later.',
      internalCode: 'BIGISUB_INSUFFICIENT_AGGREGATOR_BALANCE',
      shouldRefund: true,
      shouldRetry: false,
      alertOwner: true,
      rawError: rawMsg,
    };
  }

  if (rawMsg.includes('phone') || rawMsg.includes('invalid number') || rawMsg.includes('recipient')) {
    return {
      customerMessage: 'Please check the phone number and try again.',
      internalCode: 'BIGISUB_INVALID_PHONE',
      shouldRefund: true,
      shouldRetry: false,
      alertOwner: false,
      rawError: rawMsg,
    };
  }

  if (rawMsg.includes('meter') || rawMsg.includes('iuc') || rawMsg.includes('smartcard')) {
    return {
      customerMessage: "We couldn't validate that meter/smartcard. Please check the number.",
      internalCode: 'BIGISUB_INVALID_METER_OR_IUC',
      shouldRefund: true,
      shouldRetry: false,
      alertOwner: false,
      rawError: rawMsg,
    };
  }

  // Default network / unexpected error fallback
  return {
    customerMessage: 'Network issue — your wallet has been refunded.',
    internalCode: 'BIGISUB_GENERIC_FAILURE',
    shouldRefund: true,
    shouldRetry: false,
    alertOwner: false,
    rawError: rawMsg,
  };
};
