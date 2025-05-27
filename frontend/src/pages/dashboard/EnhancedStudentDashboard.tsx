import React, { useMemo } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  BookOpenIcon, 
  ClipboardDocumentListIcon, 
  ChatBubbleLeftIcon,
  BellIcon,
  ClockIcon,
  CalendarIcon,
  AcademicCapIcon,
  ChartBarIcon,
  TrophyIcon,
  FireIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { StatisticsChart, chartConfigs } from '../../components/charts/StatisticsChart';
import { courseService, assignmentService, notificationService, forumService } from '../../services';
import { formatDate, getDeadlineStatus } from '../../utils/date';
import { ProgressBar } from '../../components/ui/ProgressBar';

interface DashboardStats {
  enrolledCourses: number;
  pendingAssignments: number;
  unreadNotifications: number;
  activeDiscussions: number;
  completionRate: number;
  averageGrade: number;
  totalStudyHours: number;
  streakDays: number;
  upcomingDeadlines: Array<{
    id: string;
    title: string;
    courseName: string;
    dueDate: string;
    status: 'urgent' | 'warning' | 'normal';
  }>;
  recentActivities: Array<{
    id: string;
    type: 'assignment' | 'announcement' | 'grade' | 'forum';
    title: string;
    description: string;
    timestamp: string;
  }>;
  learningProgress: number[];
  gradeDistribution: number[];
  weeklyActivity: number[];
  courseProgress: Array<{
    courseName: string;
    progress: number;
    grade: string;
  }>;
}

