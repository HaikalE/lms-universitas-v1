import { IsNumber, IsOptional, IsUUID, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateVideoProgressDto {
  @IsUUID()
  materialId: string;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  currentTime: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  totalDuration?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(100)
  @IsOptional()
  watchedPercentage?: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  watchedSeconds?: number;

  @IsOptional()
  watchSession?: {
    startTime: number;
    endTime: number;
    duration: number;
  };
}

export class VideoProgressQueryDto {
  @IsOptional()
  @IsUUID()
  courseId?: string;

  @IsOptional()
  @IsUUID()
  materialId?: string;

  @IsOptional()
  @Type(() => Boolean)
  completedOnly?: boolean;
}

export class VideoProgressResponseDto {
  id: string;
  materialId: string;
  currentTime: number;
  totalDuration: number;
  watchedPercentage: number;
  watchedSeconds: number;
  isCompleted: boolean;
  completedAt: Date | null;
  hasTriggeredAttendance: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Include material info
  material?: {
    id: string;
    title: string;
    type: string;
    isAttendanceTrigger: boolean;
    attendanceThreshold: number | null;
  };
}
