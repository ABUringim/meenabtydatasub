import {
  UserProfile,
  Transaction,
  WalletLedgerEntry,
  Beneficiary,
  ProductItem,
  DisputeTicket,
  AuditLog,
  VtuProviderConfig,
  PaystackGatewayConfig,
  PlatformSettings,
  BlogPost,
  NotificationCampaign,
  Role,
  CustomerActivity,
  CustomerReceipt,
  CustomerSpending,
  ServiceCategory,
  AdminTotalsStats,
  AdminServiceStat,
  AdminDailyStat,
  AdminPendingStat,
  AdminActivity,
} from '../types';
import { INITIAL_PRODUCTS, INITIAL_PROVIDERS } from '../data/initialData';

const STORAGE_KEYS = {
  USERS: 'sayyada_users_v2',
  TRANSACTIONS: 'sayyada_transactions_v2',
  LEDGER: 'sayyada_ledger_v2',
  BENEFICIARIES: 'sayyada_beneficiaries_v2',
  ACTIVITY: 'sayyada_activity_v2',
  RECEIPTS: 'sayyada_receipts_v2',
  SPENDING: 'sayyada_spending_v2',
  PRODUCTS: 'sayyada_products_v2',
  DISPUTES: 'sayyada_disputes_v2',
  AUDIT_LOGS: 'sayyada_audit_logs_v2',
  ADMIN_STATS: 'sayyada_admin_stats_v2',
  ADMIN_SERVICES: 'sayyada_admin_services_v2',
  ADMIN_DAILY: 'sayyada_admin_daily_v2',
  ADMIN_ACTIVITY: 'sayyada_admin_activity_v2',
  PROVIDERS: 'sayyada_providers_v2',
  PAYSTACK_CONFIG: 'sayyada_paystack_config_v2',
  SETTINGS: 'sayyada_settings_v2',
  BLOG_POSTS: 'sayyada_blog_posts_v2',
  NOTIFICATIONS: 'sayyada_notifications_v2',
  CURRENT_USER_ID: 'sayyada_current_user_id',
  ADMIN_SESSION_TIMESTAMP: 'sayyada_admin_session_ts',
};

