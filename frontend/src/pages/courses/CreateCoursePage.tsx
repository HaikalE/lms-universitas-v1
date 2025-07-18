import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  BookOpen, 
  Users, 
  Calendar,
  Clock,
  MapPin,
  FileText,
  AlertCircle,
  Check
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { TextArea } from '../../components/ui/TextArea';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { Badge } from '../../components/ui/Badge';
import { toast } from 'react-hot-toast';
import { courseService } from '../../services/courseService';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface Lecturer {
  id: string;
  fullName: string;
  lecturerId: string;
  email: string;
}

interface FormData {
  lecturers: Lecturer[];
  statistics: {
    totalCourses: number;
    activeCourses: number;
    totalLecturers: number;
  };
  formFields: {
    semesters: string[];
    creditOptions: number[];
    maxStudentsOptions: number[];
  };
}

interface CourseFormData {
  code: string;
  name: string;
  description: string;
  credits: number;
  semester: string;
  lecturerId: string;
  maxStudents: number;
  schedule: string;
  location: string;
  syllabus: string;
}

const CreateCoursePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [courseData, setCourseData] = useState<CourseFormData>({
    code: '',
    name: '',
    description: '',
    credits: 3,
    semester: '',
    lecturerId: '',
    maxStudents: 30,
    schedule: '',
    location: '',
    syllabus: ''
  });

  // Check if user is admin
  useEffect(() => {
    if (user?.role !== UserRole.ADMIN) {
      toast.error('Hanya admin yang dapat membuat mata kuliah');
      navigate('/courses');
      return;
    }
  }, [user, navigate]);

  // Fetch form data when component mounts
  useEffect(() => {
    fetchFormData();
  }, []);

  const fetchFormData = async () => {
    try {
      setLoading(true);
      console.log('📋 Fetching create course form data...');
      
      // Use courseService method
      const response = await courseService.getCreateCourseData();
      
      if (response.data) {
        setFormData(response.data);
        console.log('✅ Form data loaded:', response.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('❌ Error fetching form data:', error);
      toast.error('Gagal memuat data form. Silakan refresh halaman.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required field validation
    if (!courseData.code.trim()) {
      newErrors.code = 'Kode mata kuliah wajib diisi';
    } else if (courseData.code.length < 2) {
      newErrors.code = 'Kode mata kuliah minimal 2 karakter';
    }

    if (!courseData.name.trim()) {
      newErrors.name = 'Nama mata kuliah wajib diisi';
    } else if (courseData.name.length < 3) {
      newErrors.name = 'Nama mata kuliah minimal 3 karakter';
    }

    if (!courseData.semester) {
      newErrors.semester = 'Semester wajib dipilih';
    }

    if (!courseData.lecturerId) {
      newErrors.lecturerId = 'Dosen pengampu wajib dipilih';
    }

    if (courseData.credits < 1 || courseData.credits > 6) {
      newErrors.credits = 'SKS harus antara 1-6';
    }

    if (courseData.maxStudents < 1) {
      newErrors.maxStudents = 'Maksimal mahasiswa minimal 1';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CourseFormData, value: string | number) => {
    setCourseData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Mohon periksa kembali data yang diisi');
      return;
    }

    try {
      setSaving(true);
      console.log('💾 Creating course:', courseData);

      const result = await courseService.createCourse({
        code: courseData.code.trim(),
        name: courseData.name.trim(),
        description: courseData.description.trim() || undefined,
        credits: courseData.credits,
        semester: courseData.semester,
        lecturerId: courseData.lecturerId,
        maxStudents: courseData.maxStudents,
        schedule: courseData.schedule.trim() || undefined,
        location: courseData.location.trim() || undefined,
        syllabus: courseData.syllabus.trim() || undefined
      });

      console.log('✅ Course created successfully:', result);
      toast.success('Mata kuliah berhasil dibuat!');
      navigate('/courses');
    } catch (error: any) {
      console.error('❌ Error creating course:', error);
      
      // Handle specific error messages from backend
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          error.response.data.message.forEach((msg: string) => toast.error(msg));
        } else {
          toast.error(error.response.data.message);
        }
      } else {
        toast.error('Gagal membuat mata kuliah. Silakan coba lagi.');
      }
    } finally {
      setSaving(false);
    }
  };

  const selectedLecturer = formData?.lecturers.find(l => l.id === courseData.lecturerId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Memuat data form...</p>
        </div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="font-semibold text-lg mb-2">Gagal Memuat Data</h3>
            <p className="text-gray-600 mb-4">
              Tidak dapat memuat data form. Silakan refresh halaman atau coba lagi.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Halaman
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/courses')}
            className="flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tambah Mata Kuliah</h1>
            <p className="text-gray-600">Buat mata kuliah baru untuk sistem</p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Mata Kuliah</p>
                <p className="text-2xl font-bold text-gray-900">{formData.statistics.totalCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Check className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Mata Kuliah Aktif</p>
                <p className="text-2xl font-bold text-gray-900">{formData.statistics.activeCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Dosen</p>
                <p className="text-2xl font-bold text-gray-900">{formData.statistics.totalLecturers}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Informasi Dasar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kode Mata Kuliah <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={courseData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  placeholder="Contoh: CS101, MAT201"
                  className={errors.code ? 'border-red-500' : ''}
                />
                {errors.code && (
                  <p className="text-red-500 text-sm mt-1">{errors.code}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKS <span className="text-red-500">*</span>
                </label>
                <Select
                  value={courseData.credits.toString()}
                  onChange={(e) => handleInputChange('credits', parseInt(e.target.value))}
                  className={errors.credits ? 'border-red-500' : ''}
                >
                  {formData.formFields.creditOptions.map(credit => (
                    <option key={credit} value={credit}>
                      {credit} SKS
                    </option>
                  ))}
                </Select>
                {errors.credits && (
                  <p className="text-red-500 text-sm mt-1">{errors.credits}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Mata Kuliah <span className="text-red-500">*</span>
              </label>
              <Input
                type="text"
                value={courseData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Contoh: Pemrograman Berorientasi Objek"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deskripsi Mata Kuliah
              </label>
              <TextArea
                value={courseData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Deskripsi singkat tentang mata kuliah ini..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Academic Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Detail Akademik
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Semester <span className="text-red-500">*</span>
                </label>
                <Select
                  value={courseData.semester}
                  onChange={(e) => handleInputChange('semester', e.target.value)}
                  className={errors.semester ? 'border-red-500' : ''}
                >
                  <option value="">Pilih Semester</option>
                  {formData.formFields.semesters.map(semester => (
                    <option key={semester} value={semester}>
                      {semester}
                    </option>
                  ))}
                </Select>
                {errors.semester && (
                  <p className="text-red-500 text-sm mt-1">{errors.semester}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maksimal Mahasiswa
                </label>
                <Select
                  value={courseData.maxStudents.toString()}
                  onChange={(e) => handleInputChange('maxStudents', parseInt(e.target.value))}
                  className={errors.maxStudents ? 'border-red-500' : ''}
                >
                  {formData.formFields.maxStudentsOptions.map(max => (
                    <option key={max} value={max}>
                      {max} Mahasiswa
                    </option>
                  ))}
                </Select>
                {errors.maxStudents && (
                  <p className="text-red-500 text-sm mt-1">{errors.maxStudents}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dosen Pengampu <span className="text-red-500">*</span>
              </label>
              <Select
                value={courseData.lecturerId}
                onChange={(e) => handleInputChange('lecturerId', e.target.value)}
                className={errors.lecturerId ? 'border-red-500' : ''}
              >
                <option value="">Pilih Dosen Pengampu</option>
                {formData.lecturers.map(lecturer => (
                  <option key={lecturer.id} value={lecturer.id}>
                    {lecturer.fullName} ({lecturer.lecturerId}) - {lecturer.email}
                  </option>
                ))}
              </Select>
              {errors.lecturerId && (
                <p className="text-red-500 text-sm mt-1">{errors.lecturerId}</p>
              )}
              
              {selectedLecturer && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-blue-700">
                      Dosen Terpilih:
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge variant="info">{selectedLecturer.fullName}</Badge>
                    <Badge variant="outline">{selectedLecturer.lecturerId}</Badge>
                    <Badge variant="outline">{selectedLecturer.email}</Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Schedule & Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Jadwal & Lokasi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jadwal Kuliah
                </label>
                <Input
                  type="text"
                  value={courseData.schedule}
                  onChange={(e) => handleInputChange('schedule', e.target.value)}
                  placeholder="Contoh: Senin 08:00-10:00, Rabu 13:00-15:00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lokasi/Ruangan
                </label>
                <Input
                  type="text"
                  value={courseData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Contoh: Lab Komputer 1, Ruang 201"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Silabus/RPS
              </label>
              <TextArea
                value={courseData.syllabus}
                onChange={(e) => handleInputChange('syllabus', e.target.value)}
                placeholder="Ringkasan silabus atau rencana pembelajaran semester..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/courses')}
                disabled={saving}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="flex items-center"
              >
                {saving ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan Mata Kuliah
                  </>
                )}
              </Button>
            </div>
            
            <div className="mt-4 text-sm text-gray-600">
              <p>
                <span className="text-red-500">*</span> Field yang wajib diisi
              </p>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};

export default CreateCoursePage;