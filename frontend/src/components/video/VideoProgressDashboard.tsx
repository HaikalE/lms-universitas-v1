import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import videoProgressService, { VideoStats } from '../../services/videoProgressService';
import attendanceService, { AttendanceStats } from '../../services/attendanceService';
import {
  PlayIcon,
  CheckCircleIcon,
  UserGroupIcon,
  ChartBarIcon,
  AcademicCapIcon,
  EyeIcon,
  ClockIcon,
  TrophyIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface VideoProgressDashboardProps {
  courseId: string;
  className?: string;
}

interface CombinedVideoStats extends VideoStats {
  attendanceStats?: {
    eligibleStudents: number;
    completedAttendance: number;
    attendanceRate: number;
  };
}

const VideoProgressDashboard: React.FC<VideoProgressDashboardProps> = ({
  courseId,
  className = '',
}) => {
  const { user } = useAuth();
  const [videoStats, setVideoStats] = useState<CombinedVideoStats[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'week' | 'month' | 'all'>('all');

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user || (user.role !== 'lecturer' && user.role !== 'admin')) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch video statistics
        const videoData = await videoProgressService.getCourseVideoStats(courseId);
        
        // Fetch attendance statistics
        const attendanceData = await attendanceService.getCourseStats(courseId);
        
        // Combine video stats with attendance info
        const combinedStats = videoData.map(video => ({
          ...video,
          attendanceStats: {
            eligibleStudents: attendanceData.totalStudents,
            completedAttendance: video.attendanceTriggered,
            attendanceRate: attendanceData.totalStudents > 0 
              ? (video.attendanceTriggered / attendanceData.totalStudents) * 100 
              : 0,
          },
        }));

        setVideoStats(combinedStats);
        setAttendanceStats(attendanceData);

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [courseId, user, selectedTimeRange]);

  if (!user || (user.role !== 'lecturer' && user.role !== 'admin')) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">Access denied. This dashboard is only available for lecturers and administrators.</span>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800 text-sm">{error}</span>
        </div>
      </div>
    );
  }

  const getCompletionRateColor = (rate: number): string => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCompletionRateBg = (rate: number): string => {
    if (rate >= 80) return 'bg-green-100';
    if (rate >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const sortedVideoStats = [...videoStats].sort((a, b) => 
    parseFloat(b.completionRate) - parseFloat(a.completionRate)
  );

  const overallStats = {
    totalVideos: videoStats.length,
    totalViewers: videoStats.reduce((sum, video) => sum + video.totalViewers, 0),
    totalCompletions: videoStats.reduce((sum, video) => sum + video.completedViewers, 0),
    totalAttendanceTriggered: videoStats.reduce((sum, video) => sum + video.attendanceTriggered, 0),
    avgCompletionRate: videoStats.length > 0 
      ? videoStats.reduce((sum, video) => sum + parseFloat(video.completionRate), 0) / videoStats.length 
      : 0,
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <ChartBarIcon className="w-6 h-6 mr-2 text-blue-600" />
            Video Progress & Attendance Analytics
          </h2>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as 'week' | 'month' | 'all')}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <PlayIcon className="w-8 h-8 text-blue-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-blue-900">{overallStats.totalVideos}</div>
                <div className="text-sm text-blue-700">Total Videos</div>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <UserGroupIcon className="w-8 h-8 text-green-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-green-900">{overallStats.totalCompletions}</div>
                <div className="text-sm text-green-700">Completions</div>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <AcademicCapIcon className="w-8 h-8 text-purple-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-purple-900">{overallStats.totalAttendanceTriggered}</div>
                <div className="text-sm text-purple-700">Auto Attendance</div>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center">
              <TrophyIcon className="w-8 h-8 text-yellow-600" />
              <div className="ml-3">
                <div className="text-2xl font-bold text-yellow-900">
                  {overallStats.avgCompletionRate.toFixed(1)}%
                </div>
                <div className="text-sm text-yellow-700">Avg Completion</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Overview */}
      {attendanceStats && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AcademicCapIcon className="w-5 h-5 mr-2" />
            Course Attendance Overview
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{attendanceStats.totalStudents}</div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{attendanceStats.presentCount}</div>
              <div className="text-sm text-gray-600">Manual Present</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{attendanceStats.autoAttendanceCount}</div>
              <div className="text-sm text-gray-600">Auto Present</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{attendanceStats.absentCount}</div>
              <div className="text-sm text-gray-600">Absent</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getCompletionRateColor(attendanceStats.attendanceRate)}`}>
                {attendanceStats.attendanceRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">Attendance Rate</div>
            </div>
          </div>
          
          {/* Attendance Rate Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  attendanceStats.attendanceRate >= 80 ? 'bg-green-500' : 
                  attendanceStats.attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${attendanceStats.attendanceRate}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
              Overall course attendance rate
            </p>
          </div>
        </div>
      )}

      {/* Video Performance Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <EyeIcon className="w-5 h-5 mr-2" />
            Video Performance Details
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Video Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Viewers
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Auto Attendance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Progress
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedVideoStats.map((video, index) => (
                <tr key={video.materialId} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <PlayIcon className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {video.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          ID: {video.materialId.slice(0, 8)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{video.totalViewers}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-sm text-gray-900">{video.completedViewers}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`text-sm font-medium ${getCompletionRateColor(parseFloat(video.completionRate))}`}>
                        {video.completionRate}%
                      </div>
                      <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            parseFloat(video.completionRate) >= 80 ? 'bg-green-500' : 
                            parseFloat(video.completionRate) >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(parseFloat(video.completionRate), 100)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <AcademicCapIcon className="w-4 h-4 text-blue-500 mr-1" />
                      <span className="text-sm text-gray-900">{video.attendanceTriggered}</span>
                      {video.attendanceStats && (
                        <span className="text-xs text-gray-500 ml-1">
                          ({video.attendanceStats.attendanceRate.toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${getCompletionRateColor(parseFloat(video.avgCompletion))}`}>
                      {video.avgCompletion}%
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {videoStats.length === 0 && (
            <div className="text-center py-8">
              <PlayIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No video data available yet.</p>
              <p className="text-gray-400 text-sm">Upload videos and students will start generating analytics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoProgressDashboard;
