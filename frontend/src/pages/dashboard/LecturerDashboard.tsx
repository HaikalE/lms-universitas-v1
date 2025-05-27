import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  BookOpenIcon, 
  UserGroupIcon, 
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ChartPieIcon,
  BellAlertIcon,
  PlusCircleIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { courseService, assignmentService, forumService, announcementService } from '../../services';
import { formatDate } from '../../utils/date';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface LecturerStats {
  totalCourses: number;
  totalStudents: number;
  pendingGrading: number;
  activeDiscussions: number;
  averageCompletionRate: number;
  recentSubmissions: Array<{
    id: string;
    studentName: string;
    assignmentTitle: string;
    courseName: string;
    submittedAt: string;
    status: 'pending' | 'graded';
  }>;
  courseStats: Array<{
    id: string;
    name: string;
    enrolledStudents: number;
    assignments: number;
    completionRate: number;
  }>;
  submissionTrends: Array<{
    date: string;
    submissions: number;
  }>;
  upcomingSchedule: Array<{
    id: string;
    type: 'class' | 'assignment' | 'meeting';
    title: string;
    time: string;
    location?: string;
  }>;
}

const LecturerDashboard: React.FC = () => {
  const { data: stats, isLoading, error, refetch } = useQuery<LecturerStats>(
    'lecturer-dashboard-stats',
    async () => {
      const [courses, assignments, forums, announcements] = await Promise.all([
        courseService.getMyCourses({ role: 'lecturer' }),
        assignmentService.getAssignments({ role: 'lecturer' }),
        forumService.getMyDiscussions(),
        announcementService.getMyAnnouncements({ role: 'lecturer' })
      ]);

      // Calculate total students
      const totalStudents = courses.reduce((sum, course) => sum + course.enrolledStudents, 0);

      // Calculate pending grading
      const pendingGrading = assignments.reduce((sum, assignment) => 
        sum + assignment.submissions.filter(s => s.status === 'submitted' && !s.grade).length, 0
      );

      // Calculate active discussions
      const activeDiscussions = forums.filter(f => f.lastActivity && 
        new Date(f.lastActivity).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
      ).length;

      // Calculate average completion rate
      const completionRates = courses.map(course => {
        const courseAssignments = assignments.filter(a => a.courseId === course.id);
        if (courseAssignments.length === 0) return 0;
        
        const totalExpectedSubmissions = courseAssignments.length * course.enrolledStudents;
        const actualSubmissions = courseAssignments.reduce((sum, a) => sum + a.submissions.length, 0);
        return (actualSubmissions / totalExpectedSubmissions) * 100;
      });

      const averageCompletionRate = completionRates.length > 0
        ? Math.round(completionRates.reduce((a, b) => a + b) / completionRates.length)
        : 0;

      // Get recent submissions
      const allSubmissions = assignments.flatMap(a => 
        a.submissions.map(s => ({
          ...s,
          assignmentTitle: a.title,
          courseName: courses.find(c => c.id === a.courseId)?.name || ''
        }))
      );

      const recentSubmissions = allSubmissions
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, 5)
        .map(s => ({
          id: s.id,
          studentName: s.student.fullName,
          assignmentTitle: s.assignmentTitle,
          courseName: s.courseName,
          submittedAt: s.submittedAt,
          status: s.grade ? 'graded' as const : 'pending' as const
        }));

      // Course statistics
      const courseStats = courses.map(course => {
        const courseAssignments = assignments.filter(a => a.courseId === course.id);
        const completionRate = completionRates[courses.indexOf(course)] || 0;

        return {
          id: course.id,
          name: course.name,
          enrolledStudents: course.enrolledStudents,
          assignments: courseAssignments.length,
          completionRate: Math.round(completionRate)
        };
      });

      // Submission trends (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const submissionTrends = last7Days.map(date => ({
        date: formatDate(date, 'short'),
        submissions: allSubmissions.filter(s => 
          s.submittedAt.startsWith(date)
        ).length
      }));

      // Mock upcoming schedule (in real app, this would come from calendar service)
      const upcomingSchedule = [
        {
          id: '1',
          type: 'class' as const,
          title: 'Algoritma & Pemrograman',
          time: '08:00 - 10:00',
          location: 'Ruang 301'
        },
        {
          id: '2',
          type: 'assignment' as const,
          title: 'Deadline: Tugas Database',
          time: '23:59',
        },
        {
          id: '3',
          type: 'meeting' as const,
          title: 'Rapat Departemen',
          time: '14:00 - 15:00',
          location: 'Ruang Meeting'
        }
      ];

      return {
        totalCourses: courses.length,
        totalStudents,
        pendingGrading,
        activeDiscussions,
        averageCompletionRate,
        recentSubmissions,
        courseStats,
        submissionTrends,
        upcomingSchedule
      };
    },
    {
      refetchInterval: 60000, // Refresh every minute
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
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Dosen</h1>
            <p className="mt-1 text-sm text-gray-500">
              Kelola mata kuliah dan pantau progress mahasiswa Anda
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
            <Link to="/courses/create">
              <Button size="sm">
                <PlusCircleIcon className="h-4 w-4 mr-2" />
                Buat Mata Kuliah
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-indigo-100 rounded-lg">
              <BookOpenIcon className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Mata Kuliah</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.totalCourses || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Total Mahasiswa</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.totalStudents || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <ClipboardDocumentCheckIcon className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Perlu Dinilai</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.pendingGrading || 0}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <ChartPieIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">Rata-rata Progress</p>
              <p className="text-2xl font-semibold text-gray-900">{stats?.averageCompletionRate || 0}%</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Statistics */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Statistik Mata Kuliah</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats?.courseStats.map((course) => (
                  <div key={course.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{course.name}</h3>
                        <div className="mt-2 flex items-center space-x-6 text-sm text-gray-600">
                          <span className="flex items-center">
                            <UserGroupIcon className="h-4 w-4 mr-1" />
                            {course.enrolledStudents} mahasiswa
                          </span>
                          <span className="flex items-center">
                            <DocumentTextIcon className="h-4 w-4 mr-1" />
                            {course.assignments} tugas
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{course.completionRate}%</p>
                          <p className="text-xs text-gray-500">Progress</p>
                        </div>
                        <ProgressBar value={course.completionRate} className="mt-2 w-24 h-2" />
                      </div>
                    </div>
                    <div className="mt-3 flex space-x-2">
                      <Link to={`/courses/${course.id}`}>
                        <Button size="sm" variant="outline">
                          <EyeIcon className="h-4 w-4 mr-1" />
                          Lihat Detail
                        </Button>
                      </Link>
                      <Link to={`/courses/${course.id}/assignments`}>
                        <Button size="sm" variant="outline">
                          Kelola Tugas
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Upcoming Schedule */}
        <div>
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Jadwal Hari Ini</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {stats?.upcomingSchedule.map((schedule) => (
                  <div key={schedule.id} className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                      schedule.type === 'class' ? 'bg-blue-100' :
                      schedule.type === 'assignment' ? 'bg-yellow-100' :
                      'bg-purple-100'
                    }`}>
                      {schedule.type === 'class' && <CalendarDaysIcon className="h-5 w-5 text-blue-600" />}
                      {schedule.type === 'assignment' && <ClipboardDocumentCheckIcon className="h-5 w-5 text-yellow-600" />}
                      {schedule.type === 'meeting' && <UserGroupIcon className="h-5 w-5 text-purple-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{schedule.title}</p>
                      <p className="text-sm text-gray-600">{schedule.time}</p>
                      {schedule.location && (
                        <p className="text-xs text-gray-500">{schedule.location}</p>
                      )}
                    </div>
                  </div>
                ))}
                <Link to="/calendar" className="block mt-4 text-center">
                  <Button variant="outline" size="sm" className="w-full">
                    Lihat Kalender Lengkap
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Submission Trends Chart */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Tren Pengumpulan Tugas (7 Hari Terakhir)</h2>
        </div>
        <div className="p-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.submissionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="submissions" fill="#4F46E5" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Recent Submissions */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Pengumpulan Tugas Terbaru</h2>
            <Link to="/assignments/submissions">
              <Button variant="outline" size="sm">
                Lihat Semua
              </Button>
            </Link>
          </div>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mahasiswa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tugas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mata Kuliah
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Waktu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats?.recentSubmissions.map((submission) => (
                  <tr key={submission.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {submission.studentName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.assignmentTitle}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.courseName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(submission.submittedAt, 'relative')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        submission.status === 'graded' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {submission.status === 'graded' ? 'Sudah Dinilai' : 'Menunggu Penilaian'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link 
                        to={`/assignments/submissions/${submission.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        {submission.status === 'graded' ? 'Lihat' : 'Nilai'}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LecturerDashboard;