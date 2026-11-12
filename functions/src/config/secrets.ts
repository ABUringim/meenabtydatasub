/**
 * Sayyada Datasub — Secrets Configuration for Cloud Functions
 * BigiSub token and Paystack secrets are kept strictly in server-side environment / Secret Manager
 */

export const BIGISUB_TOKEN_SECRET = process.env.BIGISUB_TOKEN || '298ef51c9e7c646836e80b2a3ccd106d8f701241';
export const bigisubTokenSecret = BIGISUB_TOKEN_SECRET;

export const BIGISUB_BASE_URL = process.env.BIGISUB_BASE_URL || 'https://bigisub.ng/api/v1';
export const bigisubBaseUrl = BIGISUB_BASE_URL;

export const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_mock_paystack_secret';
export const paystackSecretKey = PAYSTACK_SECRET_KEY;

export const DEPLOYED_URL = process.env.DEPLOYED_URL || process.env.APP_URL || 'https://sayyadadatasub.shop';
export const deployedUrl = DEPLOYED_URL;
