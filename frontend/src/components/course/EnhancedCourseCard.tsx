import React, { useState } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  BookmarkIcon, 
  ShareIcon, 
  UserGroupIcon,
  CalendarDaysIcon,
  ClockIcon,
  StarIcon,
  AcademicCapIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

export interface Course {
  id: string;
  title: string;
  description: string;
  instructor: {
    name: string;
    avatar?: string;
    title?: string;
  };
  thumbnail?: string;
  duration: number; // in minutes
  studentsCount: number;
  rating: number;
  reviewsCount: number;
  progress?: number; // 0-100
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  lastAccessed?: Date;
  isBookmarked?: boolean;
  isEnrolled?: boolean;
  price?: number;
  originalPrice?: number;
  tags: string[];
  lessons: number;
  completedLessons?: number;
  certificate?: boolean;
  language: string;
}

interface EnhancedCourseCardProps {
  course: Course;
  variant?: 'default' | 'compact' | 'detailed';
  showProgress?: boolean;
  onPlay?: (course: Course) => void;
  onBookmark?: (courseId: string, bookmarked: boolean) => void;
  onShare?: (course: Course) => void;
  onEnroll?: (course: Course) => void;
  onClick?: (course: Course) => void;
  className?: string;
}

const EnhancedCourseCard: React.FC<EnhancedCourseCardProps> = ({
  course,
  variant = 'default',
  showProgress = true,
  onPlay,
  onBookmark,
  onShare,
  onEnroll,
  onClick,
  className = ''
}) => {
  const [isBookmarked, setIsBookmarked] = useState(course.isBookmarked || false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const handleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newBookmarked = !isBookmarked;
    setIsBookmarked(newBookmarked);
    onBookmark?.(course.id, newBookmarked);
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlay?.(course);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(course);
  };

  const handleEnroll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEnroll?.(course);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (variant === 'compact') {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        onClick={() => onClick?.(course)}
        className={`bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-all ${className}`}
      >
        <div className="flex items-center space-x-4">
          {/* Thumbnail */}
          <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            {course.thumbnail && !imageError ? (
              <img
                src={course.thumbnail}
                alt={course.title}
                className="w-full h-full object-cover"
                onLoad={() => setImageLoading(false)}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <AcademicCapIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
            
            {course.isEnrolled && (
              <div className="absolute top-1 right-1">
                <CheckCircleIcon className="w-4 h-4 text-green-600" />
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {course.title}
            </h3>
            <p className="text-xs text-gray-600 mt-1">
              by {course.instructor.name}
            </p>
            
            <div className="flex items-center space-x-3 mt-2">
              <div className="flex items-center text-xs text-gray-500">
                <ClockIcon className="w-3 h-3 mr-1" />
                {formatDuration(course.duration)}
              </div>
              
              <div className="flex items-center text-xs text-gray-500">
                <StarIcon className="w-3 h-3 mr-1" />
                {course.rating.toFixed(1)}
              </div>
            </div>
            
            {showProgress && course.progress !== undefined && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {course.progress}% complete
                </p>
              </div>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex items-center space-x-1">
            {course.isEnrolled && onPlay && (
              <button
                onClick={handlePlay}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Continue Learning"
              >
                <PlayIcon className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={handleBookmark}
              className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
              title={isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
            >
              {isBookmarked ? (
                <BookmarkSolidIcon className="w-4 h-4 text-yellow-600" />
              ) : (
                <BookmarkIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      onClick={() => onClick?.(course)}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 ${className}`}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-100">
        {course.thumbnail && !imageError ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover"
            onLoad={() => setImageLoading(false)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <AcademicCapIcon className="w-16 h-16 text-gray-400" />
          </div>
        )}
        
        {imageLoading && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
        
        {/* Overlay Actions */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 hover:opacity-100">
          {course.isEnrolled && onPlay && (
            <button
              onClick={handlePlay}
              className="bg-white bg-opacity-90 text-gray-900 p-3 rounded-full hover:bg-opacity-100 transition-all"
            >
              <PlayIcon className="w-6 h-6" />
            </button>
          )}
        </div>
        
        {/* Top badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(course.difficulty)}`}>
            {course.difficulty}
          </span>
          
          {course.certificate && (
            <span className="bg-purple-100 text-purple-800 px-2 py-1 text-xs font-medium rounded-full">
              Certificate
            </span>
          )}
        </div>
        
        {/* Top right actions */}
        <div className="absolute top-3 right-3 flex space-x-2">
          <button
            onClick={handleBookmark}
            className="bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full transition-all"
            title={isBookmarked ? 'Remove Bookmark' : 'Bookmark'}
          >
            {isBookmarked ? (
              <BookmarkSolidIcon className="w-4 h-4 text-yellow-600" />
            ) : (
              <BookmarkIcon className="w-4 h-4 text-gray-600" />
            )}
          </button>
          
          <button
            onClick={handleShare}
            className="bg-white bg-opacity-80 hover:bg-opacity-100 p-2 rounded-full transition-all"
            title="Share Course"
          >
            <ShareIcon className="w-4 h-4 text-gray-600" />
          </button>
        </div>
        
        {/* Duration badge */}
        <div className="absolute bottom-3 right-3">
          <span className="bg-black bg-opacity-70 text-white px-2 py-1 text-xs rounded">
            {formatDuration(course.duration)}
          </span>
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {/* Category */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-blue-600 font-medium">
            {course.category}
          </span>
          
          {course.lastAccessed && (
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(course.lastAccessed, { addSuffix: true })}
            </span>
          )}
        </div>
        
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h3>
        
        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {course.description}
        </p>
        
        {/* Instructor */}
        <div className="flex items-center mb-4">
          {course.instructor.avatar ? (
            <img
              src={course.instructor.avatar}
              alt={course.instructor.name}
              className="w-8 h-8 rounded-full mr-3"
            />
          ) : (
            <div className="w-8 h-8 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                {course.instructor.name.charAt(0)}
              </span>
            </div>
          )}
          
          <div>
            <p className="text-sm font-medium text-gray-900">
              {course.instructor.name}
            </p>
            {course.instructor.title && (
              <p className="text-xs text-gray-500">
                {course.instructor.title}
              </p>
            )}
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center">
              <UserGroupIcon className="w-4 h-4 mr-1" />
              {course.studentsCount.toLocaleString()}
            </div>
            
            <div className="flex items-center">
              <StarIcon className="w-4 h-4 mr-1" />
              {course.rating.toFixed(1)} ({course.reviewsCount})
            </div>
            
            <div className="flex items-center">
              <AcademicCapIcon className="w-4 h-4 mr-1" />
              {course.lessons} lessons
            </div>
          </div>
        </div>
        
        {/* Progress */}
        {showProgress && course.progress !== undefined && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progress
              </span>
              <span className="text-sm text-gray-500">
                {course.completedLessons || 0}/{course.lessons} lessons
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${course.progress}%` }}
              />
            </div>
            
            <p className="text-xs text-gray-500 mt-1">
              {course.progress}% complete
            </p>
          </div>
        )}
        
        {/* Tags */}
        {course.tags.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {course.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-700 px-2 py-1 text-xs rounded"
                >
                  {tag}
                </span>
              ))}
              {course.tags.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{course.tags.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
        
        {/* Price and Action */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {course.price !== undefined ? (
              <>
                <span className="text-lg font-bold text-gray-900">
                  ${course.price}
                </span>
                {course.originalPrice && course.originalPrice > course.price && (
                  <span className="text-sm text-gray-500 line-through">
                    ${course.originalPrice}
                  </span>
                )}
              </>
            ) : (
              <span className="text-lg font-bold text-green-600">
                Free
              </span>
            )}
          </div>
          
          {!course.isEnrolled ? (
            <button
              onClick={handleEnroll}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Enroll Now
            </button>
          ) : onPlay ? (
            <button
              onClick={handlePlay}
              className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center"
            >
              <PlayIcon className="w-4 h-4 mr-2" />
              Continue
            </button>
          ) : (
            <span className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium flex items-center">
              <CheckCircleIcon className="w-4 h-4 mr-2" />
              Enrolled
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default EnhancedCourseCard;