import { useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from './firebase';

/**
 * Maps raw Firebase Auth error codes to branded Sayyada Datasub messages.
 * Never exposes raw error codes or internal Firebase messages to users.
 */
export const mapAuthError = (errorCode?: string): string => {
  if (!errorCode) return 'Something went wrong. Please try again.';

  switch (errorCode) {
    // Sign-In Errors (Enumeration-protected)
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Email or password is incorrect. Please try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';

    // Sign-Up Errors
    case 'auth/email-already-in-use':
      return 'An account with this email already exists. Please sign in instead.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';

    // Resend / Verification Errors
    case 'auth/email-not-verified':
      return 'Your email address is not yet verified. Please verify it and log in.';
    case 'auth/resend-too-many-requests':
      return 'Please wait a minute before requesting another verification email.';
    case 'auth/no-current-user':
      return 'Please sign in first.';

    // Safe Fallback
    default:
      return 'Something went wrong. Please try again.';
  }
};

/**
 * Standard Sign In with Email and Password
 */
export const signIn = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return cred.user;
  } catch (error: any) {
    const code = error?.code || '';
    throw new Error(mapAuthError(code));
  }
};

/**
 * Sign In with strict email verification enforcement.
 * Immediately reloads the user to get fresh verification status from server.
 * If unverified, immediately signs out and throws an auth/email-not-verified error with email.
 */
export const signInVerified = async (email: string, password: string): Promise<FirebaseUser> => {
  let cred;
  try {
    cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  } catch (error: any) {
    const code = error?.code || '';
    throw new Error(mapAuthError(code));
  }

  // Fetch fresh verification status directly from Firebase server
  await cred.user.reload().catch(() => {});
  const freshUser = auth.currentUser;

  if (!freshUser?.emailVerified) {
    await signOut(auth);
    const err: any = new Error(
      `We have sent you a verification email to ${cred.user.email || email}. Please verify it and log in.`
    );
    err.code = 'auth/email-not-verified';
    err.email = cred.user.email || email;
    throw err;
  }

  return freshUser;
};

/**
 * Standard Sign Up with Email and Password
 */
export const signUp = async (email: string, password: string): Promise<FirebaseUser> => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    return cred.user;
  } catch (error: any) {
    const code = error?.code || '';
    throw new Error(mapAuthError(code));
  }
};

/**
 * Sign Up with mandatory Email Verification (NO AUTO-LOGIN).
 * 1. Creates account in Firebase Auth
 * 2. Immediately dispatches verification email with redirect to /auth?verified=1
 * 3. Immediately signs out so user is NOT logged in
 * 4. Returns the user's email for the verification screen
 */
export const signUpWithVerification = async (email: string, password: string): Promise<string> => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sayyadadatasub.com';

    await sendEmailVerification(cred.user, {
      url: `${origin}/auth?verified=1`,
      handleCodeInApp: false,
    }).catch((e) => {
      console.warn('Verification dispatch warning:', e);
    });

    // Force immediate sign-out: unverified users must never remain authenticated
    await signOut(auth);
    return cred.user.email || email.trim();
  } catch (error: any) {
    const code = error?.code || '';
    throw new Error(mapAuthError(code));
  }
};

/**
 * Resends the email verification link to the target user.
 * Supports sending for current user, or temporary authenticated session if user is signed out.
 */
export const resendVerification = async (email?: string, password?: string): Promise<void> => {
  let targetUser = auth.currentUser;
  let signedInTemporarily = false;

  if (!targetUser && email && password) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      targetUser = cred.user;
      signedInTemporarily = true;
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/too-many-requests') {
        throw new Error('Please wait a minute before requesting another verification email.');
      }
      throw new Error('Please sign in first.');
    }
  }

  if (!targetUser) {
    throw new Error('Please sign in first to resend the verification email.');
  }

  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sayyadadatasub.com';
    await sendEmailVerification(targetUser, {
      url: `${origin}/auth?verified=1`,
      handleCodeInApp: false,
    });
  } catch (error: any) {
    const code = error?.code || '';
    if (code === 'auth/too-many-requests') {
      throw new Error('Please wait a minute before requesting another verification email.');
    }
    throw new Error('Could not resend email. Please try again in a moment.');
  } finally {
    if (signedInTemporarily) {
      await signOut(auth).catch(() => {});
    }
  }
};

/**
 * Re-checks if the user's email has been verified.
 * Calls user.reload() to pull fresh verification flag from Firebase's server.
 */
export const recheckVerification = async (email?: string, password?: string): Promise<boolean> => {
  if (auth.currentUser) {
    try {
      await auth.currentUser.reload();
      return !!auth.currentUser.emailVerified;
    } catch {
      throw new Error('Could not check verification status. Please refresh the page.');
    }
  }

  // If user is currently signed out, authenticate briefly to check fresh status
  if (email && password) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await cred.user.reload();
      const isVerified = !!cred.user.emailVerified;
      if (!isVerified) {
        await signOut(auth);
      }
      return isVerified;
    } catch {
      return false;
    }
  }

  return false;
};

/**
 * Sign Out / Logout from Firebase Authentication
 */
export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error: any) {
    console.error('Logout error:', error);
  }
};

/**
 * React hook to listen for Firebase Auth state changes
 * Uses browserLocalPersistence and enforces user.reload() to fetch fresh emailVerified status.
 * Blocks unverified users automatically.
 */
export const useAuth = () => {
  const [user, setUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!currentUser) {
          setUser(null);
          setLoading(false);
          return;
        }

        try {
          await currentUser.reload();
        } catch {
          // ignore transient reload errors
        }

        const freshUser = auth.currentUser;
        if (!freshUser?.emailVerified) {
          await signOut(auth).catch(() => {});
          setUser(null);
        } else {
          setUser(freshUser);
        }
        setLoading(false);
      },
      (err: any) => {
        setError(mapAuthError(err?.code));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { user, loading, error };
};
