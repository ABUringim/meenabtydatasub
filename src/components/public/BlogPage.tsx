import React, { useState } from 'react';
import { usePosts } from '../../hooks/usePosts';
import { BlogPost } from '../../types';
import { formatWATDate } from '../../lib/formatters';
import { Modal } from '../shared/Modal';
import { BookOpen, Clock, ArrowRight, Calendar, User, Tag, Sparkles } from 'lucide-react';

export const BlogPage: React.FC<{ onNavigateToService: (service: string) => void }> = ({
  onNavigateToService,
}) => {
  const { posts } = usePosts();
  const [selectedArticle, setSelectedArticle] = useState<BlogPost | null>(null);

  // Filter to published articles only (status === "published" or published === true)
  const publishedPosts = posts.filter(
    (p) => p.status === 'published' || p.published === true
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-3 border border-emerald-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Telecom & Fintech Insights</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Meenabty Knowledge Base & Guides
        </h1>
        <p className="text-sm text-slate-500 mt-2">
          Official telecom updates, electricity tariff guides, and digital payment security articles.
        </p>
      </div>

      {publishedPosts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-md mx-auto space-y-3">
          <BookOpen className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">No published articles yet</h3>
          <p className="text-xs text-slate-500">
            Articles authored in the Admin CMS will appear live here immediately upon publication.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {publishedPosts.map((art) => (
            <article
              key={art.id}
              onClick={() => setSelectedArticle(art)}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-emerald-600 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2.5">
                  <span className="font-semibold text-emerald-800">{art.category}</span>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="w-3 h-3" />
                    {art.readTime || '4 min read'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{formatWATDate(art.publishedAt || art.createdAt || art.created_at)}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors leading-snug">
                  {art.title}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                  {art.excerpt || art.summary || art.content.slice(0, 160)}
                </p>
                {art.tags && art.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {art.tags.slice(0, 3).map((t) => (
                      <span key={t} className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">By {art.authorName || 'Meenabty Editorial'}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedArticle(art);
                  }}
                  className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
                >
                  <span>Read Article</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Article Detail Reading Modal */}
      <Modal
        isOpen={Boolean(selectedArticle)}
        onClose={() => setSelectedArticle(null)}
        title={selectedArticle?.title || 'Article'}
        subtitle={`Category: ${selectedArticle?.category} · Author: ${selectedArticle?.authorName || 'Meenabty Operations'}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs text-slate-700 leading-relaxed max-h-[70vh] overflow-y-auto pr-1">
          {selectedArticle?.coverImageUrl && (
            <img
              src={selectedArticle.coverImageUrl}
              alt={selectedArticle.title}
              className="w-full h-52 object-cover rounded-xl border border-slate-200"
            />
          )}

          <div className="flex items-center gap-3 text-[11px] text-slate-400 border-b border-slate-100 pb-2">
            <span>Published: {selectedArticle ? formatWATDate(selectedArticle.publishedAt || selectedArticle.createdAt || selectedArticle.created_at) : ''}</span>
            <span>·</span>
            <span>{selectedArticle?.readTime || '4 min read'}</span>
          </div>

          <div className="text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
            {selectedArticle?.content}
          </div>

          {selectedArticle?.tags && selectedArticle.tags.length > 0 && (
            <div className="pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500">Related Tags:</span>
              {selectedArticle.tags.map((t) => (
                <span key={t} className="px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded-md text-[11px]">
                  #{t}
                </span>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setSelectedArticle(null)}
              className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedArticle(null);
                onNavigateToService('service-data');
              }}
              className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs"
            >
              <span>Vend Telecom Services</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
