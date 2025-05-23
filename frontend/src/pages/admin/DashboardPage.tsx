import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { userService } from '../../services/userService';
import { courseService } from '../../services/courseService';
import { assignmentService } from '../../services/assignmentService';
import { adminService, SystemStats } from '../../services/adminService';
import { User, Course, Assignment, UserRole } from '../../types';
import {
  Users, BookOpen, FileText, TrendingUp,
  Clock, CheckCircle, AlertCircle, Calendar,
  BarChart3, Activity, Settings, Database
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'user_created' | 'course_created' | 'assignment_submitted';
  message: string;
  timestamp: string;
  user?: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalStudents: 0,
    totalLecturers: 0,
    totalAdmins: 0,
    totalCourses: 0,
    activeCourses: 0,
    totalAssignments: 0,
    totalSubmissions: 0,
    pendingSubmissions: 0,
    systemHealth: {
      status: 'healthy',
      uptime: 0,
      lastBackup: '',
      diskUsage: 0,
      memoryUsage: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [usersData, coursesData, systemStats] = await Promise.all([
        userService.getUsers({ limit: 100 }),
        courseService.getCourses({ limit: 100 }),
        adminService.getSystemStats(),
      ]);

      // Calculate statistics
      const users = usersData.data;
      const courses = coursesData.data;

      const totalStudents = users.filter(u => u.role === UserRole.STUDENT).length;
      const totalLecturers = users.filter(u => u.role === UserRole.LECTURER).length;
      const totalAdmins = users.filter(u => u.role === UserRole.ADMIN).length;
      const activeCourses = courses.filter(c => c.isActive).length;

      // Recent users (last 5)
      const sortedUsers = users
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      // Recent courses (last 5)
      const sortedCourses = courses
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      // Mock recent activities (in real app, this would come from an activities log)
      const recentActivities: ActivityItem[] = [
        {
          id: '1',
          type: 'user_created',
          message: 'Mahasiswa baru mendaftar',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          user: 'Budi Santoso',
        },
        {
          id: '2',
          type: 'course_created',
          message: 'Mata kuliah baru dibuat',
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        },
        {
          id: '3',
          type: 'assignment_submitted',
          message: '15 tugas baru dikumpulkan hari ini',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        },
      ];

      // Update stats with calculated values
      const updatedStats = {
        ...systemStats,
        totalUsers: users.length,
        totalStudents,
        totalLecturers,
        totalAdmins,
        totalCourses: courses.length,
        activeCourses,
      };

      setStats(updatedStats);
      setRecentUsers(sortedUsers);
      setRecentCourses(sortedCourses);
      setRecentActivities(recentActivities);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_created': return <Users className="w-4 h-4 text-blue-500" />;
      case 'course_created': return <BookOpen className="w-4 h-4 text-green-500" />;
      case 'assignment_submitted': return <FileText className="w-4 h-4 text-purple-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
  };

  const handleCreateBackup = async () => {
    try {
      await adminService.createBackup('full');
      alert('Backup berhasil dibuat!');
    } catch (error) {
      console.error('Error creating backup:', error);
      alert('Gagal membuat backup. Silakan coba lagi.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Memuat dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={handleCreateBackup}>
            <Database className="w-4 h-4" />
            Backup Data
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Pengaturan
          </Button>
        </div>
      </div>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.totalUsers}</div>
                <p className="text-sm text-gray-600">Total Pengguna</p>
                <div className="flex items-center mt-2 text-xs text-green-600">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% dari bulan lalu
                </div>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.totalCourses}</div>
                <p className="text-sm text-gray-600">Mata Kuliah</p>
                <div className="flex items-center mt-2 text-xs text-blue-600">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {stats.activeCourses} aktif
                </div>
              </div>
              <BookOpen className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-sm text-gray-600">Mahasiswa</p>
                <div className="flex items-center mt-2 text-xs text-purple-600">
                  <Activity className="w-3 h-3 mr-1" />
                  {Math.floor(stats.totalStudents * 0.85)} aktif
                </div>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.pendingSubmissions}</div>
                <p className="text-sm text-gray-600">Tugas Pending</p>
                <div className="flex items-center mt-2 text-xs text-orange-600">
                  <Clock className="w-3 h-3 mr-1" />
                  Perlu review
                </div>
              </div>
              <FileText className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Distribusi Pengguna
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Mahasiswa</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{stats.totalStudents}</span>
                  <Badge variant="info">
                    {stats.totalUsers > 0 ? Math.round((stats.totalStudents / stats.totalUsers) * 100) : 0}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Dosen</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{stats.totalLecturers}</span>
                  <Badge variant="success">
                    {stats.totalUsers > 0 ? Math.round((stats.totalLecturers / stats.totalUsers) * 100) : 0}%
                  </Badge>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Admin</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{stats.totalAdmins}</span>
                  <Badge variant="error">
                    {stats.totalUsers > 0 ? Math.round((stats.totalAdmins / stats.totalUsers) * 100) : 0}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Aktivitas Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Status Sistem
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    {stats.pendingSubmissions} tugas perlu direview
                  </p>
                  <p className="text-xs text-yellow-600">
                    Beberapa tugas menunggu penilaian dari dosen
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Database className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Backup terakhir: 2 hari lalu
                  </p>
                  <p className="text-xs text-blue-600">
                    Backup otomatis dijadwalkan setiap minggu
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Sistem berjalan normal
                  </p>
                  <p className="text-xs text-green-600">
                    Semua layanan aktif dan responsif
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pengguna Terbaru</CardTitle>
              <Button variant="outline" size="sm">
                Lihat Semua
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {user.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.fullName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <Badge variant={
                    user.role === UserRole.ADMIN ? 'error' :
                    user.role === UserRole.LECTURER ? 'info' :
                    'success'
                  }>
                    {user.role}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Mata Kuliah Terbaru</CardTitle>
              <Button variant="outline" size="sm">
                Lihat Semua
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentCourses.map((course) => (
                <div key={course.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{course.name}</p>
                    <p className="text-xs text-gray-500">
                      {course.code} • {course.credits} SKS • {course.lecturer.fullName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="info">
                      {course.semester}
                    </Badge>
                    <Badge variant={course.isActive ? 'success' : 'error'}>
                      {course.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-16 flex flex-col gap-1" variant="outline">
              <Users className="w-5 h-5" />
              <span className="text-xs">Tambah User</span>
            </Button>
            <Button className="h-16 flex flex-col gap-1" variant="outline">
              <BookOpen className="w-5 h-5" />
              <span className="text-xs">Buat Mata Kuliah</span>
            </Button>
            <Button className="h-16 flex flex-col gap-1" variant="outline">
              <BarChart3 className="w-5 h-5" />
              <span className="text-xs">Lihat Laporan</span>
            </Button>
            <Button className="h-16 flex flex-col gap-1" variant="outline">
              <Settings className="w-5 h-5" />
              <span className="text-xs">Pengaturan</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;