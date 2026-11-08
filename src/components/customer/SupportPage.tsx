import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { formatWATDate } from '../../lib/formatters';
import { StatusBadge } from '../shared/StatusBadge';
import { HelpCircle, AlertTriangle, Send, CheckCircle2, MessageSquare } from 'lucide-react';

interface SupportPageProps {
  initialRef?: string;
}

export const SupportPage: React.FC<SupportPageProps> = ({ initialRef = '' }) => {
  const { disputes, createDispute } = useWallet();

  const [reference, setReference] = useState(initialRef);
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim() || !description.trim()) return;
    setIsLoading(true);
    const ok = await createDispute(reference.trim(), description.trim());
    setIsLoading(false);
    if (ok) {
      setSuccessMsg(true);
      setReference('');
      setDescription('');
      setTimeout(() => setSuccessMsg(false), 4000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-900">Support & Dispute Resolution</h2>
        <p className="text-xs text-slate-500">
          Raise issues on delayed or failed vending. All disputes are reviewed by our operations desk.
        </p>
      </div>

      {/* New Dispute Ticket Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h3 className="text-sm font-bold text-slate-900">Open a Dispute Ticket</h3>
        </div>

        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Dispute logged successfully. Ticket ID assigned.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Transaction Reference (e.g. SD_TXN_...)
            </label>
            <input
              type="text"
              required
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. SD_AIRTIME_XXXXX or SD_ELEC_XXXXX"
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description of the Issue
            </label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Purchased 1GB MTN data but recipient line has not received it after 30 minutes..."
              className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="py-2.5 px-5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-2 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Submitting...' : 'Submit Dispute'}</span>
          </button>
        </form>
      </div>

      {/* Existing Dispute Tickets */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Your Dispute History</h3>
          </div>
          <span className="text-xs text-slate-400">{disputes.length} ticket(s)</span>
        </div>

        {disputes.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No dispute tickets raised. Everything is running smoothly!
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {disputes.map((d) => (
              <div key={d.id} className="p-4 space-y-2 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-900">{d.transaction_ref}</span>
                    <span className="text-[11px] text-slate-400">· {formatWATDate(d.created_at)}</span>
                  </div>
                  <StatusBadge status={d.status} />
                </div>
                <p className="text-xs text-slate-700">{d.description}</p>
                {d.admin_notes && (
                  <div className="p-2.5 bg-slate-100 rounded-lg text-xs text-slate-800">
                    <span className="font-semibold text-slate-900">Admin Response: </span>
                    {d.admin_notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
