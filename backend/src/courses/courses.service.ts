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
import { Submission, SubmissionStatus } from '../entities/submission.entity';
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
    @InjectRepository(Submission)
    private submissionRepository: Repository<Submission>,
  ) {}

  // ===============================
  // LECTURER DASHBOARD STATS 
  // ===============================
  
  async getLecturerDashboardStats(currentUser: User) {
    try {
      console.log('📊 Getting dashboard stats for lecturer:', currentUser.id);

      // For admin, show overall stats. For lecturer, show their courses only
      let coursesQuery = this.courseRepository
        .createQueryBuilder('course')
        .leftJoinAndSelect('course.students', 'students')
        .leftJoinAndSelect('course.assignments', 'assignments')
        .leftJoinAndSelect('course.materials', 'materials')
        .where('course.isActive = :isActive', { isActive: true });

      if (currentUser.role === UserRole.LECTURER) {
        coursesQuery = coursesQuery.andWhere('course.lecturerId = :lecturerId', { 
          lecturerId: currentUser.id 
        });
      }

      const courses = await coursesQuery.getMany();

      // Calculate basic stats
      const totalCourses = courses.length;
      const totalStudents = courses.reduce((sum, course) => sum + (course.students?.length || 0), 0);
      const totalAssignments = courses.reduce((sum, course) => sum + (course.assignments?.length || 0), 0);
      const totalMaterials = courses.reduce((sum, course) => sum + (course.materials?.length || 0), 0);

      // Get pending submissions that need grading
      let pendingSubmissionsQuery = this.submissionRepository
        .createQueryBuilder('submission')
        .innerJoin('submission.assignment', 'assignment')
        .innerJoin('assignment.course', 'course')
        .leftJoinAndSelect('submission.student', 'student')
        .leftJoinAndSelect('submission.assignment', 'assignmentData')
        .leftJoinAndSelect('assignmentData.course', 'courseData')
        .where('submission.status IN (:...statuses)', { 
          statuses: [SubmissionStatus.SUBMITTED, SubmissionStatus.LATE] 
        })
        .andWhere('course.isActive = :isActive', { isActive: true });

      if (currentUser.role === UserRole.LECTURER) {
        pendingSubmissionsQuery = pendingSubmissionsQuery.andWhere('course.lecturerId = :lecturerId', { 
          lecturerId: currentUser.id 
        });
      }

      const pendingSubmissions = await pendingSubmissionsQuery
        .orderBy('submission.submittedAt', 'DESC')
        .limit(10)
        .getMany();

      const pendingCount = pendingSubmissions.length;

      // Get recent submissions (last 7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      let recentSubmissionsQuery = this.submissionRepository
        .createQueryBuilder('submission')
        .innerJoin('submission.assignment', 'assignment')
        .innerJoin('assignment.course', 'course')
        .leftJoinAndSelect('submission.student', 'student')
        .leftJoinAndSelect('submission.assignment', 'assignmentData')
        .leftJoinAndSelect('assignmentData.course', 'courseData')
        .where('submission.submittedAt >= :oneWeekAgo', { oneWeekAgo })
        .andWhere('course.isActive = :isActive', { isActive: true });

      if (currentUser.role === UserRole.LECTURER) {
        recentSubmissionsQuery = recentSubmissionsQuery.andWhere('course.lecturerId = :lecturerId', { 
          lecturerId: currentUser.id 
        });
      }

      const recentSubmissions = await recentSubmissionsQuery
        .orderBy('submission.submittedAt', 'DESC')
        .limit(10)
        .getMany();

      // Get forum activity (recent posts)
      let recentForumPostsQuery = this.forumPostRepository
        .createQueryBuilder('post')
        .innerJoin('post.course', 'course')
        .leftJoinAndSelect('post.author', 'author')
        .leftJoinAndSelect('post.course', 'courseData')
        .where('post.createdAt >= :oneWeekAgo', { oneWeekAgo })
        .andWhere('course.isActive = :isActive', { isActive: true });

      if (currentUser.role === UserRole.LECTURER) {
        recentForumPostsQuery = recentForumPostsQuery.andWhere('course.lecturerId = :lecturerId', { 
          lecturerId: currentUser.id 
        });
      }

      const recentForumPosts = await recentForumPostsQuery
        .orderBy('post.createdAt', 'DESC')
        .limit(5)
        .getMany();

      // Get today's deadlines
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      today.setHours(0, 0, 0, 0);
      tomorrow.setHours(0, 0, 0, 0);

      let todayDeadlinesQuery = this.assignmentRepository
        .createQueryBuilder('assignment')
        .innerJoin('assignment.course', 'course')
        .leftJoinAndSelect('assignment.course', 'courseData')
        .where('assignment.dueDate >= :today', { today })
        .andWhere('assignment.dueDate < :tomorrow', { tomorrow })
        .andWhere('course.isActive = :isActive', { isActive: true });

      if (currentUser.role === UserRole.LECTURER) {
        todayDeadlinesQuery = todayDeadlinesQuery.andWhere('course.lecturerId = :lecturerId', { 
          lecturerId: currentUser.id 
        });
      }

      const todayDeadlines = await todayDeadlinesQuery
        .orderBy('assignment.dueDate', 'ASC')
        .getMany();

      // Calculate completion rate (simplified)
      const allSubmissionsCount = await this.submissionRepository
        .createQueryBuilder('submission')
        .innerJoin('submission.assignment', 'assignment')
        .innerJoin('assignment.course', 'course')
        .where('course.isActive = :isActive', { isActive: true })
        .andWhere(currentUser.role === UserRole.LECTURER ? 'course.lecturerId = :lecturerId' : '1=1', 
          currentUser.role === UserRole.LECTURER ? { lecturerId: currentUser.id } : {})
        .getCount();

      const gradedSubmissionsCount = await this.submissionRepository
        .createQueryBuilder('submission')
        .innerJoin('submission.assignment', 'assignment')
        .innerJoin('assignment.course', 'course')
        .where('submission.status = :status', { status: SubmissionStatus.GRADED })
        .andWhere('course.isActive = :isActive', { isActive: true })
        .andWhere(currentUser.role === UserRole.LECTURER ? 'course.lecturerId = :lecturerId' : '1=1', 
          currentUser.role === UserRole.LECTURER ? { lecturerId: currentUser.id } : {})
        .getCount();

      const completionRate = allSubmissionsCount > 0 ? Math.round((gradedSubmissionsCount / allSubmissionsCount) * 100) : 0;

      // Format course stats
      const courseStats = courses.map(course => ({
        id: course.id,
        name: course.name,
        code: course.code,
        studentsCount: course.students?.length || 0,
        assignmentsCount: course.assignments?.length || 0,
        materialsCount: course.materials?.length || 0,
        semester: course.semester,
      }));

      // Generate submission trend for last 7 days
      const submissionTrends = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const startDate = new Date(date);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(date);
        endDate.setHours(23, 59, 59, 999);

        let daySubmissionsQuery = this.submissionRepository
          .createQueryBuilder('submission')
          .innerJoin('submission.assignment', 'assignment')
          .innerJoin('assignment.course', 'course')
          .where('submission.submittedAt >= :startDate', { startDate })
          .andWhere('submission.submittedAt <= :endDate', { endDate })
          .andWhere('course.isActive = :isActive', { isActive: true });

        if (currentUser.role === UserRole.LECTURER) {
          daySubmissionsQuery = daySubmissionsQuery.andWhere('course.lecturerId = :lecturerId', { 
            lecturerId: currentUser.id 
          });
        }

        const count = await daySubmissionsQuery.getCount();

        submissionTrends.push({
          date: date.toISOString().split('T')[0],
          submissions: count,
        });
      }

      const dashboardStats = {
        overview: {
          totalCourses,
          totalStudents,
          totalAssignments,
          totalMaterials,
          pendingGrading: pendingCount,
          completionRate,
        },
        courseStats,
        recentActivity: {
          submissions: recentSubmissions.map(submission => ({
            id: submission.id,
            studentName: submission.student?.fullName || 'Unknown',
            assignmentTitle: submission.assignment?.title || 'Unknown Assignment',
            courseName: submission.assignment?.course?.name || 'Unknown Course',
            submittedAt: submission.submittedAt,
            status: submission.status,
            isLate: submission.isLate,
          })),
          forumPosts: recentForumPosts.map(post => ({
            id: post.id,
            title: post.title,
            authorName: post.author?.fullName || 'Anonymous',
            courseName: post.course?.name || 'Unknown Course',
            createdAt: post.createdAt,
          })),
        },
        todaySchedule: [
          // Today's deadlines
          ...todayDeadlines.map(assignment => ({
            id: assignment.id,
            type: 'deadline',
            title: `Deadline: ${assignment.title}`,
            courseName: assignment.course?.name || 'Unknown Course',
            time: assignment.dueDate,
            description: `Assignment deadline`,
          })),
        ],
        submissionTrends,
        pendingSubmissions: pendingSubmissions.slice(0, 5).map(submission => ({
          id: submission.id,
          studentName: submission.student?.fullName || 'Unknown',
          assignmentTitle: submission.assignment?.title || 'Unknown Assignment',
          courseName: submission.assignment?.course?.name || 'Unknown Course',
          submittedAt: submission.submittedAt,
          status: submission.status,
          isLate: submission.isLate,
        })),
      };

      console.log('✅ Dashboard stats calculated:', {
        totalCourses,
        totalStudents,
        pendingGrading: pendingCount,
        completionRate
      });

      return dashboardStats;
    } catch (error) {
      console.error('❌ Error getting lecturer dashboard stats:', {
        error: error.message,
        stack: error.stack,
        userId: currentUser.id,
        userRole: currentUser.role
      });

      throw new BadRequestException('Terjadi kesalahan saat mengambil statistik dashboard');
    }
  }

  // ===============================
  // COURSE CREATION FORM SUPPORT
  // ===============================

  async getCreateCourseData(currentUser: User) {
    try {
      console.log('📋 Getting course creation form data for admin:', currentUser.id);

      // Only admin can create courses
      if (currentUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Hanya admin yang dapat membuat mata kuliah');
      }

      // Get all active lecturers
      const lecturers = await this.userRepository.find({
        where: { 
          role: UserRole.LECTURER, 
          isActive: true 
        },
        select: [
          'id',
          'fullName',
          'lecturerId',
          'email',
        ],
        order: {
          fullName: 'ASC',
        },
      });

      // Get some statistics for the form
      const totalCourses = await this.courseRepository.count();
      const activeCourses = await this.courseRepository.count({ 
        where: { isActive: true } 
      });

      console.log('✅ Course creation data retrieved:', {
        lecturersCount: lecturers.length,
        totalCourses,
        activeCourses
      });

      return {
        message: 'Data untuk form pembuatan mata kuliah berhasil diambil',
        data: {
          lecturers: lecturers.map(lecturer => ({
            id: lecturer.id,
            fullName: lecturer.fullName,
            lecturerId: lecturer.lecturerId,
            email: lecturer.email,
          })),
          statistics: {
            totalCourses,
            activeCourses,
            totalLecturers: lecturers.length,
          },
          // Form metadata
          formFields: {
            semesters: [
              'Ganjil 2024/2025',
              'Genap 2024/2025',
              'Ganjil 2025/2026',
              'Genap 2025/2026'
            ],
            creditOptions: [1, 2, 3, 4, 5, 6]
          }
        }
      };
    } catch (error) {
      console.error('❌ Error getting course creation data:', {
        error: error.message,
        adminId: currentUser.id
      });

      // Re-throw known exceptions
      if (error instanceof ForbiddenException) {
        throw error;
      }

      // Generic error
      throw new BadRequestException('Terjadi kesalahan saat mengambil data form pembuatan mata kuliah');
    }
  }

  async getAllLecturers(currentUser: User) {
    try {
      console.log('👨‍🏫 Getting all lecturers for user:', currentUser.id);

      // Only admin and lecturers can access this
      if (currentUser.role !== UserRole.ADMIN && currentUser.role !== UserRole.LECTURER) {
        throw new ForbiddenException('Akses ditolak. Hanya admin dan dosen yang dapat melihat daftar dosen');
      }

      // Get all active lecturers with more details for admin
      const selectFields: (keyof User)[] = currentUser.role === UserRole.ADMIN ? [
        'id',
        'fullName', 
        'lecturerId',
        'email',
        'phone',
        'isActive',
        'createdAt'
      ] : [
        'id',
        'fullName',
        'lecturerId',
        'email'
      ];

      const lecturers = await this.userRepository.find({
        where: { 
          role: UserRole.LECTURER, 
          isActive: true 
        },
        select: selectFields,
        order: {
          fullName: 'ASC',
        },
      });

      // For admin, also get course count for each lecturer
      if (currentUser.role === UserRole.ADMIN) {
        const lecturersWithCourseCount = await Promise.all(
          lecturers.map(async (lecturer) => {
            const courseCount = await this.courseRepository.count({
              where: { lecturerId: lecturer.id, isActive: true }
            });
            return {
              ...lecturer,
              courseCount,
            };
          })
        );

        console.log('✅ All lecturers retrieved for admin:', {
          total: lecturersWithCourseCount.length
        });

        return {
          message: 'Daftar semua dosen berhasil diambil',
          data: lecturersWithCourseCount,
          meta: {
            total: lecturersWithCourseCount.length,
            userRole: currentUser.role,
          }
        };
      }

      console.log('✅ All lecturers retrieved for lecturer:', {
        total: lecturers.length
      });

      return {
        message: 'Daftar dosen berhasil diambil',
        data: lecturers,
        meta: {
          total: lecturers.length,
          userRole: currentUser.role,
        }
      };
    } catch (error) {
      console.error('❌ Error getting all lecturers:', {
        error: error.message,
        userId: currentUser.id,
        userRole: currentUser.role
      });

      // Re-throw known exceptions
      if (error instanceof ForbiddenException) {
        throw error;
      }

      // Generic error
      throw new BadRequestException('Terjadi kesalahan saat mengambil daftar dosen');
    }
  }

  async create(createCourseDto: CreateCourseDto, currentUser: User) {
    try {
      console.log('📚 Creating course in service:', {
        dto: createCourseDto,
        createdBy: currentUser.id
      });

      const { lecturerId, code, ...courseData } = createCourseDto;

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

      // ✅ FIXED: Create course without TypeORM relation conflict
      const course = this.courseRepository.create({
        code,
        ...courseData,
        lecturerId: lecturer.id, // Explicit assignment to avoid conflict
      });

      const savedCourse = await this.courseRepository.save(course);
      
      console.log('✅ Course created successfully:', {
        id: savedCourse.id,
        code: savedCourse.code,
        name: savedCourse.name
      });

      // Return with lecturer details loaded
      const result = await this.courseRepository.findOne({
        where: { id: savedCourse.id },
        relations: ['lecturer'],
      });

      return result;
    } catch (error) {
      console.error('❌ Error in course service create:', {
        error: error.message,
        stack: error.stack,
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
    try {
      console.log('🔍 Finding course:', { id, userId: currentUser.id, userRole: currentUser.role });

      // First, check if course exists
      const course = await this.courseRepository.findOne({
        where: { id },
        relations: ['lecturer'],
      });

      if (!course) {
        throw new NotFoundException('Mata kuliah tidak ditemukan');
      }

      console.log('✅ Course found:', { 
        courseId: course.id, 
        courseName: course.name,
        lecturerId: course.lecturerId 
      });

      // Check access based on user role
      let hasAccess = false;

      if (currentUser.role === UserRole.ADMIN) {
        // Admin has access to all courses
        hasAccess = true;
      } else if (currentUser.role === UserRole.LECTURER) {
        // Lecturer can only access courses they teach
        hasAccess = course.lecturerId === currentUser.id;
      } else if (currentUser.role === UserRole.STUDENT) {
        // Student can only access courses they're enrolled in
        // Check enrollment using separate query to avoid complex joins
        const enrollment = await this.courseRepository
          .createQueryBuilder('course')
          .innerJoin('course.students', 'student')
          .where('course.id = :courseId', { courseId: id })
          .andWhere('student.id = :studentId', { studentId: currentUser.id })
          .getOne();
        
        hasAccess = !!enrollment;
      }

      if (!hasAccess) {
        throw new ForbiddenException('Anda tidak memiliki akses ke mata kuliah ini');
      }

      // If user has access, load course with students for admin/lecturer
      if (currentUser.role === UserRole.ADMIN || 
          (currentUser.role === UserRole.LECTURER && course.lecturerId === currentUser.id)) {
        
        const courseWithStudents = await this.courseRepository.findOne({
          where: { id },
          relations: ['lecturer', 'students'],
        });

        console.log('✅ Course loaded with students count:', courseWithStudents?.students?.length || 0);
        return courseWithStudents;
      }

      // For students, return course without student list
      console.log('✅ Course loaded for student access');
      return course;

    } catch (error) {
      console.error('❌ Error in findOne:', {
        error: error.message,
        courseId: id,
        userId: currentUser.id,
        userRole: currentUser.role
      });

      // Re-throw known exceptions
      if (error instanceof NotFoundException || 
          error instanceof ForbiddenException) {
        throw error;
      }

      // Handle unexpected errors
      throw new BadRequestException('Terjadi kesalahan saat mengambil data mata kuliah');
    }
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

  // ===============================
  // LECTURER MANAGEMENT METHODS
  // ===============================

  async addLecturerToCourse(courseId: string, lecturerId: string, currentUser: User) {
    try {
      console.log('👨‍🏫 Adding lecturer to course:', { courseId, lecturerId, adminId: currentUser.id });

      // Find course
      const course = await this.courseRepository.findOne({
        where: { id: courseId },
        relations: ['lecturer'],
      });

      if (!course) {
        throw new NotFoundException('Mata kuliah tidak ditemukan');
      }

      // Only admin can add lecturers
      if (currentUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Hanya admin yang dapat menambahkan dosen pengampu');
      }

      // Verify lecturer exists and has correct role
      const lecturer = await this.userRepository.findOne({
        where: { id: lecturerId, role: UserRole.LECTURER, isActive: true },
      });

      if (!lecturer) {
        throw new NotFoundException('Dosen tidak ditemukan atau tidak aktif');
      }

      // Check if lecturer is already assigned to this course
      if (course.lecturerId === lecturerId) {
        throw new ConflictException('Dosen ini sudah menjadi pengampu mata kuliah ini');
      }

      // Update course with new lecturer
      course.lecturerId = lecturerId;
      course.lecturer = lecturer;
      
      const updatedCourse = await this.courseRepository.save(course);

      console.log('✅ Lecturer added to course successfully:', {
        courseId: updatedCourse.id,
        lecturerName: lecturer.fullName
      });

      return {
        message: 'Dosen berhasil ditambahkan sebagai pengampu mata kuliah',
        course: {
          id: updatedCourse.id,
          name: updatedCourse.name,
          code: updatedCourse.code,
        },
        lecturer: {
          id: lecturer.id,
          fullName: lecturer.fullName,
          lecturerId: lecturer.lecturerId,
          email: lecturer.email,
        },
      };
    } catch (error) {
      console.error('❌ Error adding lecturer to course:', {
        error: error.message,
        courseId,
        lecturerId,
        adminId: currentUser.id
      });

      // Re-throw known exceptions
      if (error instanceof BadRequestException || 
          error instanceof ConflictException || 
          error instanceof NotFoundException ||
          error instanceof ForbiddenException) {
        throw error;
      }

      // Generic error
      throw new BadRequestException('Terjadi kesalahan saat menambahkan dosen pengampu');
    }
  }

  async removeLecturerFromCourse(courseId: string, lecturerId: string, currentUser: User) {
    try {
      console.log('👨‍🏫 Removing lecturer from course:', { courseId, lecturerId, adminId: currentUser.id });

      // Find course
      const course = await this.courseRepository.findOne({
        where: { id: courseId },
        relations: ['lecturer'],
      });

      if (!course) {
        throw new NotFoundException('Mata kuliah tidak ditemukan');
      }

      // Only admin can remove lecturers
      if (currentUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Hanya admin yang dapat menghapus dosen pengampu');
      }

      // Check if lecturer is actually assigned to this course
      if (course.lecturerId !== lecturerId) {
        throw new NotFoundException('Dosen ini tidak menjadi pengampu mata kuliah ini');
      }

      const removedLecturer = course.lecturer;

      // Note: For this implementation, we'll require at least one lecturer per course
      // In a real system, you might want to allow temporary removal or require 
      // replacement lecturer assignment
      throw new BadRequestException('Mata kuliah harus memiliki minimal satu dosen pengampu. Silakan tambahkan dosen lain terlebih dahulu sebelum menghapus dosen ini.');

      // If you want to allow removal, uncomment below and modify as needed:
      /*
      course.lecturerId = null;
      course.lecturer = null;
      await this.courseRepository.save(course);

      return {
        message: 'Dosen berhasil dihapus dari mata kuliah',
        course: {
          id: course.id,
          name: course.name,
          code: course.code,
        },
        removedLecturer: {
          id: removedLecturer.id,
          fullName: removedLecturer.fullName,
          lecturerId: removedLecturer.lecturerId,
          email: removedLecturer.email,
        },
      };
      */
    } catch (error) {
      console.error('❌ Error removing lecturer from course:', {
        error: error.message,
        courseId,
        lecturerId,
        adminId: currentUser.id
      });

      // Re-throw known exceptions
      if (error instanceof BadRequestException || 
          error instanceof ConflictException || 
          error instanceof NotFoundException ||
          error instanceof ForbiddenException) {
        throw error;
      }

      // Generic error
      throw new BadRequestException('Terjadi kesalahan saat menghapus dosen pengampu');
    }
  }

  async getAvailableLecturers(courseId: string, currentUser: User) {
    try {
      console.log('👨‍🏫 Getting available lecturers for course:', { courseId, adminId: currentUser.id });

      // Find course to verify it exists
      const course = await this.courseRepository.findOne({ where: { id: courseId } });

      if (!course) {
        throw new NotFoundException('Mata kuliah tidak ditemukan');
      }

      // Only admin can view available lecturers
      if (currentUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Hanya admin yang dapat melihat daftar dosen yang tersedia');
      }

      // Get all active lecturers
      const availableLecturers = await this.userRepository.find({
        where: { 
          role: UserRole.LECTURER, 
          isActive: true 
        },
        select: [
          'id',
          'fullName',
          'lecturerId',
          'email',
          'phone',
        ],
        order: {
          fullName: 'ASC',
        },
      });

      // Mark current course lecturer
      const lecturersWithStatus = availableLecturers.map(lecturer => ({
        ...lecturer,
        isCurrentLecturer: lecturer.id === course.lecturerId,
      }));

      console.log('✅ Available lecturers retrieved:', {
        total: lecturersWithStatus.length,
        currentLecturerId: course.lecturerId
      });

      return {
        data: lecturersWithStatus,
        meta: {
          total: lecturersWithStatus.length,
          currentCourse: {
            id: course.id,
            name: course.name,
            code: course.code,
            currentLecturerId: course.lecturerId,
          },
        },
      };
    } catch (error) {
      console.error('❌ Error getting available lecturers:', {
        error: error.message,
        courseId,
        adminId: currentUser.id
      });

      // Re-throw known exceptions
      if (error instanceof NotFoundException ||
          error instanceof ForbiddenException) {
        throw error;
      }

      // Generic error
      throw new BadRequestException('Terjadi kesalahan saat mengambil daftar dosen yang tersedia');
    }
  }

  async getCourseMaterials(courseId: string, currentUser: User) {
    // Verify access to course
    await this.findOne(courseId, currentUser);

    const materials = await this.materialRepository.find({
      where: { courseId, isVisible: true },
      relations: ['uploadedBy'],
      order: { week: 'ASC', orderIndex: 'ASC' },
    });

    // ✅ FIXED: Include isAttendanceTrigger and attendanceThreshold in response
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
      isVisible: material.isVisible,
      // ✅ NEW: Include weekly attendance fields
      isAttendanceTrigger: material.isAttendanceTrigger || false,
      attendanceThreshold: material.attendanceThreshold,
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

    // ✅ FIX: Ensure only videos can be attendance triggers
    if (materialData.type !== MaterialType.VIDEO) {
      materialData.isAttendanceTrigger = false;
    }

    // Handle file upload if provided
    if (file && createMaterialDto.type !== MaterialType.LINK) {
      try {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join('/app', 'uploads', 'course-materials');
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
        materialData.filePath = path.join('course-materials', fileName); // Relative path for DB
        materialData.fileSize = file.size;
      } catch (error) {
        console.error('Error saving file:', error);
        throw new BadRequestException(`Gagal menyimpan file: ${error.message}`);
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

    // ✅ FIX: Ensure only videos can be attendance triggers
    if (materialData.type && materialData.type !== MaterialType.VIDEO) {
      materialData.isAttendanceTrigger = false;
    } else if (material.type !== MaterialType.VIDEO && materialData.isAttendanceTrigger === true) {
      // Prevent non-video material from having attendance trigger set
      materialData.isAttendanceTrigger = false;
    }

    // Handle file upload if provided
    if (file && updateMaterialDto.type !== MaterialType.LINK) {
      try {
        // Delete old file if exists
        if (material.filePath && fs.existsSync(path.join('/app', 'uploads', material.filePath))) {
          fs.unlinkSync(path.join('/app', 'uploads', material.filePath));
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join('/app', 'uploads', 'course-materials');
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
        materialData.filePath = path.join('course-materials', fileName); // Relative path for DB
        materialData.fileSize = file.size;
      } catch (error) {
        console.error('Error saving file:', error);
        throw new BadRequestException(`Gagal menyimpan file: ${error.message}`);
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
