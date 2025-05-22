import React from 'react';
import { useQuery } from 'react-query';
import {
  BookOpenIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { courseService } from '../../services/courseService';
import { assignmentService } from '../../services/assignmentService';
import { announcementService } from '../../services/announcementService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const StudentDashboard: React.FC = () => {
  const { data: courses, isLoading: coursesLoading } = useQuery(
    'myCourses',
    courseService.getMyCourses
  );

  const { data: assignments, isLoading: assignmentsLoading } = useQuery(
    'myAssignments',
    () => assignmentService.getAssignments({ limit: 5 })
  );

  const { data: announcements, isLoading: announcementsLoading } = useQuery(
    'recentAnnouncements',
    announcementService.getRecentAnnouncements
  );

  const { data: grades, isLoading: gradesLoading } = useQuery(
    'myGrades',
    assignmentService.getMyGrades
  );

  const upcomingAssignments = assignments?.data?.filter(
    (assignment) => new Date(assignment.dueDate) > new Date()
  ) || [];

  const completedAssignments = assignments?.data?.filter(
    (assignment) => assignment.mySubmission?.status === 'submitted' || assignment.mySubmission?.status === 'graded'
  ) || [];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Selamat Datang di Dashboard</h1>
        <p className="text-primary-100">
          Kelola aktivitas akademik Anda dengan mudah dan efisien.
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
                <ClockIcon className="h-8 w-8 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tugas Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignmentsLoading ? '-' : upcomingAssignments.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tugas Selesai</p>
                <p className="text-2xl font-bold text-gray-900">
                  {assignmentsLoading ? '-' : completedAssignments.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DocumentTextIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Nilai Rata-rata</p>
                <p className="text-2xl font-bold text-gray-900">
                  {gradesLoading ? '-' : 
                    grades && grades.length > 0 
                      ? (grades.reduce((acc, grade) => acc + (grade.score / grade.maxScore * 100), 0) / grades.length).toFixed(1)
                      : '0'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Mata Kuliah Saya</CardTitle>
          </CardHeader>
          <CardContent>
            {coursesLoading ? (
              <LoadingSpinner />
            ) : courses && courses.length > 0 ? (
              <div className="space-y-3">
                {courses.slice(0, 5).map((course) => (
                  <Link
                    key={course.id}
                    to={`/courses/${course.id}`}
                    className="block p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{course.name}</h3>
                        <p className="text-sm text-gray-500">{course.code} • {course.credits} SKS</p>
                      </div>
                      <span className="text-xs text-gray-400">{course.semester}</span>
                    </div>
                  </Link>
                ))}
                {courses.length > 5 && (
                  <Link
                    to="/courses"
                    className="block text-center text-sm text-primary-600 hover:text-primary-500 pt-2"
                  >
                    Lihat semua mata kuliah ({courses.length})
                  </Link>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Belum ada mata kuliah yang diambil
              </p>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Tugas Mendatang</CardTitle>
          </CardHeader>
          <CardContent>
            {assignmentsLoading ? (
              <LoadingSpinner />
            ) : upcomingAssignments.length > 0 ? (
              <div className="space-y-3">
                {upcomingAssignments.slice(0, 5).map((assignment) => (
                  <Link
                    key={assignment.id}
                    to={`/assignments/${assignment.id}`}
                    className="block p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{assignment.title}</h3>
                        <p className="text-sm text-gray-500">{assignment.course.name}</p>
                        <div className="flex items-center mt-1">
                          <CalendarIcon className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500">
                            {format(new Date(assignment.dueDate), 'dd MMM yyyy HH:mm', { locale: id })}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        new Date(assignment.dueDate).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {assignment.mySubmission ? 'Dikumpulkan' : 'Belum dikumpul'}
                      </span>
                    </div>
                  </Link>
                ))}
                {upcomingAssignments.length === 0 && (
                  <p className="text-gray-500 text-center py-4">
                    Tidak ada tugas mendatang
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Tidak ada tugas mendatang
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Announcements */}
      <Card>
        <CardHeader>
          <CardTitle>Pengumuman Terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          {announcementsLoading ? (
            <LoadingSpinner />
          ) : announcements && announcements.length > 0 ? (
            <div className="space-y-4">
              {announcements.slice(0, 3).map((announcement) => (
                <div
                  key={announcement.id}
                  className="p-4 rounded-lg border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900">{announcement.title}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      announcement.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      announcement.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      announcement.priority === 'medium' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {announcement.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {announcement.content}
                  </p>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">
                      {announcement.course ? announcement.course.name : 'Pengumuman Global'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {format(new Date(announcement.createdAt), 'dd MMM yyyy', { locale: id })}
                    </span>
                  </div>
                </div>
              ))}
              <Link
                to="/announcements"
                className="block text-center text-sm text-primary-600 hover:text-primary-500 pt-2"
              >
                Lihat semua pengumuman
              </Link>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              Tidak ada pengumuman terbaru
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentDashboard;
