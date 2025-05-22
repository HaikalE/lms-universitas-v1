import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class CreateForumPostDto {
  @IsNotEmpty({ message: 'Judul post wajib diisi' })
  @IsString({ message: 'Judul post harus berupa string' })
  title: string;

  @IsNotEmpty({ message: 'Konten post wajib diisi' })
  @IsString({ message: 'Konten post harus berupa string' })
  content: string;

  @IsNotEmpty({ message: 'Course ID wajib diisi' })
  @IsUUID('4', { message: 'Course ID harus berupa UUID yang valid' })
  courseId: string;

  @IsOptional()
  @IsUUID('4', { message: 'Parent ID harus berupa UUID yang valid' })
  parentId?: string;
}
