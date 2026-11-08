export type Role = 'customer' | 'admin' | 'owner';

export type KycTier = 1 | 2;

export interface UserProfile {
  uid: string;
  email: string;
  phone: string;
  name: string;
  tier: KycTier;
  kyc_status: 'verified' | 'pending' | 'unverified';
  role: Role;
  wallet_balance: number; // in kobo (1 NGN = 100 kobo)
  ledger_balance: number; // in kobo
  virtual_account?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
  hasPin: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
  bvn?: string;
  nin?: string;
  ip_address?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
  suspended: boolean;
}

export type ServiceCategory =
  | 'airtime'
  | 'data'
  | 'tv'
  | 'electricity'
  | 'exam'
  | 'remit'
  | 'invoice'
  | 'giftcard'
  | 'transport'
  | 'travel';

export type NetworkProvider = 'MTN' | 'Airtel' | 'Glo' | '9mobile';

export type TransactionStatus = 'pending' | 'processing' | 'success' | 'failed' | 'reversed' | 'refunded';

export interface Transaction {
  id: string;
  user_id: string;
  user_email?: string;
  service: ServiceCategory;
  provider: string; // e.g., 'MTN', 'DSTV', 'IKEDC', 'WAEC', 'VTPass'
  reference: string; // unique idempotency key
  paystack_ref?: string;
  payment_method?: string;
  amount: number; // in kobo
  cost: number; // in kobo
  profit: number; // in kobo
  status: TransactionStatus;
  recipient_details: {
    phone?: string;
    network?: string;
    planName?: string;
    planCode?: string;
    nominalAmount?: number;
    smartcardNo?: string;
    customerName?: string;
    address?: string;
    meterNo?: string;
    meterType?: 'prepaid' | 'postpaid';
    token?: string; // 20-digit electricity token
    units?: string; // kWh units
    disco?: string;
    examType?: string;
    quantity?: number;
    pins?: Array<{ pin: string; serial: string }>;
    bankName?: string;
    bankCode?: string;
    accountNumber?: string;
    accountName?: string;
    narration?: string;
    billerId?: string;
    invoiceNo?: string;
    biller?: string;
    cardType?: string;
    cardValue?: string;
    mode?: 'buy' | 'sell';
    exchangeRate?: string;
    plateNumber?: string;
    bookingType?: 'flight' | 'hotel';
    route?: string;
    date?: string;
    passengerName?: string;
    guestEmail?: string;
  };
  vtu_response?: {
    code: string;
    message: string;
    operatorRef?: string;
    rawPayload?: any;
    timestamp: string;
  };
  api_response?: any;
  failure_reason?: string;
  retries: number;
  created_at: string;
  completed_at?: string;
  forced_by?: string;
}

export interface WalletLedgerEntry {
  id: string;
  user_id: string;
  type: 'credit' | 'debit';
  amount: number; // in kobo
  balance_before: number; // in kobo
  balance_after: number; // in kobo
  source: 'paystack' | 'vending' | 'refund' | 'admin_adjustment';
  reference: string;
  description: string;
  created_at: string;
}

export type BeneficiaryType = 'phone' | 'meter' | 'smartcard' | 'bank' | 'exam' | 'plate';

export interface Beneficiary {
  id: string;
  user_id: string;
  type: BeneficiaryType;
  label: string;
  value: string;
  provider: string;
  meta?: Record<string, any>;
  additionalInfo?: string;
  lastUsedAt?: string;
  created_at: string;
}

export type ActivityType =
  | 'fund_wallet'
  | 'airtime'
  | 'data'
  | 'tv'
  | 'electricity'
  | 'exam'
  | 'remit'
  | 'invoice'
  | 'giftcard'
  | 'transport'
  | 'travel'
  | 'login'
  | 'beneficiary_added'
  | 'receipt_download'
  | 'dispute_raised';

export interface CustomerActivity {
  id: string;
  user_id: string;
  type: ActivityType;
  title: string;
  transactionRef?: string;
  amount?: number; // in kobo
  status: 'success' | 'failed' | 'pending';
  icon?: string;
  created_at: string;
}

export interface CustomerReceipt {
  id: string;
  user_id: string;
  transactionRef: string;
  service: ServiceCategory;
  provider: string;
  recipient: string;
  amount: number; // in kobo
  status: 'success' | 'failed';
  receiptUrl?: string;
  issuedAt: string;
}

