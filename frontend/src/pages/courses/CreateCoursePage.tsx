import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

const CreateCoursePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Tambah Mata Kuliah Baru</h1>
      </div>

      {/* Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Halaman ini khusus untuk navigasi langsung ke <code>/courses/create</code>.
            </p>
            <p className="text-gray-600">
              Untuk membuat mata kuliah baru, silakan gunakan:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>
                <strong>Admin Panel:</strong> Navigasi ke{' '}
                <Button
                  variant="link"
                  className="p-0 h-auto text-blue-600"
                  onClick={() => navigate('/admin/courses')}
                >
                  /admin/courses
                </Button>{' '}
                dan klik "Tambah Mata Kuliah"
              </li>
              <li>
                <strong>Course Management:</strong> Gunakan modal form di halaman administrasi
              </li>
            </ul>
            
            <div className="mt-6 space-x-2">
              <Button onClick={() => navigate('/admin/courses')}>
                Ke Admin Courses
              </Button>
              <Button variant="outline" onClick={() => navigate('/courses')}>
                Ke Daftar Courses
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateCoursePage;