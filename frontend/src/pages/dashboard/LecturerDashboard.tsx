import React from 'react';
import { useQuery } from 'react-query';
import {
  BookOpenIcon,
  DocumentTextIcon,
  UsersIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { courseService } from '../../services/courseService';
import { assignmentService } from '../../services/assignmentService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';

const LecturerDashboard: React.FC = () => {
  const { data: courses, isLoading: coursesLoading } = useQuery(
    'myCourses',
    courseService.getMyCourses
  );

  const { data: assignments, isLoading: assignmentsLoading } = useQuery(
    'myAssignments',
    () => assignmentService.getAssignments({ limit: 10 })
  );

  const totalStudents = courses?.reduce((total, course) => total + (course.studentsCount || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Dashboard Dosen</h1>
        <p className="text-primary-100">
          Kelola mata kuliah dan tugas mahasiswa Anda.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpenIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Mata Kuliah</p>
                <p className="text-2xl font-bold text-gray-900">
                  {coursesLoading ? '-' : courses?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UsersIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Mahasiswa</p>
                <p className="text-2xl font-bold text-gray-900">
                  {coursesLoading ? '-' : totalStudents}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Tugas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignmentsLoading ? '-' : assignments?.data?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Perlu Dinilai</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Mata Kuliah Saya</CardTitle>
          </CardHeader>
          <CardContent>
            {coursesLoading ? (
              <LoadingSpinner />
            ) : courses && courses.length > 0 ? (
              <div className="space-y-3">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="block p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{course.name}</h3>
                        <p className="text-sm text-gray-500">
                          {course.code} • {course.studentsCount || 0} mahasiswa
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">{course.semester}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Belum ada mata kuliah yang diampu
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tugas Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            {assignmentsLoading ? (
              <LoadingSpinner />
            ) : assignments?.data && assignments.data.length > 0 ? (
              <div className="space-y-3">
                {assignments.data.slice(0, 5).map((assignment) => (
                  <Link
                    key={assignment.id}
                    to={`/assignments/${assignment.id}`}
                    className="block p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <div>
                      <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                      <p className="text-sm text-gray-500">{assignment.course.name}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Belum ada tugas yang dibuat
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LecturerDashboard;
