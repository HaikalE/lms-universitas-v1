import React, { useState, useEffect, useMemo } from 'react';
import {
  AcademicCapIcon,
  ChartBarIcon,
  UsersIcon,
  CalendarDaysIcon,
  BellIcon,
  TrophyIcon,
  ClockIcon,
  BookOpenIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import AdvancedChart, { ChartConfig } from '../charts/AdvancedChart';
import EnhancedCourseCard, { Course } from '../course/EnhancedCourseCard';
import NotificationCenter, { Notification } from '../ui/NotificationCenter';
import ProgressIndicator from '../ui/ProgressIndicator';
import { useAccessibility } from '../../hooks/useAccessibility';

interface DashboardData {
  user: {
    id: string;
    name: string;
    role: 'student' | 'lecturer' | 'admin';
    avatar?: string;
    stats: {
      totalCourses: number;
      completedCourses: number;
      totalAssignments: number;
      completedAssignments: number;
      totalHours: number;
      streak: number;
    };
  };
  courses: Course[];
  notifications: Notification[];
  activities: Array<{
    id: string;
    type: 'course_completed' | 'assignment_submitted' | 'grade_received' | 'login';
    title: string;
    description: string;
    timestamp: Date;
    metadata?: Record<string, any>;
  }>;
  analytics: {
    learningProgress: Array<{ date: string; progress: number; hoursStudied: number }>;
    coursePerformance: Array<{ course: string; score: number; completion: number }>;
    weeklyActivity: Array<{ day: string; hours: number; activities: number }>;
    upcomingDeadlines: Array<{
      id: string;
      title: string;
      type: 'assignment' | 'exam' | 'project';
      dueDate: Date;
      course: string;
      priority: 'low' | 'medium' | 'high';
    }>;
  };
}

interface EnhancedDashboardProps {
  data: DashboardData;
  loading?: boolean;
  onCourseAction?: (courseId: string, action: string) => void;
  onNotificationAction?: (notificationId: string) => void;
  className?: string;
}

const EnhancedDashboard: React.FC<EnhancedDashboardProps> = ({
  data,
  loading = false,
  onCourseAction,
  onNotificationAction,
  className = ''
}) => {
  const { announceToScreenReader, reducedMotion } = useAccessibility();
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('week');
  const [showAllCourses, setShowAllCourses] = useState(false);

  // Calculate dashboard metrics
  const metrics = useMemo(() => {
    const { user } = data;
    const completionRate = user.stats.totalCourses > 0 
      ? (user.stats.completedCourses / user.stats.totalCourses) * 100 
      : 0;
    
    const assignmentCompletionRate = user.stats.totalAssignments > 0
      ? (user.stats.completedAssignments / user.stats.totalAssignments) * 100
      : 0;
    
    const averageProgress = data.courses.length > 0
      ? data.courses.reduce((sum, course) => sum + (course.progress || 0), 0) / data.courses.length
      : 0;

    return {
      completionRate,
      assignmentCompletionRate,
      averageProgress,
      streak: user.stats.streak,
      totalHours: user.stats.totalHours
    };
  }, [data]);

  // Prepare chart data
  const chartConfigs: Record<string, ChartConfig> = useMemo(() => {
    return {
      learningProgress: {
        type: 'area',
        data: data.analytics.learningProgress,
        xAxisKey: 'date',
        yAxisKey: 'progress',
        title: 'Learning Progress',
        subtitle: 'Your progress over time',
        gradientColors: { start: '#3B82F6', end: '#1D4ED8' },
        formatValue: (value) => `${value}%`,
        height: 300
      },
      weeklyActivity: {
        type: 'bar',
        data: data.analytics.weeklyActivity,
        xAxisKey: 'day',
        yAxisKey: 'hours',
        title: 'Weekly Activity',
        subtitle: 'Hours studied per day',
        colors: ['#10B981'],
        formatValue: (value) => `${value}h`,
        height: 250
      },
      coursePerformance: {
        type: 'radialBar',
        data: data.analytics.coursePerformance.slice(0, 5),
        valueKey: 'score',
        nameKey: 'course',
        title: 'Course Performance',
        subtitle: 'Top 5 courses by score',
        colors: ['#8B5CF6', '#06B6D4', '#F59E0B', '#EF4444', '#10B981'],
        height: 300
      }
    };
  }, [data.analytics]);

  // Get current week activities
  const weekStart = startOfWeek(new Date());
  const weekEnd = endOfWeek(new Date());
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const recentCourses = data.courses
    .filter(course => course.lastAccessed)
    .sort((a, b) => (b.lastAccessed?.getTime() || 0) - (a.lastAccessed?.getTime() || 0))
    .slice(0, showAllCourses ? undefined : 3);

  const urgentDeadlines = data.analytics.upcomingDeadlines
    .filter(deadline => {
      const daysUntil = Math.ceil((deadline.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      return daysUntil <= 7;
    })
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

  useEffect(() => {
    if (!loading) {
      announceToScreenReader('Dashboard loaded with latest data');
    }
  }, [loading, announceToScreenReader]);

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    change?: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
  }> = ({ title, value, change, icon: Icon, color, trend = 'neutral' }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.3 }}
      className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <p className={`text-sm mt-1 flex items-center ${
              trend === 'up' ? 'text-green-600' : 
              trend === 'down' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className={`animate-pulse space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-gray-200 rounded-xl h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-200 rounded-xl h-80" />
          <div className="bg-gray-200 rounded-xl h-80" />
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`} id="main-content">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white p-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome back, {data.user.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-blue-100 text-lg">
              {data.user.role === 'student' ? 
                'Ready to continue your learning journey?' :
                data.user.role === 'lecturer' ?
                'Your students are waiting for your guidance.' :
                'Manage your educational platform.'
              }
            </p>
          </div>
          
          {data.user.avatar && (
            <img
              src={data.user.avatar}
              alt={data.user.name}
              className="w-16 h-16 rounded-full border-4 border-white/20"
            />
          )}
        </div>
        
        {/* Streak Display */}
        {metrics.streak > 0 && (
          <div className="mt-4 flex items-center">
            <TrophyIcon className="w-5 h-5 mr-2" />
            <span className="text-sm">
              🔥 {metrics.streak} day learning streak!
            </span>
          </div>
        )}
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Course Progress"
          value={`${Math.round(metrics.averageProgress)}%`}
          change={`${data.courses.length} enrolled`}
          icon={AcademicCapIcon}
          color="bg-blue-500"
          trend="up"
        />
        
        <StatCard
          title="Assignments"
          value={`${data.user.stats.completedAssignments}/${data.user.stats.totalAssignments}`}
          change={`${Math.round(metrics.assignmentCompletionRate)}% complete`}
          icon={CheckCircleIcon}
          color="bg-green-500"
          trend={metrics.assignmentCompletionRate > 80 ? 'up' : 'neutral'}
        />
        
        <StatCard
          title="Study Time"
          value={`${metrics.totalHours}h`}
          change="This month"
          icon={ClockIcon}
          color="bg-purple-500"
          trend="up"
        />
        
        <StatCard
          title="Notifications"
          value={data.notifications.filter(n => !n.read).length}
          change="Unread"
          icon={BellIcon}
          color="bg-orange-500"
          trend="neutral"
        />
      </div>

      {/* Urgent Deadlines Alert */}
      {urgentDeadlines.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 border border-red-200 rounded-xl p-6"
        >
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="w-6 h-6 text-red-600 mr-3" />
            <h3 className="text-lg font-semibold text-red-900">
              Urgent Deadlines ({urgentDeadlines.length})
            </h3>
          </div>
          
          <div className="space-y-3">
            {urgentDeadlines.slice(0, 3).map((deadline) => {
              const daysUntil = Math.ceil((deadline.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              return (
                <div key={deadline.id} className="flex items-center justify-between bg-white p-4 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{deadline.title}</p>
                    <p className="text-sm text-gray-600">{deadline.course}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${
                      daysUntil <= 1 ? 'text-red-600' : 
                      daysUntil <= 3 ? 'text-orange-600' : 
                      'text-yellow-600'
                    }`}>
                      {daysUntil === 0 ? 'Due today' : 
                       daysUntil === 1 ? 'Due tomorrow' :
                       `Due in ${daysUntil} days`
                      }
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(deadline.dueDate, 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AdvancedChart
          config={chartConfigs.learningProgress}
          loading={loading}
        />
        
        <AdvancedChart
          config={chartConfigs.weeklyActivity}
          loading={loading}
        />
      </div>

      {/* Recent Courses */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {data.user.role === 'student' ? 'Continue Learning' : 'Recent Courses'}
          </h2>
          
          {data.courses.length > 3 && (
            <button
              onClick={() => setShowAllCourses(!showAllCourses)}
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              {showAllCourses ? 'Show Less' : `View All (${data.courses.length})`}
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: reducedMotion ? 0 : 0.3 }}
            >
              <EnhancedCourseCard
                course={course}
                variant="default"
                showProgress={true}
                onPlay={(course) => onCourseAction?.(course.id, 'play')}
                onBookmark={(courseId, bookmarked) => onCourseAction?.(courseId, bookmarked ? 'bookmark' : 'unbookmark')}
                onClick={(course) => onCourseAction?.(course.id, 'view')}
              />
            </motion.div>
          ))}
        </div>
        
        {data.courses.length === 0 && (
          <div className="text-center py-12">
            <BookOpenIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No courses yet
            </h3>
            <p className="text-gray-600 mb-4">
              {data.user.role === 'student' 
                ? 'Start your learning journey by enrolling in courses'
                : 'Create your first course to get started'
              }
            </p>
            <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              {data.user.role === 'student' ? 'Browse Courses' : 'Create Course'}
            </button>
          </div>
        )}
      </div>

      {/* Performance Chart */}
      {data.analytics.coursePerformance.length > 0 && (
        <AdvancedChart
          config={chartConfigs.coursePerformance}
          loading={loading}
          className="lg:col-span-2"
        />
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Activity
        </h3>
        
        {data.activities.length > 0 ? (
          <div className="space-y-4">
            {data.activities.slice(0, 5).map((activity, index) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05, duration: reducedMotion ? 0 : 0.2 }}
                className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg"
              >
                <div className={`p-2 rounded-full ${
                  activity.type === 'course_completed' ? 'bg-green-100 text-green-600' :
                  activity.type === 'assignment_submitted' ? 'bg-blue-100 text-blue-600' :
                  activity.type === 'grade_received' ? 'bg-purple-100 text-purple-600' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {activity.type === 'course_completed' ? <CheckCircleIcon className="w-5 h-5" /> :
                   activity.type === 'assignment_submitted' ? <BookOpenIcon className="w-5 h-5" /> :
                   activity.type === 'grade_received' ? <ChartBarIcon className="w-5 h-5" /> :
                   <ClockIcon className="w-5 h-5" />
                  }
                </div>
                
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                </div>
                
                <span className="text-sm text-gray-500">
                  {format(activity.timestamp, 'MMM dd, HH:mm')}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No recent activity to show
          </p>
        )}
      </div>
    </div>
  );
};

export default EnhancedDashboard;