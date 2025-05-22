import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

const CourseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Detail Mata Kuliah</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Mata Kuliah ID: {id}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Halaman detail mata kuliah sedang dalam pengembangan...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CourseDetailPage;
