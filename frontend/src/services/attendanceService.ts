import api from './api';

// Types for Attendance API
export interface AttendanceRecord {
  id: string;
  studentId: string;
  courseId: string;
  triggerMaterialId: string | null;
  attendanceDate: string;
  status: 'present' | 'absent' | 'auto_present' | 'excused' | 'late';
  attendanceType: 'manual' | 'video_completion' | 'qr_code' | 'location_based';
  notes: string | null;
  submittedAt: Date | null;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;
  student?: {
    id: string;
    fullName: string;
    studentId: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
    code: string;
  };
  triggerMaterial?: {
    id: string;
    title: string;
    type: string;
  };
}

export interface AttendanceStats {
  courseId: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  lateCount: number;
  autoAttendanceCount: number;
  attendanceRate: number;
}

export interface AttendanceSummary {
  courseId: string;
  summary: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    excusedDays: number;
    autoAttendanceDays: number;
    attendanceRate: number;
  };
  recentAttendances: AttendanceRecord[];
}

export interface TodayAttendanceStatus {
  hasAttendanceToday: boolean;
  canAutoSubmit: boolean;
  attendance: AttendanceRecord | null;
}

export interface CreateAttendanceDto {
  studentId: string;
  courseId: string;
  attendanceDate: string;
  status: 'present' | 'absent' | 'excused' | 'late';
  attendanceType: 'manual' | 'video_completion' | 'qr_code' | 'location_based';
  notes?: string;
}

export interface UpdateAttendanceDto {
  status?: 'present' | 'absent' | 'auto_present' | 'excused' | 'late';
  notes?: string;
}

export interface AttendanceQuery {
  courseId?: string;
  studentId?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  attendanceType?: string;
  page?: number;
  limit?: number;
}

export interface AttendanceListResponse {
  data: AttendanceRecord[];
  total: number;
  page: number;
  limit: number;
}

class AttendanceService {
  // Get my attendance for a course (Student)
  async getMyAttendance(courseId: string): Promise<AttendanceRecord[]> {
    try {
      const response = await api.get(`/attendance/my-attendance/course/${courseId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get my attendance:', error);
      throw error;
    }
  }

  // Get student attendance (Lecturer/Admin)
  async getStudentAttendance(studentId: string, courseId: string): Promise<AttendanceRecord[]> {
    try {
      const response = await api.get(`/attendance/student/${studentId}/course/${courseId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get student attendance:', error);
      throw error;
    }
  }

  // Get attendance records with filtering (Lecturer/Admin)
  async getAttendances(query: AttendanceQuery): Promise<AttendanceListResponse> {
    try {
      const params = new URLSearchParams();
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const response = await api.get(`/attendance?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get attendances:', error);
      throw error;
    }
  }

  // Get course attendance statistics (Lecturer/Admin)
  async getCourseStats(courseId: string, startDate?: string, endDate?: string): Promise<AttendanceStats> {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/attendance/course/${courseId}/stats?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get course attendance stats:', error);
      throw error;
    }
  }

  // Check if can auto-submit today (Student)
  async canAutoSubmitToday(courseId: string): Promise<{ canAutoSubmit: boolean }> {
    try {
      const response = await api.get(`/attendance/can-auto-submit/course/${courseId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to check auto-submit eligibility:', error);
      throw error;
    }
  }

  // Get my attendance summary (Student)
  async getMyAttendanceSummary(courseId?: string): Promise<AttendanceSummary> {
    try {
      const params = courseId ? `?courseId=${courseId}` : '';
      const response = await api.get(`/attendance/my-summary${params}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get attendance summary:', error);
      throw error;
    }
  }

  // Get today's attendance status (Student)
  async getTodayAttendanceStatus(courseId: string): Promise<TodayAttendanceStatus> {
    try {
      const response = await api.get(`/attendance/today-status/course/${courseId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get today attendance status:', error);
      throw error;
    }
  }

  // Create manual attendance (Lecturer/Admin)
  async createAttendance(attendanceData: CreateAttendanceDto): Promise<AttendanceRecord> {
    try {
      const response = await api.post(`/attendance`, attendanceData);
      return response.data;
    } catch (error) {
      console.error('Failed to create attendance:', error);
      throw error;
    }
  }

  // Update attendance (Lecturer/Admin)
  async updateAttendance(attendanceId: string, updateData: UpdateAttendanceDto): Promise<AttendanceRecord> {
    try {
      const response = await api.put(`/attendance/${attendanceId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Failed to update attendance:', error);
      throw error;
    }
  }

  // Utility: Format attendance status for display
  formatAttendanceStatus(status: string): { text: string; color: string; icon: string } {
    switch (status) {
      case 'present':
        return { text: 'Hadir', color: 'text-green-600', icon: '✅' };
      case 'auto_present':
        return { text: 'Hadir Otomatis', color: 'text-blue-600', icon: '🤖' };
      case 'late':
        return { text: 'Terlambat', color: 'text-yellow-600', icon: '⏰' };
      case 'excused':
        return { text: 'Izin', color: 'text-gray-600', icon: '📝' };
      case 'absent':
        return { text: 'Tidak Hadir', color: 'text-red-600', icon: '❌' };
      default:
        return { text: status, color: 'text-gray-600', icon: '❓' };
    }
  }

  // Utility: Format attendance type for display
  formatAttendanceType(type: string): { text: string; color: string; icon: string } {
    switch (type) {
      case 'manual':
        return { text: 'Manual', color: 'text-gray-600', icon: '👨‍🏫' };
      case 'video_completion':
        return { text: 'Video Selesai', color: 'text-blue-600', icon: '🎥' };
      case 'qr_code':
        return { text: 'QR Code', color: 'text-purple-600', icon: '📱' };
      case 'location_based':
        return { text: 'Lokasi', color: 'text-green-600', icon: '📍' };
      default:
        return { text: type, color: 'text-gray-600', icon: '❓' };
    }
  }

  // Utility: Calculate attendance rate
  calculateAttendanceRate(present: number, total: number): number {
    return total > 0 ? Math.round((present / total) * 100) : 0;
  }

  // Utility: Get attendance rate color
  getAttendanceRateColor(rate: number): string {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  // Get course attendance by week (Lecturer/Admin)
  async getCourseAttendanceByWeek(
    courseId: string, 
    week?: string, 
    startDate?: string, 
    endDate?: string
  ): Promise<{
    attendancesByWeek: any;
    students: any[];
    weeklyStats: any[];
  }> {
    try {
      const params = new URLSearchParams();
      if (week) params.append('week', week);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await api.get(`/attendance/course/${courseId}/by-week?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get course attendance by week:', error);
      throw error;
    }
  }
}

export const attendanceService = new AttendanceService();
export default attendanceService;
