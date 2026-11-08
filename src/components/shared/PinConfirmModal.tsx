import React, { useState } from 'react';
import { Modal } from './Modal';
import { ShieldCheck, AlertCircle } from 'lucide-react';
import { formatKoboToNgn } from '../../lib/formatters';

interface PinConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  amountKobo: number;
  recipientDescription: string;
  isLoading?: boolean;
}

export const PinConfirmModal: React.FC<PinConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Transaction PIN',
  amountKobo,
  recipientDescription,
  isLoading = false,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setError('Please enter your 4-digit security PIN');
      return;
    }
    // Default demo PIN is 1234 or any 4 digits
    onConfirm();
    setPin('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle="Enter your 4-digit transaction PIN to authorize" maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-center">
          <p className="text-xs text-slate-500 font-medium">Total Deduction</p>
          <p className="text-2xl font-bold font-mono text-slate-900 mt-1">{formatKoboToNgn(amountKobo)}</p>
          <p className="text-xs text-slate-600 mt-1.5 truncate">{recipientDescription}</p>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center items-center gap-3 py-2">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin.length > idx
                  ? 'bg-emerald-600 border-emerald-600 scale-110'
                  : 'bg-white border-slate-300'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-2 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((item, index) => {
            if (item === '') return <div key={index} />;
            if (item === '⌫') {
              return (
                <button
                  key={index}
                  type="button"
                  onClick={handleBackspace}
                  className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors flex items-center justify-center text-sm"
                >
                  Delete
                </button>
              );
            }
            return (
              <button
                key={index}
                type="button"
                onClick={() => handleDigit(item)}
                className="py-3 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-mono text-lg font-bold rounded-lg transition-colors"
              >
                {item}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pin.length !== 4 || isLoading}
            className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-1.5"
          >
            {isLoading ? (
              <span>Authorizing...</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Confirm Payment</span>
              </>
            )}
          </button>
        </div>

        <p className="text-[11px] text-center text-slate-400">
          Demo Default PIN: any 4 digits (e.g. 1234)
        </p>
      </form>
    </Modal>
  );
};
