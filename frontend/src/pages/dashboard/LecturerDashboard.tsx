import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  BookOpenIcon, 
  UserGroupIcon, 
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  PlusIcon,
  BellIcon,
  EyeIcon,
  CalendarDaysIcon,
  ClockIcon,
  AcademicCapIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  StarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon as CheckCircleIconSolid,
  ExclamationTriangleIcon as ExclamationTriangleIconSolid
} from '@heroicons/react/24/solid';
import { courseService, DashboardStats } from '../../services/courseService';
import { assignmentService } from '../../services/assignmentService';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { toast } from 'react-hot-toast';

const EnhancedLecturerDashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [greeting, setGreeting] = useState('');
  const [activeCard, setActiveCard] = useState<string | null>(null);
  const [quickGradeData, setQuickGradeData] = useState<{[key: string]: {score: string, feedback: string}}>({});
  
  const queryClient = useQueryClient();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Set greeting based on time
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Selamat Pagi');
    else if (hour < 17) setGreeting('Selamat Siang');
    else setGreeting('Selamat Malam');

    return () => clearInterval(timer);
  }, []);

  const { data: dashboardData, isLoading, error, refetch } = useQuery<DashboardStats>(
    'lecturer-dashboard-stats',
    async () => {
      const response = await courseService.getDashboardStats();
      return response.data;
    },
    {
      refetchInterval: 30000, // Refresh every 30 seconds for latest submissions
      retry: 3,
    }
  );

  // Quick grading mutation
  const gradeMutation = useMutation(
    async ({ submissionId, gradeData }: { submissionId: string, gradeData: any }) => {
      return await assignmentService.gradeSubmission(submissionId, gradeData);
    },
    {
      onSuccess: (data, variables) => {
        toast.success('✅ Submission berhasil dinilai!');
        queryClient.invalidateQueries('lecturer-dashboard-stats');
        // Clear the form data
        setQuickGradeData(prev => {
          const newData = { ...prev };
          delete newData[variables.submissionId];
          return newData;
        });
      },
      onError: (error: any) => {
        toast.error('❌ Gagal menilai submission: ' + (error.message || 'Unknown error'));
      },
    }
  );

  const handleQuickGrade = (submissionId: string) => {
    const gradeData = quickGradeData[submissionId];
    if (!gradeData || !gradeData.score) {
      toast.error('Silakan masukkan nilai terlebih dahulu');
      return;
    }

    const score = parseFloat(gradeData.score);
    if (isNaN(score) || score < 0 || score > 100) {
      toast.error('Nilai harus berupa angka antara 0-100');
      return;
    }

    gradeMutation.mutate({
      submissionId,
      gradeData: {
        score: score,
        feedback: gradeData.feedback || 'Dinilai via dashboard'
      }
    });
  };

  const updateQuickGradeData = (submissionId: string, field: 'score' | 'feedback', value: string) => {
    setQuickGradeData(prev => ({
      ...prev,
      [submissionId]: {
        ...prev[submissionId],
        [field]: value
      }
    }));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Baru saja';
    if (diffInMinutes < 60) return `${diffInMinutes} menit lalu`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} jam lalu`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} hari lalu`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
        <ErrorMessage message="Gagal memuat dashboard. Silakan coba lagi." />
        <div className="mt-4 text-center">
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      id: 'courses',
      title: 'Mata Kuliah',
      value: dashboardData?.overview.totalCourses || 0,
      icon: BookOpenIcon,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      id: 'students',
      title: 'Total Mahasiswa',
      value: dashboardData?.overview.totalStudents || 0,
      icon: UserGroupIcon,
      color: 'from-green-500 to-emerald-600',
    },
    {
      id: 'pending',
      title: 'Perlu Review',
      value: dashboardData?.overview.pendingGrading || 0,
      icon: ClipboardDocumentCheckIcon,
      color: 'from-orange-500 to-red-600',
    },
    {
      id: 'completion',
      title: 'Completion Rate',
      value: `${dashboardData?.overview.completionRate || 0}%`,
      icon: ChartBarIcon,
      color: 'from-purple-500 to-pink-600',
    },
  ];

  const pendingSubmissions = dashboardData?.pendingSubmissions || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {greeting}, Prof! 👋
            </h1>
            <p className="text-gray-600 text-lg">
              {formatDate(currentTime)} • {formatTime(currentTime)}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="relative p-3 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <BellIcon className="h-6 w-6 text-gray-600" />
              {(dashboardData?.overview.pendingGrading || 0) > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                  {dashboardData?.overview.pendingGrading}
                </span>
              )}
            </button>
            <Link to="/courses/create">
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2">
                <PlusIcon className="h-5 w-5" />
                <span>Buat Konten</span>
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div 
            key={stat.id}
            className={`relative overflow-hidden bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer ${
              activeCard === stat.id ? 'ring-4 ring-blue-500 ring-opacity-50' : ''
            }`}
            onClick={() => setActiveCard(activeCard === stat.id ? null : stat.id)}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color}`}>
                  <stat.icon className="h-8 w-8 text-white" />
                </div>
              </div>
            </div>
            <div className={`h-1 bg-gradient-to-r ${stat.color}`}></div>
          </div>
        ))}
      </div>

      {/* 🎯 PRIORITY SECTION: Submission Perlu Dinilai */}
      {pendingSubmissions.length > 0 && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-orange-50 to-red-50 border-l-4 border-orange-500 rounded-2xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <ExclamationTriangleIconSolid className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      📝 Submission Perlu Dinilai
                    </h2>
                    <p className="text-sm text-gray-600">
                      {pendingSubmissions.length} submission menunggu review Anda
                    </p>
                  </div>
                </div>
                <Link to="/assignments">
                  <button className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                    <span>Lihat Semua</span>
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </Link>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {pendingSubmissions.slice(0, 4).map((submission) => (
                  <div 
                    key={submission.id} 
                    className={`bg-white rounded-xl p-4 border-2 transition-all duration-300 hover:shadow-lg ${
                      submission.isLate ? 'border-red-200 bg-red-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{submission.studentName}</h3>
                          {submission.isLate && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                              Terlambat
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{submission.assignmentTitle}</p>
                        <p className="text-xs text-gray-500">{submission.courseName}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatRelativeTime(submission.submittedAt)}
                        </p>
                      </div>
                      
                      {submission.isLate && (
                        <ExclamationTriangleIconSolid className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    
                    {/* Quick Grading Form */}
                    <div className="mt-4 space-y-3 border-t pt-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Nilai (0-100)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="85"
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            value={quickGradeData[submission.id]?.score || ''}
                            onChange={(e) => updateQuickGradeData(submission.id, 'score', e.target.value)}
                          />
                        </div>
                        <div className="flex items-end">
                          <button
                            onClick={() => handleQuickGrade(submission.id)}
                            disabled={gradeMutation.isLoading || !quickGradeData[submission.id]?.score}
                            className={`w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              gradeMutation.isLoading || !quickGradeData[submission.id]?.score
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {gradeMutation.isLoading ? (
                              <div className="flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              </div>
                            ) : (
                              <>
                                <CheckCircleIconSolid className="h-4 w-4 inline mr-1" />
                                Nilai
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Feedback (Opsional)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Feedback untuk mahasiswa..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          value={quickGradeData[submission.id]?.feedback || ''}
                          onChange={(e) => updateQuickGradeData(submission.id, 'feedback', e.target.value)}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <Link 
                          to={`/assignments/${submission.id}`}
                          className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Lihat Detail →
                        </Link>
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <ClockIcon className="h-3 w-3" />
                          <span>Quick Grade</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {pendingSubmissions.length > 4 && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    Dan {pendingSubmissions.length - 4} submission lainnya...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Overview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Mata Kuliah Aktif</h2>
              <Link to="/courses">
                <button className="text-blue-600 hover:text-blue-700 font-medium">
                  Lihat Semua
                </button>
              </Link>
            </div>
            
            <div className="space-y-4">
              {dashboardData?.courseStats.slice(0, 3).map((course) => (
                <div key={course.id} className="border rounded-xl p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <AcademicCapIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{course.name}</h3>
                          <p className="text-sm text-gray-600">{course.code} • {course.semester}</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center space-x-6 text-sm text-gray-600">
                        <span className="flex items-center">
                          <UserGroupIcon className="h-4 w-4 mr-1" />
                          {course.studentsCount} mahasiswa
                        </span>
                        <span className="flex items-center">
                          <DocumentTextIcon className="h-4 w-4 mr-1" />
                          {course.assignmentsCount} tugas
                        </span>
                        <span className="flex items-center">
                          <BookOpenIcon className="h-4 w-4 mr-1" />
                          {course.materialsCount} materi
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Link to={`/courses/${course.id}`}>
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <EyeIcon className="h-5 w-5" />
                        </button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
              
              {(!dashboardData?.courseStats || dashboardData.courseStats.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <AcademicCapIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Belum ada mata kuliah</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Today's Schedule & Activity */}
        <div className="space-y-6">
          {/* Today's Schedule */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center space-x-2 mb-4">
              <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">Jadwal Hari Ini</h2>
            </div>
            
            <div className="space-y-3">
              {dashboardData?.todaySchedule.slice(0, 3).map((item, index) => (
                <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ClockIcon className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{item.title}</p>
                    <p className="text-xs text-gray-600">{item.time}</p>
                    {item.courseName && (
                      <p className="text-xs text-gray-500">{item.courseName}</p>
                    )}
                  </div>
                </div>
              ))}
              
              {(!dashboardData?.todaySchedule || dashboardData.todaySchedule.length === 0) && (
                <div className="text-center py-4 text-gray-500">
                  <CalendarDaysIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Tidak ada jadwal hari ini</p>
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Aktivitas Terbaru</h2>
              <Link to="/assignments">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Lihat Semua
                </button>
              </Link>
            </div>
            
            <div className="space-y-3">
              {dashboardData?.recentActivity.submissions.slice(0, 3).map((submission) => (
                <div key={submission.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className={`w-3 h-3 rounded-full ${
                    submission.status === 'graded' ? 'bg-green-500' : 
                    submission.isLate ? 'bg-red-500' : 'bg-yellow-500'
                  }`}></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{submission.studentName}</p>
                    <p className="text-xs text-gray-600">{submission.assignmentTitle}</p>
                    <p className="text-xs text-gray-500">{submission.courseName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {formatRelativeTime(submission.submittedAt)}
                    </p>
                    {submission.isLate && (
                      <span className="text-xs text-red-600 font-medium">Terlambat</span>
                    )}
                  </div>
                </div>
              ))}
              
              {(!dashboardData?.recentActivity.submissions || dashboardData.recentActivity.submissions.length === 0) && (
                <div className="text-center py-4 text-gray-500">
                  <ClipboardDocumentCheckIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Belum ada aktivitas</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/courses/create">
            <button className="flex flex-col items-center space-y-2 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <PlusIcon className="h-8 w-8 text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Buat Course</span>
            </button>
          </Link>
          <Link to="/assignments/create">
            <button className="flex flex-col items-center space-y-2 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <DocumentTextIcon className="h-8 w-8 text-green-600" />
              <span className="text-sm font-medium text-gray-900">Buat Tugas</span>
            </button>
          </Link>
          <Link to="/assignments">
            <button className="flex flex-col items-center space-y-2 p-4 border border-gray-200 rounded-xl hover:bg-orange-50 transition-colors relative">
              <ClipboardDocumentCheckIcon className="h-8 w-8 text-orange-600" />
              <span className="text-sm font-medium text-gray-900">Review Tugas</span>
              {(dashboardData?.overview.pendingGrading || 0) > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                  {dashboardData?.overview.pendingGrading}
                </span>
              )}
            </button>
          </Link>
          <Link to="/courses">
            <button className="flex flex-col items-center space-y-2 p-4 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
              <BookOpenIcon className="h-8 w-8 text-purple-600" />
              <span className="text-sm font-medium text-gray-900">Kelola Course</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLecturerDashboard;