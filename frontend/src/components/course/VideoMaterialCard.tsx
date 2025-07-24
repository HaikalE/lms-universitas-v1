import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import EnhancedVideoPlayer from '../video/EnhancedVideoPlayer';
import AttendanceStatusCard from '../attendance/AttendanceStatusCard';
import { VideoProgressResponse } from '../../services/videoProgressService';
import {
  PlayIcon,
  DocumentIcon,
  LinkIcon,
  PresentationChartLineIcon,
  DocumentTextIcon,
  EyeIcon,
  EyeSlashIcon,
  ClockIcon,
  CheckCircleIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

export interface CourseMaterial {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'video' | 'document' | 'presentation' | 'link';
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  url?: string;
  week: number;
  orderIndex: number;
  isVisible: boolean;
  isAttendanceTrigger: boolean;
  attendanceThreshold?: number;
  createdAt: string;
  updatedAt: string;
}

interface VideoMaterialCardProps {
  material: CourseMaterial;
  courseId: string;
  className?: string;
  showAttendanceStatus?: boolean;
  isPreview?: boolean;
}

const VideoMaterialCard: React.FC<VideoMaterialCardProps> = ({
  material,
  courseId,
  className = '',
  showAttendanceStatus = true,
  isPreview = false,
}) => {
  const { user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [attendanceTriggered, setAttendanceTriggered] = useState(false);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <PlayIcon className="w-5 h-5" />;
      case 'pdf':
        return <DocumentIcon className="w-5 h-5" />;
      case 'presentation':
        return <PresentationChartLineIcon className="w-5 h-5" />;
      case 'document':
        return <DocumentTextIcon className="w-5 h-5" />;
      case 'link':
        return <LinkIcon className="w-5 h-5" />;
      default:
        return <DocumentIcon className="w-5 h-5" />;
    }
  };

  const getFileTypeColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'text-red-600 bg-red-50';
      case 'pdf':
        return 'text-blue-600 bg-blue-50';
      case 'presentation':
        return 'text-purple-600 bg-purple-50';
      case 'document':
        return 'text-green-600 bg-green-50';
      case 'link':
        return 'text-indigo-600 bg-indigo-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getVideoUrl = () => {
    if (material.url) return material.url;
    if (material.filePath) {
      // Assuming videos are served from uploads directory
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      return `${baseUrl}/uploads/${material.filePath}`;
    }
    return '';
  };

  const handleAttendanceTriggered = (progress: VideoProgressResponse) => {
    setAttendanceTriggered(true);
    console.log('Attendance triggered for material:', material.id, progress);
  };

  const handleProgressUpdate = (progress: VideoProgressResponse) => {
    console.log('Progress updated for material:', material.id, progress);
  };

  const handlePlayVideo = () => {
    setShowVideoPlayer(true);
    setIsExpanded(true);
  };

  const handleDownload = () => {
    if (material.filePath) {
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
      const downloadUrl = `${baseUrl}/uploads/${material.filePath}`;
      window.open(downloadUrl, '_blank');
    }
  };

  const handleExternalLink = () => {
    if (material.url) {
      window.open(material.url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!material.isVisible && user?.role === 'student') {
    return null; // Hide invisible materials from students
  }

  return (
    <div className={`bg-white rounded-lg border shadow-sm overflow-hidden ${className}`}>
      {/* Material Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3 flex-1">
            <div className={`p-2 rounded-lg ${getFileTypeColor(material.type)}`}>
              {getFileIcon(material.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 truncate">
                    {material.title}
                  </h3>
                  {material.description && (
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {material.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>Week {material.week}</span>
                    {material.fileSize && <span>{formatFileSize(material.fileSize)}</span>}
                    {material.isAttendanceTrigger && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <AcademicCapIcon className="w-3 h-3 mr-1" />
                        Attendance Trigger
                      </span>
                    )}
                    {!material.isVisible && user?.role !== 'student' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <EyeSlashIcon className="w-3 h-3 mr-1" />
                        Hidden
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex items-center space-x-2 ml-4">
            {material.type === 'video' && (
              <button
                onClick={handlePlayVideo}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <PlayIcon className="w-4 h-4 mr-1" />
                Play
              </button>
            )}
            
            {material.type === 'link' && material.url && (
              <button
                onClick={handleExternalLink}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <LinkIcon className="w-4 h-4 mr-1" />
                Open
              </button>
            )}
            
            {material.filePath && material.type !== 'video' && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <DocumentIcon className="w-4 h-4 mr-1" />
                Download
              </button>
            )}
            
            {!isExpanded && material.type === 'video' && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                {isExpanded ? <EyeSlashIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Attendance Status for Video Materials */}
      {material.type === 'video' && 
       material.isAttendanceTrigger && 
       showAttendanceStatus && 
       user?.role === 'student' && (
        <div className="px-4 py-3 bg-gray-50 border-b">
          <AttendanceStatusCard 
            courseId={courseId} 
            showDetailedStats={false}
            className="!shadow-none !border-0 !bg-transparent"
          />
        </div>
      )}

      {/* Video Player Section */}
      {material.type === 'video' && showVideoPlayer && isExpanded && (
        <div className="p-4">
          <EnhancedVideoPlayer
            materialId={material.id}
            courseId={courseId}
            src={getVideoUrl()}
            title={material.title}
            description={material.description}
            isAttendanceTrigger={material.isAttendanceTrigger}
            attendanceThreshold={material.attendanceThreshold || 80}
            onAttendanceTriggered={handleAttendanceTriggered}
            onProgressUpdate={handleProgressUpdate}
            showAttendanceStatus={showAttendanceStatus}
            showProgressStats={true}
            poster={material.filePath ? `${process.env.REACT_APP_API_URL}/uploads/thumbnails/${material.id}.jpg` : undefined}
            className="rounded-lg overflow-hidden"
          />
          
          {attendanceTriggered && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center">
                <CheckCircleIcon className="w-5 h-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    🎉 Attendance Recorded!
                  </p>
                  <p className="text-sm text-green-700">
                    Your attendance has been automatically recorded for completing this video.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview for other file types */}
      {material.type !== 'video' && isExpanded && (
        <div className="p-4 bg-gray-50">
          <div className="text-center py-8">
            <div className={`inline-flex p-4 rounded-full ${getFileTypeColor(material.type)} mb-4`}>
              {getFileIcon(material.type)}
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              {material.title}
            </h4>
            <p className="text-gray-600 mb-4">
              {material.description || 'Click the button above to access this material.'}
            </p>
            {material.filePath && (
              <button
                onClick={handleDownload}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <DocumentIcon className="w-4 h-4 mr-2" />
                Download {material.fileName}
              </button>
            )}
            {material.url && (
              <button
                onClick={handleExternalLink}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <LinkIcon className="w-4 h-4 mr-2" />
                Open Link
              </button>
            )}
          </div>
        </div>
      )}

      {/* Material Metadata */}
      <div className="px-4 py-3 bg-gray-50 border-t text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <ClockIcon className="w-3 h-3 mr-1" />
              {new Date(material.createdAt).toLocaleDateString('id-ID')}
            </span>
            {material.fileName && (
              <span className="truncate max-w-xs">
                File: {material.fileName}
              </span>
            )}
          </div>
          {isPreview && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">
              Preview Mode
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoMaterialCard;
