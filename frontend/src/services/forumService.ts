import api from './api';
import { 
  ApiResponse,
  ForumPost, 
  ForumReply,
  ForumPostsResponse,
  CreateForumPostRequest,
  UpdateForumPostRequest,
  QueryForumPostsParams,
  MarkBestAnswerRequest,
  ForumAnalyticsParams,
  ForumAnalyticsResponse,
  LikeResponse,
  CategoryCount,
  PopularTag,
  UserActivity,
  Leaderboard,
} from '../types/forum';

export const forumService = {
  // ============================================
  // CRUD Operations
  // ============================================

  getForumPosts: async (
    courseId: string, 
    params?: QueryForumPostsParams
  ): Promise<ForumPostsResponse> => {
    const response = await api.get(`/forums/course/${courseId}`, { params });
    return response.data;
  },

  getForumPost: async (id: string): Promise<ForumPost> => {
    const response = await api.get(`/forums/${id}`);
    return response.data;
  },

  createForumPost: async (postData: CreateForumPostRequest): Promise<ForumPost> => {
    const response = await api.post('/forums', postData);
    return response.data.data || response.data;
  },

  updateForumPost: async (id: string, postData: UpdateForumPostRequest): Promise<ForumPost> => {
    const response = await api.patch(`/forums/${id}`, postData);
    return response.data.data || response.data;
  },

  deleteForumPost: async (id: string): Promise<void> => {
    await api.delete(`/forums/${id}`);
  },

  // ============================================
  // Enhanced Interaction Features
  // ============================================

  toggleLike: async (postId: string): Promise<LikeResponse> => {
    const response = await api.post(`/forums/${postId}/like`);
    return response.data;
  },

  markBestAnswer: async (postId: string, data: MarkBestAnswerRequest): Promise<{ message: string }> => {
    const response = await api.patch(`/forums/${postId}/best-answer`, data);
    return response.data;
  },

  // ============================================
  // Moderation Features (Lecturer/Admin Only)
  // ============================================

  togglePin: async (id: string): Promise<{ message: string; isPinned: boolean }> => {
    const response = await api.patch(`/forums/${id}/pin`);
    return response.data;
  },

  toggleLock: async (id: string): Promise<{ message: string; isLocked: boolean }> => {
    const response = await api.patch(`/forums/${id}/lock`);
    return response.data;
  },

  // ============================================
  // Analytics & Reporting (Lecturer/Admin Only)
  // ============================================

  getForumAnalytics: async (
    courseId: string, 
    params?: ForumAnalyticsParams
  ): Promise<ForumAnalyticsResponse> => {
    const response = await api.get(`/forums/course/${courseId}/analytics`, { params });
    return response.data;
  },

  // ============================================
  // Search & Discovery Features
  // ============================================

  getCategoryCounts: async (courseId: string): Promise<CategoryCount> => {
    const response = await api.get(`/forums/course/${courseId}/categories`);
    return response.data;
  },

  getPopularTags: async (courseId: string): Promise<PopularTag[]> => {
    const response = await api.get(`/forums/course/${courseId}/tags`);
    return response.data;
  },

  // ============================================
  // User Activity & Stats
  // ============================================

  getMyActivity: async (): Promise<UserActivity> => {
    const response = await api.get('/forums/my-activity');
    return response.data;
  },

  getLeaderboard: async (courseId: string): Promise<Leaderboard> => {
    const response = await api.get(`/forums/course/${courseId}/leaderboard`);
    return response.data;
  },

  // ============================================
  // Quick Actions & Shortcuts
  // ============================================

  getPinnedPosts: async (courseId: string): Promise<ForumPostsResponse> => {
    const response = await api.get(`/forums/course/${courseId}/pinned`);
    return response.data;
  },

  getAnnouncements: async (courseId: string): Promise<ForumPostsResponse> => {
    const response = await api.get(`/forums/course/${courseId}/announcements`);
    return response.data;
  },

  getQuestions: async (
    courseId: string, 
    params?: QueryForumPostsParams
  ): Promise<ForumPostsResponse> => {
    const response = await api.get(`/forums/course/${courseId}/questions`, { params });
    return response.data;
  },

  getUnansweredQuestions: async (
    courseId: string, 
    params?: QueryForumPostsParams
  ): Promise<ForumPostsResponse> => {
    const response = await api.get(`/forums/course/${courseId}/unanswered`, { params });
    return response.data;
  },

  getTrendingPosts: async (courseId: string): Promise<ForumPostsResponse> => {
    const response = await api.get(`/forums/course/${courseId}/trending`);
    return response.data;
  },

  getRecentActivity: async (courseId: string): Promise<ForumPostsResponse> => {
    const response = await api.get(`/forums/course/${courseId}/recent`);
    return response.data;
  },

  // ============================================
  // Legacy Methods (for backward compatibility)
  // ============================================

  getForumReplies: async (postId: string, params?: any): Promise<ApiResponse<ForumReply[]>> => {
    // This is now handled by getForumPost which includes the full tree
    const post = await forumService.getForumPost(postId);
    return {
      success: true,
      data: post.children || [],
    };
  },

  getMyDiscussions: async (): Promise<ForumPost[]> => {
    const activity = await forumService.getMyActivity();
    return activity.recentPosts;
  },

  createReply: async (postId: string, replyData: any): Promise<ApiResponse<ForumReply>> => {
    const reply = await forumService.createForumPost({
      ...replyData,
      parentId: postId,
    });
    return {
      success: true,
      data: reply,
    };
  },

  updateReply: async (replyId: string, replyData: any): Promise<ForumReply> => {
    return forumService.updateForumPost(replyId, replyData);
  },

  deleteReply: async (replyId: string): Promise<void> => {
    return forumService.deleteForumPost(replyId);
  },

  likePost: async (postId: string): Promise<any> => {
    return forumService.toggleLike(postId);
  },

  likeReply: async (replyId: string): Promise<any> => {
    return forumService.toggleLike(replyId);
  },

  markPostAsViewed: async (postId: string): Promise<void> => {
    // This is now handled automatically when viewing a post
    // Keeping for backward compatibility
    await forumService.getForumPost(postId);
  },

  markAsAnswer: async (postId: string, replyId: string): Promise<any> => {
    return forumService.markBestAnswer(postId, { replyId });
  },

  pinPost: async (postId: string): Promise<any> => {
    return forumService.togglePin(postId);
  },

  // ============================================
  // Utility Functions
  // ============================================

  searchPosts: async (
    courseId: string,
    searchQuery: string,
    filters?: Partial<QueryForumPostsParams>
  ): Promise<ForumPostsResponse> => {
    return forumService.getForumPosts(courseId, {
      search: searchQuery,
      ...filters,
    });
  },

  getPostsByCategory: async (
    courseId: string,
    category: string,
    params?: QueryForumPostsParams
  ): Promise<ForumPostsResponse> => {
    return forumService.getForumPosts(courseId, {
      category: category as any,
      ...params,
    });
  },

  getPostsByTag: async (
    courseId: string,
    tags: string[],
    params?: QueryForumPostsParams
  ): Promise<ForumPostsResponse> => {
    return forumService.getForumPosts(courseId, {
      tags,
      ...params,
    });
  },

  getPostsByAuthor: async (
    courseId: string,
    authorId: string,
    params?: QueryForumPostsParams
  ): Promise<ForumPostsResponse> => {
    return forumService.getForumPosts(courseId, {
      authorId,
      ...params,
    });
  },

  // ============================================
  // Advanced Filtering
  // ============================================

  buildAdvancedQuery: (filters: {
    search?: string;
    category?: string;
    tags?: string[];
    dateRange?: { start: string; end: string };
    author?: string;
    hasAttachments?: boolean;
    unanswered?: boolean;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): QueryForumPostsParams => {
    return {
      search: filters.search,
      category: filters.category as any,
      tags: filters.tags,
      authorId: filters.author,
      hasAttachments: filters.hasAttachments,
      unanswered: filters.unanswered,
      sortBy: filters.sortBy as any,
      sortOrder: filters.sortOrder,
    };
  },

  // ============================================
  // Cache Management
  // ============================================

  clearCache: () => {
    // This would clear any local cache if implemented
    console.log('Forum cache cleared');
  },

  refreshPost: async (id: string): Promise<ForumPost> => {
    // Force refresh a specific post
    return forumService.getForumPost(id);
  },
};

export default forumService;
