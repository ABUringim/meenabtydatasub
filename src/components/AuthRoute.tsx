import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';

interface AuthRouteProps {
  children: React.ReactNode;
  onRedirectToDashboard: () => void;
}

export const AuthRoute: React.FC<AuthRouteProps> = ({
  children,
  onRedirectToDashboard,
}) => {
  const { loading: contextLoading } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: FirebaseUser | null) => {
      setChecking(false);
      if (user && user.emailVerified) {
        onRedirectToDashboard();
      }
    });

    return () => unsubscribe();
  }, [onRedirectToDashboard]);

  const isLoading = checking || contextLoading;

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-3 border-emerald-600 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Validating credentials...</span>
        </div>
      </div>
    );
  }

  if (auth.currentUser && auth.currentUser.emailVerified) {
    return null;
  }

  return <>{children}</>;
};
