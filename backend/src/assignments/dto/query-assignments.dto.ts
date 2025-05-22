import {
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsUUID,
  Transform,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssignmentType } from '../../entities/assignment.entity';

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
}
