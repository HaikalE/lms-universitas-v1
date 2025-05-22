import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsUUID,
  IsObject,
} from 'class-validator';
import { NotificationType } from '../../entities/notification.entity';

export class CreateNotificationDto {
  @IsNotEmpty({ message: 'Judul notifikasi wajib diisi' })
  @IsString({ message: 'Judul notifikasi harus berupa string' })
  title: string;

  @IsNotEmpty({ message: 'Pesan notifikasi wajib diisi' })
  @IsString({ message: 'Pesan notifikasi harus berupa string' })
  message: string;

  @IsEnum(NotificationType, {
    message: 'Tipe notifikasi harus salah satu dari: assignment_new, assignment_due, assignment_graded, announcement, forum_reply, course_enrollment, general',
  })
  type: NotificationType;

  @IsNotEmpty({ message: 'User ID wajib diisi' })
  @IsUUID('4', { message: 'User ID harus berupa UUID yang valid' })
  userId: string;

  @IsOptional()
  @IsObject({ message: 'Metadata harus berupa object' })
  metadata?: any;
}
