import { storage } from '../../services/storage';
import { BlogPost, PostStatus } from '../../types';

export const adminPostsService = {
  /**
   * Helper to generate a clean URL slug from a title.
   */
  generateSlug(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  /**
   * Retrieves all blog posts across all statuses.
   */
  getPosts(): BlogPost[] {
    return storage.getBlogPosts();
  },

  /**
   * Subscribes to real-time changes on the blog posts collection.
   */
  subscribePosts(callback: (posts: BlogPost[]) => void): () => void {
    callback(storage.getBlogPosts());
    return storage.subscribeAdmin(() => {
      callback(storage.getBlogPosts());
    });
  },

  /**
   * Creates a new blog post.
   */
  async createPost(
    postData: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>,
    actorId: string,
    actorName: string
  ): Promise<BlogPost> {
    const slug = postData.slug?.trim() ? this.generateSlug(postData.slug) : this.generateSlug(postData.title);
    const now = new Date().toISOString();

    const newPost: BlogPost = {
      ...postData,
      id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      slug,
      status: postData.status || 'draft',
      createdAt: now,
      updatedAt: now,
      publishedAt: postData.status === 'published' ? (postData.publishedAt || now) : undefined,
      viewCount: 0,
      readTime: postData.readTime || '3 min read',
      authorId: postData.authorId || actorId,
      authorName: postData.authorName || actorName,
    };

    storage.saveBlogPost(newPost);
    storage.recordAdminActivity(
      actorId,
      actorName,
      'create_post',
      `posts/${newPost.id}`,
      null,
      newPost,
      'admin'
    );

    return newPost;
  },

  /**
   * Updates an existing blog post.
   */
  async updatePost(
    id: string,
    updates: Partial<BlogPost>,
    actorId: string,
    actorName: string
  ): Promise<BlogPost> {
    const existing = storage.getBlogPosts().find((p) => p.id === id);
    if (!existing) {
      throw new Error(`Blog post ${id} not found`);
    }

    const before = { ...existing };
    const now = new Date().toISOString();

    const merged: BlogPost = {
      ...existing,
      ...updates,
      slug: updates.title && !updates.slug ? this.generateSlug(updates.title) : (updates.slug || existing.slug),
      updatedAt: now,
      publishedAt:
        updates.status === 'published' && !existing.publishedAt
          ? now
          : updates.publishedAt || existing.publishedAt,
    };

    storage.saveBlogPost(merged);
    storage.recordAdminActivity(
      actorId,
      actorName,
      'update_post',
      `posts/${id}`,
      before,
      merged,
      'admin'
    );

    return merged;
  },

  /**
   * Sets post status to published.
   */
  async publishPost(id: string, actorId: string, actorName: string): Promise<BlogPost> {
    return this.updatePost(
      id,
      {
        status: 'published',
        publishedAt: new Date().toISOString(),
      },
      actorId,
      actorName
    );
  },

  /**
   * Archives a post (soft delete).
   */
  async archivePost(id: string, actorId: string, actorName: string): Promise<BlogPost> {
    return this.updatePost(
      id,
      {
        status: 'archived',
      },
      actorId,
      actorName
    );
  },

  /**
   * Permanently deletes a blog post.
   */
  async deletePost(id: string, actorId: string, actorName: string): Promise<void> {
    const existing = storage.getBlogPosts().find((p) => p.id === id);
    storage.deleteBlogPost(id);
    storage.recordAdminActivity(
      actorId,
      actorName,
      'delete_post',
      `posts/${id}`,
      existing,
      null,
      'admin'
    );
  },
};
