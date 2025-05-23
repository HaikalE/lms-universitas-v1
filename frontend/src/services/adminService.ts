import api from './api';
import { ApiResponse, User, Course } from '../types';

export interface SystemStats {
  totalUsers: number;
  totalStudents: number;
  totalLecturers: number;
  totalAdmins: number;
  totalCourses: number;
  activeCourses: number;
  totalAssignments: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  systemHealth: {
    status: 'healthy' | 'warning' | 'error';
    uptime: number;
    lastBackup: string;
    diskUsage: number;
    memoryUsage: number;
  };
}

export interface ActivityLog {
  id: string;
  action: string;
  entityType: 'user' | 'course' | 'assignment' | 'system';
  entityId: string;
  userId: string;
  userRole: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface BulkOperation {
  operation: 'activate' | 'deactivate' | 'delete' | 'enroll' | 'unenroll';
  entityType: 'users' | 'courses';
  entityIds: string[];
  additionalData?: Record<string, any>;
}

export interface ReportParams {
  type: 'users' | 'courses' | 'assignments' | 'submissions' | 'activity';
  dateFrom?: string;
  dateTo?: string;
  format?: 'json' | 'csv' | 'pdf';
  filters?: Record<string, any>;
}

export interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  createdAt: string;
  type: 'auto' | 'manual';
  status: 'completed' | 'failed' | 'in_progress';
}

