import {
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsArray,
  IsInt,
  Min,
  Max,
  Transform,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PostCategory } from '../../entities/forum-post.entity';

export class QueryForumPostsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page harus berupa angka' })
  @Min(1, { message: 'Page minimal 1' })
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit harus berupa angka' })
  @Min(1, { message: 'Limit minimal 1' })
  @Max(100, { message: 'Limit maksimal 100' })
  limit?: number = 10;

  @IsOptional()
  @IsString({ message: 'Search harus berupa string' })
  @Transform(({ value }) => value?.trim())
  search?: string;

  @IsOptional()
  @IsEnum(PostCategory, { message: 'Kategori tidak valid' })
  category?: PostCategory;

  @IsOptional()
  @IsArray({ message: 'Tags harus berupa array' })
  @IsString({ each: true, message: 'Setiap tag harus berupa string' })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.split(',').map(tag => tag.trim().toLowerCase());
    }
    return value;
  })
  tags?: string[];

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean({ message: 'isPinned harus berupa boolean' })
  isPinned?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean({ message: 'isAnnouncement harus berupa boolean' })
  isAnnouncement?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean({ message: 'hasAttachments harus berupa boolean' })
  hasAttachments?: boolean;

  @IsOptional()
  @IsString({ message: 'SortBy harus berupa string' })
  @Transform(({ value }) => value?.toLowerCase())
  sortBy?: 'createdAt' | 'updatedAt' | 'likesCount' | 'viewCount' | 'replyCount' | 'lastActivityAt' = 'createdAt';

  @IsOptional()
  @IsString({ message: 'SortOrder harus berupa string' })
  @Transform(({ value }) => value?.toUpperCase())
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @IsOptional()
  @IsString({ message: 'AuthorId harus berupa string' })
  authorId?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean({ message: 'onlyQuestions harus berupa boolean' })
  onlyQuestions?: boolean;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean({ message: 'unanswered harus berupa boolean' })
  unanswered?: boolean;
}
