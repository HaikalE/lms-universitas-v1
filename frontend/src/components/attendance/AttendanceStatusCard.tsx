import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import attendanceService, { AttendanceRecord, AttendanceSummary, TodayAttendanceStatus } from '../../services/attendanceService';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface AttendanceStatusCardProps {
  courseId: string;
  className?: string;
  showDetailedStats?: boolean;
}

const AttendanceStatusCard: React.FC<AttendanceStatusCardProps> = ({
  courseId,
  className = '',
  showDetailedStats = false,
}) => {
  const { user } = useAuth();
  const [todayStatus, setTodayStatus] = useState<TodayAttendanceStatus | null>(null);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!user || user.role !== 'student') {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch today's status
        const status = await attendanceService.getTodayAttendanceStatus(courseId);
        setTodayStatus(status);

        // Fetch summary if detailed stats requested
        if (showDetailedStats) {
          const summaryData = await attendanceService.getMyAttendanceSummary(courseId);
          setSummary(summaryData);
        }

      } catch (err) {
        console.error('Failed to fetch attendance data:', err);
        setError('Failed to load attendance data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceData();
  }, [courseId, user, showDetailedStats]);

  if (!user || user.role !== 'student') {
    return null;
  }

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800 text-sm">{error}</span>
        </div>
      </div>
    );
  }

  const formatAttendanceStatus = (status: string) => {
    const formatted = attendanceService.formatAttendanceStatus(status);
    return formatted;
  };

  const formatAttendanceType = (type: string) => {
    const formatted = attendanceService.formatAttendanceType(type);
    return formatted;
  };

  const getTodayStatusInfo = () => {
    if (!todayStatus) return null;

    if (todayStatus.hasAttendanceToday && todayStatus.attendance) {
      const status = formatAttendanceStatus(todayStatus.attendance.status);
      const type = formatAttendanceType(todayStatus.attendance.attendanceType);
      
      return {
        icon: status.icon,
        title: `${status.text} - ${type.text}`,
        description: todayStatus.attendance.notes || 'Absensi tercatat untuk hari ini',
        color: status.color,
        bgColor: todayStatus.attendance.status === 'auto_present' ? 'bg-blue-50' : 'bg-green-50',
        borderColor: todayStatus.attendance.status === 'auto_present' ? 'border-blue-200' : 'border-green-200',
        showTime: true,
        time: todayStatus.attendance.submittedAt,
      };
    }

    if (todayStatus.canAutoSubmit) {
      return {
        icon: '⏳',
        title: 'Belum Absen Hari Ini',
        description: 'Tonton video pembelajaran sampai selesai untuk absensi otomatis',
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        showTime: false,
      };
    }

    return {
      icon: '❌',
      title: 'Tidak Hadir',
      description: 'Tidak ada catatan absensi untuk hari ini',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      showTime: false,
    };
  };

  const todayInfo = getTodayStatusInfo();
  const attendanceRate = summary ? 
    attendanceService.calculateAttendanceRate(summary.summary.presentDays, summary.summary.totalDays) : 0;

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Today's Status */}
      {todayInfo && (
        <div className={`${todayInfo.bgColor} border ${todayInfo.borderColor} rounded-t-lg p-4`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <div className="text-2xl mt-1">{todayInfo.icon}</div>
              <div className="flex-1">
                <h3 className={`font-semibold ${todayInfo.color}`}>
                  {todayInfo.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {todayInfo.description}
                </p>
                {todayInfo.showTime && todayInfo.time && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center">
                    <ClockIcon className="w-3 h-3 mr-1" />
                    {new Date(todayInfo.time).toLocaleTimeString('id-ID')}
                  </p>
                )}
              </div>
            </div>
            <div className="text-right">
              <CalendarDaysIcon className={`w-6 h-6 ${todayInfo.color}`} />
            </div>
          </div>
        </div>
      )}

      {/* Detailed Statistics */}
      {showDetailedStats && summary && (
        <div className="p-4 border-t">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900 flex items-center">
              <ChartBarIcon className="w-4 h-4 mr-2" />
              Statistik Kehadiran
            </h4>
            <div className={`text-xl font-bold ${attendanceService.getAttendanceRateColor(attendanceRate)}`}>
              {attendanceRate}%
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="text-center p-3 bg-gray-50 rounded">
              <div className="text-lg font-semibold text-gray-900">
                {summary.summary.totalDays}
              </div>
              <div className="text-xs text-gray-600">Total Hari</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-lg font-semibold text-green-600">
                {summary.summary.presentDays}
              </div>
              <div className="text-xs text-gray-600">Hadir</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-lg font-semibold text-blue-600">
                {summary.summary.autoAttendanceDays}
              </div>
              <div className="text-xs text-gray-600">Auto</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="text-lg font-semibold text-red-600">
                {summary.summary.absentDays}
              </div>
              <div className="text-xs text-gray-600">Absent</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                attendanceRate >= 80 ? 'bg-green-500' : 
                attendanceRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center">
            Tingkat kehadiran: {attendanceRate}%
            {attendanceRate >= 80 ? ' (Excellent! 🎉)' : 
             attendanceRate >= 60 ? ' (Good 👍)' : ' (Needs improvement 📈)'}
          </p>
        </div>
      )}

      {/* Recent Attendance */}
      {showDetailedStats && summary?.recentAttendances && summary.recentAttendances.length > 0 && (
        <div className="p-4 border-t bg-gray-50 rounded-b-lg">
          <h5 className="font-medium text-gray-900 mb-3 text-sm">Riwayat Terbaru</h5>
          <div className="space-y-2">
            {summary.recentAttendances.slice(0, 3).map((record) => {
              const status = formatAttendanceStatus(record.status);
              const type = formatAttendanceType(record.attendanceType);
              
              return (
                <div key={record.id} className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{status.icon}</span>
                    <div>
                      <div className="text-sm text-gray-900">
                        {new Date(record.attendanceDate).toLocaleDateString('id-ID')}
                      </div>
                      <div className="text-xs text-gray-500">{type.text}</div>
                    </div>
                  </div>
                  <div className={`text-xs font-medium ${status.color}`}>
                    {status.text}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceStatusCard;
