import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';

export enum ForumPostType {
  DISCUSSION = 'discussion',
  QUESTION = 'question',
  ANNOUNCEMENT = 'announcement',
}

export class CreateForumPostDto {
  @IsOptional() // ✅ FIXED: Title is optional for replies
  @IsString({ message: 'Judul post harus berupa string' })
  title?: string;

  @IsNotEmpty({ message: 'Konten post wajib diisi' })
  @IsString({ message: 'Konten post harus berupa string' })
  content: string;

  @IsOptional() // ✅ FIXED: CourseId is optional for replies (will inherit from parent)
  @IsUUID('4', { message: 'Course ID harus berupa UUID yang valid' })
  courseId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Parent ID harus berupa UUID yang valid' })
  parentId?: string;

  @IsOptional()
  @IsEnum(ForumPostType, { message: 'Tipe post harus salah satu dari: discussion, question, announcement' })
  type?: ForumPostType;
}