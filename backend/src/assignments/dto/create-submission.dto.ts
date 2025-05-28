import { IsOptional, IsString, IsNumber, Min, IsEnum } from 'class-validator';
import { SubmissionStatus } from '../../entities/submission.entity';

export class CreateSubmissionDto {
  @IsOptional()
  @IsString({ message: 'Konten submission harus berupa string' })
  content?: string;

  @IsOptional()
  @IsString({ message: 'Nama file harus berupa string' })
  fileName?: string;

  @IsOptional()
  @IsString({ message: 'Path file harus berupa string' })
  filePath?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Ukuran file harus berupa angka' })
  @Min(0, { message: 'Ukuran file tidak boleh negatif' })
  fileSize?: number;

  @IsOptional()
  @IsEnum(SubmissionStatus, { message: 'Status submission tidak valid' })
  status?: SubmissionStatus;
}
