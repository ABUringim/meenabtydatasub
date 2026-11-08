import React, { useState } from 'react';
import { Modal } from '../../shared/Modal';
import { Transaction } from '../../../types';
import { useWallet } from '../../../context/WalletContext';
import { formatKoboToNgn } from '../../../lib/formatters';
import { AlertCircle, Send, CheckCircle2 } from 'lucide-react';

interface ReportIssueModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  transaction,
  isOpen,
  onClose,
}) => {
  const { createDispute } = useWallet();
  const [category, setCategory] = useState('Recipient did not receive airtime/data value');
  const [description, setDescription] = useState('');
  const [contactChannel, setContactChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    const fullText = `[Category: ${category}] [Contact via: ${contactChannel.toUpperCase()}]\n${description.trim()}`;
    await createDispute(transaction.reference, fullText);
    setIsSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setDescription('');
      onClose();
    }, 1500);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Report Transaction Issue"
      subtitle="Open an official investigation ticket with our 24/7 technical operations desk"
      maxWidth="md"
    >
      {submitted ? (
        <div className="py-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Dispute Ticket Logged Successfully</h4>
          <p className="text-xs text-slate-600 max-w-sm mx-auto">
            Reference <span className="font-mono font-bold">{transaction.reference}</span> is now under priority audit. Our team will update you shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Summary Card */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <p className="text-[11px] text-slate-500 font-medium">Order Reference</p>
              <p className="font-mono font-bold text-slate-900 mt-0.5">{transaction.reference}</p>
              <p className="text-[11px] text-slate-600 capitalize mt-0.5">
                {transaction.service} ({transaction.provider})
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-slate-500 font-medium">Amount</p>
              <p className="font-mono font-bold text-slate-900 mt-0.5">
                {formatKoboToNgn(transaction.amount)}
              </p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 capitalize">
                {transaction.status}
              </span>
            </div>
          </div>

          {/* Issue Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Issue Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            >
              <option value="Recipient did not receive airtime/data value">
                Recipient did not receive airtime/data value
              </option>
              <option value="Prepaid meter rejected 20-digit token">
                Prepaid meter rejected 20-digit token
              </option>
              <option value="Cable TV smartcard still scrambled/not activated">
                Cable TV smartcard still scrambled/not activated
              </option>
              <option value="Exam PIN could not be redeemed on portal">
                Exam PIN could not be redeemed on portal
              </option>
              <option value="Wallet debited but order marked failed">
                Wallet debited but order marked failed
              </option>
              <option value="Other technical inquiry">Other technical inquiry</option>
            </select>
          </div>

          {/* Detailed Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Describe the Problem in Detail <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any error message from the keypad, recipient network status, or pertinent observations..."
              className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden resize-none"
            />
          </div>

          {/* Preferred Resolution Channel */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Preferred Response Channel
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setContactChannel('whatsapp')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-colors flex items-center justify-center gap-1.5 ${
                  contactChannel === 'whatsapp'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <span>WhatsApp Notification</span>
              </button>
              <button
                type="button"
                onClick={() => setContactChannel('email')}
                className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-colors flex items-center justify-center gap-1.5 ${
                  contactChannel === 'email'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <span>Email Follow-up</span>
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !description.trim()}
              className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Dispute'}</span>
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
