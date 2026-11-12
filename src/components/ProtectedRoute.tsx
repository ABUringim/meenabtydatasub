import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  onRedirectToAuth: () => void;
  onRedirectToVerify: (email?: string) => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  onRedirectToAuth,
  onRedirectToVerify,
}) => {
  const { loading: contextLoading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      setChecking(false);
      if (!user) {
        // Strictly logged out -> redirect to /auth (login)
        onRedirectToAuth();
      } else if (!user.emailVerified) {
        // Logged in but unverified -> sign out and redirect to verification
        signOut(auth).catch(() => {});
        onRedirectToVerify(user.email || undefined);
      }
    });

    return () => unsubscribe();
  }, [onRedirectToAuth, onRedirectToVerify]);

  const isLoading = checking || contextLoading;

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-3 border-emerald-600 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Authenticating verified session...</span>
        </div>
      </div>
    );
  }

  // Strict check: No user or unverified user can EVER see dashboard children
  if (!auth.currentUser || !auth.currentUser.emailVerified) {
    return null;
  }

  return <>{children}</>;
};
