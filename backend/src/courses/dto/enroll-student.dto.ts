import { IsString, IsUUID, IsArray, IsOptional, IsEmail } from 'class-validator';

export class EnrollStudentDto {
  @IsUUID()
  studentId: string;
}

export class EnrollMultipleStudentsDto {
  @IsArray()
  @IsUUID(undefined, { each: true })
  studentIds: string[];
}

export class QueryCourseStudentsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  sortBy?: 'fullName' | 'studentId' | 'enrolledAt';

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}

export class AddStudentByEmailDto {
  @IsEmail()
  email: string;
}
