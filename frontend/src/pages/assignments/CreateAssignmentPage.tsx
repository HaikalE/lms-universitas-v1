import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { AssignmentType, Course, UserRole } from '../../types';
import { assignmentService } from '../../services/assignmentService';
import { courseService } from '../../services/courseService';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Select } from '../../components/ui/Select';
import { Checkbox } from '../../components/ui/Checkbox';
import { Loader } from '../../components/ui/Loader';
import { Alert } from '../../components/ui/Alert';
import { 
  ArrowLeftIcon,
  SaveIcon,
  AlertCircleIcon,
  FileTextIcon,
  CalendarIcon,
  InfoIcon
} from 'lucide-react';
import { format } from 'date-fns';

interface CreateAssignmentData {
  title: string;
  description: string;
  type: AssignmentType;
  courseId: string;
  dueDate: string;
  maxScore: number;
  allowLateSubmission: boolean;
  latePenaltyPercent: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  isVisible: boolean;
}

const CreateAssignmentPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CreateAssignmentData>({
    title: '',
    description: '',
    type: AssignmentType.INDIVIDUAL,
    courseId: '',
    dueDate: '',
    maxScore: 100,
    allowLateSubmission: true,
    latePenaltyPercent: 10,
    allowedFileTypes: ['.pdf', '.doc', '.docx', '.jpg', '.png', '.zip'],
    maxFileSize: 10,
    isVisible: true
  });

  const commonFileTypes = [
    { value: '.pdf', label: 'PDF' },
    { value: '.doc', label: 'DOC' },
    { value: '.docx', label: 'DOCX' },
    { value: '.xls', label: 'XLS' },
    { value: '.xlsx', label: 'XLSX' },
    { value: '.ppt', label: 'PPT' },
    { value: '.pptx', label: 'PPTX' },
    { value: '.jpg', label: 'JPG' },
    { value: '.jpeg', label: 'JPEG' },
    { value: '.png', label: 'PNG' },
    { value: '.gif', label: 'GIF' },
    { value: '.zip', label: 'ZIP' },
    { value: '.rar', label: 'RAR' },
    { value: '.txt', label: 'TXT' },
    { value: '.mp4', label: 'MP4' },
    { value: '.avi', label: 'AVI' }
  ];

  useEffect(() => {
    // Redirect if not lecturer
    if (user?.role !== UserRole.LECTURER) {
      navigate('/assignments');
    } else {
      fetchCourses();
    }
  }, [user, navigate]);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const coursesData = await courseService.getMyCourses(); // Asumsikan ini mengembalikan Course[]
      setCourses(coursesData); // Langsung gunakan coursesData
      if (coursesData.length > 0) { // Gunakan coursesData di sini
        setFormData(prev => ({ ...prev, courseId: coursesData[0].id })); // Gunakan coursesData di sini
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal memuat daftar mata kuliah');
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleFileTypeChange = (fileType: string) => {
    setFormData(prev => ({
      ...prev,
      allowedFileTypes: prev.allowedFileTypes.includes(fileType)
        ? prev.allowedFileTypes.filter(ft => ft !== fileType)
        : [...prev.allowedFileTypes, fileType]
    }));
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Judul tugas harus diisi';
    }
    
    if (!formData.description.trim()) {
      errors.description = 'Deskripsi tugas harus diisi';
    }
    
    if (!formData.courseId) {
      errors.courseId = 'Mata kuliah harus dipilih';
    }
    
    if (!formData.dueDate) {
      errors.dueDate = 'Deadline harus diisi';
    } else {
      const dueDate = new Date(formData.dueDate);
      const now = new Date();
      if (dueDate <= now) {
        errors.dueDate = 'Deadline harus lebih dari waktu sekarang';
      }
    }
    
    if (!formData.maxScore || formData.maxScore <= 0) {
      errors.maxScore = 'Nilai maksimal harus lebih dari 0';
    }
    
    if (formData.allowLateSubmission && (!formData.latePenaltyPercent || formData.latePenaltyPercent < 0 || formData.latePenaltyPercent > 100)) {
      errors.latePenaltyPercent = 'Penalti harus antara 0-100%';
    }
    
    if (!formData.maxFileSize || formData.maxFileSize <= 0) {
      errors.maxFileSize = 'Ukuran file maksimal harus lebih dari 0';
    }
    
    if (formData.allowedFileTypes.length === 0) {
      errors.allowedFileTypes = 'Pilih minimal satu tipe file';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Format the due date to ISO string
      const dueDate = new Date(formData.dueDate);
      
      await assignmentService.createAssignment({
        ...formData,
        dueDate: dueDate.toISOString(),
        maxScore: Number(formData.maxScore),
        latePenaltyPercent: Number(formData.latePenaltyPercent),
        maxFileSize: Number(formData.maxFileSize)
      });
      
      // Navigate back to assignments list
      navigate('/assignments');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal membuat tugas');
    } finally {
      setLoading(false);
    }
  };

  if (loadingCourses) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="p-2"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Buat Tugas Baru</h1>
      </div>

      {error && (
        <Alert variant="error">
          <AlertCircleIcon className="w-4 h-4" />
          <span>{error}</span>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Judul Tugas <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Masukkan judul tugas"
                error={validationErrors.title}
              />
              {validationErrors.title && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi <span className="text-red-500">*</span>
              </label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={6}
                placeholder="Jelaskan detail tugas, instruksi, dan kriteria penilaian..."
                error={validationErrors.description}
              />
              {validationErrors.description && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mata Kuliah <span className="text-red-500">*</span>
                </label>
                <Select
                  name="courseId"
                  value={formData.courseId}
                  onChange={handleInputChange}
                  error={validationErrors.courseId}
                >
                  <option value="">Pilih Mata Kuliah</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </Select>
                {validationErrors.courseId && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.courseId}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Tugas <span className="text-red-500">*</span>
                </label>
                <Select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                >
                  <option value={AssignmentType.INDIVIDUAL}>Tugas Individu</option>
                  <option value={AssignmentType.GROUP}>Tugas Kelompok</option>
                  <option value={AssignmentType.QUIZ}>Quiz</option>
                  <option value={AssignmentType.EXAM}>Ujian</option>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Deadline and Scoring */}
        <Card>
          <CardHeader>
            <CardTitle>Deadline & Penilaian</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deadline <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  error={validationErrors.dueDate}
                />
                {validationErrors.dueDate && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.dueDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nilai Maksimal <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  name="maxScore"
                  value={formData.maxScore}
                  onChange={handleInputChange}
                  min="1"
                  error={validationErrors.maxScore}
                />
                {validationErrors.maxScore && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.maxScore}</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <Checkbox
                  id="allowLateSubmission"
                  name="allowLateSubmission"
                  checked={formData.allowLateSubmission}
                  onChange={handleInputChange}
                />
                <label htmlFor="allowLateSubmission" className="ml-2 text-sm text-gray-700">
                  Izinkan pengumpulan terlambat
                </label>
              </div>
              
              {formData.allowLateSubmission && (
                <div className="ml-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Penalti Keterlambatan (%)
                  </label>
                  <Input
                    type="number"
                    name="latePenaltyPercent"
                    value={formData.latePenaltyPercent}
                    onChange={handleInputChange}
                    min="0"
                    max="100"
                    error={validationErrors.latePenaltyPercent}
                  />
                  {validationErrors.latePenaltyPercent && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.latePenaltyPercent}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Nilai akan dikurangi {formData.latePenaltyPercent}% untuk pengumpulan terlambat
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* File Upload Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Upload File</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipe File yang Diizinkan <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {commonFileTypes.map(fileType => (
                  <div key={fileType.value} className="flex items-center">
                    <Checkbox
                      id={`filetype-${fileType.value}`}
                      checked={formData.allowedFileTypes.includes(fileType.value)}
                      onChange={() => handleFileTypeChange(fileType.value)}
                    />
                    <label
                      htmlFor={`filetype-${fileType.value}`}
                      className="ml-2 text-sm text-gray-700"
                    >
                      {fileType.label}
                    </label>
                  </div>
                ))}
              </div>
              {validationErrors.allowedFileTypes && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.allowedFileTypes}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ukuran File Maksimal (MB) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                name="maxFileSize"
                value={formData.maxFileSize}
                onChange={handleInputChange}
                min="1"
                max="100"
                error={validationErrors.maxFileSize}
              />
              {validationErrors.maxFileSize && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.maxFileSize}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Maksimal ukuran file yang dapat diupload oleh mahasiswa
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Visibility Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Pengaturan Visibilitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Checkbox
                id="isVisible"
                name="isVisible"
                checked={formData.isVisible}
                onChange={handleInputChange}
              />
              <label htmlFor="isVisible" className="ml-2 text-sm text-gray-700">
                Tampilkan tugas ke mahasiswa
              </label>
            </div>
            <p className="mt-2 text-xs text-gray-500 flex items-start gap-1">
              <InfoIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
              Jika tidak dicentang, tugas akan disimpan sebagai draft dan tidak terlihat oleh mahasiswa
            </p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <Loader size="small" className="mr-2" />
            ) : (
              <SaveIcon className="w-4 h-4 mr-2" />
            )}
            Buat Tugas
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateAssignmentPage;