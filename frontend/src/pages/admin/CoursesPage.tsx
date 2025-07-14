import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { DataTable } from '../../components/ui/DataTable';
import { courseService } from '../../services/courseService';
import { userService } from '../../services/userService';
import { Course, User, UserRole, ApiResponse } from '../../types';
import { 
  Plus, Search, Edit, Trash2, Users, BookOpen, 
  Calendar, Award, Eye, UserPlus, AlertCircle 
} from 'lucide-react';

const AdminCoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lecturers, setLecturers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [semesterFilter, setSemesterFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showEnrollmentModal, setShowEnrollmentModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  // Fetch courses with filters
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search: search || undefined,
        semester: semesterFilter || undefined,
      };
      
      const response: ApiResponse<Course[]> = await courseService.getCourses(params);
      setCourses(response.data);
      setTotal(response.meta?.total || 0);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch lecturers for dropdown
  const fetchLecturers = async () => {
    try {
      const response = await userService.getLecturers();
      setLecturers(response.data);
    } catch (error) {
      console.error('Error fetching lecturers:', error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [page, search, semesterFilter]);

  useEffect(() => {
    fetchLecturers();
  }, []);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setPage(1);
      fetchCourses();
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleCreateCourse = () => {
    setSelectedCourse(null);
    setShowCreateModal(true);
  };

  const handleEditCourse = (course: Course) => {
    setSelectedCourse(course);
    setShowEditModal(true);
  };

  const handleManageEnrollment = (course: Course) => {
    setSelectedCourse(course);
    setShowEnrollmentModal(true);
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus mata kuliah ini?')) {
      try {
        await courseService.deleteCourse(courseId);
        fetchCourses();
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  const getSemesterOptions = () => {
    const currentYear = new Date().getFullYear();
    const options = [];
    for (let year = currentYear - 2; year <= currentYear + 1; year++) {
      options.push(`${year}/1`, `${year}/2`);
    }
    return options;
  };

  const columns = [
    {
      key: 'course',
      title: 'Mata Kuliah',
      render: (course: Course) => (
        <div>
          <div className="font-medium">{course.name}</div>
          <div className="text-sm text-gray-500">
            <span className="font-mono">{course.code}</span> • {course.credits} SKS
          </div>
        </div>
      ),
    },
    {
      key: 'lecturer',
      title: 'Dosen Pengampu',
      render: (course: Course) => (
        <div>
          <div className="font-medium">{course.lecturer.fullName}</div>
          <div className="text-sm text-gray-500 font-mono">
            {course.lecturer.lecturerId}
          </div>
        </div>
      ),
    },
    {
      key: 'semester',
      title: 'Semester',
      render: (course: Course) => (
        <Badge variant="info">
          {course.semester}
        </Badge>
      ),
    },
    {
      key: 'students',
      title: 'Peserta',
      render: (course: Course) => (
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-gray-400" />
          <span>{course.studentsCount || 0}</span>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: (course: Course) => (
        <Badge variant={course.isActive ? 'success' : 'error'}>
          {course.isActive ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: 'Aksi',
      render: (course: Course) => (
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant="outline"
            title="Lihat Detail"
            onClick={() => handleViewCourse(course)}
          >
            <Eye className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            title="Kelola Peserta"
            onClick={() => handleManageEnrollment(course)}
          >
            <UserPlus className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            title="Edit"
            onClick={() => handleEditCourse(course)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            title="Hapus"
            onClick={() => handleDeleteCourse(course.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleViewCourse = (course: Course) => {
    // Navigate to course details page
    window.location.href = `/courses/${course.id}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Mata Kuliah</h1>
        <Button onClick={handleCreateCourse} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Tambah Mata Kuliah
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Cari kode atau nama mata kuliah..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              className="w-full sm:w-48"
            >
              <option value="">Semua Semester</option>
              {getSemesterOptions().map(semester => (
                <option key={semester} value={semester}>{semester}</option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{total}</div>
                <p className="text-sm text-gray-600">Total Mata Kuliah</p>
              </div>
              <BookOpen className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {courses.filter(c => c.isActive).length}
                </div>
                <p className="text-sm text-gray-600">Mata Kuliah Aktif</p>
              </div>
              <Calendar className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {courses.reduce((sum, c) => sum + (c.studentsCount || 0), 0)}
                </div>
                <p className="text-sm text-gray-600">Total Peserta</p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {courses.reduce((sum, c) => sum + c.credits, 0)}
                </div>
                <p className="text-sm text-gray-600">Total SKS</p>
              </div>
              <Award className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Courses Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Mata Kuliah</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={courses}
            loading={loading}
            pagination={{
              page,
              total,
              limit: 10,
              onPageChange: setPage,
            }}
          />
        </CardContent>
      </Card>

      {/* Create Course Modal */}
      {showCreateModal && (
        <CreateCourseModal
          lecturers={lecturers}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchCourses();
          }}
        />
      )}

      {/* Edit Course Modal */}
      {showEditModal && selectedCourse && (
        <EditCourseModal
          course={selectedCourse}
          lecturers={lecturers}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false);
            fetchCourses();
          }}
        />
      )}

      {/* Enrollment Management Modal */}
      {showEnrollmentModal && selectedCourse && (
        <EnrollmentModal
          course={selectedCourse}
          onClose={() => setShowEnrollmentModal(false)}
          onSuccess={() => {
            setShowEnrollmentModal(false);
            fetchCourses();
          }}
        />
      )}
    </div>
  );
};

// Create Course Modal Component
const CreateCourseModal: React.FC<{
  lecturers: User[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ lecturers, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    credits: 3,
    semester: '',
    lecturerId: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Enhanced form validation
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Kode mata kuliah wajib diisi';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Nama mata kuliah wajib diisi';
    }

    if (!formData.semester) {
      newErrors.semester = 'Semester wajib dipilih';
    }

    if (!formData.lecturerId) {
      newErrors.lecturerId = 'Dosen pengampu wajib dipilih';
    }

    if (formData.credits < 1 || formData.credits > 6) {
      newErrors.credits = 'SKS harus antara 1-6';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log('Creating course with data:', formData);
      await courseService.createCourse(formData);
      onSuccess();
    } catch (error: any) {
      console.error('Error creating course:', error);
      
      // Handle specific validation errors from backend
      if (error.response && error.response.data) {
        const errorMessage = error.response.data.message;
        if (typeof errorMessage === 'string') {
          if (errorMessage.includes('uuid')) {
            setErrors({ lecturerId: 'Pilih dosen pengampu yang valid' });
          } else if (errorMessage.includes('code')) {
            setErrors({ code: 'Kode mata kuliah sudah digunakan' });
          } else {
            setErrors({ general: errorMessage });
          }
        } else if (Array.isArray(errorMessage)) {
          const fieldErrors: {[key: string]: string} = {};
          errorMessage.forEach((msg: string) => {
            if (msg.includes('lecturerId')) {
              fieldErrors.lecturerId = 'ID dosen harus berupa UUID yang valid';
            } else if (msg.includes('code')) {
              fieldErrors.code = msg;
            } else if (msg.includes('name')) {
              fieldErrors.name = msg;
            } else if (msg.includes('semester')) {
              fieldErrors.semester = msg;
            } else {
              fieldErrors.general = msg;
            }
          });
          setErrors(fieldErrors);
        }
      } else {
        setErrors({ general: 'Terjadi kesalahan saat membuat mata kuliah. Silakan coba lagi.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const getSemesterOptions = () => {
    const currentYear = new Date().getFullYear();
    const options = [];
    for (let year = currentYear; year <= currentYear + 1; year++) {
      options.push(`${year}/1`, `${year}/2`);
    }
    return options;
  };

  return (
    <Modal title="Tambah Mata Kuliah Baru" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* General Error Message */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{errors.general}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Kode Mata Kuliah"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="contoh: CS101"
              required
              className={errors.code ? 'border-red-500' : ''}
            />
            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
          </div>
          
          <div>
            <Select
              label="SKS"
              value={formData.credits.toString()}
              onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
              className={errors.credits ? 'border-red-500' : ''}
            >
              <option value="1">1 SKS</option>
              <option value="2">2 SKS</option>
              <option value="3">3 SKS</option>
              <option value="4">4 SKS</option>
              <option value="6">6 SKS</option>
            </Select>
            {errors.credits && <p className="text-red-500 text-sm mt-1">{errors.credits}</p>}
          </div>
          
          <div className="md:col-span-2">
            <Input
              label="Nama Mata Kuliah"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="contoh: Algoritma dan Struktur Data"
              required
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          
          <div>
            <Select
              label="Semester"
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              required
              className={errors.semester ? 'border-red-500' : ''}
            >
              <option value="">Pilih Semester</option>
              {getSemesterOptions().map(semester => (
                <option key={semester} value={semester}>{semester}</option>
              ))}
            </Select>
            {errors.semester && <p className="text-red-500 text-sm mt-1">{errors.semester}</p>}
          </div>
          
          <div>
            <Select
              label="Dosen Pengampu"
              value={formData.lecturerId}
              onChange={(e) => setFormData({ ...formData, lecturerId: e.target.value })}
              required
              className={errors.lecturerId ? 'border-red-500' : ''}
            >
              <option value="">Pilih Dosen</option>
              {lecturers.map(lecturer => (
                <option key={lecturer.id} value={lecturer.id}>
                  {lecturer.fullName} ({lecturer.lecturerId})
                </option>
              ))}
            </Select>
            {errors.lecturerId && <p className="text-red-500 text-sm mt-1">{errors.lecturerId}</p>}
            {lecturers.length === 0 && (
              <p className="text-yellow-600 text-sm mt-1">
                Belum ada dosen tersedia. Pastikan ada dosen yang terdaftar dalam sistem.
              </p>
            )}
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Deskripsi</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi mata kuliah..."
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" disabled={loading || lecturers.length === 0}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Edit Course Modal
const EditCourseModal: React.FC<{
  course: Course;
  lecturers: User[];
  onClose: () => void;
  onSuccess: () => void;
}> = ({ course, lecturers, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    code: course.code,
    name: course.name,
    description: course.description || '',
    credits: course.credits,
    semester: course.semester,
    lecturerId: course.lecturer.id,
    isActive: course.isActive,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Enhanced form validation for edit
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.code.trim()) {
      newErrors.code = 'Kode mata kuliah wajib diisi';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Nama mata kuliah wajib diisi';
    }

    if (!formData.semester) {
      newErrors.semester = 'Semester wajib dipilih';
    }

    if (!formData.lecturerId) {
      newErrors.lecturerId = 'Dosen pengampu wajib dipilih';
    }

    if (formData.credits < 1 || formData.credits > 6) {
      newErrors.credits = 'SKS harus antara 1-6';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});

    // Validate form
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await courseService.updateCourse(course.id, formData);
      onSuccess();
    } catch (error: any) {
      console.error('Error updating course:', error);
      
      // Handle specific validation errors from backend
      if (error.response && error.response.data) {
        const errorMessage = error.response.data.message;
        if (typeof errorMessage === 'string') {
          if (errorMessage.includes('uuid')) {
            setErrors({ lecturerId: 'Pilih dosen pengampu yang valid' });
          } else if (errorMessage.includes('code')) {
            setErrors({ code: 'Kode mata kuliah sudah digunakan' });
          } else {
            setErrors({ general: errorMessage });
          }
        } else if (Array.isArray(errorMessage)) {
          const fieldErrors: {[key: string]: string} = {};
          errorMessage.forEach((msg: string) => {
            if (msg.includes('lecturerId')) {
              fieldErrors.lecturerId = 'ID dosen harus berupa UUID yang valid';
            } else if (msg.includes('code')) {
              fieldErrors.code = msg;
            } else if (msg.includes('name')) {
              fieldErrors.name = msg;
            } else if (msg.includes('semester')) {
              fieldErrors.semester = msg;
            } else {
              fieldErrors.general = msg;
            }
          });
          setErrors(fieldErrors);
        }
      } else {
        setErrors({ general: 'Terjadi kesalahan saat memperbarui mata kuliah. Silakan coba lagi.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Edit Mata Kuliah" onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* General Error Message */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{errors.general}</div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Input
              label="Kode Mata Kuliah"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              className={errors.code ? 'border-red-500' : ''}
            />
            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code}</p>}
          </div>
          
          <div>
            <Select
              label="SKS"
              value={formData.credits.toString()}
              onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) })}
              className={errors.credits ? 'border-red-500' : ''}
            >
              <option value="1">1 SKS</option>
              <option value="2">2 SKS</option>
              <option value="3">3 SKS</option>
              <option value="4">4 SKS</option>
              <option value="6">6 SKS</option>
            </Select>
            {errors.credits && <p className="text-red-500 text-sm mt-1">{errors.credits}</p>}
          </div>
          
          <div className="md:col-span-2">
            <Input
              label="Nama Mata Kuliah"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
          </div>
          
          <div>
            <Input
              label="Semester"
              value={formData.semester}
              onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
              required
              className={errors.semester ? 'border-red-500' : ''}
            />
            {errors.semester && <p className="text-red-500 text-sm mt-1">{errors.semester}</p>}
          </div>
          
          <div>
            <Select
              label="Dosen Pengampu"
              value={formData.lecturerId}
              onChange={(e) => setFormData({ ...formData, lecturerId: e.target.value })}
              required
              className={errors.lecturerId ? 'border-red-500' : ''}
            >
              <option value="">Pilih Dosen</option>
              {lecturers.map(lecturer => (
                <option key={lecturer.id} value={lecturer.id}>
                  {lecturer.fullName} ({lecturer.lecturerId})
                </option>
              ))}
            </Select>
            {errors.lecturerId && <p className="text-red-500 text-sm mt-1">{errors.lecturerId}</p>}
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Deskripsi</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Deskripsi mata kuliah..."
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Mata Kuliah Aktif
            </label>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Batal
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

// Enrollment Management Modal
const EnrollmentModal: React.FC<{
  course: Course;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ course, onClose, onSuccess }) => {
  const [students, setStudents] = useState<User[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchStudents();
    fetchEnrolledStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await userService.getStudents();
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchEnrolledStudents = async () => {
    try {
      // Get course details with enrolled students
      const courseDetails = await courseService.getCourse(course.id);
      setEnrolledStudents(courseDetails.students || []);
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollStudent = async (studentId: string) => {
    try {
      await userService.enrollStudent(studentId, course.id);
      fetchEnrolledStudents();
    } catch (error) {
      console.error('Error enrolling student:', error);
    }
  };

  const handleUnenrollStudent = async (studentId: string) => {
    try {
      await userService.unenrollStudent(studentId, course.id);
      fetchEnrolledStudents();
    } catch (error) {
      console.error('Error unenrolling student:', error);
    }
  };

  const availableStudents = students.filter(
    student => !enrolledStudents.some(enrolled => enrolled.id === student.id)
  );

  const filteredAvailableStudents = availableStudents.filter(
    student => 
      student.fullName.toLowerCase().includes(search.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredEnrolledStudents = enrolledStudents.filter(
    student => 
      student.fullName.toLowerCase().includes(search.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal title={`Kelola Peserta - ${course.name}`} onClose={onClose} size="xl">
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari mahasiswa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Badge variant="info">
            {enrolledStudents.length} Terdaftar
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Available Students */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mahasiswa Tersedia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredAvailableStudents.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{student.fullName}</div>
                      <div className="text-sm text-gray-500 font-mono">{student.studentId}</div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleEnrollStudent(student.id)}
                    >
                      Daftarkan
                    </Button>
                  </div>
                ))}
                {filteredAvailableStudents.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    Tidak ada mahasiswa tersedia
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Enrolled Students */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mahasiswa Terdaftar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredEnrolledStudents.map(student => (
                  <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg bg-green-50">
                    <div>
                      <div className="font-medium">{student.fullName}</div>
                      <div className="text-sm text-gray-500 font-mono">{student.studentId}</div>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleUnenrollStudent(student.id)}
                    >
                      Batalkan
                    </Button>
                  </div>
                ))}
                {filteredEnrolledStudents.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    Belum ada mahasiswa terdaftar
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button onClick={onClose}>
            Selesai
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AdminCoursesPage;