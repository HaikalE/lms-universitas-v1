import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { 
  UserGroupIcon,
  AcademicCapIcon,
  ServerIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CogIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { ErrorMessage } from '../../components/ui/ErrorMessage';
import { adminService } from '../../services';
import { formatDate } from '../../utils/date';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface SystemStats {
  users: {
    total: number;
    students: number;
    lecturers: number;
    admins: number;
    activeToday: number;
    newThisMonth: number;
  };
  courses: {
    total: number;
    active: number;
    archived: number;
    avgStudentsPerCourse: number;
  };
  system: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: string;
    diskUsage: number;
    memoryUsage: number;
    cpuUsage: number;
    lastBackup: string;
  };
  activities: {
    totalAssignments: number;
    totalSubmissions: number;
    avgGradeScore: number;
    forumPosts: number;
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'error' | 'info';
    message: string;
    timestamp: string;
  }>;
  userGrowth: Array<{
    month: string;
    students: number;
    lecturers: number;
  }>;
  courseDistribution: Array<{
    department: string;
    courses: number;
    percentage: number;
  }>;
  recentActivities: Array<{
    id: string;
    type: string;
    user: string;
    action: string;
    timestamp: string;
  }>;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const AdminDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  
  const { data: stats, isLoading, error, refetch } = useQuery<SystemStats>(
    ['admin-dashboard-stats', timeRange],
    () => adminService.getSystemStats(timeRange),
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
    return <ErrorMessage message="Gagal memuat dashboard administrator. Silakan coba lagi." />;
  }

  const systemStatusColor = 
    stats?.system.status === 'healthy' ? 'text-green-600' :
    stats?.system.status === 'warning' ? 'text-yellow-600' : 'text-red-600';

  const systemStatusBg = 
    stats?.system.status === 'healthy' ? 'bg-green-100' :
    stats?.system.status === 'warning' ? 'bg-yellow-100' : 'bg-red-100';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrator</h1>
            <p className="mt-1 text-sm text-gray-500">
              Pantau dan kelola seluruh sistem LMS Universitas
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Time Range Selector */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTimeRange('day')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  timeRange === 'day' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Hari Ini
              </button>
              <button
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  timeRange === 'week' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Minggu Ini
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  timeRange === 'month' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Bulan Ini
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* System Status Alert */}
      {stats?.system.status !== 'healthy' && (
        <div className={`rounded-lg p-4 ${systemStatusBg} border ${
          stats?.system.status === 'warning' ? 'border-yellow-200' : 'border-red-200'
        }`}>
          <div className="flex">
            <ExclamationTriangleIcon className={`h-5 w-5 ${systemStatusColor}`} />
            <div className="ml-3">
              <h3 className={`text-sm font-medium ${systemStatusColor}`}>
                System {stats?.system.status === 'warning' ? 'Warning' : 'Critical'}
              </h3>
              <div className="mt-2 text-sm">
                {stats?.alerts.slice(0, 3).map(alert => (
                  <p key={alert.id} className={systemStatusColor}>{alert.message}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Pengguna</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.users.total || 0}</p>
              <p className="text-xs text-green-600 mt-1">
                +{stats?.users.newThisMonth || 0} bulan ini
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <UserGroupIcon className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-gray-500">Aktif hari ini:</span>
            <span className="font-medium text-gray-900">{stats?.users.activeToday || 0}</span>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Mata Kuliah</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.courses.total || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.courses.active || 0} aktif
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <AcademicCapIcon className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-gray-500">Rata-rata mahasiswa:</span>
            <span className="font-medium text-gray-900">{stats?.courses.avgStudentsPerCourse || 0}</span>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className={`text-2xl font-bold capitalize ${systemStatusColor}`}>
                {stats?.system.status || 'Unknown'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Uptime: {stats?.system.uptime || 'N/A'}
              </p>
            </div>
            <div className={`p-3 ${systemStatusBg} rounded-lg`}>
              <ServerIcon className={`h-8 w-8 ${systemStatusColor}`} />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">CPU:</span>
              <span className="font-medium">{stats?.system.cpuUsage || 0}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Memory:</span>
              <span className="font-medium">{stats?.system.memoryUsage || 0}%</span>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktivitas</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.activities.totalSubmissions || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                Pengumpulan tugas
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-gray-500">Rata-rata nilai:</span>
            <span className="font-medium text-gray-900">{stats?.activities.avgGradeScore || 0}</span>
          </div>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pertumbuhan Pengguna</h2>
          </div>
          <div className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.userGrowth}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="students" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Mahasiswa" />
                  <Area type="monotone" dataKey="lecturers" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Dosen" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Course Distribution */}
        <Card>
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Distribusi Mata Kuliah</h2>
          </div>
          <div className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.courseDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.department}: ${entry.percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="courses"
                  >
                    {stats?.courseDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* System Resources */}
      <Card>
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">System Resources</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">CPU Usage</span>
                <span className="text-sm font-bold text-gray-900">{stats?.system.cpuUsage || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (stats?.system.cpuUsage || 0) > 80 ? 'bg-red-600' : 
                    (stats?.system.cpuUsage || 0) > 60 ? 'bg-yellow-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${stats?.system.cpuUsage || 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Memory Usage</span>
                <span className="text-sm font-bold text-gray-900">{stats?.system.memoryUsage || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (stats?.system.memoryUsage || 0) > 80 ? 'bg-red-600' : 
                    (stats?.system.memoryUsage || 0) > 60 ? 'bg-yellow-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${stats?.system.memoryUsage || 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Disk Usage</span>
                <span className="text-sm font-bold text-gray-900">{stats?.system.diskUsage || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${
                    (stats?.system.diskUsage || 0) > 80 ? 'bg-red-600' : 
                    (stats?.system.diskUsage || 0) > 60 ? 'bg-yellow-600' : 'bg-green-600'
                  }`}
                  style={{ width: `${stats?.system.diskUsage || 0}%` }}
                />
              </div>
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between text-sm">
            <span className="text-gray-500">Last Backup: {formatDate(stats?.system.lastBackup || new Date(), 'full')}</span>
            <Button size="sm" variant="outline">
              <ShieldCheckIcon className="h-4 w-4 mr-2" />
              Backup Now
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick Actions & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div>
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              <Link to="/admin/users/create">
                <Button variant="outline" className="w-full justify-start">
                  <PlusCircleIcon className="h-4 w-4 mr-2" />
                  Tambah Pengguna Baru
                </Button>
              </Link>
              <Link to="/admin/courses/create">
                <Button variant="outline" className="w-full justify-start">
                  <PlusCircleIcon className="h-4 w-4 mr-2" />
                  Buat Mata Kuliah
                </Button>
              </Link>
              <Link to="/admin/announcements/create">
                <Button variant="outline" className="w-full justify-start">
                  <PlusCircleIcon className="h-4 w-4 mr-2" />
                  Buat Pengumuman
                </Button>
              </Link>
              <Link to="/admin/reports">
                <Button variant="outline" className="w-full justify-start">
                  <DocumentTextIcon className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </Link>
              <Link to="/admin/settings">
                <Button variant="outline" className="w-full justify-start">
                  <CogIcon className="h-4 w-4 mr-2" />
                  System Settings
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-2">
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Aktivitas Terbaru</h2>
            </div>
            <div className="p-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {stats?.recentActivities.map((activity, activityIdx) => (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== stats.recentActivities.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                              <UserGroupIcon className="h-4 w-4 text-gray-500" />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div>
                              <p className="text-sm text-gray-900">
                                <span className="font-medium">{activity.user}</span>{' '}
                                {activity.action}
                              </p>
                              <p className="text-xs text-gray-500">{activity.type}</p>
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {formatDate(activity.timestamp, 'relative')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;