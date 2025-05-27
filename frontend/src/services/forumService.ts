import api from './api';
import { ApiResponse, ForumPost } from '../types';

export const forumService = {
  getForumPosts: async (courseId: string, params?: any): Promise<ApiResponse<ForumPost[]>> => {
    const response = await api.get(`/forums/course/${courseId}`, { params });
    return response.data;
  },

  getForumPost: async (id: string): Promise<ForumPost> => {
    const response = await api.get(`/forums/${id}`);
    return response.data;
  },

  getMyDiscussions: async (): Promise<ForumPost[]> => {
    const response = await api.get('/forums/my-discussions');
    return response.data;
  },

  createForumPost: async (postData: any): Promise<ForumPost> => {
    const response = await api.post('/forums', postData);
    return response.data;
  },

  updateForumPost: async (id: string, postData: any): Promise<ForumPost> => {
    const response = await api.patch(`/forums/${id}`, postData);
    return response.data;
  },

  deleteForumPost: async (id: string): Promise<void> => {
    await api.delete(`/forums/${id}`);
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
