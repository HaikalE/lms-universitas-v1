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
import { ForumPostType } from '../../entities/forum-post.entity';

export class QueryForumPostsDto {
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
  @IsString({ message: 'Search harus berupa string' })
  search?: string;

  @IsOptional()
  @IsEnum(ForumPostType, { message: 'Type harus berupa discussion, question, atau announcement' })
  type?: ForumPostType | 'all';

  @IsOptional()
  @IsString({ message: 'Parent ID harus berupa string' })
  parentId?: string | null;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  @IsBoolean({ message: 'isPinned harus berupa boolean' })
  isPinned?: boolean;

  // ✅ FIX: Add sort parameter to accept frontend format (sort=latest)
  @IsOptional()
  @IsString({ message: 'Sort harus berupa string' })
  sort?: string;

  @IsOptional()
  @IsString({ message: 'sortBy harus berupa string' })
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString({ message: 'sortOrder harus ASC atau DESC' })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  // ✅ Helper method to get sortBy from sort parameter
  getSortBy(): string {
    if (this.sortBy) return this.sortBy;
    
    switch (this.sort) {
      case 'latest':
        return 'createdAt';
      case 'oldest':
        return 'createdAt';
      case 'popular':
        return 'likesCount';
      case 'replies':
        return 'repliesCount';
      default:
        return 'createdAt';
    }
  }

  // ✅ Helper method to get sortOrder from sort parameter
  getSortOrder(): 'ASC' | 'DESC' {
    if (this.sortOrder) return this.sortOrder;
    
    switch (this.sort) {
      case 'latest':
        return 'DESC';
      case 'oldest':
        return 'ASC';
      case 'popular':
        return 'DESC';
      case 'replies':
        return 'DESC';
      default:
        return 'DESC';
    }
  }
}
