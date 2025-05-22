import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';

const ProfilePage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Informasi Profil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-gray-500">Halaman profil sedang dalam pengembangan...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfilePage;
