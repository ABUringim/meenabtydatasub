import React, { useState, useEffect } from 'react';
import { BlogPost, PostStatus } from '../../../types';
import { adminPostsService } from '../../../lib/admin/adminPosts';
import { Modal } from '../../shared/Modal';
import { Sparkles, Globe, Tag, Image, Clock, Save, X } from 'lucide-react';

interface PostEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: BlogPost | null;
  actorId: string;
  actorName: string;
  onSaved: (post: BlogPost) => void;
}

export const PostEditorModal: React.FC<PostEditorModalProps> = ({
  isOpen,
  onClose,
  post,
  actorId,
  actorName,
  onSaved,
}) => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Telecom & Data');
  const [readTime, setReadTime] = useState('4 min read');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [status, setStatus] = useState<PostStatus>('draft');
  const [tagsInput, setTagsInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'content' | 'seo' | 'preview'>('content');
  const [isSaving, setIsSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);

  useEffect(() => {
    if (post) {
      setTitle(post.title || '');
      setSlug(post.slug || '');
      setCategory(post.category || 'Telecom & Data');
      setReadTime(post.readTime || '4 min read');
      setExcerpt(post.excerpt || post.summary || '');
      setContent(post.content || '');
      setCoverImageUrl(post.coverImageUrl || post.coverImage || '');
      setStatus(post.status || (post.published ? 'published' : 'draft'));
      setTags(post.tags || []);
      setTagsInput((post.tags || []).join(', '));
      setSeoTitle(post.seoTitle || '');
      setSeoDescription(post.seoDescription || '');
      setAutoSlug(false);
    } else {
      setTitle('');
      setSlug('');
      setCategory('Telecom & Data');
      setReadTime('4 min read');
      setExcerpt('');
      setContent('');
      setCoverImageUrl('');
      setStatus('draft');
      setTags([]);
      setTagsInput('');
      setSeoTitle('');
      setSeoDescription('');
      setAutoSlug(true);
    }
  }, [post, isOpen]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (autoSlug) {
      setSlug(adminPostsService.generateSlug(val));
    }
    if (!seoTitle) {
      setSeoTitle(val);
    }
  };

  const handleTagsKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagsInput.trim().replace(/^,+|,+$/g, '');
      if (newTag && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setTagsInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSaving(true);
    try {
      const finalSlug = slug.trim() || adminPostsService.generateSlug(title);
      const postPayload = {
        title: title.trim(),
        slug: finalSlug,
        category,
        readTime,
        summary: excerpt.trim() || title.trim(),
        excerpt: excerpt.trim(),
        content: content.trim(),
        coverImageUrl: coverImageUrl.trim(),
        coverImage: coverImageUrl.trim(),
        status,
        published: status === 'published',
        tags,
        seoTitle: seoTitle.trim() || title.trim(),
        seoDescription: seoDescription.trim() || excerpt.trim(),
        authorId: post?.authorId || actorId,
        authorName: post?.authorName || actorName,
        created_at: post?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let saved: BlogPost;
      if (post) {
        saved = await adminPostsService.updatePost(post.id, postPayload, actorId, actorName);
      } else {
        saved = await adminPostsService.createPost(postPayload, actorId, actorName);
      }

      onSaved(saved);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={post ? 'Edit Blog Publication' : 'Compose Blog Article'}
      subtitle="Publish guides, telecom tutorials, and official platform announcements"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sub-tab navigation */}
        <div className="flex border-b border-slate-800 text-xs font-semibold gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('content')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeSubTab === 'content'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Article Content
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('seo')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeSubTab === 'seo'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            SEO & Social Metadata
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('preview')}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              activeSubTab === 'preview'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Reader Preview
          </button>
        </div>

        {activeSubTab === 'content' && (
          <div className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Article Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="e.g. How to Resolve Meter STS Token Errors on KEDCO"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">URL Slug</label>
                  <button
                    type="button"
                    onClick={() => {
                      setAutoSlug(!autoSlug);
                      if (!autoSlug) setSlug(adminPostsService.generateSlug(title));
                    }}
                    className="text-[10px] text-emerald-400 hover:underline"
                  >
                    {autoSlug ? 'Lock Slug' : 'Auto-generate'}
                  </button>
                </div>
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-400">
                  <span className="text-slate-500 shrink-0">/blog/</span>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => {
                      setAutoSlug(false);
                      setSlug(e.target.value);
                    }}
                    className="w-full bg-transparent text-white focus:outline-hidden ml-1 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  <option value="Telecom & Data">Telecom & Data</option>
                  <option value="Electricity Bills">Electricity Bills</option>
                  <option value="Exam PINs">Exam PINs</option>
                  <option value="Fintech & Wallets">Fintech & Wallets</option>
                  <option value="Security & KYC">Security & KYC</option>
                  <option value="Platform Updates">Platform Updates</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Estimated Read Time</label>
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs">
                  <Clock className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="text"
                    required
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    placeholder="e.g. 4 min read"
                    className="w-full bg-transparent text-white focus:outline-hidden text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Cover Image URL</label>
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs">
                  <Image className="w-3.5 h-3.5 text-slate-400 mr-2 shrink-0" />
                  <input
                    type="url"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-transparent text-white focus:outline-hidden text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Summary / Lead Excerpt</label>
              <textarea
                rows={2}
                required
                value={excerpt}
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  if (!seoDescription) setSeoDescription(e.target.value);
                }}
                placeholder="A compelling 1-2 sentence lead for cards and social sharing..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Article Content (Markdown supported)</label>
              <textarea
                rows={7}
                required
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write article content here..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tags (Press Enter or comma to add)</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium flex items-center gap-1 border border-slate-700"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="text-slate-400 hover:text-rose-400"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                onKeyDown={handleTagsKeyDown}
                placeholder="e.g. mtn, airtime, vtu, kedco"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>
          </div>
        )}

        {activeSubTab === 'seo' && (
          <div className="space-y-4">
            <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-xl text-xs text-indigo-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">Search Engine & OpenGraph Optimization</p>
                <p className="text-[11px] text-indigo-300/90 mt-0.5">
                  These metadata tags are dynamically ingested by Google Search, Twitter Cards, and WhatsApp previews.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                SEO Meta Title <span className="text-slate-500 font-normal">({seoTitle.length}/60 chars)</span>
              </label>
              <input
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                maxLength={70}
                placeholder="Sayyada Datasub | Guide Title"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                SEO Meta Description <span className="text-slate-500 font-normal">({seoDescription.length}/160 chars)</span>
              </label>
              <textarea
                rows={3}
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                maxLength={180}
                placeholder="High-CTR summary for Google SERP snippet..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
              />
            </div>

            {/* Google SERP Card Preview */}
            <div className="p-3 bg-white rounded-xl text-slate-900 space-y-1">
              <span className="text-[10px] text-slate-500 font-mono">https://sayyadadatasub.com/blog/{slug || 'post-slug'}</span>
              <p className="text-sm font-semibold text-blue-700 hover:underline cursor-pointer line-clamp-1">
                {seoTitle || title || 'Article Title Preview'}
              </p>
              <p className="text-xs text-slate-600 line-clamp-2">
                {seoDescription || excerpt || 'Article description preview will appear here on search results.'}
              </p>
            </div>
          </div>
        )}

        {activeSubTab === 'preview' && (
          <div className="space-y-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
            {coverImageUrl && (
              <img
                src={coverImageUrl}
                alt={title}
                className="w-full h-44 object-cover rounded-lg border border-slate-800"
              />
            )}
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                {category}
              </span>
              <h1 className="text-lg font-bold text-white mt-1.5">{title || 'Untitled Article'}</h1>
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                <span>By {post?.authorName || actorName}</span>
                <span>•</span>
                <span>{readTime}</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 italic font-serif border-l-2 border-emerald-500 pl-3">
              {excerpt || 'Lead excerpt goes here...'}
            </p>
            <div className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {content || 'Article content will be rendered here.'}
            </div>
          </div>
        )}

        {/* Footer publication status selector + actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300">Status:</span>
            <div className="flex gap-1.5">
              {(['draft', 'published', 'archived'] as PostStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatus(st)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold capitalize transition-all ${
                    status === st
                      ? st === 'published'
                        ? 'bg-emerald-600 text-white'
                        : st === 'draft'
                        ? 'bg-amber-600 text-white'
                        : 'bg-rose-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="py-2 px-3 bg-slate-800 text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : post ? 'Update Article' : 'Publish Article'}</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
