import { 
  IsEnum, 
  IsOptional, 
  IsUUID, 
  IsDateString, 
  IsString, 
  IsNumber,
  Min,
  Max 
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus, AttendanceType } from '../../entities/attendance.entity';

export class CreateAttendanceDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  courseId: string;

  @IsOptional()
  @IsUUID()
  triggerMaterialId?: string;

  @IsDateString()
  attendanceDate: string; // YYYY-MM-DD format

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @IsEnum(AttendanceType)
  attendanceType: AttendanceType;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  metadata?: {
    videoProgress?: number;
    completionTime?: Date;
    ipAddress?: string;
    userAgent?: string;
  };
}

export class UpdateAttendanceDto {
  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsUUID()
  verifiedBy?: string;
}

export class AttendanceQueryDto {
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsEnum(AttendanceStatus)
  status?: AttendanceStatus;

  @IsOptional()
  @IsEnum(AttendanceType)
  attendanceType?: AttendanceType;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class AutoSubmitAttendanceDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  courseId: string;

  @IsUUID()
  triggerMaterialId: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  completionPercentage: number;

  @IsOptional()
  metadata?: {
    videoProgress?: number;
    completionTime?: Date;
    ipAddress?: string;
    userAgent?: string;
  };
}

export class AttendanceResponseDto {
  id: string;
  studentId: string;
  courseId: string;
  triggerMaterialId: string | null;
  attendanceDate: string;
  status: AttendanceStatus;
  attendanceType: AttendanceType;
  notes: string | null;
  submittedAt: Date | null;
  verifiedBy: string | null;
  verifiedAt: Date | null;
  metadata: any;
  createdAt: Date;
  updatedAt: Date;

  // Include related data
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

export class AttendanceStatsDto {
  courseId: string;
  totalStudents: number;
  presentCount: number;
  absentCount: number;
  excusedCount: number;
  lateCount: number;
  autoAttendanceCount: number;
  attendanceRate: number;
  
  // Breakdown by date
  dailyStats?: {
    date: string;
    present: number;
    absent: number;
    excused: number;
    late: number;
    autoPresent: number;
    rate: number;
  }[];
}
