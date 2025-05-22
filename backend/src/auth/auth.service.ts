import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User, UserRole } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({ 
      where: { email },
      select: ['id', 'email', 'password', 'fullName', 'role', 'isActive']
    });

    if (user && user.isActive && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result as User;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;
    const user = await this.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        studentId: user.studentId,
        lecturerId: user.lecturerId,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const { email, password, fullName, role, studentId, lecturerId } = registerDto;

    // Check if email already exists
    const existingUser = await this.userRepository.findOne({ where: { email } });
    if (existingUser) {
      throw new ConflictException('Email sudah terdaftar');
    }

    // Check student ID uniqueness
    if (studentId) {
      const existingStudent = await this.userRepository.findOne({ where: { studentId } });
      if (existingStudent) {
        throw new ConflictException('NIM sudah terdaftar');
      }
    }

    // Check lecturer ID uniqueness
    if (lecturerId) {
      const existingLecturer = await this.userRepository.findOne({ where: { lecturerId } });
      if (existingLecturer) {
        throw new ConflictException('NIDN sudah terdaftar');
      }
    }

    // Validate role-specific requirements
    if (role === UserRole.STUDENT && !studentId) {
      throw new BadRequestException('NIM wajib diisi untuk mahasiswa');
    }

    if (role === UserRole.LECTURER && !lecturerId) {
      throw new BadRequestException('NIDN wajib diisi untuk dosen');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      email,
      password: hashedPassword,
      fullName,
      role,
      studentId,
      lecturerId,
    });

    const savedUser = await this.userRepository.save(user);

    // Remove password from response
    const { password: _, ...result } = savedUser;
    return result;
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      select: ['id', 'email', 'fullName', 'role', 'studentId', 'lecturerId', 'phone', 'address', 'avatar', 'createdAt']
    });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    return user;
  }

  async updateProfile(userId: string, updateData: Partial<User>) {
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan');
    }

    // Remove sensitive fields that shouldn't be updated via this method
    const { password, role, email, studentId, lecturerId, ...allowedUpdates } = updateData;

    Object.assign(user, allowedUpdates);
    const updatedUser = await this.userRepository.save(user);

    const { password: _, ...result } = updatedUser;
    return result;
  }
}
