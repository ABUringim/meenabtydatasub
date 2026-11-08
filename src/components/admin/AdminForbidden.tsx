import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../services/storage';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';

interface AdminForbiddenProps {
  onReturnToDashboard: () => void;
}

export const AdminForbidden: React.FC<AdminForbiddenProps> = ({ onReturnToDashboard }) => {
  const { user } = useAuth();

  useEffect(() => {
    // Record unauthorized attempt in audit logs
    storage.recordAuditLog(
      user?.uid || 'anonymous',
      user?.email || 'unauthenticated',
      'UNAUTHORIZED_ADMIN_ROUTE_ATTEMPT',
      'Attempted unauthorized access to /admin/*',
      null,
      null,
      user?.role || 'customer'
    );
  }, [user]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-xl p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            HTTP 403 FORBIDDEN
          </span>
          <h1 className="text-xl font-extrabold text-slate-900 mt-2">
            Administrative Access Restricted
          </h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            This management zone is strictly reserved for authorized platform staff and owners.
            Your customer identity ({user?.email || 'Guest'}) has been logged for security monitoring.
          </p>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-600 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Zero-Trust Security Enforcement</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Role validation is enforced server-side. Repeated unauthorized attempts will flag the account for automated security review.
          </p>
        </div>

        <button
          onClick={onReturnToDashboard}
          className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Customer Dashboard</span>
        </button>
      </div>
    </div>
  );
};
