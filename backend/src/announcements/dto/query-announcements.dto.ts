import {
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { AnnouncementPriority } from '../../entities/announcement.entity';
import { UserRole } from '../../entities/user.entity';

export class QueryAnnouncementsDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Page harus berupa angka' })
  @Min(1, { message: 'Page minimal 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Limit harus berupa angka' })
  @Min(1, { message: 'Limit minimal 1' })
  @Max(100, { message: 'Limit maksimal 100' })
  limit?: number = 10;

  @IsOptional()
  @IsUUID('4', { message: 'Course ID harus berupa UUID yang valid' })
  courseId?: string;

  @IsOptional()
  @IsEnum(AnnouncementPriority, {
    message: 'Prioritas harus salah satu dari: low, medium, high, urgent',
  })
  priority?: AnnouncementPriority;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'isActive harus berupa boolean' })
  isActive?: boolean;

  @IsOptional()
  @IsString({ message: 'Search harus berupa string' })
  search?: string;

  @IsOptional()
  @IsString({ message: 'sortBy harus berupa string' })
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString({ message: 'sortOrder harus ASC atau DESC' })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  // ✅ FIX: Add role parameter that frontend sends
  @IsOptional()
  @IsEnum(UserRole, {
    message: 'Role harus salah satu dari: admin, lecturer, student',
  })
  role?: UserRole;

  // ✅ FIX: Add status filter for announcement status  
  @IsOptional()
  @IsString({ message: 'Status harus berupa string' })
  status?: string;
}
