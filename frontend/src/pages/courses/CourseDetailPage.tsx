import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Users,
  Calendar,
  Clock,
  FileText,
  Video,
  Link as LinkIcon,
  Download,
  Upload,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  MessageSquare,
  FileText as AssignmentIcon,
  Info,
  Settings,
  ChevronRight,
  File,
  Presentation,
  MoreVertical,
  Share2,
  Star,
  AlertCircle,
  Search,
  UserPlus,
  UserMinus,
  Mail,
  Filter,
  X,
  GraduationCap,
  ToggleLeft,
  ToggleRight,
  Play,
  ExternalLink,
  BarChart3
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import VideoMaterialCard from '../../components/course/VideoMaterialCard';
import { courseService, CourseStudent } from '../../services/courseService';
import { assignmentService } from '../../services/assignmentService';
import { forumService } from '../../services/forumService';
import { attendanceService } from '../../services/attendanceService';
import { Course, CourseMaterial, MaterialType, Assignment, ForumPost, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/date';

type TabType = 'overview' | 'materials' | 'assignments' | 'forums' | 'students' | 'attendance' | 'settings';

interface MaterialFormData {
  title: string;
  description: string;
  type: MaterialType;
  week: number;
  orderIndex: number;
  file?: File;
  url?: string;
  isAttendanceTrigger: boolean;
  attendanceThreshold: number;
}

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

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [forums, setForums] = useState<ForumPost[]>([]);
  const [students, setStudents] = useState<CourseStudent[]>([]);
  const [availableStudents, setAvailableStudents] = useState<CourseStudent[]>([]);
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [deleteMaterialModalOpen, setDeleteMaterialModalOpen] = useState(false);
  const [removeStudentModalOpen, setRemoveStudentModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<CourseStudent | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<CourseMaterial | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [studentsQuery, setStudentsQuery] = useState<StudentsQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'fullName',
    sortOrder: 'ASC'
  });
  const [studentsMeta, setStudentsMeta] = useState<any>({});
  
  const [materialForm, setMaterialForm] = useState<MaterialFormData>({
    title: '',
    description: '',
    type: MaterialType.PDF,
    week: 1,
    orderIndex: 1,
    isAttendanceTrigger: false,
    attendanceThreshold: 80,
  });

  const [studentForm, setStudentForm] = useState<StudentFormData>({
    email: '',
    selectedStudentIds: [],
  });

  const isAdmin = user?.role === UserRole.ADMIN;
  const isLecturer = user?.role === UserRole.LECTURER;
  const isStudent = user?.role === UserRole.STUDENT;
  const isCourseLecturer = course?.lecturer.id === user?.id;
  const canManageCourse = isAdmin || isCourseLecturer;

  useEffect(() => {
    if (id) {
      fetchCourseData();
    }
  }, [id]);

  useEffect(() => {
    if (course) {
      fetchTabData();
    }
  }, [course, activeTab, studentsQuery]);

  // Effect for attendance data when selectedWeek changes
  useEffect(() => {
    if (course && activeTab === 'attendance' && canManageCourse) {
      fetchAttendanceData();
    }
  }, [selectedWeek]);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showActionMenu && !(event.target as Element).closest('.action-menu')) {
        setShowActionMenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionMenu]);

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

  const fetchTabData = async () => {
    if (!course) return;

    try {
      switch (activeTab) {
        case 'materials':
          const materialsData = await courseService.getCourseMaterials(course.id);
          setMaterials(materialsData);
          break;
        case 'assignments':
          const assignmentsData = await assignmentService.getAssignments({ courseId: course.id });
          setAssignments(assignmentsData.data);
          break;
        case 'forums':
          try {
            const forumsResponse = await forumService.getForumPosts(course.id);
            const forumsData = forumsResponse.data || forumsResponse;
            setForums(Array.isArray(forumsData) ? forumsData : []);
          } catch (forumError) {
            setForums([]);
            // Don't show error to user for forums as it's not critical
          }
          break;
        case 'students':
          await fetchStudents();
          break;
        case 'attendance':
          if (canManageCourse) {
            await fetchAttendanceData();
          }
          break;
      }
    } catch (error) {
      if (activeTab !== 'forums') {
        toast.error(`Gagal memuat data ${activeTab}`);
      }
    }
  };

  const fetchStudents = async () => {
    if (!course) return;

    try {
      setStudentsLoading(true);
      const response = await courseService.getCourseStudents(course.id, studentsQuery);
      setStudents(response.data);
      setStudentsMeta(response.meta);
    } catch (error) {
      toast.error('Gagal memuat data mahasiswa');
    } finally {
      setStudentsLoading(false);
    }
  };

  const fetchAvailableStudents = async () => {
    if (!course || !canManageCourse) return;

    try {
      const data = await courseService.getAvailableStudents(course.id);
      setAvailableStudents(data);
    } catch (error) {
      toast.error('Gagal memuat data mahasiswa tersedia');
    }
  };

  const fetchAttendanceData = async () => {
    if (!course || !canManageCourse) return;

    try {
      setAttendanceLoading(true);
      const data = await attendanceService.getCourseAttendanceByWeek(
        course.id,
        selectedWeek || undefined
      );
      setAttendanceData(data);
    } catch (error) {
      toast.error('Gagal memuat data absensi');
    } finally {
      setAttendanceLoading(false);
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
      setStudentModalOpen(false);
      setStudentForm({ email: '', selectedStudentIds: [] });
      fetchStudents();
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

  const validateMaterialForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    // Validate title
    if (!materialForm.title?.trim()) {
      errors.title = 'Judul materi wajib diisi';
    }

    // Validate type
    if (!materialForm.type) {
      errors.type = 'Tipe materi wajib dipilih';
    }

    // Validate week
    if (!materialForm.week || materialForm.week < 1 || materialForm.week > 16) {
      errors.week = 'Minggu harus antara 1-16';
    }

    // Validate orderIndex
    if (!materialForm.orderIndex || materialForm.orderIndex < 1) {
      errors.orderIndex = 'Urutan harus minimal 1';
    }

    // Validate attendance threshold for video materials
    if (materialForm.type === MaterialType.VIDEO && materialForm.isAttendanceTrigger) {
      if (!materialForm.attendanceThreshold || materialForm.attendanceThreshold < 1 || materialForm.attendanceThreshold > 100) {
        errors.attendanceThreshold = 'Threshold absensi harus antara 1-100%';
      }
    }

    // Validate file or URL based on type
    if (materialForm.type === MaterialType.LINK) {
      if (!materialForm.url?.trim()) {
        errors.url = 'URL wajib diisi untuk tipe link';
      } else {
        try {
          new URL(materialForm.url);
        } catch {
          errors.url = 'Format URL tidak valid';
        }
      }
    } else {
      // For non-link types, file is required (except when editing and file already exists)
      if (!materialForm.file && !editingMaterial) {
        errors.file = 'File wajib diupload untuk tipe materi ini';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleMaterialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course) return;

    // Client-side validation
    if (!validateMaterialForm()) {
      toast.error('Mohon perbaiki kesalahan pada form');
      return;
    }

    try {
      setSubmitting(true);
      
      const formData = new FormData();
      formData.append('title', materialForm.title.trim());
      formData.append('description', materialForm.description?.trim() || '');
      formData.append('type', materialForm.type);
      formData.append('week', materialForm.week.toString());
      formData.append('orderIndex', materialForm.orderIndex.toString());
      formData.append('isVisible', 'true');
      
      // Add attendance trigger fields for video materials
      if (materialForm.type === MaterialType.VIDEO) {
        formData.append('isAttendanceTrigger', materialForm.isAttendanceTrigger.toString());
        formData.append('attendanceThreshold', materialForm.attendanceThreshold.toString());
      }
      
      if (materialForm.type === MaterialType.LINK && materialForm.url) {
        formData.append('url', materialForm.url.trim());
      } else if (materialForm.file) {
        formData.append('file', materialForm.file);
      }

      if (editingMaterial) {
        await courseService.updateCourseMaterial(course.id, editingMaterial.id, formData);
        toast.success('Materi berhasil diperbarui');
      } else {
        await courseService.createCourseMaterial(course.id, formData);
        toast.success('Materi berhasil ditambahkan');
      }

      setMaterialModalOpen(false);
      resetMaterialForm();
      fetchTabData();
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Gagal menyimpan materi';
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMaterial = async () => {
    if (!course || !selectedMaterial) return;

    try {
      await courseService.deleteCourseMaterial(course.id, selectedMaterial.id);
      toast.success('Materi berhasil dihapus');
      setDeleteMaterialModalOpen(false);
      setSelectedMaterial(null);
      fetchTabData();
    } catch (error) {
      toast.error('Gagal menghapus materi');
    }
  };

  const resetMaterialForm = () => {
    setMaterialForm({
      title: '',
      description: '',
      type: MaterialType.PDF,
      week: 1,
      orderIndex: 1,
      isAttendanceTrigger: false,
      attendanceThreshold: 80,
    });
    setEditingMaterial(null);
    setFormErrors({});
  };

  const resetStudentForm = () => {
    setStudentForm({
      email: '',
      selectedStudentIds: [],
    });
  };

  const getMaterialIcon = (type: MaterialType) => {
    switch (type) {
      case MaterialType.PDF:
        return <FileText className="w-5 h-5" />;
      case MaterialType.VIDEO:
        return <Video className="w-5 h-5" />;
      case MaterialType.DOCUMENT:
        return <File className="w-5 h-5" />;
      case MaterialType.PRESENTATION:
        return <Presentation className="w-5 h-5" />;
      case MaterialType.LINK:
        return <LinkIcon className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  const getAcceptedFileTypes = (type: MaterialType): string => {
    switch (type) {
      case MaterialType.PDF:
        return '.pdf';
      case MaterialType.VIDEO:
        return 'video/*';
      case MaterialType.PRESENTATION:
        return '.ppt,.pptx,.odp';
      case MaterialType.DOCUMENT:
        return '.doc,.docx,.txt,.odt';
      default:
        return '*';
    }
  };

  // Helper function to get correct file download URL using backend URL
  const getFileDownloadUrl = (material: CourseMaterial): string => {
    if (material.type === MaterialType.LINK && material.url) {
      return material.url;
    }
    
    if (material.filePath) {
      // Static files are served directly from backend root, not through /api prefix
      const baseUrl = (process.env.REACT_APP_API_URL || 'http://203.194.113.5:3000/api').replace('/api', '');
      return `${baseUrl}/${material.filePath}`;
    }
    
    return '#';
  };

  // Helper to format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get material type colors
  const getMaterialTypeColor = (type: MaterialType) => {
    switch (type) {
      case MaterialType.PDF:
        return 'bg-red-100 text-red-600';
      case MaterialType.VIDEO:
        return 'bg-blue-100 text-blue-600';
      case MaterialType.DOCUMENT:
        return 'bg-green-100 text-green-600';
      case MaterialType.PRESENTATION:
        return 'bg-orange-100 text-orange-600';
      case MaterialType.LINK:
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Info className="w-4 h-4" /> },
    { id: 'materials', label: 'Materi', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'assignments', label: 'Tugas', icon: <AssignmentIcon className="w-4 h-4" /> },
    { id: 'forums', label: 'Forum', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'students', label: 'Mahasiswa', icon: <Users className="w-4 h-4" /> },
  ];

  // Add attendance tab for lecturers only
  if (canManageCourse) {
    tabs.splice(4, 0, { id: 'attendance', label: 'Absensi', icon: <GraduationCap className="w-4 h-4" /> });
  }

  if (canManageCourse) {
    tabs.push({ id: 'settings', label: 'Pengaturan', icon: <Settings className="w-4 h-4" /> });
  }

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
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/courses')}
            className="mr-4 bg-white/20 text-white border-white/30 hover:bg-white/30"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <Badge className="bg-white/20 text-white border-white/30">
            {course.code}
          </Badge>
        </div>

        <h1 className="text-3xl font-bold mb-2">{course.name}</h1>
        {course.description && (
          <p className="text-white/90 mb-4">{course.description}</p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-white/90">
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            <span>{course.lecturer.fullName}</span>
          </div>
          <div className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            <span>Semester {course.semester}</span>
          </div>
          <div className="flex items-center">
            <BookOpen className="w-5 h-5 mr-2" />
            <span>{course.credits} SKS</span>
          </div>
          <div className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            <span>{students.length} Mahasiswa</span>
          </div>
        </div>

        {canManageCourse && (
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
              onClick={() => navigate(`/courses/${course.id}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Mata Kuliah
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              <Share2 className="w-4 h-4 mr-2" />
              Bagikan
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex space-x-8 min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 pb-3 px-1 border-b-2 font-medium text-sm
                ${activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'students' && (
                <Badge variant="default" className="ml-1">
                  {students.length}
                </Badge>
              )}
              {tab.id === 'forums' && (
                <Badge variant="default" className="ml-1">
                  {forums.length}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Mata Kuliah</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Deskripsi</h4>
                      <p className="text-gray-600">
                        {course.description || 'Belum ada deskripsi untuk mata kuliah ini.'}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Capaian Pembelajaran</h4>
                      <ul className="list-disc list-inside text-gray-600 space-y-1">
                        <li>Memahami konsep dasar {course.name.toLowerCase()}</li>
                        <li>Mampu menerapkan teori dalam praktik</li>
                        <li>Mengembangkan kemampuan analisis dan problem solving</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statistik Kelas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-indigo-600">{materials.length}</div>
                      <div className="text-sm text-gray-600">Materi</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{assignments.length}</div>
                      <div className="text-sm text-gray-600">Tugas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{forums.length}</div>
                      <div className="text-sm text-gray-600">Diskusi</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{students.length}</div>
                      <div className="text-sm text-gray-600">Mahasiswa</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Informasi Dosen</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                      <Users className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{course.lecturer.fullName}</h4>
                      <p className="text-sm text-gray-600">{course.lecturer.lecturerId}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Jadwal Perkuliahan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                      <span>Senin, 08:00 - 10:30</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                      <span>Rabu, 13:00 - 15:30</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Materials Tab - CLEANED VERSION */}
        {activeTab === 'materials' && (
          <div className="space-y-6">
            {canManageCourse && (
              <div className="flex justify-end">
                <Button onClick={() => setMaterialModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Materi
                </Button>
              </div>
            )}

            {materials.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada materi yang diunggah</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Group materials by week */}
                {Array.from(new Set(materials.map(m => m.week))).sort().map(week => {
                  const weekMaterials = materials.filter(m => m.week === week).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
                  
                  return (
                    <div key={week} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          📚 Minggu {week}
                          <Badge variant="outline" className="text-xs">
                            {weekMaterials.length} materi
                          </Badge>
                        </h3>
                      </div>
                      
                      <div className="space-y-4">
                        {weekMaterials.map(material => (
                          <Card key={material.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-indigo-500">
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-4 flex-1">
                                  {/* Material Icon */}
                                  <div className={`p-3 rounded-lg ${getMaterialTypeColor(material.type)}`}>
                                    {getMaterialIcon(material.type)}
                                  </div>
                                  
                                  {/* Material Info */}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-lg text-gray-900 mb-2">{material.title}</h4>
                                    {material.description && (
                                      <p className="text-gray-600 mb-3 line-clamp-2">{material.description}</p>
                                    )}
                                    
                                    {/* Material Metadata */}
                                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                                      <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {formatDate(material.createdAt)}
                                      </span>
                                      {material.fileSize && (
                                        <span>{formatFileSize(material.fileSize)}</span>
                                      )}
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs px-2 py-1"
                                      >
                                        {material.type.toUpperCase()}
                                      </Badge>
                                      {material.isAttendanceTrigger && (
                                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                                          🎯 Attendance Trigger ({material.attendanceThreshold || 80}%)
                                        </Badge>
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-3">
                                      {/* Video Materials */}
                                      {material.type === MaterialType.VIDEO && (
                                        <Button
                                          size="sm"
                                          className="bg-red-600 hover:bg-red-700 text-white"
                                          onClick={() => {
                                            navigate(`/courses/${course.id}/materials/${material.id}/video`);
                                          }}
                                        >
                                          <Play className="w-4 h-4 mr-2" />
                                          Tonton Video
                                        </Button>
                                      )}

                                      {/* PDF & Document Materials */}
                                      {(material.type === MaterialType.PDF || 
                                        material.type === MaterialType.DOCUMENT || 
                                        material.type === MaterialType.PRESENTATION) && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            const downloadUrl = getFileDownloadUrl(material);
                                            if (downloadUrl !== '#') {
                                              window.open(downloadUrl, '_blank');
                                            } else {
                                              toast.error('File tidak tersedia untuk diunduh');
                                            }
                                          }}
                                        >
                                          <Download className="w-4 h-4 mr-2" />
                                          Download {material.type.toUpperCase()}
                                        </Button>
                                      )}

                                      {/* Link Materials */}
                                      {material.type === MaterialType.LINK && material.url && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            window.open(material.url, '_blank', 'noopener,noreferrer');
                                          }}
                                        >
                                          <ExternalLink className="w-4 h-4 mr-2" />
                                          Buka Link
                                        </Button>
                                      )}

                                      {/* View/Preview Button for all types */}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          if (material.type === MaterialType.VIDEO) {
                                            navigate(`/courses/${course.id}/materials/${material.id}/video`);
                                          } else {
                                            const url = getFileDownloadUrl(material);
                                            if (url !== '#') {
                                              window.open(url, '_blank');
                                            } else {
                                              toast.error('File tidak tersedia');
                                            }
                                          }
                                        }}
                                      >
                                        <Eye className="w-4 h-4 mr-2" />
                                        Lihat
                                      </Button>
                                    </div>
                                  </div>
                                </div>

                                {/* Lecturer Actions */}
                                {canManageCourse && (
                                  <div className="relative action-menu">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="p-2"
                                      onClick={() => setShowActionMenu(showActionMenu === material.id ? null : material.id)}
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                    
                                    {showActionMenu === material.id && (
                                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                                        <button
                                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                                          onClick={() => {
                                            setEditingMaterial(material);
                                            setMaterialForm({
                                              title: material.title,
                                              description: material.description || '',
                                              type: material.type,
                                              week: material.week,
                                              orderIndex: material.orderIndex || 1,
                                              url: material.url || '',
                                              isAttendanceTrigger: material.isAttendanceTrigger || false,
                                              attendanceThreshold: material.attendanceThreshold || 80,
                                            });
                                            setMaterialModalOpen(true);
                                            setShowActionMenu(null);
                                          }}
                                        >
                                          <Edit className="w-4 h-4 mr-2" />
                                          Edit
                                        </button>
                                        <button
                                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full"
                                          onClick={() => {
                                            toast.success(material.isVisible ? 'Materi disembunyikan' : 'Materi ditampilkan');
                                            setShowActionMenu(null);
                                          }}
                                        >
                                          {material.isVisible ? (
                                            <>
                                              <EyeOff className="w-4 h-4 mr-2" />
                                              Sembunyikan
                                            </>
                                          ) : (
                                            <>
                                              <Eye className="w-4 h-4 mr-2" />
                                              Tampilkan
                                            </>
                                          )}
                                        </button>
                                        <button
                                          className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                                          onClick={() => {
                                            setSelectedMaterial(material);
                                            setDeleteMaterialModalOpen(true);
                                            setShowActionMenu(null);
                                          }}
                                        >
                                          <Trash2 className="w-4 h-4 mr-2" />
                                          Hapus
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Material management for lecturers */}
                      {canManageCourse && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between text-sm text-gray-600">
                            <span>
                              Minggu {week}: {weekMaterials.length} materi
                              {weekMaterials.filter(m => m.isAttendanceTrigger).length > 0 && (
                                <span className="ml-2 text-blue-600">
                                  • {weekMaterials.filter(m => m.isAttendanceTrigger).length} video attendance
                                </span>
                              )}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setMaterialForm({
                                  ...materialForm,
                                  week: week,
                                  orderIndex: Math.max(...weekMaterials.map(m => m.orderIndex || 0)) + 1
                                });
                                setMaterialModalOpen(true);
                              }}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Tambah ke Minggu {week}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Summary Statistics for Lecturers */}
                {canManageCourse && (
                  <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        📊 Statistik Materi
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-blue-600">
                            {materials.length}
                          </div>
                          <div className="text-xs text-gray-600">Total Materi</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">
                            {materials.filter(m => m.type === 'video').length}
                          </div>
                          <div className="text-xs text-gray-600">Video</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {materials.filter(m => m.isAttendanceTrigger).length}
                          </div>
                          <div className="text-xs text-gray-600">Attendance Trigger</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-purple-600">
                            {Array.from(new Set(materials.map(m => m.week))).length}
                          </div>
                          <div className="text-xs text-gray-600">Minggu Aktif</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab - Keep existing implementation */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            {canManageCourse && (
              <div className="flex justify-end">
                <Button onClick={() => navigate(`/courses/${course.id}/assignments/create`)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Buat Tugas
                </Button>
              </div>
            )}

            {assignments.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <AssignmentIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada tugas</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {assignments.map(assignment => (
                  <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900">{assignment.title}</h4>
                            <Badge variant={assignment.type === 'exam' ? 'error' : 'default'}>
                              {assignment.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">{assignment.description}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>Deadline: {formatDate(assignment.dueDate)}</span>
                            </div>
                            <div className="flex items-center">
                              <Star className="w-4 h-4 mr-1" />
                              <span>{assignment.maxScore} poin</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Forums Tab - FIXED IMPLEMENTATION */}
        {activeTab === 'forums' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">Forum Diskusi</h2>
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  {forums.length} diskusi
                </Badge>
              </div>
              <Button onClick={() => navigate(`/forums/create?courseId=${course.id}`)}>
                <Plus className="w-4 h-4 mr-2" />
                Buat Diskusi
              </Button>
            </div>

            {forums.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Belum ada diskusi</h3>
                  <p className="text-gray-500 mb-4">Jadilah yang pertama memulai diskusi!</p>
                  <Button onClick={() => navigate(`/forums/create?courseId=${course.id}`)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Mulai Diskusi Baru
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {forums.map(forum => (
                  <Card key={forum.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium text-gray-900">{forum.title}</h4>
                            {forum.isPinned && (
                              <Badge variant="default" className="bg-yellow-100 text-yellow-800 text-xs">
                                📌 Pinned
                              </Badge>
                            )}
                            {forum.type && (
                              <Badge variant="outline" className="text-xs">
                                {forum.type}
                              </Badge>
                            )}
                            {forum.isAnswered && (
                              <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                                ✅ Terjawab
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{forum.content}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                            <span className="font-medium">{forum.author?.fullName || 'Unknown'}</span>
                            <span>•</span>
                            <span>{formatDate(forum.createdAt)}</span>
                            <span>•</span>
                            <span>{forum.children?.length || 0} balasan</span>
                            {forum.likesCount > 0 && (
                              <>
                                <span>•</span>
                                <span>❤️ {forum.likesCount}</span>
                              </>
                            )}
                            {forum.viewsCount > 0 && (
                              <>
                                <span>•</span>
                                <span>👁️ {forum.viewsCount}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Attendance Tab - NEW FOR LECTURERS */}
        {activeTab === 'attendance' && canManageCourse && (
          <div className="space-y-6">
            {/* Header with Filters */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <GraduationCap className="w-5 h-5" />
                  Data Absensi Mahasiswa
                </h2>
                {attendanceData?.weeklyStats && (
                  <Badge variant="default" className="bg-blue-100 text-blue-800">
                    {attendanceData.students?.length || 0} mahasiswa
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                <Select
                  value={selectedWeek}
                  onChange={(e) => {
                    setSelectedWeek(e.target.value);
                  }}
                  className="w-48"
                >
                  <option value="">Semua Minggu</option>
                  {Array.from({length: 16}, (_, i) => i + 1).map(week => (
                    <option key={week} value={week.toString()}>
                      Minggu {week}
                    </option>
                  ))}
                </Select>
                <Button
                  onClick={fetchAttendanceData}
                  disabled={attendanceLoading}
                  size="sm"
                  variant="outline"
                >
                  {attendanceLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  ) : (
                    <Filter className="w-4 h-4 mr-2" />
                  )}
                  Refresh
                </Button>
              </div>
            </div>

            {/* Loading State */}
            {attendanceLoading && (
              <div className="flex justify-center py-12">
                <Loader size="large" />
              </div>
            )}

            {/* Attendance Data */}
            {!attendanceLoading && attendanceData && (
              <div className="space-y-6">
                {/* Weekly Statistics Summary */}
                {attendanceData.weeklyStats && attendanceData.weeklyStats.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Statistik Kehadiran {selectedWeek ? `Minggu ${selectedWeek}` : 'Semua Minggu'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {attendanceData.weeklyStats.map((stat: any) => (
                          <div key={stat.week} className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-indigo-600">
                              {Math.round(stat.attendanceRate)}%
                            </div>
                            <div className="text-sm text-gray-600">Minggu {stat.week}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {stat.presentCount}/{stat.totalStudents} hadir
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Attendance by Week */}
                {attendanceData.attendancesByWeek && Object.keys(attendanceData.attendancesByWeek).length > 0 ? (
                  Object.entries(attendanceData.attendancesByWeek).map(([week, weekData]: [string, any]) => (
                    <Card key={week} className="overflow-hidden">
                      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-blue-600" />
                              <span className="font-semibold text-gray-900">Minggu {week}</span>
                            </div>
                            <Badge className="bg-blue-100 text-blue-800 px-2 py-1">
                              {weekData.length} pertemuan
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users className="w-4 h-4" />
                            <span>{attendanceData.students?.length || 0} mahasiswa terdaftar</span>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        {(() => {
                          // Group attendance records by date
                          const attendancesByDate = weekData.reduce((acc: any, attendance: any) => {
                            const date = attendance.attendanceDate;
                            if (!acc[date]) {
                              acc[date] = [];
                            }
                            acc[date].push(attendance);
                            return acc;
                          }, {});

                          // Create day data with present and absent students
                          const dayDataArray = Object.entries(attendancesByDate).map(([date, attendances]: [string, any[]]) => {
                            const presentStudents = attendances.filter(a => 
                              ['present', 'auto_present', 'late'].includes(a.status)
                            );
                            
                            // Get students who didn't attend this date
                            const presentStudentIds = new Set(presentStudents.map(a => a.studentId));
                            const absentStudents = (attendanceData.students || []).filter((student: any) => 
                              !presentStudentIds.has(student.id)
                            );

                            return {
                              date,
                              presentStudents,
                              absentStudents
                            };
                          });

                          return dayDataArray.map((dayData: any, index: number) => (
                            <div key={index} className="border-b last:border-b-0">
                              {/* Date Header */}
                              <div className="bg-gray-50 px-6 py-4 border-b">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-2 h-8 bg-blue-500 rounded-full"></div>
                                    <div>
                                      <h4 className="font-semibold text-gray-900">
                                        {new Date(dayData.date).toLocaleDateString('id-ID', {
                                          weekday: 'long',
                                          year: 'numeric',
                                          month: 'long',
                                          day: 'numeric'
                                        })}
                                      </h4>
                                      <p className="text-sm text-gray-500 mt-1">
                                        Pertemuan • {dayData.presentStudents?.length + dayData.absentStudents?.length || 0} mahasiswa
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 bg-green-100 px-3 py-2 rounded-lg">
                                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                      <span className="text-sm font-medium text-green-700">
                                        {dayData.presentStudents?.length || 0} hadir
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-red-100 px-3 py-2 rounded-lg">
                                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                      <span className="text-sm font-medium text-red-700">
                                        {dayData.absentStudents?.length || 0} tidak hadir
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Student Attendance List */}
                              <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {/* Present Students */}
                                  <div>
                                    <h5 className="font-medium text-green-700 mb-3 flex items-center gap-2">
                                      ✅ Mahasiswa Hadir ({dayData.presentStudents?.length || 0})
                                    </h5>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                      {dayData.presentStudents?.length > 0 ? (
                                        dayData.presentStudents.map((attendance: any) => {
                                          const statusInfo = attendanceService.formatAttendanceStatus(attendance.status);
                                          const typeInfo = attendanceService.formatAttendanceType(attendance.attendanceType);
                                          
                                          return (
                                            <div key={attendance.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                              <div className="flex items-center space-x-3">
                                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-sm font-semibold text-green-700">
                                                  {attendance.student?.fullName?.charAt(0)?.toUpperCase()}
                                                </div>
                                                <div>
                                                  <div className="font-medium text-gray-900">
                                                    {attendance.student?.fullName}
                                                  </div>
                                                  <div className="text-sm text-gray-600">
                                                    {attendance.student?.studentId}
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="text-right">
                                                <div className={`text-sm font-medium ${statusInfo.color}`}>
                                                  {statusInfo.icon} {statusInfo.text}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                  {typeInfo.icon} {typeInfo.text}
                                                </div>
                                                {attendance.submittedAt && (
                                                  <div className="text-xs text-gray-400">
                                                    {new Date(attendance.submittedAt).toLocaleTimeString('id-ID')}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          );
                                        })
                                      ) : (
                                        <div className="text-center py-6 text-gray-500">
                                          <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                          <p className="text-sm">Tidak ada mahasiswa yang hadir</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Absent Students */}
                                  <div>
                                    <h5 className="font-medium text-red-700 mb-3 flex items-center gap-2">
                                      ❌ Mahasiswa Tidak Hadir ({dayData.absentStudents?.length || 0})
                                    </h5>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                      {dayData.absentStudents?.length > 0 ? (
                                        dayData.absentStudents.map((student: any) => (
                                          <div key={student.id} className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border border-red-200">
                                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-sm font-semibold text-red-700">
                                              {student.fullName?.charAt(0)?.toUpperCase()}
                                            </div>
                                            <div>
                                              <div className="font-medium text-gray-900">
                                                {student.fullName}
                                              </div>
                                              <div className="text-sm text-gray-600">
                                                {student.studentId}
                                              </div>
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="text-center py-6 text-gray-500">
                                          <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                          <p className="text-sm">Semua mahasiswa hadir</p>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ));
                        })()}
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Belum Ada Data Absensi
                      </h3>
                      <p className="text-gray-500">
                        {selectedWeek 
                          ? `Belum ada data absensi untuk minggu ${selectedWeek}` 
                          : 'Belum ada mahasiswa yang melakukan absensi'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        )}

        {/* Students Tab - Keep existing implementation */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            {/* Header with Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Cari mahasiswa..."
                    className="pl-10 w-64"
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
              </div>

              {canManageCourse && (
                <Button 
                  onClick={() => {
                    setStudentModalOpen(true);
                    fetchAvailableStudents();
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Tambah Mahasiswa
                </Button>
              )}
            </div>

            {/* Students List */}
            {studentsLoading ? (
              <div className="flex justify-center py-12">
                <Loader size="large" />
              </div>
            ) : students.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {studentsQuery.search ? 'Tidak ada mahasiswa yang ditemukan' : 'Belum ada mahasiswa yang terdaftar'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {students.map(student => (
                    <Card key={student.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {student.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900 truncate">{student.fullName}</h4>
                              <p className="text-sm text-gray-600">{student.studentId}</p>
                              <p className="text-xs text-gray-500 truncate">{student.email}</p>
                            </div>
                          </div>

                          {canManageCourse && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50 hover:border-red-200 p-2"
                              onClick={() => {
                                setSelectedStudent(student);
                                setRemoveStudentModalOpen(true);
                              }}
                            >
                              <UserMinus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {studentsMeta.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={studentsQuery.page === 1}
                      onClick={() => setStudentsQuery(prev => ({ ...prev, page: prev.page! - 1 }))}
                    >
                      Sebelumnya
                    </Button>
                    <span className="text-sm text-gray-600">
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

                {/* Stats */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Total mahasiswa: {studentsMeta.total || students.length}</span>
                      {studentsQuery.search && (
                        <span>Menampilkan hasil pencarian untuk "{studentsQuery.search}"</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Settings Tab - Keep existing implementation */}
        {activeTab === 'settings' && canManageCourse && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan Mata Kuliah</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/courses/${course.id}/edit`)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Informasi Mata Kuliah
                  </Button>
                  <Button
                    variant="outline"
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus Mata Kuliah
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      {studentModalOpen && (
        <Modal
          onClose={() => {
            setStudentModalOpen(false);
            resetStudentForm();
          }}
          title="Tambah Mahasiswa"
          size="lg"
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
                Hapus
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Material Form Modal - CLEANED VERSION WITHOUT DEBUG */}
      {materialModalOpen && (
        <Modal
          onClose={() => {
            setMaterialModalOpen(false);
            resetMaterialForm();
          }}
          title={editingMaterial ? 'Edit Materi' : 'Tambah Materi'}
          size="lg"
        >
          <form onSubmit={handleMaterialSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Judul Materi <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={materialForm.title}
                onChange={(e) => {
                  setMaterialForm({...materialForm, title: e.target.value});
                  if (formErrors.title) setFormErrors({...formErrors, title: ''});
                }}
                className={formErrors.title ? 'border-red-500' : ''}
                required
              />
              {formErrors.title && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {formErrors.title}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
                value={materialForm.description}
                onChange={(e) => setMaterialForm({...materialForm, description: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipe Materi <span className="text-red-500">*</span>
              </label>
              <Select
                value={materialForm.type}
                onChange={(e) => {
                  setMaterialForm({...materialForm, type: e.target.value as MaterialType});
                  if (formErrors.type) setFormErrors({...formErrors, type: ''});
                }}
                className={`w-full ${formErrors.type ? 'border-red-500' : ''}`}
              >
                <option value={MaterialType.PDF}>PDF</option>
                <option value={MaterialType.VIDEO}>Video</option>
                <option value={MaterialType.DOCUMENT}>Dokumen</option>
                <option value={MaterialType.PRESENTATION}>Presentasi</option>
                <option value={MaterialType.LINK}>Link</option>
              </Select>
              {formErrors.type && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {formErrors.type}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minggu <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  max="16"
                  value={materialForm.week}
                  onChange={(e) => {
                    setMaterialForm({...materialForm, week: parseInt(e.target.value) || 1});
                    if (formErrors.week) setFormErrors({...formErrors, week: ''});
                  }}
                  className={formErrors.week ? 'border-red-500' : ''}
                  required
                />
                {formErrors.week && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {formErrors.week}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Urutan <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  min="1"
                  value={materialForm.orderIndex}
                  onChange={(e) => {
                    setMaterialForm({...materialForm, orderIndex: parseInt(e.target.value) || 1});
                    if (formErrors.orderIndex) setFormErrors({...formErrors, orderIndex: ''});
                  }}
                  className={formErrors.orderIndex ? 'border-red-500' : ''}
                  required
                />
                {formErrors.orderIndex && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {formErrors.orderIndex}
                  </p>
                )}
              </div>
            </div>

            {/* ATTENDANCE TRIGGER SETTINGS - Clean version for VIDEO type */}
            {materialForm.type === MaterialType.VIDEO && (
              <div className="border-2 border-blue-100 rounded-lg p-4 bg-blue-50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-600" />
                    <h3 className="font-medium text-gray-900">🎯 Pengaturan Absensi Otomatis</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMaterialForm({
                      ...materialForm, 
                      isAttendanceTrigger: !materialForm.isAttendanceTrigger
                    })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      materialForm.isAttendanceTrigger ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        materialForm.isAttendanceTrigger ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                <p className="text-sm text-gray-600">
                  Aktifkan untuk mencatat kehadiran otomatis berdasarkan waktu menonton video
                </p>

                {materialForm.isAttendanceTrigger && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Threshold Penyelesaian (%) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min="1"
                        max="100"
                        value={materialForm.attendanceThreshold}
                        onChange={(e) => {
                          setMaterialForm({
                            ...materialForm, 
                            attendanceThreshold: parseInt(e.target.value) || 80
                          });
                          if (formErrors.attendanceThreshold) {
                            setFormErrors({...formErrors, attendanceThreshold: ''});
                          }
                        }}
                        className={`w-24 ${formErrors.attendanceThreshold ? 'border-red-500' : ''}`}
                        required
                      />
                      <span className="text-sm text-gray-600">
                        % video harus ditonton untuk mencatat absensi
                      </span>
                    </div>
                    {formErrors.attendanceThreshold && (
                      <p className="text-red-500 text-xs mt-1 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {formErrors.attendanceThreshold}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      💡 Recommended: 80% - Mahasiswa perlu menonton setidaknya 80% video untuk absensi otomatis
                    </p>
                  </div>
                )}
              </div>
            )}

            {materialForm.type === MaterialType.LINK ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL <span className="text-red-500">*</span>
                </label>
                <Input
                  type="url"
                  value={materialForm.url || ''}
                  onChange={(e) => {
                    setMaterialForm({...materialForm, url: e.target.value});
                    if (formErrors.url) setFormErrors({...formErrors, url: ''});
                  }}
                  className={formErrors.url ? 'border-red-500' : ''}
                  placeholder="https://example.com"
                  required
                />
                {formErrors.url && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {formErrors.url}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  File {!editingMaterial && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setMaterialForm({...materialForm, file: e.target.files[0]});
                        if (formErrors.file) setFormErrors({...formErrors, file: ''});
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      formErrors.file ? 'border-red-500' : 'border-gray-300'
                    }`}
                    accept={getAcceptedFileTypes(materialForm.type)}
                    required={!editingMaterial}
                  />
                  <div className="absolute right-3 top-2 text-gray-400">
                    <Upload className="w-5 h-5" />
                  </div>
                </div>
                {formErrors.file && (
                  <p className="text-red-500 text-xs mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {formErrors.file}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Maksimal 50MB. Format yang diterima: {getAcceptedFileTypes(materialForm.type).replace(/\./g, '').toUpperCase()}
                </p>
                {editingMaterial && !materialForm.file && (
                  <p className="text-xs text-gray-600 mt-1 flex items-center">
                    <Info className="w-3 h-3 mr-1" />
                    Kosongkan jika tidak ingin mengubah file
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setMaterialModalOpen(false);
                  resetMaterialForm();
                }}
                disabled={submitting}
              >
                Batal
              </Button>
              <Button 
                type="submit"
                disabled={submitting}
                className="min-w-[80px]"
              >
                {submitting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editingMaterial ? 'Menyimpan...' : 'Menambah...'}
                  </div>
                ) : (
                  editingMaterial ? 'Simpan' : 'Tambah'
                )}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Material Modal - Keep existing implementation */}
      {deleteMaterialModalOpen && (
        <Modal
          onClose={() => setDeleteMaterialModalOpen(false)}
          title="Konfirmasi Hapus"
        >
          <div className="space-y-4">
            <p>
              Apakah Anda yakin ingin menghapus materi <strong>{selectedMaterial?.title}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeleteMaterialModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="default"
                className="bg-red-600 hover:bg-red-700"
                onClick={handleDeleteMaterial}
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

export default CourseDetailPage;