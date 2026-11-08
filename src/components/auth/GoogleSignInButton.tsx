import React from 'react';

interface GoogleSignInButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  text?: string;
  className?: string;
}

/**
 * Official Google Sign-In Button compliant with Google Identity Brand Guidelines:
 * - White background (#ffffff)
 * - Border (#747775)
 * - Text color (#1F1F1F)
 * - Height: 48px on mobile, 40px on desktop
 * - Official Google 'G' icon served locally from /google-logo.svg
 * - Text: "Continue with Google"
 */
export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onClick,
  isLoading = false,
  disabled = false,
  text = 'Continue with Google',
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || isLoading}
      aria-label="Continue with Google"
      className={`w-full h-12 md:h-10 px-4 bg-white hover:bg-[#f8f9fa] active:bg-[#f1f3f4] text-[#1F1F1F] border border-[#747775] rounded-lg font-medium text-xs md:text-sm flex items-center justify-center gap-3 transition-colors shadow-2xs cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed select-none ${className}`}
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-[#4285F4]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-xs font-semibold text-slate-700">Connecting to Google...</span>
        </div>
      ) : (
        <>
          <img
            src="/google-logo.svg"
            alt="Google"
            className="w-4 h-4 md:w-4.5 md:h-4.5 shrink-0"
            width={18}
            height={18}
          />
          <span className="tracking-tight font-semibold">{text}</span>
        </>
      )}
    </button>
  );
};
