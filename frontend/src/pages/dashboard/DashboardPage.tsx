import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import StudentDashboard from './StudentDashboard';
import LecturerDashboard from './LecturerDashboard';
import AdminDashboard from './AdminDashboard';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const DashboardPage: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null; // Protected route should handle this
  }

  // Render dashboard based on user role
  switch (user.role) {
    case UserRole.STUDENT:
      return <StudentDashboard />;
    case UserRole.LECTURER:
      return <LecturerDashboard />;
    case UserRole.ADMIN:
      return <AdminDashboard />;
    default:
      return (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold text-gray-900">Role tidak dikenali</h2>
          <p className="mt-2 text-gray-600">Silakan hubungi administrator</p>
        </div>
      );
  }
};

export default DashboardPage;