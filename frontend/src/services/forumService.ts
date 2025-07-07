import api from './api';
import { ApiResponse, ForumPost, ForumReply } from '../types';

export const forumService = {
  getForumPosts: async (courseId: string, params?: any): Promise<ApiResponse<ForumPost[]>> => {
    try {
      console.log('🔍 Fetching forum posts for course:', courseId);
      const response = await api.get(`/forums/course/${courseId}`, { params });
      console.log('✅ Forum posts fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching forum posts:', error);
      throw error;
    }
  },

  getForumPost: async (id: string): Promise<ApiResponse<ForumPost>> => {
    try {
      console.log('🔍 Fetching forum post:', id);
      const response = await api.get(`/forums/${id}`);
      console.log('✅ Forum post fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching forum post:', error);
      throw error;
    }
  },

  getForumReplies: async (postId: string, params?: any): Promise<ApiResponse<ForumReply[]>> => {
    try {
      console.log('🔍 Fetching forum replies for post:', postId);
      const response = await api.get(`/forums/${postId}/replies`, { params });
      console.log('✅ Forum replies fetched successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching forum replies:', error);
      throw error;
    }
  },

  getMyDiscussions: async (): Promise<ForumPost[]> => {
    try {
      console.log('🔍 Fetching my discussions');
      const response = await api.get('/forums/my-discussions');
      console.log('✅ My discussions fetched successfully');
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ Error fetching my discussions:', error);
      throw error;
    }
  },

  createForumPost: async (postData: any): Promise<ForumPost> => {
    try {
      console.log('📝 Creating forum post:', {
        title: postData.title,
        courseId: postData.courseId
      });
      
      const response = await api.post('/forums', postData);
      console.log('✅ Forum post created successfully:', response.data);
      
      // Handle both direct ForumPost response and ApiResponse<ForumPost> wrapper
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ Error creating forum post:', error);
      throw error;
    }
  },

  updateForumPost: async (id: string, postData: any): Promise<ForumPost> => {
    try {
      console.log('✏️ Updating forum post:', id);
      const response = await api.patch(`/forums/${id}`, postData);
      console.log('✅ Forum post updated successfully');
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ Error updating forum post:', error);
      throw error;
    }
  },

  deleteForumPost: async (id: string): Promise<void> => {
    try {
      console.log('🗑️ Deleting forum post:', id);
      await api.delete(`/forums/${id}`);
      console.log('✅ Forum post deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting forum post:', error);
      throw error;
    }
  },

  // Reply methods
  createReply: async (postId: string, replyData: any): Promise<ApiResponse<ForumReply>> => {
    try {
      console.log('💬 Creating reply for post:', postId);
      const response = await api.post(`/forums/${postId}/replies`, replyData);
      console.log('✅ Reply created successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error creating reply:', error);
      throw error;
    }
  },

  updateReply: async (replyId: string, replyData: any): Promise<ForumReply> => {
    try {
      console.log('✏️ Updating reply:', replyId);
      const response = await api.patch(`/forums/replies/${replyId}`, replyData);
      console.log('✅ Reply updated successfully');
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ Error updating reply:', error);
      throw error;
    }
  },

  deleteReply: async (replyId: string): Promise<void> => {
    try {
      console.log('🗑️ Deleting reply:', replyId);
      await api.delete(`/forums/replies/${replyId}`);
      console.log('✅ Reply deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting reply:', error);
      throw error;
    }
  },

  // Like methods
  likePost: async (postId: string): Promise<any> => {
    try {
      console.log('❤️ Liking post:', postId);
      const response = await api.post(`/forums/${postId}/like`);
      console.log('✅ Post liked successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error liking post:', error);
      throw error;
    }
  },

  likeReply: async (replyId: string): Promise<any> => {
    try {
      console.log('❤️ Liking reply:', replyId);
      const response = await api.post(`/forums/replies/${replyId}/like`);
      console.log('✅ Reply liked successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error liking reply:', error);
      throw error;
    }
  },

  // View tracking
  markPostAsViewed: async (postId: string): Promise<void> => {
    try {
      console.log('👁️ Marking post as viewed:', postId);
      await api.post(`/forums/${postId}/view`);
      console.log('✅ Post marked as viewed');
    } catch (error) {
      console.error('❌ Error marking post as viewed:', error);
      // Don't throw error for view tracking to avoid disrupting user experience
    }
  },

  // Answer marking
  markAsAnswer: async (postId: string, replyId: string): Promise<any> => {
    try {
      console.log('✅ Marking reply as answer:', { postId, replyId });
      const response = await api.patch(`/forums/${postId}/answer/${replyId}`);
      console.log('✅ Reply marked as answer successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error marking as answer:', error);
      throw error;
    }
  },

  // Pin/Lock methods
  pinPost: async (postId: string): Promise<any> => {
    try {
      console.log('📌 Pinning post:', postId);
      const response = await api.patch(`/forums/${postId}/pin`);
      console.log('✅ Post pinned successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error pinning post:', error);
      throw error;
    }
  },

  togglePin: async (id: string): Promise<any> => {
    try {
      console.log('📌 Toggling pin for post:', id);
      const response = await api.patch(`/forums/${id}/pin`);
      console.log('✅ Pin toggled successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error toggling pin:', error);
      throw error;
    }
  },

  toggleLock: async (id: string): Promise<any> => {
    try {
      console.log('🔒 Toggling lock for post:', id);
      const response = await api.patch(`/forums/${id}/lock`);
      console.log('✅ Lock toggled successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error toggling lock:', error);
      throw error;
    }
  },

  toggleLike: async (id: string): Promise<any> => {
    try {
      console.log('❤️ Toggling like for post:', id);
      const response = await api.post(`/forums/${id}/like`);
      console.log('✅ Like toggled successfully');
      return response.data;
    } catch (error) {
      console.error('❌ Error toggling like:', error);
      throw error;
    }
  },
};