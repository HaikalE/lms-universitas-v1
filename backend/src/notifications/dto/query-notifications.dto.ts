import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { NotificationType } from '../../entities/notification.entity';

export class QueryNotificationsDto {
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
  @IsEnum(NotificationType, {
    message: 'Tipe notifikasi harus salah satu dari: assignment, announcement, forum, course',
  })
  type?: NotificationType;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'isRead harus berupa boolean' })
  isRead?: boolean;

  @IsOptional()
  @IsString({ message: 'sortBy harus berupa string' })
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString({ message: 'sortOrder harus ASC atau DESC' })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
