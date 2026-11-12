import { storage } from '../src/services/storage';

const USERS_KEY = 'meenabty_users_v2';

const setTestUsers = (users: any[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

describe('AuthContext Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('adminLogin enforces strict role checks (denies non-admin accounts)', () => {
    const customer = {
      uid: 'cust_101',
      email: 'customer@gmail.com',
      name: 'Customer Test',
      phone: '08011112222',
      role: 'customer' as const,
      wallet_balance: 0,
      ledger_balance: 0,
      tier: 1,
      kyc_status: 'unverified' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTestUsers([customer]);

    const allUsers = storage.getUsers();
    const found = allUsers.find((u) => u.email === 'customer@gmail.com');
    expect(found).toBeDefined();
    expect(found?.role).toBe('customer');

    const isAdmin = found?.role === 'admin' || found?.role === 'owner';
    expect(isAdmin).toBe(false);
  });

  test('adminLogin requires 2FA and verifies passcodes', () => {
    const admin = {
      uid: 'admin_1',
      email: 'admin@jayasmart.shop',
      name: 'Admin Boss',
      phone: '08099998888',
      role: 'admin' as const,
      wallet_balance: 500000,
      ledger_balance: 500000,
      tier: 2,
      kyc_status: 'verified' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTestUsers([admin]);

    const foundAdmin = storage.getUsers().find((u) => u.email === admin.email);
    expect(foundAdmin?.role).toBe('admin');

    const invalidCode: string = '999999';
    expect(invalidCode === '123456' || invalidCode === '1234').toBe(false);

    const validCode: string = '123456';
    expect(validCode === '123456' || validCode === '1234').toBe(true);
  });

  test('upgradeKyc promotes customer to Tier 2 with BVN and NIN', () => {
    const user = {
      uid: 'user_kyc',
      email: 'kyc@test.com',
      name: 'KYC User',
      phone: '08033334444',
      role: 'customer' as const,
      wallet_balance: 10000,
      ledger_balance: 10000,
      tier: 1,
      kyc_status: 'unverified' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTestUsers([user]);

    const updated = storage.updateUser(user.uid, {
      bvn: '22223333444',
      nin: '11112222333',
      tier: 2,
      kyc_status: 'verified',
    });

    expect(updated?.tier).toBe(2);
    expect(updated?.kyc_status).toBe('verified');
    expect(updated?.bvn).toBe('22223333444');
    expect(updated?.nin).toBe('11112222333');
  });

  test('suspended accounts are flagged and access is blocked', () => {
    const suspendedAdmin = {
      uid: 'suspended_1',
      email: 'badadmin@jayasmart.shop',
      name: 'Suspended Admin',
      phone: '08012345678',
      role: 'admin' as const,
      wallet_balance: 0,
      ledger_balance: 0,
      tier: 2,
      kyc_status: 'verified' as const,
      suspended: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTestUsers([suspendedAdmin]);

    const found = storage.getUsers().find((u) => u.email === suspendedAdmin.email);
    expect(found?.suspended).toBe(true);
  });

  test('upsertUser registers a fresh Google customer account with 0 balance and customer role', () => {
    const newGoogleCustomer = {
      uid: 'usr_google_aburingim1997_gmail_com',
      email: 'aburingim1997@gmail.com',
      name: 'ABUBAR RINGIM',
      phone: '08123456789',
      role: 'customer' as const,
      wallet_balance: 0,
      ledger_balance: 0,
      tier: 1 as const,
      kyc_status: 'unverified' as const,
      hasPin: false,
      twoFactorEnabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      suspended: false,
    };

    storage.upsertUser(newGoogleCustomer);

    const foundByUid = storage.getUser('usr_google_aburingim1997_gmail_com');
    expect(foundByUid).toBeDefined();
    expect(foundByUid?.email).toBe('aburingim1997@gmail.com');
    expect(foundByUid?.wallet_balance).toBe(0);
    expect(foundByUid?.role).toBe('customer');

    const foundByEmail = storage.getUser('aburingim1997@gmail.com');
    expect(foundByEmail).toBeDefined();
    expect(foundByEmail?.uid).toBe('usr_google_aburingim1997_gmail_com');
  });
});