export interface CustomerSpending {
  service: ServiceCategory;
  totalSpent: number; // in kobo
  transactionCount: number;
  lastTransactionAt: string;
  updatedAt: string;
}

export interface ProductItem {
  id: string;
  service: ServiceCategory;
  provider: string;
  plan_code: string;
  name: string;
  cost_price: number; // in kobo
  selling_price: number; // in kobo
  base_price?: number; // alias for cost_price in kobo
  user_price?: number; // alias for retail selling_price in kobo
  agent_price?: number; // wholesale agent price in kobo
  vendor_price?: number; // wholesale vendor price in kobo
  discount_percent?: number;
  validity?: string;
  active: boolean;
  category?: string; // e.g., 'SME', 'Gifting', 'Corporate'
  meta?: Record<string, any>;
}

export interface DisputeTicket {
  id: string;
  transaction_id: string;
  transaction_ref: string;
  user_id: string;
  user_email: string;
  user_phone: string;
  service: ServiceCategory;
  amount: number; // in kobo
  status: 'open' | 'investigating' | 'resolved_refunded' | 'rejected' | 'escalated_to_owner';
  description: string;
  admin_notes?: string;
  sla_deadline?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_email: string;
  actor_role?: Role;
  action: string;
  target: string;
  before?: any;
  after?: any;
  ip: string;
  user_agent?: string;
  created_at: string;
}

export interface VtuProviderConfig {
  id: string;
  name: string;
  code: 'vtpass' | 'clubkash' | 'interswitch' | 'custom';
  active: boolean;
  isSandbox: boolean;
  status: 'healthy' | 'degraded' | 'maintenance';
  successRate: number;
  balanceNgn: number;
  apiUrl: string;
  apiKeyMasked: string;
  secretKeyMasked: string;
  fallbackOrder: number;
  lastTestedAt?: string;
}

export interface PaystackGatewayConfig {
  publicKeyMasked: string;
  secretKeyMasked: string;
  testMode: boolean;
  webhookUrl: string;
  lastWebhookReceivedAt?: string;
  floatAlertThresholdNgn: number;
}

export interface PlatformSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  fundingBonusPercent: number;
  withdrawalFeeNgn: number;
  allowlistIps: string[];
  supportPhone: string;
  supportWhatsApp: string;
  supportEmail: string;
  currencySymbol: string;
  timezone: string;
}

export type PostStatus = 'draft' | 'published' | 'archived';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  readTime: string;
  coverImage?: string;
  coverImageUrl?: string;
  summary: string;
  excerpt?: string;
  content: string;
  published: boolean;
  status?: PostStatus;
  tags?: string[];
  authorId?: string;
  authorName?: string;
  seoTitle?: string;
  seoDescription?: string;
  created_at: string;
  createdAt?: string;
  updated_at: string;
  updatedAt?: string;
  publishedAt?: string | null;
  viewCount?: number;
}

export interface AdminTotalsStats {
  totalRevenue: number; // in kobo (sum of successful transactions)
  totalProfit: number; // in kobo
  totalTransactions: number;
  totalCustomers: number;
  totalWalletFloat: number; // in kobo
  totalPaystackInflow?: number; // in kobo (wallet top-ups)
  updatedAt: string;
}

export interface AdminServiceStat {
  service: ServiceCategory;
  totalRevenue: number; // in kobo
  totalProfit: number; // in kobo
  transactionCount: number;
  successCount: number;
  failedCount: number;
  failureRate: number; // percentage (0 - 100)
  updatedAt: string;
}

export interface AdminDailyStat {
  date: string; // YYYY-MM-DD
  revenue: number; // in kobo
  profit: number; // in kobo
  transactionCount: number;
  successCount: number;
  failedCount: number;
  newCustomers: number;
  newPayments: number;
  updatedAt: string;
}

export interface AdminPendingStat {
  stuckTransactions: number; // status 'processing' for > 5 min
  pendingDisputes: number;
  lastUpdatedAt: string;
}

export interface AdminActivity {
  id: string;
  actorId: string;
  actorName: string;
  actorRole?: Role;
  action: string;
  target: string;
  before?: any;
  after?: any;
  ip: string;
  createdAt: string;
}

export interface NotificationCampaign {
  id: string;
  title: string;
  message: string;
  type: 'push' | 'email' | 'in_app_banner';
  target: 'all' | 'verified_only' | 'single_user';
  targetUserId?: string;
  scheduledAt?: string;
  sentAt?: string;
  recipientCount: number;
  status: 'draft' | 'scheduled' | 'sent';
}

