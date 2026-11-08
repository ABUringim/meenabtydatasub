import React from 'react';
import { useAuth } from '../lib/auth';

interface AuthRouteProps {
  children: React.ReactNode;
  onRedirectToDashboard: () => void;
}

export const AuthRoute: React.FC<AuthRouteProps> = ({
  children,
  onRedirectToDashboard,
}) => {
  const { user, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && user?.emailVerified) {
      onRedirectToDashboard();
    }
  }, [loading, user, onRedirectToDashboard]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-3 border-emerald-600 border-t-transparent animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Validating credentials...</span>
        </div>
      </div>
    );
  }

  if (user?.emailVerified) {
    return null;
  }

  return <>{children}</>;
};
