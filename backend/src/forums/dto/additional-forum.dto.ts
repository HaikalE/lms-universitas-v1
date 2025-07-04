import { IsOptional, IsString, IsEnum, IsBoolean, IsArray, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { PostCategory } from '../../entities/forum-post.entity';

export class UpdateForumPostDto {
  @IsOptional()
  @IsString({ message: 'Judul post harus berupa string' })
  @MinLength(5, { message: 'Judul minimal 5 karakter' })
  @MaxLength(200, { message: 'Judul maksimal 200 karakter' })
  @Transform(({ value }) => value?.trim())
  title?: string;

  @IsOptional()
  @IsString({ message: 'Konten post harus berupa string' })
  @MinLength(10, { message: 'Konten minimal 10 karakter' })
  @MaxLength(10000, { message: 'Konten maksimal 10.000 karakter' })
  @Transform(({ value }) => value?.trim())
  content?: string;

  @IsOptional()
  @IsEnum(PostCategory, { message: 'Kategori post tidak valid' })
  category?: PostCategory;

  @IsOptional()
  @IsArray({ message: 'Tags harus berupa array' })
  @IsString({ each: true, message: 'Setiap tag harus berupa string' })
  @Transform(({ value }) => 
    value?.map((tag: string) => tag.trim().toLowerCase().replace(/[^a-z0-9]/g, '')) || []
  )
  tags?: string[];

  @IsOptional()
  @IsBoolean({ message: 'isPinned harus berupa boolean' })
  isPinned?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'isLocked harus berupa boolean' })
  isLocked?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'isAnnouncement harus berupa boolean' })
  isAnnouncement?: boolean;
}

// ============================================
// DTO for marking best answer
// ============================================
export class MarkBestAnswerDto {
  @IsString({ message: 'Reply ID harus berupa string' })
  replyId: string;
}

// ============================================
// DTO for forum analytics
// ============================================
export class ForumAnalyticsDto {
  @IsOptional()
  @IsString({ message: 'Start date harus berupa string' })
  startDate?: string;

  @IsOptional()
  @IsString({ message: 'End date harus berupa string' })
  endDate?: string;

  @IsOptional()
  @IsEnum(PostCategory, { message: 'Kategori tidak valid' })
  category?: PostCategory;
}

// ============================================
// DTO for attachment upload
// ============================================
export class UploadAttachmentDto {
  @IsString({ message: 'Post ID wajib diisi' })
  postId: string;

  @IsString({ message: 'Filename wajib diisi' })
  filename: string;

  @IsString({ message: 'Original name wajib diisi' })
  originalName: string;
}
