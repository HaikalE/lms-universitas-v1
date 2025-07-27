import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Course } from './course.entity';
import { CourseMaterial } from './course-material.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  AUTO_PRESENT = 'auto_present', // triggered by video completion
  EXCUSED = 'excused', // izin/sakit
  LATE = 'late',
}

export enum AttendanceType {
  MANUAL = 'manual',
  VIDEO_COMPLETION = 'video_completion',
  QR_CODE = 'qr_code',
  LOCATION_BASED = 'location_based',
}

@Entity('attendances')
@Index(['studentId', 'courseId', 'attendanceDate']) // Optimize attendance queries
@Index(['courseId', 'attendanceDate']) // For course attendance reports
@Index(['studentId', 'courseId', 'week']) // 🔥 NEW: Weekly attendance optimization
@Index(['courseId', 'week']) // 🔥 NEW: Course weekly reports
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  student: User;

  @Column()
  studentId: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  course: Course;

  @Column()
  courseId: string;

  @ManyToOne(() => CourseMaterial, { nullable: true, onDelete: 'SET NULL' })
  triggerMaterial: CourseMaterial; // video yang trigger absensi

  @Column({ nullable: true })
  triggerMaterialId: string;

  @Column({ type: 'date' })
  attendanceDate: Date; // tanggal absensi (YYYY-MM-DD)

  // 🔥 NEW: Track week number for weekly attendance system
  @Column({ nullable: true })
  week: number; // minggu ke berapa (1-16)

  @Column({
    type: 'enum',
    enum: AttendanceStatus,
    default: AttendanceStatus.PRESENT,
  })
  status: AttendanceStatus;

  @Column({
    type: 'enum',
    enum: AttendanceType,
    default: AttendanceType.MANUAL,
  })
  attendanceType: AttendanceType;

  @Column({ type: 'text', nullable: true })
  notes: string; // catatan tambahan (alasan izin, dll)

  @Column({ nullable: true })
  submittedAt: Date; // kapan absensi disubmit

  @Column({ nullable: true })
  verifiedBy: string; // ID dosen/admin yang verifikasi (untuk manual attendance)

  @Column({ nullable: true })
  verifiedAt: Date;

  @Column({ type: 'json', nullable: true })
  metadata: { // data tambahan untuk analytics
    videoProgress?: number;
    completionTime?: Date;
    ipAddress?: string;
    userAgent?: string;
    weekNumber?: number; // 🔥 ENHANCED: Backup week tracking in metadata
    weeklyCompletion?: boolean; // 🔥 NEW: Flag for weekly completion
    weeklyCompletionDetails?: {
      totalRequired: number;
      completedCount: number;
      weeklyCompletionRate: number;
      completedVideos: any[];
    };
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
