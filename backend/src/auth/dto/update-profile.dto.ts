import { IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: 'Nama lengkap harus berupa string' })
  fullName?: string;

  @IsOptional()
  @IsString({ message: 'Nomor telepon harus berupa string' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'Alamat harus berupa string' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Avatar harus berupa string' })
  avatar?: string;
}
