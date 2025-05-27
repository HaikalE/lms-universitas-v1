import React from 'react';
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
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { courseService, assignmentService, notificationService, forumService } from '../../services';
import { formatDate, getDeadlineStatus } from '../../utils/date';
import { ProgressBar } from '../../components/ui/ProgressBar';

interface DashboardStats {
  enrolledCourses: number;
  pendingAssignments: number;
  unreadNotifications: number;
  activeDiscussions: number;
  completionRate: number;
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
}

const StudentDashboard: React.FC = () => {
  const { data: stats, isLoading, error } = useQuery<DashboardStats>(
    'student-dashboard-stats',
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

      return {
        enrolledCourses: courses.length,
        pendingAssignments,
        unreadNotifications: notifications.filter(n => !n.isRead).length,
        activeDiscussions: forums.filter(f => f.isActive).length,
        completionRate,
        upcomingDeadlines,
        recentActivities
      };
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Gagal memuat dashboard. Silakan coba lagi." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Mahasiswa</h1>
            <p className="mt-1 text-sm text-gray-500">
              Selamat datang kembali! Berikut ringkasan aktivitas pembelajaran Anda.
            </p>
          </div>
          <div className="hidden sm:flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">{formatDate(new Date(), 'full')}</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <BookOpenIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Mata Kuliah</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.enrolledCourses || 0}</p>
            </div>
          </div>
          <Link to="/courses" className="mt-4 flex items-center text-sm text-blue-600 hover:text-blue-800">
            Lihat semua
            <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ClipboardDocumentListIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Tugas Pending</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.pendingAssignments || 0}</p>
            </div>
          </div>
          <Link to="/assignments" className="mt-4 flex items-center text-sm text-yellow-600 hover:text-yellow-800">
            Kerjakan tugas
            <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <BellIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Notifikasi Baru</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.unreadNotifications || 0}</p>
            </div>
          </div>
          <Link to="/notifications" className="mt-4 flex items-center text-sm text-red-600 hover:text-red-800">
            Lihat notifikasi
            <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Progress</p>
              <div className="flex items-center">
                <p className="text-2xl font-semibold text-gray-900">{stats?.completionRate || 0}%</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <ProgressBar value={stats?.completionRate || 0} className="h-2" />
          </div>
        </Card>
      </div>

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
                    <div key={deadline.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{deadline.title}</h3>
                        <p className="text-sm text-gray-500">{deadline.courseName}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(deadline.dueDate, 'short')}
                          </p>
                          <p className={`text-xs ${
                            deadline.status === 'urgent' ? 'text-red-600' :
                            deadline.status === 'warning' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {deadline.status === 'urgent' ? 'Segera!' :
                             deadline.status === 'warning' ? 'Mendekat' :
                             'Masih ada waktu'}
                          </p>
                        </div>
                        <Link 
                          to={`/assignments/${deadline.id}`}
                          className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
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
                    <div key={activity.id} className="flex space-x-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        activity.type === 'assignment' ? 'bg-blue-100' :
                        activity.type === 'announcement' ? 'bg-yellow-100' :
                        activity.type === 'grade' ? 'bg-green-100' :
                        'bg-purple-100'
                      }`}>
                        {activity.type === 'assignment' && <ClipboardDocumentListIcon className="h-4 w-4 text-blue-600" />}
                        {activity.type === 'announcement' && <BellIcon className="h-4 w-4 text-yellow-600" />}
                        {activity.type === 'grade' && <ChartBarIcon className="h-4 w-4 text-green-600" />}
                        {activity.type === 'forum' && <ChatBubbleLeftIcon className="h-4 w-4 text-purple-600" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{activity.title}</p>
                        <p className="text-xs text-gray-500">{activity.description}</p>
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
    </div>
  );
};

export default StudentDashboard;