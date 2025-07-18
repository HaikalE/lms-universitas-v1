import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  ValidateIf,
  IsBoolean,
} from 'class-validator';
import { UserRole } from '../../entities/user.entity';

export class CreateUserDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email wajib diisi' })
  email: string;

  @IsString({ message: 'Password harus berupa string' })
  @IsNotEmpty({ message: 'Password wajib diisi' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;

  @IsString({ message: 'Nama lengkap harus berupa string' })
  @IsNotEmpty({ message: 'Nama lengkap wajib diisi' })
  fullName: string;

  @IsEnum(UserRole, { message: 'Role harus salah satu dari: admin, lecturer, student' })
  role: UserRole;

  @ValidateIf((o) => o.role === UserRole.STUDENT)
  @IsNotEmpty({ message: 'NIM wajib diisi untuk mahasiswa' })
  @IsString({ message: 'NIM harus berupa string' })
  studentId?: string;

  @ValidateIf((o) => o.role === UserRole.LECTURER)
  @IsNotEmpty({ message: 'NIDN wajib diisi untuk dosen' })
  @IsString({ message: 'NIDN harus berupa string' })
  lecturerId?: string;

  @IsOptional()
  @IsString({ message: 'ID Karyawan harus berupa string' })
  employeeId?: string;

  @IsOptional()
  @IsString({ message: 'Nomor telepon harus berupa string' })
  phone?: string;

  @IsOptional()
  @IsString({ message: 'Alamat harus berupa string' })
  address?: string;

  @IsOptional()
  @IsString({ message: 'Avatar harus berupa string' })
  avatar?: string;

  @IsOptional()
  @IsString({ message: 'Bio harus berupa string' })
  bio?: string;

  @IsOptional()
  @IsBoolean({ message: 'Status aktif harus berupa boolean' })
  isActive?: boolean;
}
