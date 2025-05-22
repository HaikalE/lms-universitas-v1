import api from './api';
import { ApiResponse, Notification } from '../types';

export const notificationService = {
  getMyNotifications: async (params?: any): Promise<ApiResponse<Notification[]>> => {
    const response = await api.get('/notifications/my-notifications', { params });
    return response.data;
  },

  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id: string): Promise<void> => {
    await api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await api.patch('/notifications/mark-all-read');
  },

  deleteNotification: async (id: string): Promise<void> => {
    await api.delete(`/notifications/${id}`);
  },
};
