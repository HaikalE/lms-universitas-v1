import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import StudentDashboard from './StudentDashboard';
import LecturerDashboard from './LecturerDashboard';
import AdminDashboard from './AdminDashboard';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>;
  }

  switch (user.role) {
    case UserRole.STUDENT:
      return <StudentDashboard />;
    case UserRole.LECTURER:
      return <LecturerDashboard />;
    case UserRole.ADMIN:
      return <AdminDashboard />;
    default:
      return <div>Unknown role</div>;
  }
};

export default DashboardPage;
