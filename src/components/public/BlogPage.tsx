import React from 'react';
import { BookOpen, Clock, ArrowRight } from 'lucide-react';

export const BlogPage: React.FC<{ onNavigateToService: (service: string) => void }> = ({
  onNavigateToService,
}) => {
  const articles = [
    {
      id: 1,
      title: 'How to Save up to 40% on MTN, Airtel & Glo SME Data in Nigeria',
      category: 'Telecom & Data',
      readTime: '4 min read',
      date: 'November 2026',
      summary:
        'Understanding the technical differences between SME Data, Corporate Gifting (CG), and direct retail gifting. Discover why SME data offers 30 days validity at a fraction of telco rack rates.',
      serviceLink: 'service-data',
    },
    {
      id: 2,
      title: 'Prepaid vs Postpaid Meter Tokens: Solving the Common Keypad Error Codes',
      category: 'Electricity Bills',
      readTime: '6 min read',
      date: 'October 2026',
      summary:
        'A comprehensive guide for Nigerian homeowners and tenants dealing with IKEDC, KEDCO, and AEDC prepaid meters. How key change tokens work and what to do if your token fails to load.',
      serviceLink: 'service-electricity',
    },
    {
      id: 3,
      title: 'The Complete 2026 Guide to WAEC, NECO & JAMB UTME e-PIN Vending',
      category: 'Education & Exams',
      readTime: '5 min read',
      date: 'September 2026',
      summary:
        'Everything you need to know about purchasing and verifying official WAEC result checker PINs and JAMB registration profile codes without visiting cyber cafes.',
      serviceLink: 'service-exam',
    },
    {
      id: 4,
      title: 'Atomic Transactions & Idempotency: Why Sayyada Guarantees Zero Double-Charges',
      category: 'Fintech Engineering',
      readTime: '5 min read',
      date: 'August 2026',
      summary:
        'How our server-side Firebase Cloud Functions and Firestore atomic transactions prevent double-debits during Nigerian telecommunications operator timeouts.',
      serviceLink: 'rates',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Sayyada Telecom & Fintech Insights
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Guides, market rate analyses, and engineering articles for Nigerian digital payment consumers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {articles.map((art) => (
          <article
            key={art.id}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2.5">
                <span className="font-semibold text-emerald-800">{art.category}</span>
                <span aria-hidden="true">·</span>
                <span>{art.date}</span>
                <span aria-hidden="true">·</span>
                <span>{art.readTime}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">{art.title}</h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed">{art.summary}</p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">Official Editorial</span>
              <button
                onClick={() => onNavigateToService(art.serviceLink)}
                className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
              >
                <span>Read & Vend</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
