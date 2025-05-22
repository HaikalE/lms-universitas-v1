import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  IsBoolean,
  IsUrl,
  ValidateIf,
} from 'class-validator';
import { MaterialType } from '../../entities/course-material.entity';

export class CreateCourseMaterialDto {
  @IsNotEmpty({ message: 'Judul materi wajib diisi' })
  @IsString({ message: 'Judul materi harus berupa string' })
  title: string;

  @IsOptional()
  @IsString({ message: 'Deskripsi harus berupa string' })
  description?: string;

  @IsEnum(MaterialType, {
    message: 'Tipe materi harus salah satu dari: pdf, video, document, presentation, link',
  })
  type: MaterialType;

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

  @ValidateIf((o) => o.type === MaterialType.LINK)
  @IsNotEmpty({ message: 'URL wajib diisi untuk tipe link' })
  @IsUrl({}, { message: 'URL harus valid' })
  url?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Minggu harus berupa angka' })
  @Min(1, { message: 'Minggu minimal 1' })
  week?: number = 1;

  @IsOptional()
  @IsNumber({}, { message: 'Urutan harus berupa angka' })
  @Min(1, { message: 'Urutan minimal 1' })
  orderIndex?: number = 1;

  @IsOptional()
  @IsBoolean({ message: 'Visibilitas harus berupa boolean' })
  isVisible?: boolean = true;
}
