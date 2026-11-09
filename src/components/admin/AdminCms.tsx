import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePosts } from '../../hooks/usePosts';
import { BlogPost, PostStatus } from '../../types';
import { formatWATDate } from '../../lib/formatters';
import { PostEditorModal } from './modals/PostEditorModal';
import { Modal } from '../shared/Modal';
import { storage } from '../../services/storage';
import {
  FileText,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  Eye,
  Megaphone,
  Search,
  Archive,
  Send,
  Sparkles,
} from 'lucide-react';

export const AdminCms: React.FC = () => {
  const { user } = useAuth();
  const { posts, loading, publishPost, archivePost, deletePost } = usePosts();
  const [activeTab, setActiveTab] = useState<'blog' | 'banner'>('blog');
  const [statusFilter, setStatusFilter] = useState<'all' | PostStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Post Editor Modal
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // In-app Delete Confirmation Modal (Zero browser confirm)
  const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Platform banner state
  const [bannerActive, setBannerActive] = useState(false);
  const [bannerText, setBannerText] = useState(
    'Special Promo: Enjoy 0% service charge on all electricity DisCo bill settlements this week!'
  );
  const [bannerTheme, setBannerTheme] = useState<'emerald' | 'amber' | 'indigo'>('emerald');

  const showToast = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleOpenNew = () => {
    setEditingPost(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (p: BlogPost) => {
    setEditingPost(p);
    setIsEditorOpen(true);
  };

  const handlePublishClick = async (p: BlogPost) => {
    await publishPost(p.id, user?.uid || 'admin', user?.name || 'Administrator');
    showToast(`Article "${p.title}" published live.`);
  };

  const handleArchiveClick = async (p: BlogPost) => {
    await archivePost(p.id, user?.uid || 'admin', user?.name || 'Administrator');
    showToast(`Article "${p.title}" archived.`);
  };

  const handleConfirmDelete = async () => {
    if (!postToDelete) return;
    setIsDeleting(true);
    try {
      await deletePost(postToDelete.id, user?.uid || 'admin', user?.name || 'Administrator');
      showToast(`Article "${postToDelete.title}" permanently deleted.`);
      setPostToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    storage.recordAdminActivity(
      user?.uid || 'admin',
      user?.name || 'Administrator',
      'update_banner',
      'settings/platform',
      null,
      { active: bannerActive, text: bannerText, theme: bannerTheme },
      user?.role
    );
    showToast('Platform global announcement banner successfully published.');
  };

  const filteredPosts = posts.filter((p) => {
    const postStatus: PostStatus = p.status || (p.published ? 'published' : 'draft');
    const matchesStatus = statusFilter === 'all' || postStatus === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Content & CMS Management Suite
          </h2>
          <p className="text-xs text-slate-400">
            Publish educational telecom guides, configure SEO metadata, and manage broadcast announcement banners
          </p>
        </div>

        {activeTab === 'blog' && (
          <button
            onClick={handleOpenNew}
            className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Article</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-700 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('blog')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'blog'
              ? 'border-emerald-500 text-emerald-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Blog & Telecom Guides ({posts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('banner')}
          className={`pb-3 px-4 flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'banner'
              ? 'border-emerald-500 text-emerald-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Broadcast Announcement Banner</span>
        </button>
      </div>

      {activeTab === 'blog' ? (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search articles by title, category, or tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="flex gap-2">
              {(['all', 'published', 'draft', 'archived'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                    statusFilter === st
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-850'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold">
                    <th className="py-3 px-4">Title & Slug</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Read Time</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Author</th>
                    <th className="py-3 px-4">Last Updated</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        {loading ? 'Loading blog publications...' : 'No articles matching search query.'}
                      </td>
                    </tr>
                  ) : (
                    filteredPosts.map((p) => {
                      const postStatus: PostStatus = p.status || (p.published ? 'published' : 'draft');
                      return (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 max-w-sm">
                            <p className="font-bold text-white line-clamp-1">{p.title}</p>
                            <span className="text-[10px] text-slate-400 font-mono">/blog/{p.slug}</span>
                            {p.tags && p.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {p.tags.slice(0, 3).map((t) => (
                                  <span key={t} className="text-[9px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded">
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-300 font-medium">{p.category}</td>
                          <td className="py-3 px-4 text-slate-400 font-mono">{p.readTime}</td>
                          <td className="py-3 px-4">
                            {postStatus === 'published' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                Published
                              </span>
                            ) : postStatus === 'archived' ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                Archived
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                Draft
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px]">{p.authorName || 'Admin'}</td>
                          <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                            {formatWATDate(p.updatedAt || p.updated_at)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {postStatus !== 'published' && (
                                <button
                                  onClick={() => handlePublishClick(p)}
                                  className="p-1 text-slate-400 hover:text-emerald-400"
                                  title="Publish Live"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {postStatus === 'published' && (
                                <button
                                  onClick={() => handleArchiveClick(p)}
                                  className="p-1 text-slate-400 hover:text-amber-400"
                                  title="Archive Article"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleOpenEdit(p)}
                                className="p-1 text-slate-400 hover:text-white"
                                title="Edit Article"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setPostToDelete(p)}
                                className="p-1 text-slate-400 hover:text-rose-400"
                                title="Delete Article"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSaveBanner}
          className="max-w-2xl bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Top Banner Broadcast</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Displayed above the navigation bar for all platform visitors and customers
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-semibold text-slate-300">Active</span>
              <input
                type="checkbox"
                checked={bannerActive}
                onChange={(e) => setBannerActive(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-950 border-slate-700"
              />
            </label>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Announcement Copy</label>
              <textarea
                rows={3}
                required
                value={bannerText}
                onChange={(e) => setBannerText(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Color Theme</label>
              <div className="flex gap-3">
                {(['emerald', 'amber', 'indigo'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setBannerTheme(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize border transition-all ${
                      bannerTheme === t
                        ? 'border-emerald-400 text-white bg-slate-800'
                        : 'border-slate-800 text-slate-400 bg-slate-950'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
          >
            Save & Publish Announcement
          </button>
        </form>
      )}

      {/* Post Editor Modal */}
      <PostEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        post={editingPost}
        actorId={user?.uid || 'admin'}
        actorName={user?.name || 'Administrator'}
        onSaved={(saved) => {
          showToast(`Article "${saved.title}" saved successfully.`);
        }}
      />

      {/* Delete Confirmation In-App Modal (Zero Browser Confirm) */}
      <Modal
        isOpen={!!postToDelete}
        onClose={() => setPostToDelete(null)}
        title="Confirm Article Deletion"
        subtitle="This action permanently deletes the article from the public portal"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Are you sure you want to permanently delete <strong className="text-white">{postToDelete?.title}</strong>?
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setPostToDelete(null)}
              className="py-2 px-3 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="py-2 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs"
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
