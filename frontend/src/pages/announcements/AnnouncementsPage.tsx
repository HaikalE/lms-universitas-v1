import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

const AnnouncementsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Pengumuman</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengumuman</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Halaman pengumuman sedang dalam pengembangan...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnnouncementsPage;
