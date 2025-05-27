import api from './api';
import { ApiResponse, ForumPost, ForumReply } from '../types';

export const forumService = {
  getForumPosts: async (courseId: string, params?: any): Promise<ApiResponse<ForumPost[]>> => {
    const response = await api.get(`/forums/course/${courseId}`, { params });
    return response.data;
  },

  getForumPost: async (id: string): Promise<ApiResponse<ForumPost>> => {
    const response = await api.get(`/forums/${id}`);
    return response.data;
  },

  getForumReplies: async (postId: string, params?: any): Promise<ApiResponse<ForumReply[]>> => {
    const response = await api.get(`/forums/${postId}/replies`, { params });
    return response.data;
  },

  getMyDiscussions: async (): Promise<ForumPost[]> => {
    const response = await api.get('/forums/my-discussions');
    return response.data.data || response.data;
  },

  createForumPost: async (postData: any): Promise<ForumPost> => {
    const response = await api.post('/forums', postData);
    // Handle both direct ForumPost response and ApiResponse<ForumPost> wrapper
    return response.data.data || response.data;
  },

  updateForumPost: async (id: string, postData: any): Promise<ForumPost> => {
    const response = await api.patch(`/forums/${id}`, postData);
    return response.data.data || response.data;
  },

  deleteForumPost: async (id: string): Promise<void> => {
    await api.delete(`/forums/${id}`);
  },

  // Reply methods
  createReply: async (postId: string, replyData: any): Promise<ApiResponse<ForumReply>> => {
    const response = await api.post(`/forums/${postId}/replies`, replyData);
    return response.data;
  },

  updateReply: async (replyId: string, replyData: any): Promise<ForumReply> => {
    const response = await api.patch(`/forums/replies/${replyId}`, replyData);
    return response.data.data || response.data;
  },

  deleteReply: async (replyId: string): Promise<void> => {
    await api.delete(`/forums/replies/${replyId}`);
  },

  // Like methods
  likePost: async (postId: string): Promise<any> => {
    const response = await api.post(`/forums/${postId}/like`);
    return response.data;
  },

  likeReply: async (replyId: string): Promise<any> => {
    const response = await api.post(`/forums/replies/${replyId}/like`);
    return response.data;
  },

  // View tracking
  markPostAsViewed: async (postId: string): Promise<void> => {
    await api.post(`/forums/${postId}/view`);
  },

  // Answer marking
  markAsAnswer: async (postId: string, replyId: string): Promise<any> => {
    const response = await api.patch(`/forums/${postId}/answer/${replyId}`);
    return response.data;
  },

  // Pin/Lock methods
  pinPost: async (postId: string): Promise<any> => {
    const response = await api.patch(`/forums/${postId}/pin`);
    return response.data;
  },

  togglePin: async (id: string): Promise<any> => {
    const response = await api.patch(`/forums/${id}/pin`);
    return response.data;
  },

  toggleLock: async (id: string): Promise<any> => {
    const response = await api.patch(`/forums/${id}/lock`);
    return response.data;
  },

  toggleLike: async (id: string): Promise<any> => {
    const response = await api.post(`/forums/${id}/like`);
    return response.data;
  },
};
