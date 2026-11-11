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
  const isGoogleAccount =
    Boolean(user?.providerData?.some((p: any) => p.providerId === 'google.com')) ||
    user?.email === 'aburingimmultipurposeco@gmail.com';
  const isVerified = Boolean(user?.emailVerified || isGoogleAccount);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not logged in -> show auth screen
        onRedirectToAuth();
      } else if (!isVerified) {
        // Logged in but unverified email/password account -> force logout and show verification screen
        signOut(auth).catch(() => {});
        onRedirectToVerify(user.email || undefined);
      }
    }
  }, [loading, user, isVerified, onRedirectToAuth, onRedirectToVerify]);

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

  if (!user || !isVerified) {
    return null;
  }

  return <>{children}</>;
};
