import {
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateGradeDto {
  @IsNotEmpty({ message: 'Nilai wajib diisi' })
  @IsNumber({}, { message: 'Nilai harus berupa angka' })
  @Min(0, { message: 'Nilai minimal 0' })
  @Max(100, { message: 'Nilai maksimal 100' })
  score: number;

  @IsOptional()
  @IsString({ message: 'Feedback harus berupa string' })
  feedback?: string;
}