const EnhancedStudentDashboard: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>(
    'enhanced-student-dashboard-stats',
    async () => {
      const [courses, assignmentsResponse, notificationsResponse, forums] = await Promise.all([
        courseService.getMyCourses(),
        assignmentService.getAssignments(),
        notificationService.getMyNotifications(),
        forumService.getMyDiscussions()
      ]);

      // Extract data from API responses
      const assignments = assignmentsResponse.data || [];
      const notifications = notificationsResponse.data || [];

      // Calculate statistics
      const pendingAssignments = assignments.filter(a => !a.mySubmission || a.mySubmission.status !== 'submitted').length;
      const completedAssignments = assignments.filter(a => a.mySubmission && a.mySubmission.status === 'submitted').length;
      const completionRate = assignments.length > 0 
        ? Math.round((completedAssignments / assignments.length) * 100)
        : 0;

      // Calculate average grade (mock data for now)
      const averageGrade = 85; // Mock average grade

      // Mock data for demonstration (replace with real API data)
      const totalStudyHours = 124;
      const streakDays = 7;
      const learningProgress = [65, 70, 72, 78, 82, 85];
      const gradeDistribution = [12, 18, 8, 3, 1];
      const weeklyActivity = [8, 12, 10, 15, 9, 6, 4];

      // Get upcoming deadlines
      const upcomingDeadlines = assignments
        .filter(a => (!a.mySubmission || a.mySubmission.status !== 'submitted') && new Date(a.dueDate) > new Date())
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5)
        .map(assignment => ({
          id: assignment.id,
          title: assignment.title,
          courseName: assignment.course.name,
          dueDate: assignment.dueDate,
          status: getDeadlineStatus(assignment.dueDate)
        }));

      // Get recent activities
      const recentActivities = [
        ...assignments.slice(0, 3).map(a => ({
          id: a.id,
          type: 'assignment' as const,
          title: `Tugas baru: ${a.title}`,
          description: a.course.name,
          timestamp: a.createdAt
        })),
        ...notifications.slice(0, 3).map(n => ({
          id: n.id,
          type: n.type as 'announcement' | 'grade',
          title: n.title,
          description: n.message,
          timestamp: n.createdAt
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);

      // Course progress data
      const courseProgress = courses.map(course => ({
        courseName: course.name,
        progress: Math.floor(Math.random() * 100), // Mock data
        grade: ['A', 'A-', 'B+', 'B'][Math.floor(Math.random() * 4)]
      }));

      return {
        enrolledCourses: courses.length,
        pendingAssignments,
        unreadNotifications: notifications.filter(n => !n.isRead).length,
        activeDiscussions: forums.filter(f => f.isActive).length,
        completionRate,
        averageGrade,
        totalStudyHours,
        streakDays,
        upcomingDeadlines,
        recentActivities,
        learningProgress,
        gradeDistribution,
        weeklyActivity,
        courseProgress
      };
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  // Chart data configurations
  const chartData = useMemo(() => {
    if (!stats) return null;
    
    return {
      learningProgress: chartConfigs.learningProgress(stats.learningProgress),
      gradeDistribution: chartConfigs.gradeDistribution(stats.gradeDistribution),
      assignmentStatus: chartConfigs.assignmentStatus(
        stats.completionRate,
        stats.pendingAssignments,
        Math.floor(stats.pendingAssignments * 0.2) // Mock overdue count
      ),
      weeklyActivity: chartConfigs.weeklyActivity(stats.weeklyActivity)
    };
  }, [stats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !chartData) {
    return <ErrorMessage message="Gagal memuat dashboard. Silakan coba lagi." />;
  }

  return (
    <div className="space-y-6">
      {/* Header dengan Motivasi */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard Mahasiswa</h1>
            <p className="text-blue-100 text-lg">
              Selamat datang kembali! Anda sudah belajar {stats?.streakDays} hari berturut-turut 🔥
            </p>
          </div>
          <div className="hidden lg:flex items-center space-x-8">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <FireIcon className="h-8 w-8 text-yellow-300" />
              </div>
              <p className="text-2xl font-bold">{stats?.streakDays}</p>
              <p className="text-sm text-blue-100">Hari Streak</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrophyIcon className="h-8 w-8 text-yellow-300" />
              </div>
              <p className="text-2xl font-bold">{stats?.averageGrade || 0}</p>
              <p className="text-sm text-blue-100">Rata-rata Nilai</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <ClockIcon className="h-8 w-8 text-yellow-300" />
              </div>
              <p className="text-2xl font-bold">{stats?.totalStudyHours}</p>
              <p className="text-sm text-blue-100">Jam Belajar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Mata Kuliah</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.enrolledCourses || 0}</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600">+2 bulan ini</span>
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <BookOpenIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tugas Pending</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.pendingAssignments || 0}</p>
              <div className="flex items-center mt-2">
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-sm text-red-600">-3 dari minggu lalu</span>
              </div>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <ClipboardDocumentListIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Notifikasi Baru</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.unreadNotifications || 0}</p>
              <div className="flex items-center mt-2">
                <span className="text-sm text-gray-500">Perlu perhatian</span>
              </div>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <BellIcon className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-all duration-300 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Progress Semester</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.completionRate || 0}%</p>
              <div className="mt-2">
                <ProgressBar value={stats?.completionRate || 0} className="h-2" />
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatisticsChart
          type="line"
          title="Progress Pembelajaran 6 Bulan Terakhir"
          data={chartData.learningProgress}
          height={300}
        />
        <StatisticsChart
          type="bar"
          title="Distribusi Nilai"
          data={chartData.gradeDistribution}
          height={300}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Progress */}
        <div className="lg:col-span-1">
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Progress Mata Kuliah</h2>
            </div>
            <div className="p-6 space-y-4">
              {stats?.courseProgress.map((course, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{course.courseName}</span>
                    <span className="text-sm font-bold text-gray-900">{course.grade}</span>
                  </div>
                  <div className="relative">
                    <ProgressBar value={course.progress} className="h-2" />
                    <span className="absolute right-0 -top-5 text-xs text-gray-500">{course.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Weekly Activity */}
        <div className="lg:col-span-1">
          <StatisticsChart
            type="bar"
            title="Aktivitas Mingguan"
            data={chartData.weeklyActivity}
            height={350}
          />
        </div>

        {/* Assignment Status */}
        <div className="lg:col-span-1">
          <StatisticsChart
            type="doughnut"
            title="Status Tugas"
            data={chartData.assignmentStatus}
            height={350}
          />
        </div>
      </div>

      {/* Deadlines and Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Deadlines */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Deadline Mendatang</h2>
                <ClockIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
            <div className="p-6">
              {stats?.upcomingDeadlines && stats.upcomingDeadlines.length > 0 ? (
                <div className="space-y-4">
                  {stats.upcomingDeadlines.map((deadline) => (
                    <div key={deadline.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-all duration-300">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{deadline.title}</h3>
                        <p className="text-sm text-gray-500">{deadline.courseName}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(deadline.dueDate, 'short')}
                          </p>
                          <p className={`text-xs font-semibold ${
                            deadline.status === 'urgent' ? 'text-red-600' :
                            deadline.status === 'warning' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {deadline.status === 'urgent' ? '⚠️ Segera!' :
                             deadline.status === 'warning' ? '⏰ Mendekat' :
                             '✅ Masih ada waktu'}
                          </p>
                        </div>
                        <Link 
                          to={`/assignments/${deadline.id}`}
                          className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
                        >
                          <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">Tidak ada deadline dalam waktu dekat</p>
                  <p className="text-xs text-gray-400 mt-1">Tetap semangat belajar! 💪</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Recent Activities */}
        <div>
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Aktivitas Terbaru</h2>
            </div>
            <div className="p-6">
              {stats?.recentActivities && stats.recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentActivities.map((activity) => (
                    <div key={activity.id} className="flex space-x-3 hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        activity.type === 'assignment' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                        activity.type === 'announcement' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                        activity.type === 'grade' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                        'bg-gradient-to-br from-purple-400 to-purple-600'
                      }`}>
                        {activity.type === 'assignment' && <ClipboardDocumentListIcon className="h-5 w-5 text-white" />}
                        {activity.type === 'announcement' && <BellIcon className="h-5 w-5 text-white" />}
                        {activity.type === 'grade' && <ChartBarIcon className="h-5 w-5 text-white" />}
                        {activity.type === 'forum' && <ChatBubbleLeftIcon className="h-5 w-5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                        <p className="text-xs text-gray-500 truncate">{activity.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(activity.timestamp, 'relative')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ClockIcon className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">Belum ada aktivitas</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Aksi Cepat</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/assignments" className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-200">
            <ClipboardDocumentListIcon className="h-8 w-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Lihat Tugas</span>
          </Link>
          <Link to="/courses" className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-200">
            <BookOpenIcon className="h-8 w-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Mata Kuliah</span>
          </Link>
          <Link to="/forums" className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-200">
            <ChatBubbleLeftIcon className="h-8 w-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Forum Diskusi</span>
          </Link>
          <Link to="/announcements" className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors duration-200">
            <BellIcon className="h-8 w-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-gray-700">Pengumuman</span>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default EnhancedStudentDashboard;