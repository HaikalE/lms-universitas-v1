import api from './api';
import { ApiResponse, ForumPost, ForumReply } from '../types';

// ✅ FIXED: Forum service with proper validation and clean implementation
export const forumService = {
  // ✅ GET: Forum posts for a course
  getForumPosts: async (courseId: string, params?: any): Promise<ApiResponse<ForumPost[]>> => {
    try {
      const response = await api.get(`/forums/course/${courseId}`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ✅ GET: Single forum post
  getForumPost: async (id: string): Promise<ApiResponse<ForumPost>> => {
    try {
      const response = await api.get(`/forums/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ✅ GET: Forum replies
  getForumReplies: async (postId: string, params?: any): Promise<ApiResponse<ForumReply[]>> => {
    try {
      const response = await api.get(`/forums/${postId}/replies`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ✅ GET: My discussions
  getMyDiscussions: async (): Promise<ForumPost[]> => {
    try {
      const response = await api.get('/forums/my-discussions');
      return response.data.data || response.data;
    } catch (error) {
      throw error;
    }
  },

  // ✅ FIXED: Create forum post with proper validation
  createPost: async (postData: {
    title: string;
    content: string;
    courseId: string;
    type?: string;
    parentId?: string;
  }): Promise<ForumPost> => {
    try {
      // ✅ CLIENT-SIDE VALIDATION
      if (!postData.title?.trim()) {
        throw new Error('Judul post wajib diisi');
      }
      if (!postData.content?.trim()) {
        throw new Error('Konten post wajib diisi');
      }
      if (!postData.courseId?.trim()) {
        throw new Error('Course ID wajib diisi');
      }

      // ✅ VALIDATE UUID FORMAT
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(postData.courseId.trim())) {
        throw new Error('Course ID harus berupa UUID yang valid');
      }

      // ✅ CLEAN DATA BEFORE SENDING
      const cleanData = {
        title: postData.title.trim(),
        content: postData.content.trim(),
        courseId: postData.courseId.trim(),
        type: postData.type || 'discussion',
        ...(postData.parentId && { parentId: postData.parentId.trim() })
      };

      const response = await api.post('/forums', cleanData);
      return response.data.data || response.data;
    } catch (error) {
      throw error;
    }
  },

  // ✅ LEGACY ALIAS: Keep backward compatibility
  createForumPost: async (postData: any): Promise<ForumPost> => {
    return forumService.createPost(postData);
  },

  // ✅ UPDATE: Forum post
  updateForumPost: async (id: string, postData: any): Promise<ForumPost> => {
    try {
      const response = await api.patch(`/forums/${id}`, postData);
      return response.data.data || response.data;
    } catch (error) {
      throw error;
    }
  },

  // ✅ DELETE: Forum post
  deleteForumPost: async (id: string): Promise<void> => {
    try {
      await api.delete(`/forums/${id}`);
    } catch (error) {
      throw error;
    }
  },

  // ✅ CREATE: Reply
  createReply: async (postId: string, replyData: any): Promise<ApiResponse<ForumReply>> => {
    try {
      if (!replyData.content?.trim()) {
        throw new Error('Konten balasan wajib diisi');
      }

      const cleanData = {
        content: replyData.content.trim(),
        ...(replyData.parentId && { parentId: replyData.parentId })
      };

      const response = await api.post(`/forums/${postId}/replies`, cleanData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ✅ UPDATE: Reply
  updateReply: async (replyId: string, replyData: any): Promise<ForumReply> => {
    try {
      const response = await api.patch(`/forums/replies/${replyId}`, replyData);
      return response.data.data || response.data;
    } catch (error) {
      throw error;
    }
  },

  // ✅ DELETE: Reply
  deleteReply: async (replyId: string): Promise<void> => {
    try {
      await api.delete(`/forums/replies/${replyId}`);
    } catch (error) {
      throw error;
    }
  },

  // ✅ FIXED: Like system with proper toggle
  toggleLike: async (id: string): Promise<{
    success: boolean;
    message: string;
    likesCount: number;
    isLiked: boolean;
  }> => {
    try {
      const response = await api.post(`/forums/${id}/like`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ✅ LEGACY ALIASES: Keep backward compatibility
  likePost: async (postId: string): Promise<any> => {
    return forumService.toggleLike(postId);
  },

  likeReply: async (replyId: string): Promise<any> => {
    try {
      const response = await api.post(`/forums/replies/${replyId}/like`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ✅ VIEW: Mark as viewed (silent failure)
  markPostAsViewed: async (postId: string): Promise<void> => {
    try {
      await api.post(`/forums/${postId}/view`);
    } catch (error) {
      // Silent failure for view tracking
    }
  },

  // ✅ ANSWER: Mark as answer
  markAsAnswer: async (postId: string, replyId: string): Promise<any> => {
    try {
      const response = await api.patch(`/forums/${postId}/answer/${replyId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ✅ PIN: Toggle pin
  togglePin: async (id: string): Promise<{
    success: boolean;
    message: string;
    isPinned: boolean;
  }> => {
    try {
      const response = await api.patch(`/forums/${id}/pin`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ✅ LEGACY ALIAS
  pinPost: async (postId: string): Promise<any> => {
    return forumService.togglePin(postId);
  },

  // ✅ LOCK: Toggle lock
  toggleLock: async (id: string): Promise<{
    success: boolean;
    message: string;
    isLocked: boolean;
  }> => {
    try {
      const response = await api.patch(`/forums/${id}/lock`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // ✅ VALIDATION: Helper function for frontend validation
  validatePostData: (data: {
    title?: string;
    content: string;
    courseId: string;
    parentId?: string;
  }): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    // Title validation (required for root posts)
    if (!data.parentId && (!data.title || !data.title.trim())) {
      errors.push('Judul post wajib diisi untuk post utama');
    }

    // Content validation (always required)
    if (!data.content || !data.content.trim()) {
      errors.push('Konten post wajib diisi');
    }

    // CourseId validation
    if (!data.courseId || !data.courseId.trim()) {
      errors.push('Course ID wajib diisi');
    } else {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(data.courseId.trim())) {
        errors.push('Course ID harus berupa UUID yang valid');
      }
    }

    // ParentId validation (if provided)
    if (data.parentId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(data.parentId)) {
        errors.push('Parent ID harus berupa UUID yang valid');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },
};
