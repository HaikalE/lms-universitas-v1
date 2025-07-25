import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, Clock, User, Monitor, Download, AlertCircle } from 'lucide-react';
import VideoPlayer from '../../components/video/VideoPlayer';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';
import { courseService } from '../../services/courseService';
import { videoProgressService } from '../../services/videoProgressService';
import { Course, CourseMaterial, MaterialType } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/date';

const VideoPreviewPage: React.FC = () => {
  const { courseId, materialId } = useParams<{ courseId: string; materialId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [material, setMaterial] = useState<CourseMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [videoProgress, setVideoProgress] = useState<number>(0);
  const [attendanceRecorded, setAttendanceRecorded] = useState(false);

  useEffect(() => {
    if (courseId && materialId) {
      fetchData();
    }
  }, [courseId, materialId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch course and materials
      const [courseData, materialsData] = await Promise.all([
        courseService.getCourse(courseId!),
        courseService.getCourseMaterials(courseId!)
      ]);
      
      setCourse(courseData);
      
      // Find the specific material
      const targetMaterial = materialsData.find(m => m.id === materialId);
      if (!targetMaterial) {
        throw new Error('Material tidak ditemukan');
      }
      
      if (targetMaterial.type !== MaterialType.VIDEO) {
        throw new Error('Material ini bukan video');
      }
      
      setMaterial(targetMaterial);
      
      // Fetch existing video progress if any
      try {
        const progressData = await videoProgressService.getProgress(materialId!);
        setVideoProgress(progressData.watchedPercentage || 0);
        setAttendanceRecorded(progressData.attendanceRecorded || false);
      } catch (error) {
        // Progress doesn't exist yet - this is normal for first time viewing
        console.log('No existing progress found');
      }
      
    } catch (error: any) {
      console.error('Error fetching video data:', error);
      toast.error(error.message || 'Gagal memuat video');
      navigate(`/courses/${courseId}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoProgress = async (percentage: number, currentTime: number) => {
    try {
      // Update local state
      setVideoProgress(percentage);
      
      // Send progress to backend
      await videoProgressService.updateProgress(materialId!, {
        currentTime,
        watchedPercentage: percentage,
        lastWatchedAt: new Date()
      });
      
      // Check if attendance should be recorded
      if (material?.isAttendanceTrigger && !attendanceRecorded) {
        const threshold = material.attendanceThreshold || 80;
        if (percentage >= threshold) {
          setAttendanceRecorded(true);
          toast.success(`🎉 Attendance recorded! You watched ${Math.round(percentage)}% of the video.`);
        }
      }
    } catch (error) {
      console.error('Error updating video progress:', error);
    }
  };

  const handleVideoComplete = async () => {
    try {
      await videoProgressService.updateProgress(materialId!, {
        watchedPercentage: 100,
        isCompleted: true,
        completedAt: new Date()
      });
      
      toast.success('🎉 Video completed successfully!');
      
      if (material?.isAttendanceTrigger && !attendanceRecorded) {
        setAttendanceRecorded(true);
        toast.success('✅ Attendance has been recorded!');
      }
    } catch (error) {
      console.error('Error marking video as complete:', error);
    }
  };

  const getVideoUrl = (): string => {
    if (!material || !material.filePath) return '';
    
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    return `${baseUrl}/api/uploads/course-materials/${material.filePath.split('/').pop()}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader size="large" />
      </div>
    );
  }

  if (!course || !material) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Video Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-4">Video yang Anda cari tidak ditemukan atau telah dihapus.</p>
          <Button onClick={() => navigate(`/courses/${courseId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Course
          </Button>
        </div>
      </div>
    );
  }

  const videoUrl = getVideoUrl();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/courses/${courseId}`)}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Course
              </Button>
              
              <div className="hidden sm:flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">{course.name}</span>
                <span className="text-gray-400">•</span>
                <Badge variant="outline" className="text-xs">
                  Week {material.week}
                </Badge>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {material.isAttendanceTrigger && (
                <Badge 
                  className={`text-xs ${attendanceRecorded ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}
                >
                  {attendanceRecorded ? '✅ Attendance Recorded' : '🎯 Attendance Required'}
                </Badge>
              )}
              
              <Badge variant="outline" className="text-xs">
                {Math.round(videoProgress)}% Watched
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Video Player */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Video Player */}
                <div className="aspect-video bg-black">
                  <VideoPlayer
                    src={videoUrl}
                    title={material.title}
                    description={material.description}
                    onProgress={handleVideoProgress}
                    onComplete={handleVideoComplete}
                    className="w-full h-full"
                    autoPlay={false}
                    showControls={true}
                    allowFullscreen={true}
                    watermark={course.name}
                  />
                </div>
                
                {/* Video Info */}
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {material.title}
                      </h1>
                      
                      {material.description && (
                        <p className="text-gray-600 mb-4 leading-relaxed">
                          {material.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          <span>{course.lecturer.fullName}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          <span>Uploaded {formatDate(material.createdAt)}</span>
                        </div>
                        {material.fileSize && (
                          <div className="flex items-center">
                            <Monitor className="w-4 h-4 mr-1" />
                            <span>{formatFileSize(material.fileSize)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(videoUrl, '_blank')}
                      className="ml-4"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Watched</span>
                      <span className="font-medium">{Math.round(videoProgress)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${videoProgress}%` }}
                      />
                    </div>
                  </div>
                  
                  {material.isAttendanceTrigger && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-blue-800 font-medium">Attendance Required</span>
                        <span className="text-blue-600">
                          {material.attendanceThreshold || 80}%
                        </span>
                      </div>
                      <div className="mt-2 text-xs text-blue-600">
                        {attendanceRecorded 
                          ? '✅ Attendance recorded successfully!'
                          : `Watch ${material.attendanceThreshold || 80}% to record attendance`
                        }
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Course Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Course Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{course.name}</h4>
                    <p className="text-sm text-gray-600">{course.code}</p>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="w-4 h-4 mr-2" />
                    <span>{course.lecturer.fullName}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600">
                    <BookOpen className="w-4 h-4 mr-2" />
                    <span>{course.credits} Credits</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/courses/${courseId}`)}
                    className="w-full mt-4"
                  >
                    View All Materials
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Material Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Material Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Week</span>
                    <span className="font-medium">{material.week}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order</span>
                    <span className="font-medium">#{material.orderIndex}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type</span>
                    <Badge variant="outline" className="text-xs">
                      {material.type.toUpperCase()}
                    </Badge>
                  </div>
                  {material.fileSize && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Size</span>
                      <span className="font-medium">{formatFileSize(material.fileSize)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPreviewPage;