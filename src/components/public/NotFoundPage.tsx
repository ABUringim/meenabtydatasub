import React from 'react';
import { Home, ArrowLeft, Headphones } from 'lucide-react';

interface NotFoundPageProps {
  onNavigateHome?: () => void;
  onNavigateSupport?: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigateHome = () => {
    if (typeof window !== 'undefined') window.location.href = '/';
  },
  onNavigateSupport = () => {
    if (typeof window !== 'undefined') window.location.href = 'mailto:support@sayyadadatasub.shop';
  },
}) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 text-center shadow-lg space-y-6 animate-in zoom-in-95 duration-150">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 font-mono font-black text-2xl border border-emerald-200">
          404
        </div>

        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Page Not Found</h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            The page or digital service URL you requested does not exist or may have been relocated.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onNavigateHome}
            className="w-full sm:w-auto py-2.5 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Go to Homepage</span>
          </button>
          <button
            type="button"
            onClick={onNavigateSupport}
            className="w-full sm:w-auto py-2.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Headphones className="w-4 h-4" />
            <span>Contact Support</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
