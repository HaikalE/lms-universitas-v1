import api from './api'; // Use centralized API instance to avoid URL duplication

// Types for Video Progress API
export interface VideoProgressUpdate {
  materialId: string;
  currentTime: number;
  totalDuration?: number;
  watchedPercentage?: number;
  watchedSeconds?: number;
  watchSession?: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

export interface VideoProgressResponse {
  id: string;
  materialId: string;
  currentTime: number;
  totalDuration: number;
  watchedPercentage: number;
  watchedSeconds: number;
  isCompleted: boolean;
  completedAt: Date | null;
  hasTriggeredAttendance: boolean;
  createdAt: Date;
  updatedAt: Date;
  material?: {
    id: string;
    title: string;
    type: string;
    isAttendanceTrigger: boolean;
    attendanceThreshold: number | null;
  };
}

export interface ResumePosition {
  currentTime: number;
  watchedPercentage: number;
}

export interface VideoStats {
  materialId: string;
  title: string;
  totalViewers: number;
  completedViewers: number;
  completionRate: string;
  avgCompletion: string;
  attendanceTriggered: number;
}

class VideoProgressService {
  // FIXED: Use centralized API instance instead of manual URL construction
  // This prevents duplicate /api/api/ in URLs since api.ts already handles baseURL correctly

  // Update video progress - called every 5-10 seconds
  async updateProgress(progressData: VideoProgressUpdate): Promise<VideoProgressResponse> {
    try {
      const response = await api.post('/video-progress', progressData);
      return response.data;
    } catch (error) {
      console.error('Failed to update video progress:', error);
      throw error;
    }
  }

  // Get current progress for a material
  async getProgress(materialId: string): Promise<VideoProgressResponse | null> {
    try {
      const response = await api.get(`/video-progress/material/${materialId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No progress found
      }
      console.error('Failed to get video progress:', error);
      throw error;
    }
  }

  // Get resume position for video
  async getResumePosition(materialId: string): Promise<ResumePosition | null> {
    try {
      const response = await api.get(`/video-progress/material/${materialId}/resume`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // No progress found
      }
      console.error('Failed to get resume position:', error);
      throw error;
    }
  }

  // Get all video progress for a course
  async getCourseProgress(courseId: string): Promise<VideoProgressResponse[]> {
    try {
      const response = await api.get(`/video-progress/course/${courseId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get course video progress:', error);
      throw error;
    }
  }

  // Get video completion statistics (for lecturers/admins)
  async getCourseVideoStats(courseId: string): Promise<VideoStats[]> {
    try {
      const response = await api.get(`/video-progress/course/${courseId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Failed to get course video stats:', error);
      throw error;
    }
  }

  // Get student progress (for lecturers/admins)
  async getStudentProgress(studentId: string, materialId: string): Promise<VideoProgressResponse | null> {
    try {
      const response = await api.get(`/video-progress/student/${studentId}/material/${materialId}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Failed to get student progress:', error);
      throw error;
    }
  }

  // Get student course progress (for lecturers/admins)
  async getStudentCourseProgress(studentId: string, courseId: string): Promise<VideoProgressResponse[]> {
    try {
      const response = await api.get(`/video-progress/student/${studentId}/course/${courseId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get student course progress:', error);
      throw error;
    }
  }
}

export const videoProgressService = new VideoProgressService();
export default videoProgressService;
