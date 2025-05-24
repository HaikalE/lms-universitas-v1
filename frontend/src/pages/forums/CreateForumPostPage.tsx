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
import { useAuth } from '../../contexts/AuthContext';
import { coursesApi, forumsApi } from '../../services/api';
import { Course } from '../../types';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

interface FormData {
  title: string;
  content: string;
  courseId: string;
  type: 'question' | 'discussion' | 'announcement';
  tags: string[];
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
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [formData, setFormData] = useState<FormData>({
    title: '',
    content: '',
    courseId: '',
    type: 'discussion',
    tags: []
  });

  const isLecturer = user?.role === 'lecturer';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await coursesApi.getMyCourses();
      setCourses(response.data);
      
      // Auto-select if only one course
      if (response.data.length === 1) {
        setFormData(prev => ({ ...prev, courseId: response.data[0].id }));
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
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
      return;
    }

    try {
      setLoading(true);
      
      const response = await forumsApi.createForumPost({
        ...formData,
        tags: formData.tags.filter(tag => tag.trim())
      });
      
      // Redirect to the new post
      navigate(`/forums/${response.data.id}`);
    } catch (error) {
      console.error('Error creating forum post:', error);
      alert('Gagal membuat diskusi. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      
      const newTag = tagInput.trim().toLowerCase();
      if (!formData.tags.includes(newTag) && formData.tags.length < 5) {
        setFormData(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'question':
        return <HelpCircle className="w-5 h-5" />;
      case 'discussion':
        return <MessageSquare className="w-5 h-5" />;
      case 'announcement':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <MessageSquare className="w-5 h-5" />;
    }
  };

  const modules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      ['blockquote', 'code-block'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      ['link', 'image', 'video'],
      ['clean']
    ],
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
              onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
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

        {/* Post Type */}
        <Card>
          <CardHeader>
            <CardTitle>Tipe Diskusi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  value: 'question',
                  label: 'Pertanyaan',
                  description: 'Ajukan pertanyaan untuk mendapatkan jawaban',
                  icon: <HelpCircle className="w-6 h-6" />,
                  color: 'blue'
                },
                {
                  value: 'discussion',
                  label: 'Diskusi',
                  description: 'Mulai diskusi atau berbagi pendapat',
                  icon: <MessageSquare className="w-6 h-6" />,
                  color: 'green'
                },
                {
                  value: 'announcement',
                  label: 'Pengumuman',
                  description: 'Bagikan informasi penting',
                  icon: <TrendingUp className="w-6 h-6" />,
                  color: 'purple',
                  disabled: !isLecturer && !isAdmin
                }
              ].map((type) => (
                <label
                  key={type.value}
                  className={`relative flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.type === type.value
                      ? `border-${type.color}-500 bg-${type.color}-50`
                      : 'border-gray-200 hover:border-gray-300'
                  } ${type.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={formData.type === type.value}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    disabled={type.disabled}
                    className="sr-only"
                  />
                  <div className={`flex items-center gap-3 mb-2 text-${type.color}-600`}>
                    {type.icon}
                    <span className="font-semibold">{type.label}</span>
                  </div>
                  <p className="text-sm text-gray-600">{type.description}</p>
                  {type.disabled && (
                    <p className="text-xs text-red-600 mt-2">Hanya untuk dosen/admin</p>
                  )}
                </label>
              ))}
            </div>
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
            <ReactQuill
              value={formData.content}
              onChange={(value) => setFormData({ ...formData, content: value })}
              placeholder="Jelaskan pertanyaan atau topik diskusi Anda secara detail..."
              className={`bg-white ${errors.content ? 'border border-red-500' : ''}`}
              modules={modules}
              style={{ minHeight: '200px' }}
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
                <li>• Tambahkan tag yang sesuai untuk memudahkan pencarian</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Tags (Opsional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-1"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-blue-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              {formData.tags.length < 5 && (
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Ketik tag dan tekan Enter (maksimal 5 tag)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
              
              <p className="text-sm text-gray-500">
                Tag membantu orang lain menemukan diskusi Anda. Gunakan kata kunci yang relevan.
              </p>
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