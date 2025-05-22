import { IsOptional, IsString, IsNumber, Min } from 'class-validator';

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
}
