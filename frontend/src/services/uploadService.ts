import api from './api';

interface UploadResponse {
  message: string;
  file: {
    originalName: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    url: string;
  };
}

interface AvatarUploadResponse {
  message: string;
  avatar: {
    originalName: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    url: string;
  };
}

export const uploadService = {
  uploadFile: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/uploads/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<AvatarUploadResponse> => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await api.post('/uploads/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
