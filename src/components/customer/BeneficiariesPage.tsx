import React from 'react';
import { BeneficiariesTab } from '../dashboard/tabs/BeneficiariesTab';

interface BeneficiariesPageProps {
  onUseBeneficiary?: (serviceTab: string, prefill: any) => void;
}

export const BeneficiariesPage: React.FC<BeneficiariesPageProps> = ({ onUseBeneficiary }) => {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-bold text-slate-900">Saved Beneficiaries</h2>
        <p className="text-xs text-slate-500">
          Store frequently used phone numbers, electricity meter numbers, smartcards, and bank accounts
        </p>
      </div>

      <BeneficiariesTab onUseBeneficiary={onUseBeneficiary} />
    </div>
  );
};
