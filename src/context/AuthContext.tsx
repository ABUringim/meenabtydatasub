import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, Role, KycTier } from '../types';
import { storage } from '../services/storage';
import { auth } from '../lib/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { signIn as fbSignIn, signUp as fbSignUp, signInWithGoogle as fbSignInWithGoogle } from '../lib/auth';

interface AuthContextType {
  user: UserProfile | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  role: Role;
  isAdmin: boolean;
  isOwner: boolean;
  adminSessionActive: boolean;
  walletBalance: number;
  suspended: boolean;
  kycTier: number;
  switchRole: (role: Role) => void;
  login: (email: string, password?: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  adminLogin: (email: string, password?: string, totpCode?: string) => Promise<{ success: boolean; requires2fa?: boolean; error?: string }>;
  logout: () => Promise<void>;
  adminLogout: () => void;
  register: (name: string, email: string, password?: string) => Promise<boolean>;
  upgradeKyc: (bvn: string, nin: string) => Promise<boolean>;
  setSecurityPin: (pin: string) => Promise<boolean>;
  toggleTwoFactor: () => Promise<boolean>;
  refreshUser: () => void;
  touchSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [adminSessionActive, setAdminSessionActive] = useState<boolean>(true);

  // Sync Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        setFirebaseUser(null);
        // Only keep admin session if explicitly loaded
        const currentUid = storage.getCurrentUserId();
        const found = currentUid ? storage.getUser(currentUid) : null;
        if (found && (found.role === 'admin' || found.role === 'owner')) {
          setCurrentUser(found);
          const isExpired = storage.isAdminSessionExpired();
          setAdminSessionActive(!isExpired);
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
        return;
      }

      setFirebaseUser(fbUser);
      setLoading(false);

      if (fbUser.email) {
        // Construct in-memory profile without saving to database or storage
        const allUsers = storage.getUsers();
        const existing = allUsers.find((u) => u.email.toLowerCase() === fbUser.email?.toLowerCase());
        const profile: UserProfile = existing || {
          uid: fbUser.uid,
          email: fbUser.email,
          phone: fbUser.phoneNumber || '08123456789',
          name: fbUser.displayName || fbUser.email.split('@')[0].toUpperCase(),
          tier: 1,
          kyc_status: 'unverified',
          role: 'customer',
          wallet_balance: 0,
          ledger_balance: 0,
          hasPin: true,
          twoFactorEnabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          suspended: false,
        };
        setCurrentUser(profile);
      }
    });

    return () => unsubscribe();
  }, []);

  // Touch session on active admin user events
  const touchSession = useCallback(() => {
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'owner')) {
      storage.touchAdminSession();
      setAdminSessionActive(true);
    }
  }, [currentUser]);

  // Global activity listener for session timeout
  useEffect(() => {
    const handleActivity = () => touchSession();
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [touchSession]);

  const switchRole = (newRole: Role) => {
    const allUsers = storage.getUsers();
    let target = allUsers.find((u) => u.role === newRole);
    if (!target) {
      target = allUsers[0];
    }
    storage.setCurrentUserId(target.uid);
    storage.touchAdminSession();
    setAdminSessionActive(true);
    setCurrentUser(target);
    storage.recordAuditLog(
      target.uid,
      target.email,
      'ROLE_SWITCH_PREVIEW',
      `Switched to role: ${newRole}`,
      null,
      null,
      target.role
    );
  };

  const login = async (email: string, password = 'password123'): Promise<boolean> => {
    await fbSignIn(email, password);
    return true;
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    const googleUser = await fbSignInWithGoogle();
    if (googleUser && googleUser.email) {
      const allUsers = storage.getUsers();
      let found = allUsers.find((u) => u.email.toLowerCase() === googleUser.email?.toLowerCase());
      if (!found) {
        found = {
          uid: googleUser.uid,
          email: googleUser.email,
          phone: (googleUser as any).phoneNumber || '08145239871',
          name: googleUser.displayName || googleUser.email.split('@')[0].toUpperCase(),
          tier: 1,
          kyc_status: 'unverified',
          role: 'customer',
          wallet_balance: 0,
          ledger_balance: 0,
          hasPin: true,
          twoFactorEnabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          suspended: false,
        };
        allUsers.push(found);
        localStorage.setItem('meenabty_users_v2', JSON.stringify(allUsers));
      }
      storage.setCurrentUserId(found.uid);
      setCurrentUser(found);
      storage.recordAuditLog(
        found.uid,
        found.email,
        'GOOGLE_SIGNIN_SUCCESS',
        `Authenticated via Google Sign-In (${found.email})`,
        null,
        null,
        found.role
      );
    }
    return true;
  };

  const adminLogin = async (
    email: string,
    _password?: string,
    totpCode?: string
  ): Promise<{ success: boolean; requires2fa?: boolean; error?: string }> => {
    await new Promise((r) => setTimeout(r, 400));
    const allUsers = storage.getUsers();
    const found = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!found || (found.role !== 'admin' && found.role !== 'owner')) {
      storage.recordAuditLog(
        'anonymous',
        email,
        'ADMIN_LOGIN_DENIED_ROLE',
        `Attempted admin login for non-admin email ${email}`,
        null,
        null,
        'customer'
      );
      return { success: false, error: 'Access Denied: Account does not possess administrative privileges.' };
    }

    if (found.suspended) {
      return { success: false, error: 'This administrative account is suspended.' };
    }

    // Require 2FA code (default demo code: 123456 or 1234)
    if (!totpCode) {
      return { success: false, requires2fa: true };
    }

    if (totpCode !== '123456' && totpCode !== '1234') {
      storage.recordAuditLog(
        found.uid,
        found.email,
        'ADMIN_2FA_FAILED',
        `Incorrect 2FA code entered by ${found.email}`,
        null,
        null,
        found.role
      );
      return { success: false, error: 'Invalid 2FA Authenticator Code. Demo code is 123456.' };
    }

    storage.setCurrentUserId(found.uid);
    storage.touchAdminSession();
    setAdminSessionActive(true);
    setCurrentUser(found);

    storage.recordAuditLog(
      found.uid,
      found.email,
      'ADMIN_LOGIN_SUCCESS',
      `Successful 2FA authenticated login as ${found.role}`,
      null,
      null,
      found.role
    );

    return { success: true };
  };

  const logout = async (): Promise<void> => {
    await signOut(auth).catch(() => {});
    storage.setCurrentUserId('');
    setCurrentUser(null);
  };

  const adminLogout = () => {
    if (currentUser) {
      storage.recordAuditLog(
        currentUser.uid,
        currentUser.email,
        'ADMIN_LOGOUT',
        'Admin signed out',
        null,
        null,
        currentUser.role
      );
    }
    storage.setCurrentUserId('');
    setAdminSessionActive(false);
    setCurrentUser(null);
  };

  const register = async (name: string, email: string, password = 'password123'): Promise<boolean> => {
    await fbSignUp(email, password);
    return true;
  };

  const upgradeKyc = async (bvn: string, nin: string): Promise<boolean> => {
    if (!currentUser) return false;
    await new Promise((r) => setTimeout(r, 600));
    const updated = storage.updateUser(currentUser.uid, {
      bvn,
      nin,
      tier: 2,
      kyc_status: 'verified',
    });
    setCurrentUser(updated);
    storage.recordAuditLog(
      currentUser.uid,
      currentUser.email,
      'KYC_TIER2_UPGRADE',
      `User ${currentUser.uid}`,
      null,
      null,
      currentUser.role
    );
    return true;
  };

  const setSecurityPin = async (_pin: string): Promise<boolean> => {
    if (!currentUser) return false;
    const updated = storage.updateUser(currentUser.uid, { hasPin: true });
    setCurrentUser(updated);
    return true;
  };

  const toggleTwoFactor = async (): Promise<boolean> => {
    if (!currentUser) return false;
    const updated = storage.updateUser(currentUser.uid, {
      twoFactorEnabled: !currentUser.twoFactorEnabled,
    });
    setCurrentUser(updated);
    return true;
  };

  const refreshUser = () => {
    const currentUid = storage.getCurrentUserId();
    if (currentUid) {
      const found = storage.getUser(currentUid);
      setCurrentUser(found);
    }
  };

  const role = currentUser?.role || 'customer';
  const isOwner = role === 'owner';
  const isAdmin = role === 'admin' || role === 'owner';
  const walletBalance = currentUser?.wallet_balance ?? 0;
  const suspended = Boolean(currentUser?.suspended);
  const kycTier = currentUser?.tier ?? 1;

  return (
    <AuthContext.Provider
      value={{
        user: currentUser,
        firebaseUser,
        loading,
        role,
        isAdmin,
        isOwner,
        adminSessionActive,
        walletBalance,
        suspended,
        kycTier,
        switchRole,
        login,
        loginWithGoogle,
        adminLogin,
        logout,
        adminLogout,
        register,
        upgradeKyc,
        setSecurityPin,
        toggleTwoFactor,
        refreshUser,
        touchSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
