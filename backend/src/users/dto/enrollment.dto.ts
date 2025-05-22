import { IsNotEmpty, IsUUID } from 'class-validator';

export class EnrollmentDto {
  @IsNotEmpty({ message: 'Course ID wajib diisi' })
  @IsUUID('4', { message: 'Course ID harus berupa UUID yang valid' })
  courseId: string;
}
