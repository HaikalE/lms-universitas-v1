import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Search,
  UserPlus,
  UserMinus,
  Mail,
  Filter,
  Download,
  Upload,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  AlertCircle,
  CheckCircle,
  X,
  Plus
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { courseService, CourseStudent } from '../../services/courseService';
import { Course, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/date';

interface StudentFormData {
  email: string;
  selectedStudentIds: string[];
}

interface StudentsQueryParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'fullName' | 'studentId' | 'enrolledAt';
  sortOrder?: 'ASC' | 'DESC';
}

interface EnrollmentStats {
  totalStudents: number;
  recentEnrollments: number;
  activeStudents: number;
}

const CourseStudentManagementPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [availableStudents, setAvailableStudents] = useState<CourseStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [removeStudentModalOpen, setRemoveStudentModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<CourseStudent | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [stats, setStats] = useState<EnrollmentStats>({
    totalStudents: 0,
    recentEnrollments: 0,
    activeStudents: 0
  });
  
  const [studentsQuery, setStudentsQuery] = useState<StudentsQueryParams>({
    page: 1,
    limit: 24,
    sortBy: 'fullName',
    sortOrder: 'ASC'
  });
  const [studentsMeta, setStudentsMeta] = useState<any>({});
  
  const [studentForm, setStudentForm] = useState<StudentFormData>({
    email: '',
    selectedStudentIds: [],
  });

  const isAdmin = user?.role === UserRole.ADMIN;
  const isLecturer = user?.role === UserRole.LECTURER;
  const isCourseLecturer = course?.lecturer.id === user?.id;
  const canManageStudents = isAdmin || isCourseLecturer;

  useEffect(() => {
    if (id) {
      fetchCourseData();
    }
  }, [id]);

  useEffect(() => {
    if (course) {
      fetchStudents();
    }
  }, [course, studentsQuery]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      const data = await courseService.getCourse(id!);
      setCourse(data);
    } catch (error) {
      toast.error('Gagal memuat data mata kuliah');
      navigate('/courses');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    if (!course) return;

    try {
      setStudentsLoading(true);
      const response = await courseService.getCourseStudents(course.id, studentsQuery);
      setStudents(response.data);
      setStudentsMeta(response.meta);
      
      // Update stats
      setStats({
        totalStudents: response.meta.total || response.data.length,
        recentEnrollments: response.data.filter(s => 
          new Date(s.enrolledAt || new Date()).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
        ).length,
        activeStudents: response.data.filter(s => s.isActive).length
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      toast.error('Gagal memuat data mahasiswa');
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchAvailableStudents = async () => {
    if (!course || !canManageStudents) return;

    try {
      const data = await courseService.getAvailableStudents(course.id);
      setAvailableStudents(data);
    } catch (error) {
      console.error('Error fetching available students:', error);
      toast.error('Gagal memuat data mahasiswa tersedia');
    }
  };

  const handleStudentSearch = (searchTerm: string) => {
    setStudentsQuery(prev => ({
      ...prev,
      search: searchTerm,
      page: 1
    }));
  };

  const handleEnrollStudentByEmail = async () => {
    if (!course || !studentForm.email.trim()) {
      toast.error('Email mahasiswa wajib diisi');
      return;
    }

    try {
      setSubmitting(true);
      await courseService.addStudentByEmail(course.id, { email: studentForm.email });
      toast.success('Mahasiswa berhasil ditambahkan');
      setStudentForm(prev => ({ ...prev, email: '' }));
      fetchStudents();
      fetchAvailableStudents();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Gagal menambahkan mahasiswa';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnrollMultipleStudents = async () => {
    if (!course || studentForm.selectedStudentIds.length === 0) {
      toast.error('Pilih minimal satu mahasiswa');
      return;
    }

    try {
      setSubmitting(true);
      const result = await courseService.enrollMultipleStudents(course.id, {
        studentIds: studentForm.selectedStudentIds
      });
      
      toast.success(result.message);
      
      if (result.errors && result.errors.length > 0) {
        result.errors.forEach(error => toast.error(error));
      }

      setStudentModalOpen(false);
      setStudentForm({ email: '', selectedStudentIds: [] });
      fetchStudents();
      fetchAvailableStudents();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Gagal menambahkan mahasiswa';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!course || !selectedStudent) return;

    try {
      await courseService.removeStudentFromCourse(course.id, selectedStudent.id);
      toast.success('Mahasiswa berhasil dihapus dari mata kuliah');
      setRemoveStudentModalOpen(false);
      setSelectedStudent(null);
      fetchStudents();
      fetchAvailableStudents();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Gagal menghapus mahasiswa';
      toast.error(errorMessage);
    }
  };

  const resetStudentForm = () => {
    setStudentForm({
      email: '',
      selectedStudentIds: [],
    });
  };

  const handleExportStudents = () => {
    // Create CSV content
    const csvHeader = 'Nama,NIM,Email,Status,Tanggal Daftar\n';
    const csvContent = students.map(student => 
      `"${student.fullName}","${student.studentId}","${student.email}","${student.isActive ? 'Aktif' : 'Tidak Aktif'}","${formatDate(student.enrolledAt || new Date())}"`
    ).join('\n');
    
    const csvData = csvHeader + csvContent;
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `mahasiswa_${course?.code}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Data mahasiswa berhasil diexport');
    setExportModalOpen(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader size="large" />
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/courses/${course.id}`)}
                className="mr-4 bg-white/20 text-white border-white/30 hover:bg-white/30"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Mata Kuliah
              </Button>
              <Badge className="bg-white/20 text-white border-white/30">
                {course.code}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold mb-2">Kelola Mahasiswa</h1>
            <p className="text-white/90">{course.name}</p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{stats.totalStudents}</div>
            <div className="text-white/80">Total Mahasiswa</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Mahasiswa</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalStudents}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Mahasiswa Aktif</p>
                <p className="text-3xl font-bold text-green-600">{stats.activeStudents}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Daftar Minggu Ini</p>
                <p className="text-3xl font-bold text-purple-600">{stats.recentEnrollments}</p>
              </div>
              <UserPlus className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions & Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Cari mahasiswa..."
                  className="pl-10 w-80"
                  value={studentsQuery.search || ''}
                  onChange={(e) => handleStudentSearch(e.target.value)}
                />
              </div>
              <Select
                value={studentsQuery.sortBy}
                onChange={(e) => setStudentsQuery(prev => ({ 
                  ...prev, 
                  sortBy: e.target.value as any,
                  page: 1 
                }))}
                className="w-40"
              >
                <option value="fullName">Nama</option>
                <option value="studentId">NIM</option>
                <option value="enrolledAt">Tanggal Daftar</option>
              </Select>
              <Select
                value={studentsQuery.sortOrder}
                onChange={(e) => setStudentsQuery(prev => ({ 
                  ...prev, 
                  sortOrder: e.target.value as any,
                  page: 1 
                }))}
                className="w-32"
              >
                <option value="ASC">A-Z</option>
                <option value="DESC">Z-A</option>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setExportModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
              {canManageStudents && (
                <Button 
                  onClick={() => {
                    setStudentModalOpen(true);
                    fetchAvailableStudents();
                  }}
                  className="flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Tambah Mahasiswa
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Students Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Daftar Mahasiswa</span>
            {studentsQuery.search && (
              <Badge variant="info">
                {students.length} hasil untuk "{studentsQuery.search}"
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentsLoading ? (
            <div className="flex justify-center py-12">
              <Loader size="large" />
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">
                {studentsQuery.search ? 'Tidak ada mahasiswa yang ditemukan' : 'Belum ada mahasiswa yang terdaftar'}
              </p>
              {canManageStudents && !studentsQuery.search && (
                <Button 
                  onClick={() => {
                    setStudentModalOpen(true);
                    fetchAvailableStudents();
                  }}
                  className="mt-4"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Tambah Mahasiswa Pertama
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {students.map(student => (
                  <div
                    key={student.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {student.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">{student.fullName}</h4>
                          <p className="text-sm text-gray-600">{student.studentId}</p>
                        </div>
                      </div>
                      
                      {canManageStudents && (
                        <div className="relative">
                          <Button
                            size="sm"
                            variant="outline"
                            className="p-1"
                            onClick={() => setShowActionMenu(showActionMenu === student.id ? null : student.id)}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                          
                          {showActionMenu === student.id && (
                            <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg z-10 border">
                              <button
                                className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                                onClick={() => {
                                  // View student details
                                  toast.info('Fitur detail mahasiswa akan segera tersedia');
                                  setShowActionMenu(null);
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Lihat Detail
                              </button>
                              <button
                                className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setRemoveStudentModalOpen(true);
                                  setShowActionMenu(null);
                                }}
                              >
                                <UserMinus className="w-4 h-4 mr-2" />
                                Hapus dari Kelas
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <span className="truncate">{student.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant={student.isActive ? 'default' : 'warning'}>
                          {student.isActive ? 'Aktif' : 'Tidak Aktif'}
                        </Badge>
                        {student.enrolledAt && (
                          <span className="text-xs text-gray-500">
                            {formatDate(student.enrolledAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {studentsMeta.totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 pt-6 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={studentsQuery.page === 1}
                    onClick={() => setStudentsQuery(prev => ({ ...prev, page: prev.page! - 1 }))}
                  >
                    Sebelumnya
                  </Button>
                  <span className="text-sm text-gray-600 mx-4">
                    Halaman {studentsQuery.page} dari {studentsMeta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={studentsQuery.page === studentsMeta.totalPages}
                    onClick={() => setStudentsQuery(prev => ({ ...prev, page: prev.page! + 1 }))}
                  >
                    Selanjutnya
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Student Modal */}
      {studentModalOpen && (
        <Modal
          onClose={() => {
            setStudentModalOpen(false);
            resetStudentForm();
          }}
          title="Tambah Mahasiswa"
          className="max-w-2xl"
        >
          <div className="space-y-6">
            {/* Add by Email */}
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Tambah dengan Email</h3>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    type="email"
                    placeholder="Email mahasiswa..."
                    value={studentForm.email}
                    onChange={(e) => setStudentForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <Button
                  onClick={handleEnrollStudentByEmail}
                  disabled={submitting || !studentForm.email.trim()}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Tambah
                </Button>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-medium text-gray-900 mb-3">Pilih dari Daftar Mahasiswa</h3>
              
              {availableStudents.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  Tidak ada mahasiswa yang tersedia untuk ditambahkan
                </p>
              ) : (
                <>
                  <div className="max-h-64 overflow-y-auto border rounded-lg">
                    {availableStudents.map(student => (
                      <label
                        key={student.id}
                        className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                      >
                        <input
                          type="checkbox"
                          checked={studentForm.selectedStudentIds.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setStudentForm(prev => ({
                                ...prev,
                                selectedStudentIds: [...prev.selectedStudentIds, student.id]
                              }));
                            } else {
                              setStudentForm(prev => ({
                                ...prev,
                                selectedStudentIds: prev.selectedStudentIds.filter(id => id !== student.id)
                              }));
                            }
                          }}
                          className="mr-3"
                        />
                        <div className="flex items-center space-x-3 flex-1">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {student.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{student.fullName}</p>
                            <p className="text-sm text-gray-600">{student.studentId} • {student.email}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {studentForm.selectedStudentIds.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        {studentForm.selectedStudentIds.length} mahasiswa dipilih
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setStudentModalOpen(false);
                  resetStudentForm();
                }}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button
                onClick={handleEnrollMultipleStudents}
                disabled={submitting || studentForm.selectedStudentIds.length === 0}
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Menambahkan...
                  </div>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Tambah {studentForm.selectedStudentIds.length} Mahasiswa
                  </>
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Remove Student Modal */}
      {removeStudentModalOpen && selectedStudent && (
        <Modal
          onClose={() => setRemoveStudentModalOpen(false)}
          title="Konfirmasi Hapus Mahasiswa"
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <p className="font-medium text-red-800">Peringatan!</p>
                <p className="text-red-700">
                  Menghapus mahasiswa akan menghilangkan semua data terkait (nilai, tugas, dll.)
                </p>
              </div>
            </div>
            <p>
              Apakah Anda yakin ingin menghapus <strong>{selectedStudent.fullName}</strong> ({selectedStudent.studentId}) dari mata kuliah ini?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setRemoveStudentModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="default"
                className="bg-red-600 hover:bg-red-700"
                onClick={handleRemoveStudent}
              >
                <UserMinus className="w-4 h-4 mr-2" />
                Hapus Mahasiswa
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Export Modal */}
      {exportModalOpen && (
        <Modal
          onClose={() => setExportModalOpen(false)}
          title="Export Data Mahasiswa"
        >
          <div className="space-y-4">
            <p>Export data mahasiswa dalam format CSV yang dapat dibuka di Excel.</p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Data yang akan diexport:</h4>
              <ul className="text-sm text-blue-700 list-disc list-inside">
                <li>Nama lengkap mahasiswa</li>
                <li>Nomor Induk Mahasiswa (NIM)</li>
                <li>Email</li>
                <li>Status aktif</li>
                <li>Tanggal pendaftaran</li>
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setExportModalOpen(false)}
              >
                Batal
              </Button>
              <Button onClick={handleExportStudents}>
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CourseStudentManagementPage;
