import React from 'react';
import { AuthPages } from '../components/public/AuthPages';

interface AuthPageProps {
  initialMode?: 'login' | 'register' | 'forgot';
  verifiedSuccessNotice?: boolean;
  onSuccess: () => void;
  onNavigateMode?: (mode: 'login' | 'register' | 'forgot') => void;
  onRequireVerification?: (email: string, password?: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  verifiedSuccessNotice = false,
  onSuccess,
  onNavigateMode = () => {},
  onRequireVerification = () => {},
}) => {
  return (
    <AuthPages
      initialMode={initialMode}
      verifiedSuccessNotice={verifiedSuccessNotice}
      onSuccess={onSuccess}
      onNavigateMode={onNavigateMode}
      onRequireVerification={onRequireVerification}
    />
  );
};

export default AuthPage;
