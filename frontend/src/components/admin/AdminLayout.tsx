import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, Users, BookOpen, FileText, 
  MessageSquare, Bell, Settings, LogOut, Menu, X,
  BarChart3, Database, Calendar
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  current?: boolean;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();

  const navigation: NavigationItem[] = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Manajemen Pengguna', href: '/admin/users', icon: Users },
    { name: 'Manajemen Mata Kuliah', href: '/admin/courses', icon: BookOpen },
    { name: 'Tugas & Nilai', href: '/admin/assignments', icon: FileText },
    { name: 'Forum & Diskusi', href: '/admin/forums', icon: MessageSquare },
    { name: 'Laporan & Analitik', href: '/admin/reports', icon: BarChart3 },
    { name: 'Kalender Akademik', href: '/admin/calendar', icon: Calendar },
    { name: 'Backup & Restore', href: '/admin/backup', icon: Database },
    { name: 'Pengaturan Sistem', href: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  const isCurrentPage = (href: string) => {
    return window.location.pathname === href || 
           (href !== '/admin' && window.location.pathname.startsWith(href));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <h1 className="text-xl font-bold text-gray-900">LMS Admin</h1>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => {
                  const current = isCurrentPage(item.href);
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className={`${
                        current
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium border-l-4`}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </a>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900">LMS Admin</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const current = isCurrentPage(item.href);
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className={`${
                        current
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium border-l-4`}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </a>
                  );
                })}
              </nav>
            </div>
            
            {/* User info */}
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex-shrink-0 w-full group block">
                <div className="flex items-center">
                  <div className="inline-block h-9 w-9 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.fullName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-700">{user?.fullName}</p>
                    <p className="text-xs font-medium text-gray-500">{user?.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-3 inline-flex items-center px-2 py-1 border border-transparent text-xs rounded text-gray-700 hover:text-gray-900"
                    title="Logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1">
              {title && (
                <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
              )}
            </div>
            
            <div className="ml-4 flex items-center md:ml-6">
              {/* Notifications */}
              <button
                type="button"
                className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Bell className="h-6 w-6" />
              </button>

              {/* Profile dropdown */}
              <div className="ml-3 relative">
                <div className="flex items-center">
                  <div className="inline-block h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.fullName?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700 hidden md:block">
                    {user?.fullName}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;