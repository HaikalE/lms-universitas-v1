import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

import { Course } from '../entities/course.entity';
import { User, UserRole } from '../entities/user.entity';
import { CourseMaterial, MaterialType } from '../entities/course-material.entity';
import { Assignment } from '../entities/assignment.entity';
import { Announcement } from '../entities/announcement.entity';
import { ForumPost } from '../entities/forum-post.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCoursesDto } from './dto/query-courses.dto';
import { CreateCourseMaterialDto } from './dto/create-course-material.dto';
import { UpdateCourseMaterialDto } from './dto/update-course-material.dto';
import { 
  EnrollStudentDto, 
  EnrollMultipleStudentsDto, 
  QueryCourseStudentsDto,
  AddStudentByEmailDto 
} from './dto/enroll-student.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(CourseMaterial)
    private materialRepository: Repository<CourseMaterial>,
    @InjectRepository(Assignment)
    private assignmentRepository: Repository<Assignment>,
    @InjectRepository(Announcement)
    private announcementRepository: Repository<Announcement>,
    @InjectRepository(ForumPost)
    private forumPostRepository: Repository<ForumPost>,
  ) {}

  async create(createCourseDto: CreateCourseDto, currentUser: User) {
    try {
      console.log('📚 Creating course in service:', {
        dto: createCourseDto,
        createdBy: currentUser.id
      });

      const { lecturerId, code } = createCourseDto;

      // Enhanced validation for lecturer ID
      if (!lecturerId || lecturerId.trim() === '') {
        throw new BadRequestException('ID dosen wajib diisi. Silakan pilih dosen dari dropdown.');
      }

      // Check if course code already exists
      const existingCourse = await this.courseRepository.findOne({ where: { code } });
      if (existingCourse) {
        console.error('❌ Course code already exists:', code);
        throw new ConflictException('Kode mata kuliah sudah digunakan. Silakan gunakan kode yang berbeda.');
      }

      // Verify lecturer exists and has correct role
      const lecturer = await this.userRepository.findOne({
        where: { id: lecturerId, role: UserRole.LECTURER, isActive: true },
      });
      
      if (!lecturer) {
        console.error('❌ Lecturer not found or inactive:', lecturerId);
        throw new NotFoundException('Dosen tidak ditemukan atau tidak aktif. Silakan pilih dosen lain dari dropdown.');
      }

      console.log('✅ Lecturer found:', {
        id: lecturer.id,
        name: lecturer.fullName,
        lecturerId: lecturer.lecturerId
      });

      const course = this.courseRepository.create({
        ...createCourseDto,
        lecturer,
        lecturerId,
      });

      const savedCourse = await this.courseRepository.save(course);
      
      console.log('✅ Course created successfully:', {
        id: savedCourse.id,
        code: savedCourse.code,
        name: savedCourse.name
      });

      return savedCourse;
    } catch (error) {
      console.error('❌ Error in course service create:', {
        error: error.message,
        dto: createCourseDto,
        userId: currentUser.id
      });

      // Re-throw known exceptions
      if (error instanceof BadRequestException || 
          error instanceof ConflictException || 
          error instanceof NotFoundException) {
        throw error;
      }

      // Handle database constraint errors
      if (error.code === '23505' || error.message.includes('duplicate key')) {
        throw new ConflictException('Kode mata kuliah sudah digunakan. Silakan gunakan kode yang berbeda.');
      }

      // Handle foreign key constraint errors
      if (error.code === '23503' || error.message.includes('foreign key')) {
        throw new BadRequestException('Dosen yang dipilih tidak valid. Silakan pilih dosen lain dari dropdown.');
      }

      // Generic error
      throw new BadRequestException('Terjadi kesalahan saat membuat mata kuliah. Silakan periksa data dan coba lagi.');
    }
  }

  async findAll(queryDto: QueryCoursesDto, currentUser: User) {
    const {
      page = 1,
      limit = 10,
      search,
      semester,
      lecturerId,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const queryBuilder = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.lecturer', 'lecturer')
      .select([
        'course.id',
        'course.code',
        'course.name',
        'course.description',
        'course.credits',
        'course.semester',
        'course.isActive',
        'course.createdAt',
        'lecturer.id',
        'lecturer.fullName',
        'lecturer.lecturerId',
      ]);

    // If user is a student, only show courses they're enrolled in
    if (currentUser.role === UserRole.STUDENT) {
      queryBuilder
        .innerJoin('course.students', 'student')
        .andWhere('student.id = :studentId', { studentId: currentUser.id });
    }

    // If user is a lecturer, only show their courses unless they're also admin
    if (currentUser.role === UserRole.LECTURER) {
      queryBuilder.andWhere('course.lecturerId = :lecturerId', {
        lecturerId: currentUser.id,
      });
    }

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(course.name ILIKE :search OR course.code ILIKE :search OR course.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (semester) {
      queryBuilder.andWhere('course.semester = :semester', { semester });
    }

    if (lecturerId) {
      queryBuilder.andWhere('course.lecturerId = :lecturerId', { lecturerId });
    }

    if (typeof isActive === 'boolean') {
      queryBuilder.andWhere('course.isActive = :isActive', { isActive });
    }

    // Apply sorting
    queryBuilder.orderBy(`course.${sortBy}`, sortOrder);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [courses, total] = await queryBuilder.getManyAndCount();

    return {
      data: courses,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUser: User) {
    const queryBuilder = this.courseRepository
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.lecturer', 'lecturer')
      .leftJoinAndSelect('course.students', 'students')
      .where('course.id = :id', { id });

    // Check access based on user role
    if (currentUser.role === UserRole.STUDENT) {
      queryBuilder.andWhere('students.id = :studentId', {
        studentId: currentUser.id,
      });
    } else if (currentUser.role === UserRole.LECTURER) {
      queryBuilder.andWhere('course.lecturerId = :lecturerId', {
        lecturerId: currentUser.id,
      });
    }

    const course = await queryBuilder.getOne();

    if (!course) {
      throw new NotFoundException('Mata kuliah tidak ditemukan atau Anda tidak memiliki akses');
    }

    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto, currentUser: User) {
    try {
      console.log('📝 Updating course in service:', {
        courseId: id,
        dto: updateCourseDto,
        updatedBy: currentUser.id
      });

      const course = await this.courseRepository.findOne({
        where: { id },
        relations: ['lecturer'],
      });

      if (!course) {
        throw new NotFoundException('Mata kuliah tidak ditemukan');
      }

      // Check permission: only admin or the assigned lecturer can update
      if (
        currentUser.role !== UserRole.ADMIN &&
        course.lecturerId !== currentUser.id
      ) {
        throw new ForbiddenException('Anda tidak memiliki akses untuk mengubah mata kuliah ini');
      }

      const { code, lecturerId } = updateCourseDto;

      // Check course code uniqueness if being updated
      if (code && code !== course.code) {
        const existingCourse = await this.courseRepository.findOne({ where: { code } });
        if (existingCourse) {
          console.error('❌ Course code already exists during update:', code);
          throw new ConflictException('Kode mata kuliah sudah digunakan. Silakan gunakan kode yang berbeda.');
        }
      }

      // Verify new lecturer if being updated
      if (lecturerId && lecturerId !== course.lecturerId) {
        // Enhanced validation for lecturer ID
        if (lecturerId.trim() === '') {
          throw new BadRequestException('ID dosen wajib diisi. Silakan pilih dosen dari dropdown.');
        }

        const lecturer = await this.userRepository.findOne({
          where: { id: lecturerId, role: UserRole.LECTURER, isActive: true },
        });
        
        if (!lecturer) {
          console.error('❌ New lecturer not found or inactive during update:', lecturerId);
          throw new NotFoundException('Dosen tidak ditemukan atau tidak aktif. Silakan pilih dosen lain dari dropdown.');
        }

        console.log('✅ New lecturer found for update:', {
          id: lecturer.id,
          name: lecturer.fullName
        });
      }

      Object.assign(course, updateCourseDto);
      const updatedCourse = await this.courseRepository.save(course);

      console.log('✅ Course updated successfully:', {
        id: updatedCourse.id,
        code: updatedCourse.code
      });

      return updatedCourse;
    } catch (error) {
      console.error('❌ Error in course service update:', {
        error: error.message,
        courseId: id,
        dto: updateCourseDto,
        userId: currentUser.id
      });

      // Re-throw known exceptions
      if (error instanceof BadRequestException || 
          error instanceof ConflictException || 
          error instanceof NotFoundException ||
          error instanceof ForbiddenException) {
        throw error;
      }

      // Handle database constraint errors
      if (error.code === '23505' || error.message.includes('duplicate key')) {
        throw new ConflictException('Kode mata kuliah sudah digunakan. Silakan gunakan kode yang berbeda.');
      }

      // Handle foreign key constraint errors
      if (error.code === '23503' || error.message.includes('foreign key')) {
        throw new BadRequestException('Dosen yang dipilih tidak valid. Silakan pilih dosen lain dari dropdown.');
      }

      // Generic error
      throw new BadRequestException('Terjadi kesalahan saat memperbarui mata kuliah. Silakan periksa data dan coba lagi.');
    }
  }

  async remove(id: string, currentUser: User) {
    const course = await this.courseRepository.findOne({ where: { id } });

    if (!course) {
      throw new NotFoundException('Mata kuliah tidak ditemukan');
    }

    // Only admin can delete courses
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Hanya admin yang dapat menghapus mata kuliah');
    }

    // Soft delete by deactivating
    course.isActive = false;
    await this.courseRepository.save(course);

    return { message: 'Mata kuliah berhasil dinonaktifkan' };
  }

  async getCourseMaterials(courseId: string, currentUser: User) {
    // Verify access to course
    await this.findOne(courseId, currentUser);

    const materials = await this.materialRepository.find({
      where: { courseId, isVisible: true },
      relations: ['uploadedBy'],
      order: { week: 'ASC', orderIndex: 'ASC' },
    });

    return materials.map((material) => ({
      id: material.id,
      title: material.title,
      description: material.description,
      type: material.type,
      fileName: material.fileName,
      filePath: material.filePath,
      fileSize: material.fileSize,
      url: material.url,
      week: material.week,
      orderIndex: material.orderIndex,
      uploadedBy: {
        id: material.uploadedBy.id,
        fullName: material.uploadedBy.fullName,
      },
      createdAt: material.createdAt,
    }));
  }

  async createCourseMaterial(
    courseId: string,
    createMaterialDto: CreateCourseMaterialDto,
    currentUser: User,
    file?: Express.Multer.File,
  ) {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });

    if (!course) {
      throw new NotFoundException('Mata kuliah tidak ditemukan');
    }

    // Only lecturer of the course or admin can create materials
    if (
      currentUser.role !== UserRole.ADMIN &&
      course.lecturerId !== currentUser.id
    ) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk menambah materi');
    }

    let materialData = { ...createMaterialDto };

    // Handle file upload if provided
    if (file && createMaterialDto.type !== MaterialType.LINK) {
      try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'uploads', 'course-materials');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const fileExtension = path.extname(file.originalname);
        const fileName = `${courseId}_${timestamp}_${randomStr}${fileExtension}`;
        const filePath = path.join(uploadsDir, fileName);

        // Save file to disk
        fs.writeFileSync(filePath, file.buffer);

        // Update material data with file info
        materialData.fileName = file.originalname;
        materialData.filePath = path.relative(process.cwd(), filePath);
        materialData.fileSize = file.size;
      } catch (error) {
        console.error('Error saving file:', error);
        throw new BadRequestException('Gagal menyimpan file');
      }
    }

    const material = this.materialRepository.create({
      ...materialData,
      courseId,
      uploadedById: currentUser.id,
    });

    return this.materialRepository.save(material);
  }

  async updateCourseMaterial(
    courseId: string,
    materialId: string,
    updateMaterialDto: UpdateCourseMaterialDto,
    currentUser: User,
    file?: Express.Multer.File,
  ) {
    const material = await this.materialRepository.findOne({
      where: { id: materialId, courseId },
      relations: ['course'],
    });

    if (!material) {
      throw new NotFoundException('Materi tidak ditemukan');
    }

    // Only lecturer of the course or admin can update materials
    if (
      currentUser.role !== UserRole.ADMIN &&
      material.course.lecturerId !== currentUser.id
    ) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk mengubah materi ini');
    }

    let materialData = { ...updateMaterialDto };

    // Handle file upload if provided
    if (file && updateMaterialDto.type !== MaterialType.LINK) {
      try {
        // Delete old file if exists
        if (material.filePath && fs.existsSync(material.filePath)) {
          fs.unlinkSync(material.filePath);
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'uploads', 'course-materials');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        // Generate unique filename
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 15);
        const fileExtension = path.extname(file.originalname);
        const fileName = `${courseId}_${timestamp}_${randomStr}${fileExtension}`;
        const filePath = path.join(uploadsDir, fileName);

        // Save file to disk
        fs.writeFileSync(filePath, file.buffer);

        // Update material data with file info
        materialData.fileName = file.originalname;
        materialData.filePath = path.relative(process.cwd(), filePath);
        materialData.fileSize = file.size;
      } catch (error) {
        console.error('Error saving file:', error);
        throw new BadRequestException('Gagal menyimpan file');
      }
    }

    Object.assign(material, materialData);
    return this.materialRepository.save(material);
  }

  async deleteCourseMaterial(
    courseId: string,
    materialId: string,
    currentUser: User,
  ) {
    const material = await this.materialRepository.findOne({
      where: { id: materialId, courseId },
      relations: ['course'],
    });

    if (!material) {
      throw new NotFoundException('Materi tidak ditemukan');
    }

    // Only lecturer of the course or admin can delete materials
    if (
      currentUser.role !== UserRole.ADMIN &&
      material.course.lecturerId !== currentUser.id
    ) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk menghapus materi ini');
    }

    // Delete associated file if exists
    if (material.filePath && fs.existsSync(material.filePath)) {
      try {
        fs.unlinkSync(material.filePath);
      } catch (error) {
        console.warn('Failed to delete file:', error);
      }
    }

    await this.materialRepository.remove(material);
    return { message: 'Materi berhasil dihapus' };
  }

  async getCourseStats(courseId: string, currentUser: User) {
    // Verify access to course
    await this.findOne(courseId, currentUser);

    const [materialsCount, assignmentsCount, studentsCount, announcementsCount, forumPostsCount] =
      await Promise.all([
        this.materialRepository.count({ where: { courseId } }),
        this.assignmentRepository.count({ where: { courseId } }),
        this.courseRepository
          .createQueryBuilder('course')
          .leftJoin('course.students', 'student')
          .where('course.id = :courseId', { courseId })
          .getCount(),
        this.announcementRepository.count({ where: { courseId } }),
        this.forumPostRepository.count({ where: { courseId } }),
      ]);

    return {
      materials: materialsCount,
      assignments: assignmentsCount,
      students: studentsCount,
      announcements: announcementsCount,
      forumPosts: forumPostsCount,
    };
  }

  // Student Management Methods
  async getCourseStudents(courseId: string, queryDto: QueryCourseStudentsDto, currentUser: User) {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });

    if (!course) {
      throw new NotFoundException('Mata kuliah tidak ditemukan');
    }

    // Check permission: only admin, lecturer of the course, or enrolled students can view
    if (
      currentUser.role !== UserRole.ADMIN &&
      course.lecturerId !== currentUser.id &&
      currentUser.role === UserRole.STUDENT
    ) {
      // For students, verify they are enrolled in the course
      const isEnrolled = await this.courseRepository
        .createQueryBuilder('course')
        .innerJoin('course.students', 'student')
        .where('course.id = :courseId', { courseId })
        .andWhere('student.id = :studentId', { studentId: currentUser.id })
        .getOne();

      if (!isEnrolled) {
        throw new ForbiddenException('Anda tidak memiliki akses untuk melihat daftar mahasiswa');
      }
    }

    const {
      page = 1,
      limit = 20,
      search,
      sortBy = 'fullName',
      sortOrder = 'ASC',
    } = queryDto;

    // Fixed query: Use the correct relation name 'coursesAsStudent' 
    const queryBuilder = this.userRepository
      .createQueryBuilder('student')
      .innerJoin('student.coursesAsStudent', 'course')
      .where('course.id = :courseId', { courseId })
      .andWhere('student.role = :role', { role: UserRole.STUDENT })
      .select([
        'student.id',
        'student.fullName',
        'student.studentId',
        'student.email',
        'student.avatar',
        'student.isActive',
        'student.createdAt'
      ]);

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(student.fullName ILIKE :search OR student.studentId ILIKE :search OR student.email ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Apply sorting
    const allowedSortFields = ['fullName', 'studentId', 'email', 'createdAt'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'fullName';
    queryBuilder.orderBy(`student.${sortField}`, sortOrder);

    // Apply pagination
    const offset = (Number(page) - 1) * Number(limit);
    queryBuilder.skip(offset).take(Number(limit));

    const [students, total] = await queryBuilder.getManyAndCount();

    // Format response with enrolledAt field (use createdAt as placeholder)
    const formattedStudents = students.map(student => ({
      id: student.id,
      fullName: student.fullName,
      studentId: student.studentId,
      email: student.email,
      avatar: student.avatar,
      isActive: student.isActive,
      enrolledAt: student.createdAt, // Using createdAt as enrollment date placeholder
    }));

    return {
      data: formattedStudents,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  async enrollStudent(courseId: string, enrollStudentDto: EnrollStudentDto, currentUser: User) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['students'],
    });

    if (!course) {
      throw new NotFoundException('Mata kuliah tidak ditemukan');
    }

    // Check permission: only admin or lecturer of the course can enroll students
    if (
      currentUser.role !== UserRole.ADMIN &&
      course.lecturerId !== currentUser.id
    ) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk menambah mahasiswa');
    }

    // Verify student exists and has STUDENT role
    const student = await this.userRepository.findOne({
      where: { id: enrollStudentDto.studentId, role: UserRole.STUDENT },
    });

    if (!student) {
      throw new NotFoundException('Mahasiswa tidak ditemukan');
    }

    // Check if student is already enrolled
    const isAlreadyEnrolled = course.students.some(s => s.id === student.id);
    if (isAlreadyEnrolled) {
      throw new ConflictException('Mahasiswa sudah terdaftar di mata kuliah ini');
    }

    // Add student to course
    course.students.push(student);
    await this.courseRepository.save(course);

    return {
      message: 'Mahasiswa berhasil ditambahkan ke mata kuliah',
      student: {
        id: student.id,
        fullName: student.fullName,
        studentId: student.studentId,
        email: student.email,
      },
    };
  }

  async enrollMultipleStudents(
    courseId: string,
    enrollMultipleDto: EnrollMultipleStudentsDto,
    currentUser: User,
  ) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['students'],
    });

    if (!course) {
      throw new NotFoundException('Mata kuliah tidak ditemukan');
    }

    // Check permission
    if (
      currentUser.role !== UserRole.ADMIN &&
      course.lecturerId !== currentUser.id
    ) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk menambah mahasiswa');
    }

    const results = [];
    const errors = [];

    for (const studentId of enrollMultipleDto.studentIds) {
      try {
        const student = await this.userRepository.findOne({
          where: { id: studentId, role: UserRole.STUDENT },
        });

        if (!student) {
          errors.push(`Mahasiswa dengan ID ${studentId} tidak ditemukan`);
          continue;
        }

        const isAlreadyEnrolled = course.students.some(s => s.id === student.id);
        if (isAlreadyEnrolled) {
          errors.push(`${student.fullName} sudah terdaftar di mata kuliah ini`);
          continue;
        }

        course.students.push(student);
        results.push({
          id: student.id,
          fullName: student.fullName,
          studentId: student.studentId,
          email: student.email,
        });
      } catch (error) {
        errors.push(`Error saat menambahkan mahasiswa dengan ID ${studentId}: ${error.message}`);
      }
    }

    if (results.length > 0) {
      await this.courseRepository.save(course);
    }

    return {
      message: `${results.length} mahasiswa berhasil ditambahkan`,
      enrolledStudents: results,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  async addStudentByEmail(
    courseId: string,
    addStudentDto: AddStudentByEmailDto,
    currentUser: User,
  ) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['students'],
    });

    if (!course) {
      throw new NotFoundException('Mata kuliah tidak ditemukan');
    }

    // Check permission
    if (
      currentUser.role !== UserRole.ADMIN &&
      course.lecturerId !== currentUser.id
    ) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk menambah mahasiswa');
    }

    // Find student by email
    const student = await this.userRepository.findOne({
      where: { email: addStudentDto.email, role: UserRole.STUDENT },
    });

    if (!student) {
      throw new NotFoundException('Mahasiswa dengan email tersebut tidak ditemukan');
    }

    // Check if student is already enrolled
    const isAlreadyEnrolled = course.students.some(s => s.id === student.id);
    if (isAlreadyEnrolled) {
      throw new ConflictException('Mahasiswa sudah terdaftar di mata kuliah ini');
    }

    // Add student to course
    course.students.push(student);
    await this.courseRepository.save(course);

    return {
      message: 'Mahasiswa berhasil ditambahkan ke mata kuliah',
      student: {
        id: student.id,
        fullName: student.fullName,
        studentId: student.studentId,
        email: student.email,
      },
    };
  }

  async removeStudentFromCourse(courseId: string, studentId: string, currentUser: User) {
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['students'],
    });

    if (!course) {
      throw new NotFoundException('Mata kuliah tidak ditemukan');
    }

    // Check permission
    if (
      currentUser.role !== UserRole.ADMIN &&
      course.lecturerId !== currentUser.id
    ) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk menghapus mahasiswa');
    }

    // Find student in course
    const studentIndex = course.students.findIndex(s => s.id === studentId);
    if (studentIndex === -1) {
      throw new NotFoundException('Mahasiswa tidak terdaftar di mata kuliah ini');
    }

    const removedStudent = course.students[studentIndex];

    // Remove student from course
    course.students.splice(studentIndex, 1);
    await this.courseRepository.save(course);

    return {
      message: 'Mahasiswa berhasil dihapus dari mata kuliah',
      student: {
        id: removedStudent.id,
        fullName: removedStudent.fullName,
        studentId: removedStudent.studentId,
        email: removedStudent.email,
      },
    };
  }

  // Helper method to get available students (not enrolled in the course)
  async getAvailableStudents(courseId: string, currentUser: User) {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });

    if (!course) {
      throw new NotFoundException('Mata kuliah tidak ditemukan');
    }

    // Check permission
    if (
      currentUser.role !== UserRole.ADMIN &&
      course.lecturerId !== currentUser.id
    ) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk melihat data mahasiswa');
    }

    // Get all students not enrolled in this course
    const availableStudents = await this.userRepository
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.STUDENT })
      .andWhere('user.isActive = :isActive', { isActive: true })
      .andWhere(`user.id NOT IN (
        SELECT student.id 
        FROM course_enrollments ce 
        INNER JOIN users student ON ce."studentId" = student.id 
        WHERE ce."courseId" = :courseId
      )`, { courseId })
      .select([
        'user.id',
        'user.fullName',
        'user.studentId',
        'user.email',
      ])
      .orderBy('user.fullName', 'ASC')
      .getMany();

    return availableStudents;
  }
}