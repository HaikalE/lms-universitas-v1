import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDate,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AnnouncementPriority } from '../../entities/announcement.entity';

export class CreateAnnouncementDto {
  @IsNotEmpty({ message: 'Judul pengumuman wajib diisi' })
  @IsString({ message: 'Judul pengumuman harus berupa string' })
  title: string;

  @IsNotEmpty({ message: 'Konten pengumuman wajib diisi' })
  @IsString({ message: 'Konten pengumuman harus berupa string' })
  content: string;

  @IsOptional()
  @IsEnum(AnnouncementPriority, {
    message: 'Prioritas harus salah satu dari: low, medium, high, urgent',
  })
  priority?: AnnouncementPriority = AnnouncementPriority.MEDIUM;

  @IsOptional()
  @IsBoolean({ message: 'Status aktif harus berupa boolean' })
  isActive?: boolean = true;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: 'Tanggal kedaluwarsa harus berupa tanggal yang valid' })
  expiresAt?: Date;

  @IsOptional()
  @IsUUID('4', { message: 'Course ID harus berupa UUID yang valid' })
  courseId?: string; // null for global announcements
}
