import { useState, useEffect, useCallback } from 'react';
import videoProgressService, { VideoProgressResponse, VideoStats } from '../services/videoProgressService';
import { useAuth } from '../contexts/AuthContext';

interface UseVideoProgressOptions {
  materialId?: string;
  courseId?: string;
  autoFetch?: boolean;
  onProgressUpdate?: (progress: VideoProgressResponse) => void;
  onError?: (error: Error) => void;
}

interface UseVideoProgressReturn {
  progress: VideoProgressResponse | null;
  courseProgress: VideoProgressResponse[];
  videoStats: VideoStats[];
  isLoading: boolean;
  error: string | null;
  updateProgress: (data: {
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
  }) => Promise<VideoProgressResponse | null>;
  getProgress: (materialId: string) => Promise<VideoProgressResponse | null>;
  getResumePosition: (materialId: string) => Promise<{ currentTime: number; watchedPercentage: number } | null>;
  getCourseProgress: (courseId: string) => Promise<VideoProgressResponse[]>;
  getVideoStats: (courseId: string) => Promise<VideoStats[]>;
  refreshProgress: () => Promise<void>;
  clearError: () => void;
}

export const useVideoProgress = (options: UseVideoProgressOptions = {}): UseVideoProgressReturn => {
  const { user } = useAuth();
  const { 
    materialId, 
    courseId, 
    autoFetch = true, 
    onProgressUpdate, 
    onError 
  } = options;

  const [progress, setProgress] = useState<VideoProgressResponse | null>(null);
  const [courseProgress, setCourseProgress] = useState<VideoProgressResponse[]>([]);
  const [videoStats, setVideoStats] = useState<VideoStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Handle errors
  const handleError = useCallback((err: any, context: string) => {
    const errorMessage = err?.response?.data?.message || err?.message || `Failed to ${context}`;
    setError(errorMessage);
    onError?.(new Error(errorMessage));
    console.error(`Video progress error (${context}):`, err);
  }, [onError]);

  // Update progress
  const updateProgress = useCallback(async (data: {
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
  }): Promise<VideoProgressResponse | null> => {
    if (!user || user.role !== 'student') return null;

    try {
      const updatedProgress = await videoProgressService.updateProgress(data);
      setProgress(updatedProgress);
      onProgressUpdate?.(updatedProgress);
      return updatedProgress;
    } catch (err) {
      handleError(err, 'update progress');
      return null;
    }
  }, [user, onProgressUpdate, handleError]);

  // Get specific progress
  const getProgress = useCallback(async (materialId: string): Promise<VideoProgressResponse | null> => {
    if (!user || user.role !== 'student') return null;

    try {
      const progressData = await videoProgressService.getProgress(materialId);
      return progressData;
    } catch (err) {
      handleError(err, 'get progress');
      return null;
    }
  }, [user, handleError]);

  // Get resume position
  const getResumePosition = useCallback(async (materialId: string) => {
    if (!user || user.role !== 'student') return null;

    try {
      const resumeData = await videoProgressService.getResumePosition(materialId);
      return resumeData;
    } catch (err) {
      handleError(err, 'get resume position');
      return null;
    }
  }, [user, handleError]);

  // Get course progress
  const getCourseProgress = useCallback(async (courseId: string): Promise<VideoProgressResponse[]> => {
    if (!user || user.role !== 'student') return [];

    try {
      const progressData = await videoProgressService.getCourseProgress(courseId);
      setCourseProgress(progressData);
      return progressData;
    } catch (err) {
      handleError(err, 'get course progress');
      return [];
    }
  }, [user, handleError]);

  // Get video statistics (for lecturers/admins)
  const getVideoStats = useCallback(async (courseId: string): Promise<VideoStats[]> => {
    if (!user || (user.role !== 'lecturer' && user.role !== 'admin')) return [];

    try {
      const statsData = await videoProgressService.getCourseVideoStats(courseId);
      setVideoStats(statsData);
      return statsData;
    } catch (err) {
      handleError(err, 'get video stats');
      return [];
    }
  }, [user, handleError]);

  // Refresh current progress
  const refreshProgress = useCallback(async () => {
    if (!materialId || !user || user.role !== 'student') return;

    setIsLoading(true);
    try {
      const progressData = await videoProgressService.getProgress(materialId);
      setProgress(progressData);
    } catch (err) {
      handleError(err, 'refresh progress');
    } finally {
      setIsLoading(false);
    }
  }, [materialId, user, handleError]);

  // Auto-fetch progress on mount
  useEffect(() => {
    if (!autoFetch || !user) return;

    const fetchInitialData = async () => {
      setIsLoading(true);
      clearError();

      try {
        // Fetch individual progress if materialId provided
        if (materialId && user.role === 'student') {
          const progressData = await videoProgressService.getProgress(materialId);
          setProgress(progressData);
        }

        // Fetch course progress if courseId provided
        if (courseId) {
          if (user.role === 'student') {
            const courseProgressData = await videoProgressService.getCourseProgress(courseId);
            setCourseProgress(courseProgressData);
          } else if (user.role === 'lecturer' || user.role === 'admin') {
            const statsData = await videoProgressService.getCourseVideoStats(courseId);
            setVideoStats(statsData);
          }
        }
      } catch (err) {
        handleError(err, 'fetch initial data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialData();
  }, [materialId, courseId, autoFetch, user, handleError, clearError]);

  return {
    progress,
    courseProgress,
    videoStats,
    isLoading,
    error,
    updateProgress,
    getProgress,
    getResumePosition,
    getCourseProgress,
    getVideoStats,
    refreshProgress,
    clearError,
  };
};

export default useVideoProgress;
