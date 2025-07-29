import React, { useState, useEffect } from 'react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  AcademicCapIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Student {
  id: string;
  fullName: string;
  studentId: string;
  email: string;
}

interface AttendanceRecord {
  id: string;
  studentId: string;
  courseId: string;
  attendanceDate: string;
  week: number;
  status: string;
  attendanceType: string;
  notes: string;
  submittedAt: string;
  student: Student;
}

interface WeeklyStats {
  week: number;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  autoAttendanceCount: number;
  attendanceRate: number;
}

interface AttendanceData {
  attendancesByWeek: Record<string, AttendanceRecord[]>;
  students: Student[];
  weeklyStats: WeeklyStats[];
}

interface ImprovedAttendanceInterfaceProps {
  courseId: string;
  attendanceData?: AttendanceData;
  currentWeek?: number;
  isLecturer?: boolean;
}

// Default mock data
const defaultAttendanceData: AttendanceData = {
  attendancesByWeek: {
    "9": [
      {
        "id": "a5f6ae62-b0d7-4fe0-ad66-88f3c9bfe537",
        "studentId": "36515d7c-394d-4570-aaf1-9c1abc9a4618",
        "courseId": "2024ece7-edc2-4f75-bdd2-e605512f4ac7",
        "attendanceDate": "2025-07-27",
        "week": 9,
        "status": "auto_present",
        "attendanceType": "video_completion",
        "notes": "Auto-submitted via video completion (100.0%)",
        "submittedAt": "2025-07-27T03:22:34.958Z",
        "student": {
          "id": "36515d7c-394d-4570-aaf1-9c1abc9a4618",
          "fullName": "Jane Student",
          "studentId": "STD001",
          "email": "student@lms.com"
        }
      }
    ]
  },
  students: [
    {
      "id": "36515d7c-394d-4570-aaf1-9c1abc9a4618",
      "fullName": "Jane Student",
      "studentId": "STD001",
      "email": "student@lms.com"
    },
    {
      "id": "407bbc2d-3f5a-4314-ab68-26cdfcf15192",
      "fullName": "Munir",
      "studentId": "12345",
      "email": "munir@munir.com"
    }
  ],
  weeklyStats: [
    {
      "week": 9,
      "totalStudents": 2,
      "presentCount": 1,
      "absentCount": 1,
      "autoAttendanceCount": 1,
      "attendanceRate": 50
    }
  ]
};

const ImprovedAttendanceInterface: React.FC<ImprovedAttendanceInterfaceProps> = ({
  courseId,
  attendanceData = defaultAttendanceData,
  currentWeek = 9,
  isLecturer = true
}) => {
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  // Get current week's data with proper error handling
  const getCurrentWeekData = (): WeeklyStats => {
    const weekData = attendanceData.weeklyStats.find(w => w.week === selectedWeek);
    if (weekData) return weekData;

    // If no data found, calculate from attendance records
    const weekAttendances = attendanceData.attendancesByWeek[selectedWeek.toString()] || [];
    const presentCount = weekAttendances.length;
    const totalStudents = attendanceData.students.length;
    const absentCount = totalStudents - presentCount;
    const autoAttendanceCount = weekAttendances.filter(a => a.status === 'auto_present').length;
    const attendanceRate = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

    return {
      week: selectedWeek,
      totalStudents,
      presentCount,
      absentCount,
      autoAttendanceCount,
      attendanceRate
    };
  };

  const currentWeekData = getCurrentWeekData();
  const currentAttendances = attendanceData.attendancesByWeek[selectedWeek.toString()] || [];
  
  // Determine which students are present vs absent
  const presentStudentIds = new Set(currentAttendances.map(a => a.studentId));
  const presentStudents = attendanceData.students.filter(s => presentStudentIds.has(s.id));
  const absentStudents = attendanceData.students.filter(s => !presentStudentIds.has(s.id));

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Here you would call actual API to refresh data
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    if (direction === 'prev' && selectedWeek > 1) {
      setSelectedWeek(selectedWeek - 1);
    } else if (direction === 'next' && selectedWeek < 16) {
      setSelectedWeek(selectedWeek + 1);
    }
  };

  const getAttendanceStatusColor = (rate: number): string => {
    if (rate >= 80) return 'text-green-700 bg-green-100 border-green-300';
    if (rate >= 60) return 'text-yellow-700 bg-yellow-100 border-yellow-300';
    return 'text-red-700 bg-red-100 border-red-300';
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Tanggal tidak valid';
      
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date);
    } catch {
      return 'Tanggal tidak valid';
    }
  };

  const formatTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '--:--';
      
      return new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
      }).format(date);
    } catch {
      return '--:--';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'auto_present':
      case 'present':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'absent':
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (status: string, type: string) => {
    switch (status) {
      case 'auto_present':
        return `Hadir Otomatis (${type === 'video_completion' ? 'Video' : 'Manual'})`;
      case 'present':
        return 'Hadir Manual';
      case 'absent':
        return 'Tidak Hadir';
      default:
        return 'Status Tidak Diketahui';
    }
  };

  // Get current date for the selected week (assuming week starts on Monday)
  const getWeekDate = (): string => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(today);
    monday.setDate(today.getDate() + daysToMonday + (selectedWeek - 1) * 7);
    
    return formatDate(monday.toISOString());
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <AcademicCapIcon className="w-7 h-7 text-blue-600" />
              Data Absensi Mahasiswa
            </h1>
            <p className="text-gray-600 mt-1">
              {attendanceData.students.length} mahasiswa terdaftar
            </p>
          </div>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowPathIcon className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Memuat...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateWeek('prev')}
            disabled={selectedWeek <= 1}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">Minggu {selectedWeek}</div>
            <div className="text-sm text-gray-600 mt-1 flex items-center gap-1 justify-center">
              <CalendarIcon className="w-4 h-4" />
              {getWeekDate()}
            </div>
          </div>
          
          <button
            onClick={() => navigateWeek('next')}
            disabled={selectedWeek >= 16}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Statistics Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Statistik Kehadiran Minggu {selectedWeek}
          </h2>
          <div className={`px-4 py-2 rounded-full border font-bold text-lg ${getAttendanceStatusColor(currentWeekData.attendanceRate)}`}>
            {currentWeekData.attendanceRate}%
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text