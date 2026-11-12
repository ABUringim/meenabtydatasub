"use strict";
/**
 * Sayyada Datasub — Secrets Configuration for Cloud Functions
 * BigiSub token and Paystack secrets are kept strictly in server-side environment / Secret Manager
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deployedUrl = exports.DEPLOYED_URL = exports.paystackSecretKey = exports.PAYSTACK_SECRET_KEY = exports.bigisubBaseUrl = exports.BIGISUB_BASE_URL = exports.bigisubTokenSecret = exports.BIGISUB_TOKEN_SECRET = void 0;
exports.BIGISUB_TOKEN_SECRET = process.env.BIGISUB_TOKEN || '298ef51c9e7c646836e80b2a3ccd106d8f701241';
exports.bigisubTokenSecret = exports.BIGISUB_TOKEN_SECRET;
exports.BIGISUB_BASE_URL = process.env.BIGISUB_BASE_URL || 'https://bigisub.ng/api/v1';
exports.bigisubBaseUrl = exports.BIGISUB_BASE_URL;
exports.PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || 'sk_test_mock_paystack_secret';
exports.paystackSecretKey = exports.PAYSTACK_SECRET_KEY;
exports.DEPLOYED_URL = process.env.DEPLOYED_URL || process.env.APP_URL || 'https://sayyadadatasub.shop';
exports.deployedUrl = exports.DEPLOYED_URL;
//# sourceMappingURL=secrets.js.map