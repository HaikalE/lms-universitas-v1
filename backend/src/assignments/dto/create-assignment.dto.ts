import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsDate,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsArray,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AssignmentType } from '../../entities/assignment.entity';

export class CreateAssignmentDto {
  @IsNotEmpty({ message: 'Judul tugas wajib diisi' })
  @IsString({ message: 'Judul tugas harus berupa string' })
  title: string;

  @IsNotEmpty({ message: 'Deskripsi tugas wajib diisi' })
  @IsString({ message: 'Deskripsi tugas harus berupa string' })
  description: string;

  @IsEnum(AssignmentType, {
    message: 'Tipe tugas harus salah satu dari: individual, group, quiz, exam',
  })
  type: AssignmentType;

  @IsNotEmpty({ message: 'Tanggal deadline wajib diisi' })
  @Type(() => Date)
  @IsDate({ message: 'Tanggal deadline harus berupa tanggal yang valid' })
  dueDate: Date;

  @IsOptional()
  @IsNumber({}, { message: 'Nilai maksimal harus berupa angka' })
  @Min(1, { message: 'Nilai maksimal minimal 1' })
  @Max(1000, { message: 'Nilai maksimal maksimal 1000' })
  maxScore?: number = 100;

  @IsOptional()
  @IsBoolean({ message: 'Allow late submission harus berupa boolean' })
  allowLateSubmission?: boolean = true;

  @IsOptional()
  @IsNumber({}, { message: 'Late penalty harus berupa angka' })
  @Min(0, { message: 'Late penalty minimal 0' })
  @Max(100, { message: 'Late penalty maksimal 100' })
  latePenaltyPercent?: number = 0;

  @IsOptional()
  @IsArray({ message: 'Allowed file types harus berupa array' })
  @IsString({ each: true, message: 'Setiap file type harus berupa string' })
  allowedFileTypes?: string[] = [];

  @IsOptional()
  @IsNumber({}, { message: 'Ukuran file maksimal harus berupa angka' })
  @Min(1, { message: 'Ukuran file maksimal minimal 1' })
  maxFileSize?: number = 10485760; // 10MB

  @IsOptional()
  @IsBoolean({ message: 'Visibilitas harus berupa boolean' })
  isVisible?: boolean = true;

  @IsNotEmpty({ message: 'Course ID wajib diisi' })
  @IsUUID('4', { message: 'Course ID harus berupa UUID yang valid' })
  courseId: string;
}
