import { useState, useEffect } from 'react';
import { adminPostsService } from '../lib/admin/adminPosts';
import { BlogPost } from '../types';

export function usePosts() {
  const [posts, setPosts] = useState<BlogPost[]>(() => adminPostsService.getPosts());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = adminPostsService.subscribePosts((allPosts) => {
      setPosts(allPosts);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const createPost = async (
    data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt' | 'viewCount'>,
    actorId: string,
    actorName: string
  ) => {
    setLoading(true);
    try {
      const created = await adminPostsService.createPost(data, actorId, actorName);
      return created;
    } finally {
      setLoading(false);
    }
  };

  const updatePost = async (
    id: string,
    updates: Partial<BlogPost>,
    actorId: string,
    actorName: string
  ) => {
    setLoading(true);
    try {
      const updated = await adminPostsService.updatePost(id, updates, actorId, actorName);
      return updated;
    } finally {
      setLoading(false);
    }
  };

  const publishPost = async (id: string, actorId: string, actorName: string) => {
    setLoading(true);
    try {
      const published = await adminPostsService.publishPost(id, actorId, actorName);
      return published;
    } finally {
      setLoading(false);
    }
  };

  const archivePost = async (id: string, actorId: string, actorName: string) => {
    setLoading(true);
    try {
      const archived = await adminPostsService.archivePost(id, actorId, actorName);
      return archived;
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id: string, actorId: string, actorName: string) => {
    setLoading(true);
    try {
      await adminPostsService.deletePost(id, actorId, actorName);
    } finally {
      setLoading(false);
    }
  };

  return {
    posts,
    loading,
    createPost,
    updatePost,
    publishPost,
    archivePost,
    deletePost,
  };
}
