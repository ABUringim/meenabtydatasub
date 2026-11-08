import React from 'react';
import { VerifyEmailPage } from '../components/public/VerifyEmailPage';

interface VerifyEmailPageWrapperProps {
  email?: string;
  initialPassword?: string;
  onNavigateToLogin: () => void;
  onNavigateToDashboard: () => void;
}

export const VerifyEmailPageWrapper: React.FC<VerifyEmailPageWrapperProps> = (props) => {
  return <VerifyEmailPage {...props} />;
};

export default VerifyEmailPage;