export const adminService = {
  // Dashboard & Statistics
  getSystemStats: async (): Promise<SystemStats> => {
    try {
      const response = await api.get('/admin/stats');
      return response.data;
    } catch (error) {
      // Return mock data if endpoint doesn't exist yet
      return {
        totalUsers: 0,
        totalStudents: 0,
        totalLecturers: 0,
        totalAdmins: 0,
        totalCourses: 0,
        activeCourses: 0,
        totalAssignments: 0,
        totalSubmissions: 0,
        pendingSubmissions: 0,
        systemHealth: {
          status: 'healthy',
          uptime: 86400,
          lastBackup: new Date().toISOString(),
          diskUsage: 45,
          memoryUsage: 62,
        },
      };
    }
  },

  getActivityLogs: async (params?: {
    page?: number;
    limit?: number;
    entityType?: string;
    userId?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<ApiResponse<ActivityLog[]>> => {
    try {
      const response = await api.get('/admin/activity-logs', { params });
      return response.data;
    } catch (error) {
      // Return mock data if endpoint doesn't exist yet
      return {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
    }
  },

  // User Management
  bulkUserOperation: async (operation: BulkOperation): Promise<{ success: number; failed: number; errors: any[] }> => {
    try {
      const response = await api.post('/admin/users/bulk', operation);
      return response.data;
    } catch (error) {
      console.error('Bulk user operation failed:', error);
      throw error;
    }
  },

  // Course Management (these are handled by courseService, but adding here for admin-specific operations)
  createCourse: async (courseData: {
    code: string;
    name: string;
    description?: string;
    credits: number;
    semester: string;
    lecturerId: string;
  }): Promise<Course> => {
    const response = await api.post('/courses', courseData);
    return response.data;
  },

  updateCourse: async (courseId: string, courseData: Partial<Course>): Promise<Course> => {
    const response = await api.patch(`/courses/${courseId}`, courseData);
    return response.data;
  },

  deleteCourse: async (courseId: string): Promise<void> => {
    await api.delete(`/courses/${courseId}`);
  },

  bulkCourseOperation: async (operation: BulkOperation): Promise<{ success: number; failed: number; errors: any[] }> => {
    try {
      const response = await api.post('/admin/courses/bulk', operation);
      return response.data;
    } catch (error) {
      console.error('Bulk course operation failed:', error);
      throw error;
    }
  },

  // Enrollment Management
  bulkEnrollStudents: async (courseId: string, studentIds: string[]): Promise<{
    enrolled: number;
    failed: number;
    errors: any[];
  }> => {
    try {
      const response = await api.post(`/admin/courses/${courseId}/bulk-enroll`, { studentIds });
      return response.data;
    } catch (error) {
      console.error('Bulk enrollment failed:', error);
      throw error;
    }
  },

  bulkUnenrollStudents: async (courseId: string, studentIds: string[]): Promise<{
    unenrolled: number;
    failed: number;
    errors: any[];
  }> => {
    try {
      const response = await api.post(`/admin/courses/${courseId}/bulk-unenroll`, { studentIds });
      return response.data;
    } catch (error) {
      console.error('Bulk unenrollment failed:', error);
      throw error;
    }
  },

  // System Management
  createBackup: async (type: 'full' | 'data_only' | 'users_only'): Promise<BackupInfo> => {
    try {
      const response = await api.post('/admin/system/backup', { type });
      return response.data;
    } catch (error) {
      console.error('Backup creation failed:', error);
      throw error;
    }
  },

  getBackups: async (): Promise<BackupInfo[]> => {
    try {
      const response = await api.get('/admin/system/backups');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch backups:', error);
      return [];
    }
  },

  restoreBackup: async (backupId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await api.post(`/admin/system/backups/${backupId}/restore`);
      return response.data;
    } catch (error) {
      console.error('Backup restoration failed:', error);
      throw error;
    }
  },

  deleteBackup: async (backupId: string): Promise<void> => {
    await api.delete(`/admin/system/backups/${backupId}`);
  },

  // Reports & Analytics
  generateReport: async (params: ReportParams): Promise<any> => {
    try {
      const response = await api.post('/admin/reports/generate', params, {
        responseType: params.format === 'pdf' ? 'blob' : 'json'
      });
      return response.data;
    } catch (error) {
      console.error('Report generation failed:', error);
      throw error;
    }
  },

  getReportHistory: async (): Promise<any[]> => {
    try {
      const response = await api.get('/admin/reports/history');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch report history:', error);
      return [];
    }
  },

  // System Settings
  getSystemSettings: async (): Promise<Record<string, any>> => {
    try {
      const response = await api.get('/admin/settings');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch system settings:', error);
      return {};
    }
  },

  updateSystemSettings: async (settings: Record<string, any>): Promise<Record<string, any>> => {
    try {
      const response = await api.patch('/admin/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Failed to update system settings:', error);
      throw error;
    }
  },

  // Data Import/Export
  importUsers: async (file: File, options: {
    updateExisting?: boolean;
    skipErrors?: boolean;
    dryRun?: boolean;
  }): Promise<{
    imported: number;
    updated: number;
    errors: any[];
    preview?: User[];
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));

    try {
      const response = await api.post('/admin/import/users', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.error('User import failed:', error);
      throw error;
    }
  },

  importCourses: async (file: File, options: {
    updateExisting?: boolean;
    skipErrors?: boolean;
    dryRun?: boolean;
  }): Promise<{
    imported: number;
    updated: number;
    errors: any[];
    preview?: Course[];
  }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));

    try {
      const response = await api.post('/admin/import/courses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      console.error('Course import failed:', error);
      throw error;
    }
  },

  exportUsers: async (filters?: Record<string, any>, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> => {
    try {
      const response = await api.post('/admin/export/users', { filters, format }, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('User export failed:', error);
      throw error;
    }
  },

  exportCourses: async (filters?: Record<string, any>, format: 'csv' | 'xlsx' = 'csv'): Promise<Blob> => {
    try {
      const response = await api.post('/admin/export/courses', { filters, format }, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Course export failed:', error);
      throw error;
    }
  },

  // Notifications & Communications
  sendSystemNotification: async (notification: {
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    targetUsers?: string[];
    targetRoles?: string[];
    scheduledAt?: string;
  }): Promise<{ sent: number; failed: number }> => {
    try {
      const response = await api.post('/admin/notifications/send', notification);
      return response.data;
    } catch (error) {
      console.error('System notification failed:', error);
      throw error;
    }
  },

  broadcastAnnouncement: async (announcement: {
    title: string;
    content: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    targetCourses?: string[];
    targetRoles?: string[];
    expiresAt?: string;
  }): Promise<{ id: string; sent: number }> => {
    try {
      const response = await api.post('/admin/announcements/broadcast', announcement);
      return response.data;
    } catch (error) {
      console.error('Announcement broadcast failed:', error);
      throw error;
    }
  },

  // Monitoring & Health
  getSystemHealth: async (): Promise<{
    status: 'healthy' | 'warning' | 'error';
    services: Array<{
      name: string;
      status: 'online' | 'offline' | 'degraded';
      response_time?: number;
      last_check: string;
    }>;
    metrics: {
      uptime: number;
      cpu_usage: number;
      memory_usage: number;
      disk_usage: number;
      active_users: number;
      database_connections: number;
    };
  }> => {
    try {
      const response = await api.get('/admin/system/health');
      return response.data;
    } catch (error) {
      // Return mock data for development
      return {
        status: 'healthy',
        services: [
          { name: 'Database', status: 'online', response_time: 5, last_check: new Date().toISOString() },
          { name: 'File Storage', status: 'online', response_time: 2, last_check: new Date().toISOString() },
          { name: 'Email Service', status: 'online', response_time: 15, last_check: new Date().toISOString() },
        ],
        metrics: {
          uptime: 99.9,
          cpu_usage: 45,
          memory_usage: 62,
          disk_usage: 28,
          active_users: 156,
          database_connections: 12,
        },
      };
    }
  },
};

// Helper functions for file downloads
export const downloadFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / (24 * 60 * 60));
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((seconds % (60 * 60)) / 60);
  
  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};