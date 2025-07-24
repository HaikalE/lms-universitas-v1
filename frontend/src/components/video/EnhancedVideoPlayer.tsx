import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import VideoPlayer, { VideoPlayerProps } from './VideoPlayer';
import videoProgressService, { VideoProgressResponse } from '../../services/videoProgressService';
import attendanceService, { TodayAttendanceStatus } from '../../services/attendanceService';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  PlayIcon,
  EyeIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

export interface EnhancedVideoPlayerProps extends Omit<VideoPlayerProps, 'onProgress' | 'onComplete' | 'startTime'> {
  materialId: string;
  courseId: string;
  isAttendanceTrigger?: boolean;
  attendanceThreshold?: number;
  onAttendanceTriggered?: (progress: VideoProgressResponse) => void;
  onProgressUpdate?: (progress: VideoProgressResponse) => void;
  showAttendanceStatus?: boolean;
  showProgressStats?: boolean;
}

interface WatchSession {
  startTime: number;
  endTime: number;
  duration: number;
}

const EnhancedVideoPlayer: React.FC<EnhancedVideoPlayerProps> = ({
  materialId,
  courseId,
  isAttendanceTrigger = false,
  attendanceThreshold = 80,
  onAttendanceTriggered,
  onProgressUpdate,
  showAttendanceStatus = true,
  showProgressStats = true,
  ...videoPlayerProps
}) => {
  const { user } = useAuth();
  const [progress, setProgress] = useState<VideoProgressResponse | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<TodayAttendanceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTriggeredAttendance, setHasTriggeredAttendance] = useState(false);
  const [watchSession, setWatchSession] = useState<WatchSession | null>(null);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);
  const [showAttendanceAlert, setShowAttendanceAlert] = useState(false);
  
  const progressUpdateIntervalRef = useRef<NodeJS.Timeout>();
  const sessionStartTimeRef = useRef<number>(0);
  const lastProgressUpdateRef = useRef<number>(0);

  // ⏰ Configuration
  const UPDATE_INTERVAL = 8000; // Update progress every 8 seconds
  const MIN_UPDATE_THRESHOLD = 5; // Minimum seconds before sending update

  // 🔄 Initialize: Load existing progress and attendance status
  useEffect(() => {
    const initializePlayer = async () => {
      if (!user || user.role !== 'student') {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Load existing progress
        const existingProgress = await videoProgressService.getProgress(materialId);
        if (existingProgress) {
          setProgress(existingProgress);
          setHasTriggeredAttendance(existingProgress.hasTriggeredAttendance);
        }

        // Load attendance status if this video can trigger attendance
        if (isAttendanceTrigger) {
          const status = await attendanceService.getTodayAttendanceStatus(courseId);
          setAttendanceStatus(status);
        }

      } catch (error) {
        console.error('Failed to initialize enhanced video player:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializePlayer();
  }, [materialId, courseId, isAttendanceTrigger, user]);

  // 📊 Start watch session tracking
  const startWatchSession = useCallback((currentTime: number) => {
    sessionStartTimeRef.current = currentTime;
    setWatchSession({
      startTime: currentTime,
      endTime: currentTime,
      duration: 0,
    });
  }, []);

  // 📊 End watch session tracking
  const endWatchSession = useCallback((currentTime: number) => {
    if (sessionStartTimeRef.current !== null) {
      const session = {
        startTime: sessionStartTimeRef.current,
        endTime: currentTime,
        duration: currentTime - sessionStartTimeRef.current,
      };
      setWatchSession(session);
      return session;
    }
    return null;
  }, []);

  // 📡 Update progress to backend
  const updateProgressToBackend = useCallback(async (
    currentTime: number,
    totalDuration: number,
    sessionData?: WatchSession
  ) => {
    if (!user || user.role !== 'student' || !totalDuration) return;

    try {
      const watchedPercentage = (currentTime / totalDuration) * 100;
      const watchedSeconds = currentTime;

      const progressData = {
        materialId,
        currentTime,
        totalDuration,
        watchedPercentage,
        watchedSeconds,
        ...(sessionData && { watchSession: sessionData }),
      };

      const updatedProgress = await videoProgressService.updateProgress(progressData);
      setProgress(updatedProgress);
      onProgressUpdate?.(updatedProgress);

      // 🎯 Check for attendance trigger
      if (
        isAttendanceTrigger && 
        !hasTriggeredAttendance && 
        !updatedProgress.hasTriggeredAttendance &&
        watchedPercentage >= attendanceThreshold &&
        attendanceStatus?.canAutoSubmit
      ) {
        setHasTriggeredAttendance(true);
        setShowAttendanceAlert(true);
        onAttendanceTriggered?.(updatedProgress);
        
        // Auto-hide alert after 5 seconds
        setTimeout(() => setShowAttendanceAlert(false), 5000);

        // Refresh attendance status
        try {
          const newStatus = await attendanceService.getTodayAttendanceStatus(courseId);
          setAttendanceStatus(newStatus);
        } catch (error) {
          console.error('Failed to refresh attendance status:', error);
        }
      }

      lastProgressUpdateRef.current = Date.now();

    } catch (error) {
      console.error('Failed to update video progress:', error);
    }
  }, [
    materialId,
    user,
    isAttendanceTrigger,
    attendanceThreshold,
    hasTriggeredAttendance,
    attendanceStatus?.canAutoSubmit,
    onProgressUpdate,
    onAttendanceTriggered,
    courseId,
  ]);

  // 🎥 Handle video progress from VideoPlayer
  const handleVideoProgress = useCallback((playedPercentage: number, currentTime: number) => {
    const now = Date.now();
    
    // Update local state immediately for smooth UI
    setLastUpdateTime(currentTime);

    // Only send to backend if enough time has passed
    if (now - lastProgressUpdateRef.current >= MIN_UPDATE_THRESHOLD * 1000) {
      const videoElement = document.querySelector('video');
      const totalDuration = videoElement?.duration;
      
      if (totalDuration && totalDuration > 0) {
        updateProgressToBackend(currentTime, totalDuration);
      }
    }
  }, [updateProgressToBackend]);

  // 🎥 Handle video completion
  const handleVideoComplete = useCallback(() => {
    const videoElement = document.querySelector('video');
    const totalDuration = videoElement?.duration;
    const currentTime = videoElement?.currentTime;
    
    if (totalDuration && currentTime) {
      // End watch session
      const session = endWatchSession(currentTime);
      
      // Force update progress on completion
      updateProgressToBackend(currentTime, totalDuration, session || undefined);
    }
  }, [updateProgressToBackend, endWatchSession]);

  // ⏯️ Handle play/pause for session tracking
  const handlePlayStateChange = useCallback((isPlaying: boolean, currentTime: number) => {
    if (isPlaying) {
      startWatchSession(currentTime);
      
      // Set up periodic progress updates
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
      }
      
      progressUpdateIntervalRef.current = setInterval(() => {
        const videoElement = document.querySelector('video');
        if (videoElement && !videoElement.paused) {
          const totalDuration = videoElement.duration;
          const currentTime = videoElement.currentTime;
          
          if (totalDuration && totalDuration > 0) {
            updateProgressToBackend(currentTime, totalDuration);
          }
        }
      }, UPDATE_INTERVAL);
      
    } else {
      // Video paused/stopped
      const session = endWatchSession(currentTime);
      const videoElement = document.querySelector('video');
      const totalDuration = videoElement?.duration;
      
      if (totalDuration && session) {
        updateProgressToBackend(currentTime, totalDuration, session);
      }
      
      // Clear interval
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
        progressUpdateIntervalRef.current = undefined;
      }
    }
  }, [startWatchSession, endWatchSession, updateProgressToBackend]);

  // 🔄 Monitor video play state changes
  useEffect(() => {
    const videoElement = document.querySelector('video');
    if (!videoElement) return;

    const handlePlay = () => handlePlayStateChange(true, videoElement.currentTime);
    const handlePause = () => handlePlayStateChange(false, videoElement.currentTime);
    const handleEnded = () => handlePlayStateChange(false, videoElement.currentTime);

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);

    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      
      // Clear interval on unmount
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
      }
    };
  }, [handlePlayStateChange]);

  // 🎯 Get attendance status styling
  const getAttendanceStatusInfo = () => {
    if (!isAttendanceTrigger) return null;
    
    if (attendanceStatus?.hasAttendanceToday) {
      return {
        icon: <CheckCircleIcon className="w-5 h-5" />,
        text: 'Absensi hari ini sudah tercatat',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
      };
    }
    
    if (hasTriggeredAttendance || (progress?.hasTriggeredAttendance && progress?.isCompleted)) {
      return {
        icon: <AcademicCapIcon className="w-5 h-5" />,
        text: 'Absensi otomatis akan tercatat segera',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
      };
    }
    
    if (progress && progress.watchedPercentage >= attendanceThreshold) {
      return {
        icon: <CheckCircleIcon className="w-5 h-5" />,
        text: 'Target video tercapai! Absensi otomatis tercatat',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
      };
    }
    
    return {
      icon: <ClockIcon className="w-5 h-5" />,
      text: `Tonton ${attendanceThreshold}% video untuk absensi otomatis`,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
    };
  };

  // 📊 Get progress color based on completion
  const getProgressColor = (percentage: number) => {
    if (percentage >= attendanceThreshold) return 'text-green-600';
    if (percentage >= attendanceThreshold * 0.7) return 'text-amber-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
        <span className="ml-3 text-white">Loading video...</span>
      </div>
    );
  }

  const attendanceInfo = getAttendanceStatusInfo();
  const currentProgress = progress?.watchedPercentage || 0;
  const resumeFromTime = progress?.currentTime || 0;

  return (
    <div className="space-y-4">
      {/* 🎯 Attendance Alert */}
      {showAttendanceAlert && isAttendanceTrigger && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
          <AcademicCapIcon className="w-6 h-6 text-green-600" />
          <div>
            <h4 className="font-medium text-green-800">🎉 Absensi Otomatis Tercatat!</h4>
            <p className="text-green-700 text-sm">
              Selamat! Absensi Anda telah tercatat secara otomatis karena menyelesaikan video pembelajaran.
            </p>
          </div>
        </div>
      )}

      {/* 📊 Progress & Attendance Status */}
      {showAttendanceStatus && attendanceInfo && user?.role === 'student' && (
        <div className={`${attendanceInfo.bgColor} border ${attendanceInfo.borderColor} rounded-lg p-4`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={attendanceInfo.color}>
                {attendanceInfo.icon}
              </div>
              <div>
                <p className={`font-medium ${attendanceInfo.color}`}>
                  {attendanceInfo.text}
                </p>
                {isAttendanceTrigger && (
                  <p className="text-sm text-gray-600 mt-1">
                    Progress saat ini: {currentProgress.toFixed(1)}% dari {attendanceThreshold}% yang diperlukan
                  </p>
                )}
              </div>
            </div>
            {isAttendanceTrigger && (
              <div className="text-right">
                <div className={`text-2xl font-bold ${getProgressColor(currentProgress)}`}>
                  {currentProgress.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">completed</div>
              </div>
            )}
          </div>
          
          {/* Progress Bar for Attendance */}
          {isAttendanceTrigger && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    currentProgress >= attendanceThreshold ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(currentProgress, 100)}%` }}
                />
                {/* Attendance threshold marker */}
                <div
                  className="absolute w-0.5 h-4 bg-red-400 transform -translate-y-1"
                  style={{ left: `${attendanceThreshold}%` }}
                  title={`${attendanceThreshold}% threshold for attendance`}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 📈 Progress Statistics */}
      {showProgressStats && progress && user?.role === 'student' && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-3 flex items-center">
            <EyeIcon className="w-4 h-4 mr-2" />
            Statistik Menonton
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Total Ditonton</div>
              <div className="font-semibold text-gray-900">
                {Math.round(progress.watchedSeconds / 60)} menit
              </div>
            </div>
            <div>
              <div className="text-gray-600">Progress</div>
              <div className={`font-semibold ${getProgressColor(progress.watchedPercentage)}`}>
                {progress.watchedPercentage.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-gray-600">Status</div>
              <div className={`font-semibold ${progress.isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
                {progress.isCompleted ? 'Selesai' : 'Berlangsung'}
              </div>
            </div>
            <div>
              <div className="text-gray-600">Absensi</div>
              <div className={`font-semibold ${
                progress.hasTriggeredAttendance ? 'text-green-600' : 'text-gray-600'
              }`}>
                {progress.hasTriggeredAttendance ? 'Tercatat' : 'Belum'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🎥 Enhanced Video Player */}
      <VideoPlayer
        {...videoPlayerProps}
        startTime={resumeFromTime}
        onProgress={handleVideoProgress}
        onComplete={handleVideoComplete}
        title={
          videoPlayerProps.title && progress 
            ? `${videoPlayerProps.title} (${currentProgress.toFixed(1)}% watched)`
            : videoPlayerProps.title
        }
      />

      {/* 🔄 Resume Indicator */}
      {resumeFromTime > 30 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center space-x-2 text-sm">
          <PlayIcon className="w-4 h-4 text-blue-600" />
          <span className="text-blue-800">
            Video akan dilanjutkan dari menit ke-{Math.floor(resumeFromTime / 60)}:{String(Math.floor(resumeFromTime % 60)).padStart(2, '0')}
          </span>
        </div>
      )}
    </div>
  );
};

export default EnhancedVideoPlayer;
