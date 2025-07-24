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
import { AssignmentType } from '../../entities/assignment.entity';
import { UserRole } from '../../entities/user.entity';

export class QueryAssignmentsDto {
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
  @IsEnum(AssignmentType, {
    message: 'Tipe tugas harus salah satu dari: individual, group, quiz, exam',
  })
  type?: AssignmentType;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'isVisible harus berupa boolean' })
  isVisible?: boolean;

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

  // ✅ FIX: Add search parameter for filtering
  @IsOptional()
  @IsString({ message: 'Search harus berupa string' })
  search?: string;

  // ✅ FIX: Add status filter for assignment status
  @IsOptional()
  @IsString({ message: 'Status harus berupa string' })
  status?: string;
}
