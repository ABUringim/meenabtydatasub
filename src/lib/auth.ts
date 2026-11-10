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
 * Maps raw Firebase Auth error codes to exact user specifications:
 * Sign Up errors:
 * • auth/email-already-in-use
 * → Show exactly: "User already exists. Please sign in"
 * 
 * Login errors:
 * • auth/wrong-password
 * • auth/user-not-found
 * • auth/invalid-credential
 * → Show exactly: "Email or password is incorrect"
 * 
 * All other errors:
 * • "Something went wrong. Please try again."
 */
export const mapAuthError = (errorCode?: string): string => {
  if (!errorCode) return 'Something went wrong. Please try again.';

  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'User already exists. Please sign in';

    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Email or password is incorrect';

    default:
      return 'Something went wrong. Please try again.';
  }
};

/**
 * Sign In with Email and Password
 * Blocks unverified users: signs them out immediately and throws auth/email-not-verified error.
 */
export const signIn = async (email: string, password: string): Promise<FirebaseUser> => {
  let cred;
  try {
    cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  } catch (error: any) {
    const code = error?.code || '';
    throw new Error(mapAuthError(code));
  }

  // Reload user to get fresh verification status from Firebase server
  try {
    await cred.user.reload();
  } catch {
    // ignore transient reload errors
  }

  const freshUser = auth.currentUser;
  if (!freshUser?.emailVerified) {
    // If login succeeds BUT user.emailVerified === false:
    // Immediately sign them out & block access to dashboard
    await signOut(auth).catch(() => {});
    const targetEmail = cred.user.email || email.trim();
    const err: any = new Error(
      `We have sent you a verification email to ${targetEmail}. Please verify it and log in.`
    );
    err.code = 'auth/email-not-verified';
    err.email = targetEmail;
    throw err;
  }

  return freshUser;
};

/**
 * Sign Up with Email and Password (No Auto Login)
 * 1. Creates account in Firebase Auth
 * 2. Immediately sends a verification email
 * 3. Immediately signs out
 * 4. Returns the user's email for the verification screen
 */
export const signUp = async (email: string, password: string): Promise<string> => {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://meenabtydatasub.com';

    await sendEmailVerification(cred.user, {
      url: `${origin}/login?verified=1`,
      handleCodeInApp: false,
    }).catch((e) => {
      console.warn('Verification dispatch warning:', e);
    });

    // Immediately sign the user out (No Auto Login)
    await signOut(auth);

    return cred.user.email || email.trim();
  } catch (error: any) {
    const code = error?.code || '';
    throw new Error(mapAuthError(code));
  }
};

/**
 * Resends the verification email to the user
 */
export const resendVerification = async (email?: string, password?: string): Promise<void> => {
  let targetUser = auth.currentUser;
  let signedInTemporarily = false;

  if (!targetUser && email && password) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      targetUser = cred.user;
      signedInTemporarily = true;
    } catch {
      throw new Error('Please sign in first.');
    }
  }

  if (!targetUser) {
    throw new Error('Please sign in first to resend the verification email.');
  }

  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://meenabtydatasub.com';
    await sendEmailVerification(targetUser, {
      url: `${origin}/login?verified=1`,
      handleCodeInApp: false,
    });
  } catch (err: any) {
    const code = err?.code || '';
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
 * Checks if the user's email has been verified
 */
export const recheckVerification = async (email?: string, password?: string): Promise<boolean> => {
  if (auth.currentUser) {
    try {
      await auth.currentUser.reload();
      return !!auth.currentUser.emailVerified;
    } catch {
      return false;
    }
  }

  if (email && password) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await cred.user.reload();
      const verified = !!cred.user.emailVerified;
      if (!verified) {
        await signOut(auth).catch(() => {});
      }
      return verified;
    } catch {
      return false;
    }
  }

  return false;
};

/**
 * Compatibility alias for signInVerified
 */
export const signInVerified = signIn;

/**
 * Compatibility alias for signUpWithVerification
 */
export const signUpWithVerification = signUp;

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
 * React hook to listen for Firebase Auth state changes using onAuthStateChanged().
 * Enforces verified-only session.
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

export {
  signInWithGoogle,
  handleGoogleRedirectResult,
  linkGoogleAccount,
  unlinkGoogleAccount,
  setPasswordForGoogleUser,
  adminSignInWithGoogle,
} from './googleAuth';
