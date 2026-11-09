/**
 * BigiSub Error Mapping & Normalization
 * Translates HTTP status codes and BigiSub error responses into safe, customer-friendly messages.
 */

export function mapBigiSubError(err: any): string {
  if (!err) return 'Upstream telecom gateway could not process transaction.';

  const data = err.response?.data || err;

  if (typeof data === 'string') {
    if (data.includes('balance') || data.includes('insufficient')) {
      return 'Telecommunications pool temporarily depleted. Please retry shortly.';
    }
    return data;
  }

  if (data?.detail) {
    if (data.detail.toLowerCase().includes('token') || data.detail.toLowerCase().includes('credential')) {
      return 'Gateway authentication error with operator core.';
    }
    return data.detail;
  }

  if (data?.message) return data.message;
  if (data?.error) return data.error;
  if (data?.msg) return data.msg;

  if (err.message) {
    if (err.message.includes('timeout') || err.message.includes('ECONNRESET')) {
      return 'Telecommunications provider timeout. Your wallet has been automatically refunded.';
    }
    return err.message;
  }

  return 'Upstream telecom gateway returned an unhandled error state.';
}
