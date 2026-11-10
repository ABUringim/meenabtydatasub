import React, { useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

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
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in -> show auth screen
        onRedirectToAuth();
      } else if (!user.emailVerified) {
        // Logged in but unverified -> force logout and show verification screen
        signOut(auth).catch(() => {});
        onRedirectToVerify(user.email || undefined);
      }
    }
  }, [loading, user, onRedirectToAuth, onRedirectToVerify]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-3 border-emerald-600 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Authenticating verified session...</span>
        </div>
      </div>
    );
  }

  if (!user || !user.emailVerified) {
    return null;
  }

  return <>{children}</>;
};
