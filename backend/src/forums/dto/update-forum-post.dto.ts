import { PartialType } from '@nestjs/mapped-types';
import { CreateForumPostDto } from './create-forum-post.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateForumPostDto extends PartialType(CreateForumPostDto) {
  @IsOptional()
  courseId?: string;

  @IsOptional()
  parentId?: string;

  @IsOptional()
  @IsBoolean({ message: 'isPinned harus berupa boolean' })
  isPinned?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'isLocked harus berupa boolean' })
  isLocked?: boolean;
}
