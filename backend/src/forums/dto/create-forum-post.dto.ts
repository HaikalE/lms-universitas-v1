import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsArray,
  IsBoolean,
  MaxLength,
  MinLength,
  ArrayMaxSize,
  ValidateIf,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PostCategory } from '../../entities/forum-post.entity';

export class CreateForumPostDto {
  @IsNotEmpty({ message: 'Judul post wajib diisi' })
  @IsString({ message: 'Judul post harus berupa string' })
  @MinLength(5, { message: 'Judul minimal 5 karakter' })
  @MaxLength(200, { message: 'Judul maksimal 200 karakter' })
  @Transform(({ value }) => value?.trim())
  title: string;

  @IsNotEmpty({ message: 'Konten post wajib diisi' })
  @IsString({ message: 'Konten post harus berupa string' })
  @MinLength(10, { message: 'Konten minimal 10 karakter' })
  @MaxLength(10000, { message: 'Konten maksimal 10.000 karakter' })
  @Transform(({ value }) => value?.trim())
  content: string;

  @IsNotEmpty({ message: 'Course ID wajib diisi' })
  @IsUUID('4', { message: 'Course ID harus berupa UUID yang valid' })
  courseId: string;

  @IsOptional()
  @IsUUID('4', { message: 'Parent ID harus berupa UUID yang valid' })
  parentId?: string;

  @IsOptional()
  @IsEnum(PostCategory, { message: 'Kategori post tidak valid' })
  category?: PostCategory = PostCategory.GENERAL;

  @IsOptional()
  @IsArray({ message: 'Tags harus berupa array' })
  @IsString({ each: true, message: 'Setiap tag harus berupa string' })
  @ArrayMaxSize(5, { message: 'Maksimal 5 tags' })
  @Transform(({ value }) => 
    value?.map((tag: string) => tag.trim().toLowerCase().replace(/[^a-z0-9]/g, '')) || []
  )
  tags?: string[] = [];

  @IsOptional()
  @IsBoolean({ message: 'isAnnouncement harus berupa boolean' })
  isAnnouncement?: boolean = false;

  @IsOptional()
  @IsArray({ message: 'Attachments harus berupa array' })
  @ArrayMaxSize(5, { message: 'Maksimal 5 file attachment' })
  attachments?: string[] = [];
}
