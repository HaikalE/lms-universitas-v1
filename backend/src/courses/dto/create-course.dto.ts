import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  Max,
  IsUUID,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateCourseDto {
  @IsNotEmpty({ message: 'Kode mata kuliah wajib diisi' })
  @IsString({ message: 'Kode mata kuliah harus berupa string' })
  code: string;

  @IsNotEmpty({ message: 'Nama mata kuliah wajib diisi' })
  @IsString({ message: 'Nama mata kuliah harus berupa string' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Deskripsi harus berupa string' })
  description?: string;

  @IsNumber({}, { message: 'SKS harus berupa angka' })
  @Min(1, { message: 'SKS minimal 1' })
  @Max(6, { message: 'SKS maksimal 6' })
  credits: number;

  @IsNotEmpty({ message: 'Semester wajib diisi' })
  @IsString({ message: 'Semester harus berupa string' })
  semester: string;

  @IsNotEmpty({ message: 'ID dosen wajib diisi. Silakan pilih dosen pengampu dari dropdown.' })
  @IsUUID('4', { message: 'ID dosen tidak valid. Silakan pilih dosen dari dropdown yang tersedia.' })
  lecturerId: string;

  @IsOptional()
  @IsBoolean({ message: 'Status aktif harus berupa boolean' })
  isActive?: boolean;
}