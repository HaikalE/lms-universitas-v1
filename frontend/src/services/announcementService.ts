import api from './api';
import { ApiResponse, Announcement } from '../types';

export const announcementService = {
  getAnnouncements: async (params?: any): Promise<ApiResponse<Announcement[]>> => {
    const response = await api.get('/announcements', { params });
    return response.data;
  },

  getAnnouncement: async (id: string): Promise<Announcement> => {
    const response = await api.get(`/announcements/${id}`);
    return response.data;
  },

  getRecentAnnouncements: async (): Promise<Announcement[]> => {
    const response = await api.get('/announcements/recent');
    return response.data;
  },

  createAnnouncement: async (announcementData: any): Promise<Announcement> => {
    const response = await api.post('/announcements', announcementData);
    return response.data;
  },

  updateAnnouncement: async (id: string, announcementData: any): Promise<Announcement> => {
    const response = await api.patch(`/announcements/${id}`, announcementData);
    return response.data;
  },

  deleteAnnouncement: async (id: string): Promise<void> => {
    await api.delete(`/announcements/${id}`);
  },
};
