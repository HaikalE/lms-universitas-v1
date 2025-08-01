import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicRoute } from './components/PublicRoute';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import CoursesPage from './pages/courses/CoursesPage';
import CourseDetailPage from './pages/courses/CourseDetailPage';
import VideoPreviewPage from './pages/courses/VideoPreviewPage';
import CreateCoursePage from './pages/courses/CreateCoursePage';
import AssignmentsPage from './pages/assignments/AssignmentsPage';
import AssignmentDetailPage from './pages/assignments/AssignmentDetailPage';
import CreateAssignmentPage from './pages/assignments/CreateAssignmentPage';
import ForumsPage from './pages/forums/ForumsPage';
import ForumDetailPage from './pages/forums/ForumDetailPage';
import CreateForumPostPage from './pages/forums/CreateForumPostPage';
import ProfilePage from './pages/profile/ProfilePage';
import AdminDashboardPage from './pages/admin/DashboardPage';
import AdminUsersPage from './pages/admin/UsersPage';
import AdminCoursesPage from './pages/admin/CoursesPage';
import Layout from './components/layout/Layout';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Public Routes */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />

              {/* Protected Routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        
                        {/* COURSES ROUTES - SPECIFIC ROUTES BEFORE DYNAMIC ROUTES */}
                        <Route path="/courses" element={<CoursesPage />} />
                        <Route path="/courses/create" element={<CreateCoursePage />} />
                        <Route path="/courses/:courseId/materials/:materialId/video" element={<VideoPreviewPage />} />
                        <Route path="/courses/:id" element={<CourseDetailPage />} />
                        <Route path="/courses/:courseId/assignments/create" element={<CreateAssignmentPage />} />
                        
                        <Route path="/assignments" element={<AssignmentsPage />} />
                        <Route path="/assignments/:id" element={<AssignmentDetailPage />} />
                        
                        {/* FORUM ROUTES - SPECIFIC ROUTES BEFORE DYNAMIC ROUTES */}
                        <Route path="/forums" element={<ForumsPage />} />
                        <Route path="/forums/create" element={<CreateForumPostPage />} />
                        <Route path="/forums/:id" element={<ForumDetailPage />} />
                        
                        <Route path="/profile" element={<ProfilePage />} />
                        
                        {/* Admin Dashboard Route */}
                        <Route path="/admin" element={<AdminDashboardPage />} />
                        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                        <Route path="/admin/users" element={<AdminUsersPage />} />
                        <Route path="/admin/courses" element={<AdminCoursesPage />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>

            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              className="mt-16"
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;