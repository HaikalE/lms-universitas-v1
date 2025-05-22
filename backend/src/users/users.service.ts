import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User, UserRole } from '../entities/user.entity';
import { Course } from '../entities/course.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUsersDto } from './dto/query-users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password, studentId, lecturerId, role } = createUserDto;

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

    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    
    // Remove password from response
    const { password: _, ...result } = savedUser;
    return result;
  }

  async findAll(queryDto: QueryUsersDto) {
    const {
      page = 1,
      limit = 10,
      role,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.fullName',
        'user.role',
        'user.studentId',
        'user.lecturerId',
        'user.phone',
        'user.isActive',
        'user.createdAt',
      ]);

    // Apply filters
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (typeof isActive === 'boolean') {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.fullName ILIKE :search OR user.email ILIKE :search OR user.studentId ILIKE :search OR user.lecturerId ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply sorting
    queryBuilder.orderBy(`user.${sortBy}`, sortOrder);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [users, total] = await queryBuilder.getManyAndCount();

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'fullName',
        'role',
        'studentId',
        'lecturerId',
        'phone',
        'address',
        'avatar',
        'isActive',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const { email, studentId, lecturerId, password } = updateUserDto;

    // Check email uniqueness if being updated
    if (email && email !== user.email) {
      const existingUser = await this.userRepository.findOne({ where: { email } });
      if (existingUser) {
        throw new ConflictException('Email sudah terdaftar');
      }
    }

    // Check student ID uniqueness if being updated
    if (studentId && studentId !== user.studentId) {
      const existingStudent = await this.userRepository.findOne({ where: { studentId } });
      if (existingStudent) {
        throw new ConflictException('NIM sudah terdaftar');
      }
    }

    // Check lecturer ID uniqueness if being updated
    if (lecturerId && lecturerId !== user.lecturerId) {
      const existingLecturer = await this.userRepository.findOne({ where: { lecturerId } });
      if (existingLecturer) {
        throw new ConflictException('NIDN sudah terdaftar');
      }
    }

    // Hash new password if provided
    let hashedPassword: string;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    // Update user
    Object.assign(user, {
      ...updateUserDto,
      ...(password && { password: hashedPassword }),
    });

    const updatedUser = await this.userRepository.save(user);
    
    // Remove password from response
    const { password: _, ...result } = updatedUser;
    return result;
  }

  async remove(id: string) {
    const user = await this.userRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Soft delete by deactivating instead of removing
    user.isActive = false;
    await this.userRepository.save(user);

    return { message: 'User berhasil dinonaktifkan' };
  }

  async enrollStudentToCourse(studentId: string, courseId: string) {
    const student = await this.userRepository.findOne({
      where: { id: studentId, role: UserRole.STUDENT },
    });

    if (!student) {
      throw new NotFoundException('Mahasiswa tidak ditemukan');
    }

    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['students'],
    });

    if (!course) {
      throw new NotFoundException('Mata kuliah tidak ditemukan');
    }

    // Check if already enrolled
    const isEnrolled = course.students.some((s) => s.id === studentId);
    if (isEnrolled) {
      throw new ConflictException('Mahasiswa sudah terdaftar di mata kuliah ini');
    }

    course.students.push(student);
    await this.courseRepository.save(course);

    return { message: 'Mahasiswa berhasil didaftarkan ke mata kuliah' };
  }

  async unenrollStudentFromCourse(studentId: string, courseId: string) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['students'],
    });

    if (!course) {
      throw new NotFoundException('Mata kuliah tidak ditemukan');
    }

    const studentIndex = course.students.findIndex((s) => s.id === studentId);
    if (studentIndex === -1) {
      throw new NotFoundException('Mahasiswa tidak terdaftar di mata kuliah ini');
    }

    course.students.splice(studentIndex, 1);
    await this.courseRepository.save(course);

    return { message: 'Mahasiswa berhasil dibatalkan dari mata kuliah' };
  }

  async getStudentCourses(studentId: string) {
    const student = await this.userRepository.findOne({
      where: { id: studentId, role: UserRole.STUDENT },
      relations: ['coursesAsStudent', 'coursesAsStudent.lecturer'],
    });

    if (!student) {
      throw new NotFoundException('Mahasiswa tidak ditemukan');
    }

    return student.coursesAsStudent.map((course) => ({
      id: course.id,
      code: course.code,
      name: course.name,
      credits: course.credits,
      semester: course.semester,
      lecturer: {
        id: course.lecturer.id,
        fullName: course.lecturer.fullName,
        lecturerId: course.lecturer.lecturerId,
      },
    }));
  }

  async getLecturerCourses(lecturerId: string) {
    const lecturer = await this.userRepository.findOne({
      where: { id: lecturerId, role: UserRole.LECTURER },
      relations: ['coursesAsLecturer', 'coursesAsLecturer.students'],
    });

    if (!lecturer) {
      throw new NotFoundException('Dosen tidak ditemukan');
    }

    return lecturer.coursesAsLecturer.map((course) => ({
      id: course.id,
      code: course.code,
      name: course.name,
      credits: course.credits,
      semester: course.semester,
      studentsCount: course.students.length,
    }));
  }
}
