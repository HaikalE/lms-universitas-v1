import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { userService } from '../../services/userService';
import { courseService } from '../../services/courseService';
import { User, Course, UserRole } from '../../types';
import {
  Users, BookOpen, FileText, Activity,
  RefreshCw, UserPlus, AlertTriangle
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalLecturers: 0,
    totalAdmins: 0,
    totalCourses: 0,
    activeCourses: 0,
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch real data
      const [usersResponse, coursesResponse] = await Promise.all([
        userService.getUsers({ limit: 100 }),
        courseService.getCourses({ limit: 100 }),
      ]);

      const users = usersResponse.data || [];
      const courses = coursesResponse.data || [];

      // Calculate real statistics
      const totalStudents = users.filter(u => u.role === UserRole.STUDENT).length;
      const totalLecturers = users.filter(u => u.role === UserRole.LECTURER).length;
      const totalAdmins = users.filter(u => u.role === UserRole.ADMIN).length;
      const activeCourses = courses.filter(c => c.isActive !== false).length;

      setStats({
        totalUsers: users.length,
        totalStudents,
        totalLecturers,
        totalAdmins,
        totalCourses: courses.length,
        activeCourses,
      });

      // Recent data (last 5)
      const sortedUsers = users
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      const sortedCourses = courses
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      setRecentUsers(sortedUsers);
      setRecentCourses(sortedCourses);
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Baru saja';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit lalu`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam lalu`;
    return `${Math.floor(diffInSeconds / 86400)} hari lalu`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Memuat data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Simple Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
          <p className="text-gray-600">Terakhir diperbarui: {lastUpdated.toLocaleTimeString()}</p>
        </div>
        <Button onClick={handleRefresh} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Simple Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                <p className="text-sm text-gray-600">Total Pengguna</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalStudents}</p>
                <p className="text-sm text-gray-600">Mahasiswa</p>
              </div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalLecturers}</p>
                <p className="text-sm text-gray-600">Dosen</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{stats.totalCourses}</p>
                <p className="text-sm text-gray-600">Mata Kuliah</p>
                <p className="text-xs text-gray-500">{stats.activeCourses} aktif</p>
              </div>
              <BookOpen className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Status */}
      {stats.totalUsers === 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 text-amber-600">
              <AlertTriangle className="w-5 h-5" />
              <div>
                <p className="font-medium">Sistem Kosong</p>
                <p className="text-sm">Belum ada pengguna yang terdaftar dalam sistem.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card>
          <CardHeader>
            <CardTitle>Pengguna Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Belum ada pengguna</p>
            ) : (
              <div className="space-y-3">
                {recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        user.role === UserRole.ADMIN ? 'bg-red-100 text-red-800' :
                        user.role === UserRole.LECTURER ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role === UserRole.ADMIN ? 'Admin' :
                         user.role === UserRole.LECTURER ? 'Dosen' : 'Mahasiswa'}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimeAgo(user.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Mata Kuliah Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCourses.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Belum ada mata kuliah</p>
            ) : (
              <div className="space-y-3">
                {recentCourses.map((course) => (
                  <div key={course.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{course.name}</p>
                      <p className="text-sm text-gray-500">
                        {course.code} • {course.credits} SKS
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        course.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {course.isActive !== false ? 'Aktif' : 'Nonaktif'}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTimeAgo(course.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Aksi Cepat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Button 
              className="h-16 flex flex-col gap-1" 
              variant="outline"
              onClick={() => window.location.href = '/admin/users'}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Kelola Pengguna</span>
            </Button>
            <Button 
              className="h-16 flex flex-col gap-1" 
              variant="outline"
              onClick={() => window.location.href = '/admin/courses'}
            >
              <BookOpen className="w-5 h-5" />
              <span className="text-xs">Kelola Mata Kuliah</span>
            </Button>
            <Button 
              className="h-16 flex flex-col gap-1" 
              variant="outline"
              onClick={handleRefresh}
            >
              <RefreshCw className="w-5 h-5" />
              <span className="text-xs">Refresh Data</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;