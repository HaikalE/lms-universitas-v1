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
  AlertCircle
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Loader } from '../../components/ui/Loader';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { courseService } from '../../services/courseService';
import { assignmentService } from '../../services/assignmentService';
import { forumService } from '../../services/forumService';
import { Course, CourseMaterial, MaterialType, Assignment, ForumPost, UserRole } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { formatDate } from '../../utils/date';

type TabType = 'overview' | 'materials' | 'assignments' | 'forums' | 'students' | 'settings';

interface MaterialFormData {
  title: string;
  description: string;
  type: MaterialType;
  week: number;
  orderIndex: number;
  file?: File;
  url?: string;
}

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [forums, setForums] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [deleteMaterialModalOpen, setDeleteMaterialModalOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<CourseMaterial | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<CourseMaterial | null>(null);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  
  const [materialForm, setMaterialForm] = useState<MaterialFormData>({
    title: '',
    description: '',
    type: MaterialType.PDF,
    week: 1,
    orderIndex: 1,
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
  }, [course, activeTab]);

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
      const forumsData = await forumService.getForumPosts(course.id);      
      setForums(forumsData.data); // Access the .data property
      break;
      }
    } catch (error) {
      console.error('Error fetching tab data:', error);
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
      
      if (materialForm.type === MaterialType.LINK && materialForm.url) {
        formData.append('url', materialForm.url.trim());
      } else if (materialForm.file) {
        formData.append('file', materialForm.file);
      }

      console.log('📤 Submitting material form:', {
        title: materialForm.title,
        type: materialForm.type,
        week: materialForm.week,
        orderIndex: materialForm.orderIndex,
        hasFile: !!materialForm.file,
        url: materialForm.url,
        isEditing: !!editingMaterial
      });

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
      console.error('❌ Error submitting material:', error);
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
    });
    setEditingMaterial(null);
    setFormErrors({});
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
      // Use the full backend URL for file downloads
      // Backend serves static files at http://localhost:3000/uploads/
      return `http://localhost:3000/${material.filePath}`;
    }
    
    return '#';
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Info className="w-4 h-4" /> },
    { id: 'materials', label: 'Materi', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'assignments', label: 'Tugas', icon: <AssignmentIcon className="w-4 h-4" /> },
    { id: 'forums', label: 'Forum', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'students', label: 'Mahasiswa', icon: <Users className="w-4 h-4" /> },
  ];

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
            <span>{course.studentsCount || 0} Mahasiswa</span>
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
                      <div className="text-3xl font-bold text-purple-600">{course.studentsCount || 0}</div>
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

        {/* Materials Tab */}
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
              <div className="space-y-4">
                {/* Group materials by week */}
                {Array.from(new Set(materials.map(m => m.week))).sort().map(week => (
                  <div key={week} className="space-y-4">
                    <h3 className="font-semibold text-lg">Minggu {week}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {materials
                        .filter(m => m.week === week)
                        .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))
                        .map(material => (
                          <Card key={material.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                  <div className={`p-2 rounded-lg ${
                                    material.type === MaterialType.PDF ? 'bg-red-100 text-red-600' :
                                    material.type === MaterialType.VIDEO ? 'bg-blue-100 text-blue-600' :
                                    material.type === MaterialType.DOCUMENT ? 'bg-green-100 text-green-600' :
                                    material.type === MaterialType.PRESENTATION ? 'bg-orange-100 text-orange-600' :
                                    'bg-purple-100 text-purple-600'
                                  }`}>
                                    {getMaterialIcon(material.type)}
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{material.title}</h4>
                                    {material.description && (
                                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                        {material.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                      <span>{formatDate(material.createdAt)}</span>
                                      {material.fileSize && (
                                        <span>{(material.fileSize / 1024 / 1024).toFixed(2)} MB</span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      const downloadUrl = getFileDownloadUrl(material);
                                      console.log('🔽 Download URL:', downloadUrl);
                                      if (downloadUrl !== '#') {
                                        window.open(downloadUrl, '_blank');
                                      } else {
                                        toast.error('File tidak tersedia untuk diunduh');
                                      }
                                    }}
                                  >
                                    {material.type === MaterialType.LINK ? (
                                      <LinkIcon className="w-4 h-4" />
                                    ) : (
                                      <Download className="w-4 h-4" />
                                    )}
                                  </Button>

                                  {canManageCourse && (
                                    <div className="relative">
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
                                              // Toggle visibility
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
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab */}
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

        {/* Forums Tab */}
        {activeTab === 'forums' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => navigate(`/courses/${course.id}/forums/create`)}>
                <Plus className="w-4 h-4 mr-2" />
                Buat Diskusi
              </Button>
            </div>

            {forums.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Belum ada diskusi</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {forums.map(forum => (
                  <Card key={forum.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{forum.title}</h4>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{forum.content}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span>{forum.author.fullName}</span>
                            <span>•</span>
                            <span>{formatDate(forum.createdAt)}</span>
                            <span>•</span>
                            <span>{forum.children?.length || 0} balasan</span>
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

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            {canManageCourse && (
              <div className="flex justify-end">
                <Button onClick={() => navigate(`/courses/${course.id}/students/manage`)}>
                  <Users className="w-4 h-4 mr-2" />
                  Kelola Mahasiswa
                </Button>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Daftar Mahasiswa ({course.studentsCount || 0})</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Fitur ini sedang dalam pengembangan...</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Settings Tab */}
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

      {/* Material Form Modal */}
      {materialModalOpen && (
        <Modal
          onClose={() => {
            setMaterialModalOpen(false);
            resetMaterialForm();
          }}
          title={editingMaterial ? 'Edit Materi' : 'Tambah Materi'}
        >
          <form onSubmit={handleMaterialSubmit} className="space-y-4">
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

      {/* Delete Material Modal */}
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