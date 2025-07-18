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

  @IsOptional()
  @IsString({ message: 'sortBy harus berupa string' })
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString({ message: 'sortOrder harus ASC atau DESC' })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
