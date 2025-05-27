import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Plus, 
  BookOpen, 
  Users, 
  Calendar,
  Clock,
  ChevronRight,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  UserPlus
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Modal } from '../../components/ui/Modal';
import { courseService } from '../../services/courseService';
import { Course, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface FilterState {
  semester: string;
  credits: string;
  lecturer: string;
  sortBy: 'name' | 'code' | 'credits' | 'studentsCount';
  sortOrder: 'asc' | 'desc';
}

const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    semester: '',
    credits: '',
    lecturer: '',
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const isAdmin = user?.role === UserRole.ADMIN;
  const isLecturer = user?.role === UserRole.LECTURER;
  const isStudent = user?.role === UserRole.STUDENT;

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await courseService.getCourses();
      setCourses(response.data);
    } catch (error) {
      toast.error('Gagal memuat data mata kuliah');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and search logic
  const filteredAndSortedCourses = useMemo(() => {
    let filtered = courses;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    if (filters.semester) {
      filtered = filtered.filter(course => course.semester === filters.semester);
    }
    if (filters.credits) {
      filtered = filtered.filter(course => course.credits === parseInt(filters.credits));
    }
    if (filters.lecturer) {
      filtered = filtered.filter(course => 
        course.lecturer.fullName.toLowerCase().includes(filters.lecturer.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (filters.sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'code':
          comparison = a.code.localeCompare(b.code);
          break;
        case 'credits':
          comparison = a.credits - b.credits;
          break;
        case 'studentsCount':
          comparison = (a.studentsCount || 0) - (b.studentsCount || 0);
          break;
      }
      return filters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [courses, searchQuery, filters]);

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    
    try {
      await courseService.deleteCourse(selectedCourse.id);
      toast.success('Mata kuliah berhasil dihapus');
      fetchCourses();
      setDeleteModalOpen(false);
      setSelectedCourse(null);
    } catch (error) {
      toast.error('Gagal menghapus mata kuliah');
    }
  };

  const handleEnrollCourse = async (courseId: string) => {
    try {
      // Implementation for enrollment
      toast.success('Berhasil mendaftar mata kuliah');
      fetchCourses();
    } catch (error) {
      toast.error('Gagal mendaftar mata kuliah');
    }
  };

  const CourseCard: React.FC<{ course: Course }> = ({ course }) => (
    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer group">
      <div 
        onClick={() => navigate(`/courses/${course.id}`)}
        className="relative"
      >
        {/* Course Header with Gradient */}
        <div className="h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-t-lg p-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
          
          <div className="relative z-10">
            <Badge className="bg-white/20 text-white border-white/30 mb-2">
              {course.code}
            </Badge>
            <h3 className="text-white font-semibold text-lg line-clamp-2">
              {course.name}
            </h3>
          </div>
        </div>

        <CardContent className="p-4">
          {/* Course Info */}
          <div className="space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <Users className="w-4 h-4 mr-2" />
              <span>{course.lecturer.fullName}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Semester {course.semester}</span>
              </div>
              <div className="flex items-center text-gray-600">
                <BookOpen className="w-4 h-4 mr-2" />
                <span>{course.credits} SKS</span>
              </div>
            </div>

            <div className="flex items-center text-sm text-gray-600">
              <Users className="w-4 h-4 mr-2" />
              <span>{course.studentsCount || 0} Mahasiswa</span>
            </div>

            {course.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {course.description}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex items-center justify-between">
            {isStudent && (
              <Button 
                size="sm" 
                className="w-full group-hover:bg-indigo-600"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEnrollCourse(course.id);
                }}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Daftar
              </Button>
            )}

            {(isAdmin || (isLecturer && course.lecturer.id === user?.id)) && (
              <>
                <Button 
                  size="sm" 
                  variant="default" 
                  className="flex-1 mr-2"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Lihat Detail
                </Button>
                <div className="relative">
                  <Button
                    size="sm"
                    variant="outline"
                    className="p-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowActionMenu(showActionMenu === course.id ? null : course.id);
                    }}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                  
                  {showActionMenu === course.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                      <button
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/courses/${course.id}/edit`);
                          setShowActionMenu(null);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                      <button
                        className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCourse(course);
                          setDeleteModalOpen(true);
                          setShowActionMenu(null);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Hapus
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </div>
    </Card>
  );

  const CourseListItem: React.FC<{ course: Course }> = ({ course }) => (
    <Card 
      className="hover:shadow-md transition-all duration-300 cursor-pointer"
      onClick={() => navigate(`/courses/${course.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="default">{course.code}</Badge>
              <h3 className="font-semibold text-lg">{course.name}</h3>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>{course.lecturer.fullName}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>Semester {course.semester}</span>
              </div>
              <div className="flex items-center">
                <BookOpen className="w-4 h-4 mr-1" />
                <span>{course.credits} SKS</span>
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>{course.studentsCount || 0} Mahasiswa</span>
              </div>
            </div>
          </div>
          
          <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mata Kuliah</h1>
          <p className="text-gray-600 mt-1">
            {filteredAndSortedCourses.length} mata kuliah tersedia
          </p>
        </div>
        
        {(isAdmin || isLecturer) && (
          <Button 
            onClick={() => navigate('/courses/create')}
            className="flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Mata Kuliah
          </Button>
        )}
      </div>

      {/* Search and Filter Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Cari mata kuliah, kode, atau dosen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Quick Filters */}
            <div className="flex gap-2">
              <Select
                value={filters.semester}
                onChange={(e) => setFilters({...filters, semester: e.target.value})}
                className="w-40"
              >
                <option value="">Semua Semester</option>
                <option value="1">Semester 1</option>
                <option value="2">Semester 2</option>
                <option value="3">Semester 3</option>
                <option value="4">Semester 4</option>
                <option value="5">Semester 5</option>
                <option value="6">Semester 6</option>
                <option value="7">Semester 7</option>
                <option value="8">Semester 8</option>
              </Select>

              <Select
                value={filters.credits}
                onChange={(e) => setFilters({...filters, credits: e.target.value})}
                className="w-32"
              >
                <option value="">Semua SKS</option>
                <option value="2">2 SKS</option>
                <option value="3">3 SKS</option>
                <option value="4">4 SKS</option>
                <option value="6">6 SKS</option>
              </Select>

              <Button
                variant="outline"
                onClick={() => setShowFilterModal(true)}
                className="flex items-center"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>

              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filters.semester || filters.credits || filters.lecturer) && (
            <div className="flex flex-wrap gap-2 mt-4">
              {filters.semester && (
<<<<<<< HEAD
                <Badge variant="default" className="flex items-center gap-1">
=======
                <Badge variant="info" className="flex items-center gap-1">
>>>>>>> ec5968c (Perbaikin eror)
                  Semester {filters.semester}
                  <button
                    onClick={() => setFilters({...filters, semester: ''})}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.credits && (
<<<<<<< HEAD
                <Badge variant="default" className="flex items-center gap-1">
=======
                <Badge variant="info" className="flex items-center gap-1">
>>>>>>> ec5968c (Perbaikin eror)
                  {filters.credits} SKS
                  <button
                    onClick={() => setFilters({...filters, credits: ''})}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filters.lecturer && (
<<<<<<< HEAD
                <Badge variant="default" className="flex items-center gap-1">
=======
                <Badge variant="info" className="flex items-center gap-1">
>>>>>>> ec5968c (Perbaikin eror)
                  Dosen: {filters.lecturer}
                  <button
                    onClick={() => setFilters({...filters, lecturer: ''})}
                    className="ml-1 hover:text-red-600"
                  >
                    ×
                  </button>
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Courses Display */}
      {filteredAndSortedCourses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Tidak ada mata kuliah yang ditemukan</p>
            <p className="text-sm text-gray-400 mt-2">
              Coba ubah filter atau kata kunci pencarian
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {filteredAndSortedCourses.map((course) => (
            viewMode === 'grid' 
              ? <CourseCard key={course.id} course={course} />
              : <CourseListItem key={course.id} course={course} />
          ))}
        </div>
      )}

      {/* Filter Modal */}
      {showFilterModal && (
        <Modal
          onClose={() => setShowFilterModal(false)}
          title="Filter Lanjutan"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cari Dosen
              </label>
              <Input
                type="text"
                placeholder="Nama dosen..."
                value={filters.lecturer}
                onChange={(e) => setFilters({...filters, lecturer: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urutkan Berdasarkan
              </label>
              <Select
                value={filters.sortBy}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value as any})}
                className="w-full"
              >
                <option value="name">Nama</option>
                <option value="code">Kode</option>
                <option value="credits">SKS</option>
                <option value="studentsCount">Jumlah Mahasiswa</option>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urutan
              </label>
              <Select
                value={filters.sortOrder}
                onChange={(e) => setFilters({...filters, sortOrder: e.target.value as any})}
                className="w-full"
              >
                <option value="asc">A-Z / Rendah-Tinggi</option>
                <option value="desc">Z-A / Tinggi-Rendah</option>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({
                    semester: '',
                    credits: '',
                    lecturer: '',
                    sortBy: 'name',
                    sortOrder: 'asc'
                  });
                }}
              >
                Reset
              </Button>
              <Button onClick={() => setShowFilterModal(false)}>
                Terapkan
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <Modal
          onClose={() => setDeleteModalOpen(false)}
          title="Konfirmasi Hapus"
        >
          <div className="space-y-4">
            <p>
              Apakah Anda yakin ingin menghapus mata kuliah <strong>{selectedCourse?.name}</strong>?
            </p>
            <p className="text-sm text-gray-600">
              Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="default"
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDeleteCourse}
              >
                Hapus
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CoursesPage;