// Initial Owner user
const DEFAULT_OWNER: UserProfile = {
  uid: 'usr_owner_sayyada_01',
  email: 'owner@sayyadadatasub.com',
  phone: '08099887766',
  name: 'Alhaji Sayyada (Platform Owner)',
  tier: 2,
  kyc_status: 'verified',
  role: 'owner',
  wallet_balance: 100000000, // ₦1,000,000.00
  ledger_balance: 100000000,
  hasPin: true,
  twoFactorEnabled: true,
  twoFactorSecret: 'OWNER-2FA-SEC-KEY',
  ip_address: '102.89.44.1 (Kano, NG)',
  last_login: new Date().toISOString(),
  created_at: new Date(Date.now() - 180 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
  suspended: false,
};

// Initial Operations Admin user
const DEFAULT_ADMIN: UserProfile = {
  uid: 'usr_admin_sayyada_01',
  email: 'admin@sayyadadatasub.com',
  phone: '08023456789',
  name: 'Amina Sani (Operations Admin)',
  tier: 2,
  kyc_status: 'verified',
  role: 'admin',
  wallet_balance: 25000000, // ₦250,000.00
  ledger_balance: 25000000,
  hasPin: true,
  twoFactorEnabled: true,
  twoFactorSecret: 'ADMIN-2FA-SEC-KEY',
  ip_address: '102.89.44.12 (Kano, NG)',
  last_login: new Date().toISOString(),
  created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
  suspended: false,
};

// Initial Customer user
const DEFAULT_CUSTOMER: UserProfile = {
  uid: 'usr_customer_sayyada_01',
  email: 'aburingim1997@gmail.com',
  phone: '08145239871',
  name: 'Abubakar Ringim',
  tier: 2,
  kyc_status: 'verified',
  role: 'customer',
  wallet_balance: 4500000, // ₦45,000.00
  ledger_balance: 4500000,
  hasPin: true,
  twoFactorEnabled: false,
  bvn: '22345678901',
  nin: '11223344556',
  virtual_account: {
    bankName: 'Wema Bank (Dedicated)',
    accountNumber: '9928374102',
    accountName: 'SAYYADA-ABUBAKAR RINGIM',
  },
  ip_address: '105.112.48.91 (Lagos, NG)',
  last_login: new Date().toISOString(),
  created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  updated_at: new Date().toISOString(),
  suspended: false,
};

const INITIAL_SETTINGS: PlatformSettings = {
  maintenanceMode: false,
  maintenanceMessage: 'Scheduled server maintenance in progress. Vending will resume shortly.',
  fundingBonusPercent: 0,
  withdrawalFeeNgn: 50,
  allowlistIps: ['102.89.44.1', '102.89.44.12', '127.0.0.1'],
  supportPhone: '+234 814 523 9871',
  supportWhatsApp: '+234 814 523 9871',
  supportEmail: 'support@sayyadadatasub.com',
  currencySymbol: '₦',
  timezone: 'Africa/Lagos (WAT)',
};

const INITIAL_PAYSTACK_CONFIG: PaystackGatewayConfig = {
  publicKeyMasked: 'pk_live_981248921••••••••••••••••39',
  secretKeyMasked: 'sk_live_091823901••••••••••••••••72',
  testMode: false,
  webhookUrl: 'https://api.sayyadadatasub.com/api/v1/paystack-webhook',
  lastWebhookReceivedAt: new Date(Date.now() - 15 * 60000).toISOString(),
  floatAlertThresholdNgn: 500000,
};

const INITIAL_BLOG_POSTS: BlogPost[] = [
  {
    id: 'post_01',
    title: 'How to Save up to 40% on MTN, Airtel & Glo SME Data in Nigeria',
    slug: 'save-on-sme-data-nigeria',
    category: 'Telecom & Data',
    readTime: '4 min read',
    summary: 'Understanding the technical differences between SME Data, Corporate Gifting (CG), and direct retail gifting.',
    content: 'SME data is purchased in bulk by licensed telecom aggregators and provisioned directly into cloud pool allocations...',
    published: true,
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
  {
    id: 'post_02',
    title: 'Prepaid vs Postpaid Meter Tokens: Solving Keypad Error Codes',
    slug: 'prepaid-meter-token-troubleshooting',
    category: 'Electricity Bills',
    readTime: '6 min read',
    summary: 'A comprehensive troubleshooting guide for Nigerian homeowners dealing with IKEDC, KEDCO, and AEDC prepaid meters.',
    content: 'When generating prepaid tokens, DisCos transmit 20-digit STS tokens. If your keypad rejects the token with error code 30...',
    published: true,
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
    updated_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
];

const INITIAL_NOTIFICATIONS: NotificationCampaign[] = [
  {
    id: 'notif_01',
    title: 'Weekend SME Data Flash Discount',
    message: 'MTN 1GB SME Data reduced to ₦270 for all verified users this weekend!',
    type: 'push',
    target: 'all',
    sentAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    recipientCount: 1420,
    status: 'sent',
  },
];

const INITIAL_BENEFICIARIES: Beneficiary[] = [
  {
    id: 'ben_01',
    user_id: DEFAULT_CUSTOMER.uid,
    type: 'phone',
    label: 'My MTN Personal Line',
    value: '08145239871',
    provider: 'MTN',
    meta: { network: 'MTN', planCategory: 'SME' },
    lastUsedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
  },
  {
    id: 'ben_02',
    user_id: DEFAULT_CUSTOMER.uid,
    type: 'meter',
    label: 'Kano Residence Prepaid Meter',
    value: '04182910492',
    provider: 'KEDCO',
    meta: { disco: 'KEDCO (Kano Electric)', meterType: 'prepaid', address: 'Plot 44 Ring Road, Kano' },
    lastUsedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    created_at: new Date(Date.now() - 20 * 86400000).toISOString(),
  },
  {
    id: 'ben_03',
    user_id: DEFAULT_CUSTOMER.uid,
    type: 'smartcard',
    label: 'Living Room DStv Compact Plus',
    value: '1092837461',
    provider: 'DSTV',
    meta: { bouquet: 'DStv Compact Plus', customerName: 'ABUBAKAR RINGIM' },
    lastUsedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'ben_04',
    user_id: DEFAULT_CUSTOMER.uid,
    type: 'bank',
    label: 'Brother Savings Account',
    value: '0123456789',
    provider: 'Guaranty Trust Bank (GTBank)',
    meta: { bankCode: '058', accountName: 'USMAN RINGIM' },
    lastUsedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'txn_init_01',
    user_id: DEFAULT_CUSTOMER.uid,
    service: 'data',
    provider: 'MTN',
    reference: 'SAY_20261108_MTN_9812',
    amount: 58000,
    cost: 52000,
    profit: 6000,
    status: 'success',
    recipient_details: {
      phone: '08145239871',
      network: 'MTN',
      planName: 'MTN SME 2GB (30 Days)',
      planCode: 'MTN_SME_2GB',
    },
    vtu_response: {
      code: '00',
      message: 'Delivered successfully by Aggregator',
      operatorRef: 'MTN-OP-94821',
      timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    retries: 0,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    completed_at: new Date(Date.now() - 2 * 3600000 + 1200).toISOString(),
  },
  {
    id: 'txn_init_02',
    user_id: DEFAULT_CUSTOMER.uid,
    service: 'electricity',
    provider: 'KEDCO',
    reference: 'SAY_20261107_KEDCO_4102',
    amount: 500000,
    cost: 495000,
    profit: 5000,
    status: 'success',
    recipient_details: {
      meterNo: '04182910492',
      meterType: 'prepaid',
      disco: 'KEDCO (Kano Electric)',
      customerName: 'MALAM BELLO RINGIM',
      address: 'Plot 44 Ring Road, Kano',
      token: '4829-1092-4820-9182-3847',
      units: '73.3 kWh',
    },
    vtu_response: {
      code: '00',
      message: 'Token generated successfully',
      operatorRef: 'KEDCO-STS-88192',
      timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
    },
    retries: 0,
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    completed_at: new Date(Date.now() - 24 * 3600000 + 1500).toISOString(),
  },
  {
    id: 'txn_init_03',
    user_id: DEFAULT_CUSTOMER.uid,
    service: 'tv',
    provider: 'DSTV',
    reference: 'SAY_20261105_DSTV_7721',
    amount: 1980000,
    cost: 1960000,
    profit: 20000,
    status: 'success',
    recipient_details: {
      smartcardNo: '1092837461',
      customerName: 'ABUBAKAR RINGIM',
      planName: 'DStv Compact Plus (Monthly)',
    },
    vtu_response: {
      code: '00',
      message: 'Subscription renewal completed',
      operatorRef: 'DSTV-MC-77182',
      timestamp: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
    retries: 0,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    completed_at: new Date(Date.now() - 4 * 86400000 + 1100).toISOString(),
  },
  {
    id: 'txn_init_04',
    user_id: DEFAULT_CUSTOMER.uid,
    service: 'exam',
    provider: 'WAEC',
    reference: 'SAY_20261104_WAEC_1192',
    amount: 350000,
    cost: 335000,
    profit: 15000,
    status: 'success',
    recipient_details: {
      examType: 'WAEC',
      quantity: 1,
      pins: [{ pin: 'PIN-981248921829', serial: 'WAEC-2026-48291' }],
    },
    vtu_response: {
      code: '00',
      message: 'e-PINs issued instantly',
      operatorRef: 'WAEC-EPIN-11928',
      timestamp: new Date(Date.now() - 6 * 86400000).toISOString(),
    },
    retries: 0,
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    completed_at: new Date(Date.now() - 6 * 86400000 + 800).toISOString(),
  },
  {
    id: 'txn_init_05',
    user_id: DEFAULT_CUSTOMER.uid,
    service: 'airtime',
    provider: 'Airtel',
    reference: 'SAY_20261102_AIRTEL_9012',
    amount: 100000,
    cost: 97000,
    profit: 3000,
    status: 'success',
    recipient_details: {
      phone: '08023456789',
      network: 'Airtel',
      nominalAmount: 1000,
    },
    vtu_response: {
      code: '00',
      message: 'Airtime topped up',
      operatorRef: 'AIRTEL-VTU-9012',
      timestamp: new Date(Date.now() - 9 * 86400000).toISOString(),
    },
    retries: 0,
    created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
    completed_at: new Date(Date.now() - 9 * 86400000 + 900).toISOString(),
  },
  {
    id: 'txn_init_06',
    user_id: DEFAULT_CUSTOMER.uid,
    service: 'data',
    provider: 'Glo',
    reference: 'SAY_20261101_GLO_3321',
    amount: 250000,
    cost: 235000,
    profit: 15000,
    status: 'failed',
    failure_reason: 'Telco timeout: Gateway unreachable. Funds automatically refunded to wallet.',
    recipient_details: {
      phone: '08051234567',
      network: 'Glo',
      planName: 'Glo 10GB Data Plan',
    },
    vtu_response: {
      code: '99',
      message: 'Delivery timeout',
      timestamp: new Date(Date.now() - 12 * 86400000).toISOString(),
    },
    retries: 2,
    created_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    completed_at: new Date(Date.now() - 12 * 86400000 + 2000).toISOString(),
  },
];

const INITIAL_ACTIVITIES: CustomerActivity[] = [
  {
    id: 'act_01',
    user_id: DEFAULT_CUSTOMER.uid,
    type: 'data',
    title: 'Purchased MTN SME 2GB Data',
    transactionRef: 'SAY_20261108_MTN_9812',
    amount: 58000,
    status: 'success',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'act_02',
    user_id: DEFAULT_CUSTOMER.uid,
    type: 'fund_wallet',
    title: 'Wallet Funded via Dedicated Virtual Account',
    amount: 5000000,
    status: 'success',
    created_at: new Date(Date.now() - 22 * 3600000).toISOString(),
  },
  {
    id: 'act_03',
    user_id: DEFAULT_CUSTOMER.uid,
    type: 'electricity',
    title: 'Paid KEDCO Prepaid Electricity Bill',
    transactionRef: 'SAY_20261107_KEDCO_4102',
    amount: 500000,
    status: 'success',
    created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'act_04',
    user_id: DEFAULT_CUSTOMER.uid,
    type: 'tv',
    title: 'Renewed DStv Compact Plus Bouquet',
    transactionRef: 'SAY_20261105_DSTV_7721',
    amount: 1980000,
    status: 'success',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'act_05',
    user_id: DEFAULT_CUSTOMER.uid,
    type: 'beneficiary_added',
    title: 'Saved Beneficiary: Living Room DStv Compact Plus',
    status: 'success',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
  },
  {
    id: 'act_06',
    user_id: DEFAULT_CUSTOMER.uid,
    type: 'exam',
    title: 'Issued 1x WAEC Result Checker PIN',
    transactionRef: 'SAY_20261104_WAEC_1192',
    amount: 350000,
    status: 'success',
    created_at: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'act_07',
    user_id: DEFAULT_CUSTOMER.uid,
    type: 'login',
    title: 'Security Login from Kano (IP: 105.112.48.91)',
    status: 'success',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
  },
];

const INITIAL_RECEIPTS: CustomerReceipt[] = [
  {
    id: 'rcpt_01',
    user_id: DEFAULT_CUSTOMER.uid,
    transactionRef: 'SAY_20261108_MTN_9812',
    service: 'data',
    provider: 'MTN',
    recipient: '08145239871',
    amount: 58000,
    status: 'success',
    issuedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'rcpt_02',
    user_id: DEFAULT_CUSTOMER.uid,
    transactionRef: 'SAY_20261107_KEDCO_4102',
    service: 'electricity',
    provider: 'KEDCO',
    recipient: '04182910492',
    amount: 500000,
    status: 'success',
    issuedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    id: 'rcpt_03',
    user_id: DEFAULT_CUSTOMER.uid,
    transactionRef: 'SAY_20261105_DSTV_7721',
    service: 'tv',
    provider: 'DSTV',
    recipient: '1092837461',
    amount: 1980000,
    status: 'success',
    issuedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    id: 'rcpt_04',
    user_id: DEFAULT_CUSTOMER.uid,
    transactionRef: 'SAY_20261104_WAEC_1192',
    service: 'exam',
    provider: 'WAEC',
    recipient: '1 PIN Issued',
    amount: 350000,
    status: 'success',
    issuedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    id: 'rcpt_05',
    user_id: DEFAULT_CUSTOMER.uid,
    transactionRef: 'SAY_20261102_AIRTEL_9012',
    service: 'airtime',
    provider: 'Airtel',
    recipient: '08023456789',
    amount: 100000,
    status: 'success',
    issuedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
];

const INITIAL_SPENDING: CustomerSpending[] = [
  {
    service: 'data',
    totalSpent: 58000,
    transactionCount: 1,
    lastTransactionAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    service: 'electricity',
    totalSpent: 500000,
    transactionCount: 1,
    lastTransactionAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
  },
  {
    service: 'tv',
    totalSpent: 1980000,
    transactionCount: 1,
    lastTransactionAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
  },
  {
    service: 'exam',
    totalSpent: 350000,
    transactionCount: 1,
    lastTransactionAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
  },
  {
    service: 'airtime',
    totalSpent: 100000,
    transactionCount: 1,
    lastTransactionAt: new Date(Date.now() - 9 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 9 * 86400000).toISOString(),
  },
];

class StorageService {
  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage write error', e);
    }
  }

  constructor() {
    this.bootstrap();
  }

  public bootstrap() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      this.setItem(STORAGE_KEYS.USERS, [DEFAULT_OWNER, DEFAULT_ADMIN, DEFAULT_CUSTOMER]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
      this.setItem(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PAYSTACK_CONFIG)) {
      this.setItem(STORAGE_KEYS.PAYSTACK_CONFIG, INITIAL_PAYSTACK_CONFIG);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BLOG_POSTS)) {
      this.setItem(STORAGE_KEYS.BLOG_POSTS, INITIAL_BLOG_POSTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS)) {
      this.setItem(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      this.setItem(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.PROVIDERS)) {
      this.setItem(STORAGE_KEYS.PROVIDERS, [
        {
          id: 'vtpass',
          name: 'VTPass Aggregator Hub',
          code: 'vtpass',
          active: true,
          isSandbox: false,
          status: 'healthy',
          successRate: 99.8,
          balanceNgn: 4500000,
          apiUrl: 'https://api.vtpass.com/api',
          apiKeyMasked: 'vtp_live_9482••••••••••••••',
          secretKeyMasked: 'sec_vtp_0192••••••••••••••',
          fallbackOrder: 1,
          lastTestedAt: new Date().toISOString(),
        },
        {
          id: 'clubkash',
          name: 'ClubKash Direct Connect',
          code: 'clubkash',
          active: false,
          isSandbox: false,
          status: 'healthy',
          successRate: 99.4,
          balanceNgn: 1850000,
          apiUrl: 'https://clubkash.com/api/v2',
          apiKeyMasked: 'clk_live_2819••••••••••••••',
          secretKeyMasked: 'sec_clk_8821••••••••••••••',
          fallbackOrder: 2,
          lastTestedAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'interswitch',
          name: 'Interswitch Quickteller API',
          code: 'interswitch',
          active: false,
          isSandbox: false,
          status: 'healthy',
          successRate: 99.9,
          balanceNgn: 12000000,
          apiUrl: 'https://api.interswitch.ng/quickteller',
          apiKeyMasked: 'isw_live_0019••••••••••••••',
          secretKeyMasked: 'sec_isw_9918••••••••••••••',
          fallbackOrder: 3,
          lastTestedAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ]);
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID)) {
      this.setItem(STORAGE_KEYS.CURRENT_USER_ID, DEFAULT_CUSTOMER.uid);
    }
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      this.setItem(STORAGE_KEYS.TRANSACTIONS, INITIAL_TRANSACTIONS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.BENEFICIARIES)) {
      this.setItem(STORAGE_KEYS.BENEFICIARIES, INITIAL_BENEFICIARIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVITY)) {
      this.setItem(STORAGE_KEYS.ACTIVITY, INITIAL_ACTIVITIES);
    }
    if (!localStorage.getItem(STORAGE_KEYS.RECEIPTS)) {
      this.setItem(STORAGE_KEYS.RECEIPTS, INITIAL_RECEIPTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.SPENDING)) {
      this.setItem(STORAGE_KEYS.SPENDING, INITIAL_SPENDING);
    }
  }

  // --- Users ---
  getUsers(): UserProfile[] {
    return this.getItem<UserProfile[]>(STORAGE_KEYS.USERS, [DEFAULT_OWNER, DEFAULT_ADMIN, DEFAULT_CUSTOMER]);
  }

  getUser(uid: string): UserProfile | null {
    const users = this.getUsers();
    return users.find((u) => u.uid === uid) || null;
  }

  updateUser(uid: string, updates: Partial<UserProfile>): UserProfile {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.uid === uid);
    if (idx === -1) throw new Error('User not found');
    const updated = { ...users[idx], ...updates, updated_at: new Date().toISOString() };
    users[idx] = updated;
    this.setItem(STORAGE_KEYS.USERS, users);
    return updated;
  }

  getCurrentUserId(): string {
    return this.getItem<string>(STORAGE_KEYS.CURRENT_USER_ID, DEFAULT_CUSTOMER.uid);
  }

  setCurrentUserId(uid: string): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER_ID, uid);
  }

  // --- Admin Session Management (30-Minute Inactivity Timeout) ---
  getAdminSessionTimestamp(): number {
    return this.getItem<number>(STORAGE_KEYS.ADMIN_SESSION_TIMESTAMP, Date.now());
  }

  touchAdminSession(): void {
    this.setItem(STORAGE_KEYS.ADMIN_SESSION_TIMESTAMP, Date.now());
  }

  isAdminSessionExpired(): boolean {
    const lastActive = this.getAdminSessionTimestamp();
    const thirtyMinutesMs = 30 * 60 * 1000;
    return Date.now() - lastActive > thirtyMinutesMs;
  }

  // --- Transactions ---
  getTransactions(): Transaction[] {
    return this.getItem<Transaction[]>(STORAGE_KEYS.TRANSACTIONS, []);
  }

  getUserTransactions(userId: string): Transaction[] {
    return this.getTransactions().filter((t) => t.user_id === userId);
  }

  getTransactionByReference(reference: string): Transaction | null {
    const txns = this.getTransactions();
    return txns.find((t) => t.reference.toLowerCase() === reference.trim().toLowerCase()) || null;
  }

  createTransaction(txn: Transaction): void {
    const txns = this.getTransactions();
    if (txns.some((t) => t.reference === txn.reference)) {
      throw new Error(`Transaction with reference ${txn.reference} already exists.`);
    }
    txns.unshift(txn);
    this.setItem(STORAGE_KEYS.TRANSACTIONS, txns);
  }

  updateTransaction(id: string, updates: Partial<Transaction>): Transaction {
    const txns = this.getTransactions();
    const idx = txns.findIndex((t) => t.id === id);
    if (idx === -1) throw new Error('Transaction not found');
    const updated = { ...txns[idx], ...updates };
    txns[idx] = updated;
    this.setItem(STORAGE_KEYS.TRANSACTIONS, txns);
    return updated;
  }

  // --- Wallet & Atomic Ledger ---
  executeAtomicWalletDeduction(
    userId: string,
    amountKobo: number,
    reference: string,
    description: string
  ): { balanceBefore: number; balanceAfter: number } {
    const users = this.getUsers();
    const userIndex = users.findIndex((u) => u.uid === userId);
    if (userIndex === -1) throw new Error('User not found');

    const user = users[userIndex];
    if (user.suspended) {
      throw new Error('Account is suspended. Please contact customer support.');
    }

    if (user.wallet_balance < amountKobo) {
      throw new Error(
        `Insufficient wallet balance. You have ₦${(user.wallet_balance / 100).toLocaleString()}, but this order requires ₦${(amountKobo / 100).toLocaleString()}.`
      );
    }

    const balanceBefore = user.wallet_balance;
    const balanceAfter = balanceBefore - amountKobo;

    users[userIndex].wallet_balance = balanceAfter;
    users[userIndex].ledger_balance = balanceAfter;
    users[userIndex].updated_at = new Date().toISOString();
    this.setItem(STORAGE_KEYS.USERS, users);

    const ledger = this.getItem<WalletLedgerEntry[]>(STORAGE_KEYS.LEDGER, []);
    const entry: WalletLedgerEntry = {
      id: `led_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      user_id: userId,
      type: 'debit',
      amount: amountKobo,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      source: 'vending',
      reference,
      description,
      created_at: new Date().toISOString(),
    };
    ledger.unshift(entry);
    this.setItem(STORAGE_KEYS.LEDGER, ledger);

    return { balanceBefore, balanceAfter };
  }

  executeAtomicWalletCredit(
    userId: string,
    amountKobo: number,
    source: 'paystack' | 'refund' | 'admin_adjustment',
    reference: string,
    description: string
  ): { balanceBefore: number; balanceAfter: number } {
    const users = this.getUsers();
    const userIndex = users.findIndex((u) => u.uid === userId);
    if (userIndex === -1) throw new Error('User not found');

    const user = users[userIndex];
    const balanceBefore = user.wallet_balance;
    const balanceAfter = balanceBefore + amountKobo;

    users[userIndex].wallet_balance = balanceAfter;
    users[userIndex].ledger_balance = balanceAfter;
    users[userIndex].updated_at = new Date().toISOString();
    this.setItem(STORAGE_KEYS.USERS, users);

    const ledger = this.getItem<WalletLedgerEntry[]>(STORAGE_KEYS.LEDGER, []);
    const entry: WalletLedgerEntry = {
      id: `led_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      user_id: userId,
      type: 'credit',
      amount: amountKobo,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
      source,
      reference,
      description,
      created_at: new Date().toISOString(),
    };
    ledger.unshift(entry);
    this.setItem(STORAGE_KEYS.LEDGER, ledger);

    return { balanceBefore, balanceAfter };
  }

  getLedger(userId?: string): WalletLedgerEntry[] {
    const ledger = this.getItem<WalletLedgerEntry[]>(STORAGE_KEYS.LEDGER, []);
    return userId ? ledger.filter((l) => l.user_id === userId) : ledger;
  }

  // --- Products ---
  getProducts(): ProductItem[] {
    return this.getItem<ProductItem[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }

  addProduct(product: ProductItem): void {
    const products = this.getProducts();
    products.unshift(product);
    this.setItem(STORAGE_KEYS.PRODUCTS, products);
  }

  updateProduct(productId: string, updates: Partial<ProductItem>): ProductItem {
    const products = this.getProducts();
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) throw new Error('Product not found');
    products[idx] = { ...products[idx], ...updates };
    this.setItem(STORAGE_KEYS.PRODUCTS, products);
    return products[idx];
  }

  deleteProduct(productId: string): void {
    const products = this.getProducts().filter((p) => p.id !== productId);
    this.setItem(STORAGE_KEYS.PRODUCTS, products);
  }

  // --- Beneficiaries ---
  getBeneficiaries(userId: string): Beneficiary[] {
    const list = this.getItem<Beneficiary[]>(STORAGE_KEYS.BENEFICIARIES, []);
    return list.filter((b) => b.user_id === userId);
  }

  addBeneficiary(beneficiary: Beneficiary): void {
    const list = this.getItem<Beneficiary[]>(STORAGE_KEYS.BENEFICIARIES, []);
    list.unshift(beneficiary);
    this.setItem(STORAGE_KEYS.BENEFICIARIES, list);
    this.recordUserActivity(
      beneficiary.user_id,
      'beneficiary_added',
      `Saved Beneficiary: ${beneficiary.label} (${beneficiary.provider})`,
      undefined,
      'success'
    );
  }

  updateBeneficiary(id: string, updates: Partial<Beneficiary>): Beneficiary {
    const list = this.getItem<Beneficiary[]>(STORAGE_KEYS.BENEFICIARIES, []);
    const idx = list.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error('Beneficiary not found');
    const updated = { ...list[idx], ...updates };
    list[idx] = updated;
    this.setItem(STORAGE_KEYS.BENEFICIARIES, list);
    return updated;
  }

  deleteBeneficiary(id: string): void {
    const list = this.getItem<Beneficiary[]>(STORAGE_KEYS.BENEFICIARIES, []);
    const filtered = list.filter((b) => b.id !== id);
    this.setItem(STORAGE_KEYS.BENEFICIARIES, filtered);
  }

  // --- Customer Activity Timeline ---
  getActivities(userId: string): CustomerActivity[] {
    const list = this.getItem<CustomerActivity[]>(STORAGE_KEYS.ACTIVITY, []);
    return list
      .filter((a) => a.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  addActivity(activity: CustomerActivity): void {
    const list = this.getItem<CustomerActivity[]>(STORAGE_KEYS.ACTIVITY, []);
    list.unshift(activity);
    this.setItem(STORAGE_KEYS.ACTIVITY, list.slice(0, 300));
  }

  recordUserActivity(
    userId: string,
    type: any,
    title: string,
    amountKobo?: number,
    status: 'success' | 'failed' | 'pending' = 'success',
    transactionRef?: string
  ): void {
    const item: CustomerActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      user_id: userId,
      type,
      title,
      amount: amountKobo,
      status,
      transactionRef,
      created_at: new Date().toISOString(),
    };
    this.addActivity(item);
  }

  // --- Customer Receipts ---
  getReceipts(userId: string): CustomerReceipt[] {
    const list = this.getItem<CustomerReceipt[]>(STORAGE_KEYS.RECEIPTS, []);
    return list
      .filter((r) => r.user_id === userId)
      .sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime());
  }

  addReceipt(receipt: CustomerReceipt): void {
    const list = this.getItem<CustomerReceipt[]>(STORAGE_KEYS.RECEIPTS, []);
    list.unshift(receipt);
    this.setItem(STORAGE_KEYS.RECEIPTS, list);
  }

  // --- Customer Spending Analytics ---
  getSpending(userId: string): CustomerSpending[] {
    const stored = this.getItem<CustomerSpending[]>(STORAGE_KEYS.SPENDING, []);
    if (stored.length > 0) return stored;

    // Dynamically calculate from successful user transactions if not present
    const txns = this.getUserTransactions(userId).filter((t) => t.status === 'success');
    const map = new Map<ServiceCategory, { total: number; count: number; lastDate: string }>();

    for (const t of txns) {
      const current = map.get(t.service) || { total: 0, count: 0, lastDate: t.created_at };
      current.total += t.amount;
      current.count += 1;
      if (new Date(t.created_at).getTime() > new Date(current.lastDate).getTime()) {
        current.lastDate = t.created_at;
      }
      map.set(t.service, current);
    }

    const aggregated: CustomerSpending[] = Array.from(map.entries()).map(([service, val]) => ({
      service,
      totalSpent: val.total,
      transactionCount: val.count,
      lastTransactionAt: val.lastDate,
      updatedAt: new Date().toISOString(),
    }));

    return aggregated;
  }

  updateSpending(userId: string, service: ServiceCategory, amountKobo: number): void {
    const current = this.getSpending(userId);
    const idx = current.findIndex((s) => s.service === service);
    const now = new Date().toISOString();

    if (idx !== -1) {
      current[idx].totalSpent += amountKobo;
      current[idx].transactionCount += 1;
      current[idx].lastTransactionAt = now;
      current[idx].updatedAt = now;
    } else {
      current.push({
        service,
        totalSpent: amountKobo,
        transactionCount: 1,
        lastTransactionAt: now,
        updatedAt: now,
      });
    }
    this.setItem(STORAGE_KEYS.SPENDING, current);
  }

  // --- Auto-Save Progress & Transaction Lifecycle Hook ---
  recordTransactionLifecycle(txn: Transaction): void {
    const recipient =
      txn.recipient_details.phone ||
      txn.recipient_details.meterNo ||
      txn.recipient_details.smartcardNo ||
      txn.recipient_details.accountNumber ||
      txn.recipient_details.customerName ||
      txn.reference;

    // 1. Append to Activity Timeline
    const title =
      txn.status === 'success'
        ? `Recharge: ${txn.provider} ${txn.service.toUpperCase()}`
        : `Failed Re-order: ${txn.provider} ${txn.service.toUpperCase()}`;

    this.recordUserActivity(
      txn.user_id,
      txn.service as any,
      title,
      txn.amount,
      txn.status === 'success' ? 'success' : 'failed',
      txn.reference
    );

    // 2. If Successful: Generate Receipt & Increment Spending
    if (txn.status === 'success') {
      const receipt: CustomerReceipt = {
        id: `rcpt_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        user_id: txn.user_id,
        transactionRef: txn.reference,
        service: txn.service,
        provider: txn.provider,
        recipient,
        amount: txn.amount,
        status: 'success',
        issuedAt: txn.completed_at || txn.created_at,
      };
      this.addReceipt(receipt);
      this.updateSpending(txn.user_id, txn.service, txn.amount);

      // 3. If Recipient matches an existing Beneficiary, update lastUsedAt
      const userBens = this.getBeneficiaries(txn.user_id);
      const matched = userBens.find(
        (b) =>
          b.value.trim() === recipient.trim() ||
          (txn.recipient_details.phone && b.value === txn.recipient_details.phone) ||
          (txn.recipient_details.meterNo && b.value === txn.recipient_details.meterNo) ||
          (txn.recipient_details.smartcardNo && b.value === txn.recipient_details.smartcardNo)
      );

      if (matched) {
        this.updateBeneficiary(matched.id, { lastUsedAt: new Date().toISOString() });
      }
    }
  }

  // --- Disputes ---
  getDisputes(): DisputeTicket[] {
    return this.getItem<DisputeTicket[]>(STORAGE_KEYS.DISPUTES, []);
  }

  createDispute(dispute: DisputeTicket): void {
    const disputes = this.getDisputes();
    disputes.unshift(dispute);
    this.setItem(STORAGE_KEYS.DISPUTES, disputes);
  }

  updateDispute(id: string, updates: Partial<DisputeTicket>): DisputeTicket {
    const disputes = this.getDisputes();
    const idx = disputes.findIndex((d) => d.id === id);
    if (idx === -1) throw new Error('Dispute not found');
    disputes[idx] = { ...disputes[idx], ...updates, updated_at: new Date().toISOString() };
    this.setItem(STORAGE_KEYS.DISPUTES, disputes);
    return disputes[idx];
  }

  // --- Audit Logs ---
  getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>(STORAGE_KEYS.AUDIT_LOGS, []);
  }

  recordAuditLog(
    actorId: string,
    actorEmail: string,
    action: string,
    target: string,
    before?: any,
    after?: any,
    actorRole?: Role
  ): void {
    const logs = this.getAuditLogs();
    const entry: AuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      actor_id: actorId,
      actor_email: actorEmail,
      actor_role: actorRole || 'admin',
      action,
      target,
      before,
      after,
      ip: '102.89.44.1 (Kano, NG)',
      user_agent: navigator.userAgent,
      created_at: new Date().toISOString(),
    };
    logs.unshift(entry);
    this.setItem(STORAGE_KEYS.AUDIT_LOGS, logs.slice(0, 500));
  }

  // --- Providers & Paystack Config ---
  getProviders(): VtuProviderConfig[] {
    return this.getItem<VtuProviderConfig[]>(STORAGE_KEYS.PROVIDERS, []);
  }

  updateProvider(id: string, updates: Partial<VtuProviderConfig>): void {
    const providers = this.getProviders();
    const idx = providers.findIndex((p) => p.id === id);
    if (idx !== -1) {
      providers[idx] = { ...providers[idx], ...updates };
      this.setItem(STORAGE_KEYS.PROVIDERS, providers);
    }
  }

  getPaystackConfig(): PaystackGatewayConfig {
    return this.getItem<PaystackGatewayConfig>(STORAGE_KEYS.PAYSTACK_CONFIG, INITIAL_PAYSTACK_CONFIG);
  }

  updatePaystackConfig(updates: Partial<PaystackGatewayConfig>): void {
    const current = this.getPaystackConfig();
    this.setItem(STORAGE_KEYS.PAYSTACK_CONFIG, { ...current, ...updates });
  }

  // --- Platform Settings ---
  getSettings(): PlatformSettings {
    return this.getItem<PlatformSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  updateSettings(updates: Partial<PlatformSettings>): void {
    const current = this.getSettings();
    this.setItem(STORAGE_KEYS.SETTINGS, { ...current, ...updates });
  }

  // --- Content CMS (Blog Posts & Notifications) ---
  getBlogPosts(): BlogPost[] {
    return this.getItem<BlogPost[]>(STORAGE_KEYS.BLOG_POSTS, INITIAL_BLOG_POSTS);
  }

  saveBlogPost(post: BlogPost): void {
    const posts = this.getBlogPosts();
    const idx = posts.findIndex((p) => p.id === post.id);
    if (idx !== -1) {
      posts[idx] = { ...post, updated_at: new Date().toISOString() };
    } else {
      posts.unshift(post);
    }
    this.setItem(STORAGE_KEYS.BLOG_POSTS, posts);
  }

  deleteBlogPost(id: string): void {
    const posts = this.getBlogPosts().filter((p) => p.id !== id);
    this.setItem(STORAGE_KEYS.BLOG_POSTS, posts);
  }

  getNotifications(): NotificationCampaign[] {
    return this.getItem<NotificationCampaign[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
  }

  addNotification(notif: NotificationCampaign): void {
    const list = this.getNotifications();
    list.unshift(notif);
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, list);
    this.notifyAdmin();
  }

  // --- Real-Time Admin Synchronization & Event Emitter ---
  public notifyAdmin(): void {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sayyada_admin_sync'));
    }
  }

  public subscribeAdmin(callback: () => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const listener = () => callback();
    window.addEventListener('sayyada_admin_sync', listener);
    return () => {
      window.removeEventListener('sayyada_admin_sync', listener);
    };
  }

  // --- Admin Stats (Aggregated Documents) ---
  getAdminTotals(): AdminTotalsStats {
    const existing = this.getItem<AdminTotalsStats | null>(STORAGE_KEYS.ADMIN_STATS, null);
    if (existing) return existing;
    return this.recomputeAdminStats();
  }

  getAdminServiceStats(): AdminServiceStat[] {
    const existing = this.getItem<AdminServiceStat[]>(STORAGE_KEYS.ADMIN_SERVICES, []);
    if (existing.length > 0) return existing;
    this.recomputeAdminStats();
    return this.getItem<AdminServiceStat[]>(STORAGE_KEYS.ADMIN_SERVICES, []);
  }

  getAdminDailyStats(date?: string): AdminDailyStat {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const dailyMap = this.getItem<Record<string, AdminDailyStat>>(STORAGE_KEYS.ADMIN_DAILY, {});
    if (dailyMap[targetDate]) return dailyMap[targetDate];

    // Compute on-the-fly for requested date
    const txns = this.getTransactions().filter(
      (t) => t.created_at.split('T')[0] === targetDate
    );
    const successTxns = txns.filter((t) => t.status === 'success');
    const failedTxns = txns.filter((t) => t.status === 'failed');

    const stat: AdminDailyStat = {
      date: targetDate,
      revenue: successTxns.reduce((sum, t) => sum + (t.amount || 0), 0),
      profit: successTxns.reduce((sum, t) => sum + (t.profit || 0), 0),
      transactionCount: txns.length,
      successCount: successTxns.length,
      failedCount: failedTxns.length,
      newCustomers: this.getUsers().filter((u) => u.created_at.split('T')[0] === targetDate && u.role === 'customer').length,
      newPayments: 0,
      updatedAt: new Date().toISOString(),
    };

    dailyMap[targetDate] = stat;
    this.setItem(STORAGE_KEYS.ADMIN_DAILY, dailyMap);
    return stat;
  }

  getAdminPendingStats(): AdminPendingStat {
    const txns = this.getTransactions();
    const disputes = this.getDisputes();
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    const stuckTransactions = txns.filter(
      (t) => t.status === 'processing' && new Date(t.created_at).getTime() < fiveMinutesAgo
    ).length;

    const pendingDisputes = disputes.filter(
      (d) => d.status === 'open' || d.status === 'investigating'
    ).length;

    return {
      stuckTransactions,
      pendingDisputes,
      lastUpdatedAt: new Date().toISOString(),
    };
  }

  recomputeAdminStats(): AdminTotalsStats {
    const txns = this.getTransactions();
    const users = this.getUsers();
    const disputes = this.getDisputes();

    const successTxns = txns.filter((t) => t.status === 'success');
    const totalRevenue = successTxns.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalProfit = successTxns.reduce((sum, t) => sum + (t.profit || 0), 0);
    const totalTransactions = txns.length;

    const customerUsers = users.filter((u) => u.role === 'customer' && !u.suspended);
    const totalCustomers = customerUsers.length;
    const totalWalletFloat = users
      .filter((u) => u.role === 'customer')
      .reduce((sum, u) => sum + (u.wallet_balance || 0), 0);

    // Ledger Paystack Inflow
    const ledger = this.getItem<WalletLedgerEntry[]>(STORAGE_KEYS.LEDGER, []);
    const totalPaystackInflow = ledger
      .filter((l) => l.source === 'paystack')
      .reduce((sum, l) => sum + l.amount, 0);

    const totals: AdminTotalsStats = {
      totalRevenue,
      totalProfit,
      totalTransactions,
      totalCustomers,
      totalWalletFloat,
      totalPaystackInflow: totalPaystackInflow || 5000000,
      updatedAt: new Date().toISOString(),
    };
    this.setItem(STORAGE_KEYS.ADMIN_STATS, totals);

    // Service Breakdown
    const serviceMap = new Map<ServiceCategory, { revenue: number; profit: number; count: number; success: number; failed: number }>();
    const allServices: ServiceCategory[] = [
      'airtime',
      'data',
      'electricity',
      'tv',
      'exam',
      'remit',
      'invoice',
      'giftcard',
      'transport',
      'travel',
    ];

    allServices.forEach((svc) => {
      serviceMap.set(svc, { revenue: 0, profit: 0, count: 0, success: 0, failed: 0 });
    });

    txns.forEach((t) => {
      const cur = serviceMap.get(t.service) || { revenue: 0, profit: 0, count: 0, success: 0, failed: 0 };
      cur.count += 1;
      if (t.status === 'success') {
        cur.revenue += t.amount || 0;
        cur.profit += t.profit || 0;
        cur.success += 1;
      } else if (t.status === 'failed') {
        cur.failed += 1;
      }
      serviceMap.set(t.service, cur);
    });

    const serviceStats: AdminServiceStat[] = Array.from(serviceMap.entries()).map(([service, s]) => {
      const rate = s.count > 0 ? (s.failed / s.count) * 100 : 0;
      return {
        service,
        totalRevenue: s.revenue,
        totalProfit: s.profit,
        transactionCount: s.count,
        successCount: s.success,
        failedCount: s.failed,
        failureRate: parseFloat(rate.toFixed(1)),
        updatedAt: new Date().toISOString(),
      };
    });
    this.setItem(STORAGE_KEYS.ADMIN_SERVICES, serviceStats);

    // Daily Stats update
    const today = new Date().toISOString().split('T')[0];
    this.getAdminDailyStats(today);

    this.notifyAdmin();
    return totals;
  }

  // --- Admin Activity Audit Trail ---
  getAdminActivities(): AdminActivity[] {
    const list = this.getItem<AdminActivity[]>(STORAGE_KEYS.ADMIN_ACTIVITY, []);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  recordAdminActivity(
    actorId: string,
    actorName: string,
    action: string,
    target: string,
    before?: any,
    after?: any,
    actorRole?: Role
  ): void {
    const list = this.getItem<AdminActivity[]>(STORAGE_KEYS.ADMIN_ACTIVITY, []);
    const entry: AdminActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      actorId,
      actorName,
      actorRole: actorRole || 'admin',
      action,
      target,
      before,
      after,
      ip: '102.89.44.1 (Kano, NG)',
      createdAt: new Date().toISOString(),
    };
    list.unshift(entry);
    this.setItem(STORAGE_KEYS.ADMIN_ACTIVITY, list.slice(0, 500));
    // Also sync to general audit logs for unified auditing
    this.recordAuditLog(actorId, `${actorName}@sayyadadatasub.com`, action, target, before, after, actorRole);
    this.notifyAdmin();
  }
}

export const storage = new StorageService();
