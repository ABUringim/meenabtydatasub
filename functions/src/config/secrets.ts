/**
 * Sayyada Datasub — Secrets Configuration for Cloud Functions
 * BigiSub token is kept strictly in server-side environment / Secret Manager
 */

export const BIGISUB_TOKEN_SECRET = process.env.BIGISUB_TOKEN || '298ef51c9e7c646836e80b2a3ccd106d8f701241';
export const BIGISUB_BASE_URL = process.env.BIGISUB_BASE_URL || 'https://bigisub.ng/api/v1';
export const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_mock_paystack_secret';
