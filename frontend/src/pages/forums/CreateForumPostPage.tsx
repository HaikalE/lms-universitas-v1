import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus,
  BookOpen,
  Tag,
  Type,
  FileText,
  AlertCircle,
  Info,
  HelpCircle,
  MessageSquare,
  TrendingUp,
  X
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
import { useAuth } from '../../contexts/AuthContext';
import { courseService, forumService } from '../../services';
import { Course } from '../../types';

interface FormData {
  title: string;
  content: string;
  courseId: string;
  // REMOVED: type and tags - tidak diperlukan backend
}

interface FormErrors {
  title?: string;
  content?: string;
  courseId?: string;
}

const CreateForumPostPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    courseId: '',
    // REMOVED: type and tags
  });

  const isLecturer = user?.role === 'lecturer';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      console.log('🔍 Fetching courses for forum post creation...');
      const courses = await courseService.getMyCourses();
      setCourses(courses);
      console.log(`✅ Found ${courses.length} courses`);
      
      // Auto-select if only one course
      if (courses.length === 1) {
        setFormData(prev => ({ ...prev, courseId: courses[0].id }));
        console.log('📌 Auto-selected course:', courses[0].name);
      }
    } catch (error) {
      console.error('❌ Error fetching courses:', error);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Judul diskusi wajib diisi';
    } else if (formData.title.length < 10) {
      newErrors.title = 'Judul minimal 10 karakter';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Judul maksimal 200 karakter';
    }

    if (!formData.content.trim()) {
      newErrors.content = 'Konten diskusi wajib diisi';
    } else if (formData.content.replace(/<[^>]*>/g, '').length < 20) {
      newErrors.content = 'Konten minimal 20 karakter';
    }

    if (!formData.courseId) {
      newErrors.courseId = 'Pilih mata kuliah untuk diskusi ini';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      console.log('❌ Form validation failed');
      return;
    }

    try {
      setLoading(true);
      
      console.log('📝 Submitting forum post data:', {
        title: formData.title,
        courseId: formData.courseId,
        contentLength: formData.content.length
      });
      
      // FIXED: Kirim hanya data yang diperlukan backend
      const postData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        courseId: formData.courseId
        // REMOVED: type and tags - tidak ada di backend DTO
      };
      
      console.log('🚀 Creating forum post with data:', postData);
      
      const forumPost = await forumService.createForumPost(postData);
      
      console.log('✅ Forum post created successfully:', forumPost.id);
      
      // Redirect to the new post
      navigate(`/forums/${forumPost.id}`);
    } catch (error) {
      console.error('❌ Error creating forum post:', error);
      alert('Gagal membuat diskusi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Navigation */}
      <button
        onClick={() => navigate('/forums')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Kembali ke Forum
      </button>

      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Buat Diskusi Baru</h1>
        <p className="text-blue-100">
          Bagikan pertanyaan, ide, atau informasi dengan komunitas pembelajaran
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Course Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Pilih Mata Kuliah
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={formData.courseId}
              onChange={(e) => {
                setFormData({ ...formData, courseId: e.target.value });
                console.log('📚 Course selected:', e.target.value);
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.courseId ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">-- Pilih Mata Kuliah --</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.name}
                </option>
              ))}
            </select>
            {errors.courseId && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.courseId}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Title */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Type className="w-5 h-5" />
              Judul Diskusi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Tulis judul yang jelas dan deskriptif..."
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              maxLength={200}
            />
            <div className="flex justify-between items-center mt-2">
              <div>
                {errors.title && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.title}
                  </p>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {formData.title.length}/200
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Konten Diskusi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RichTextEditor
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
              placeholder="Jelaskan pertanyaan atau topik diskusi Anda secara detail..."
              minHeight={200}
            />
            {errors.content && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.content}
              </p>
            )}
            
            {/* Tips */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="flex items-center gap-2 font-medium text-blue-900 mb-2">
                <Info className="w-5 h-5" />
                Tips Membuat Diskusi yang Baik:
              </h4>
              <ul className="space-y-1 text-sm text-blue-800">
                <li>• Gunakan judul yang spesifik dan deskriptif</li>
                <li>• Jelaskan konteks dan latar belakang masalah</li>
                <li>• Sertakan detail yang relevan (kode, screenshot, dll)</li>
                <li>• Gunakan format yang rapi dan mudah dibaca</li>
                <li>• Pastikan konten sesuai dengan mata kuliah yang dipilih</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => navigate('/forums')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Membuat...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5" />
                Buat Diskusi
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateForumPostPage;