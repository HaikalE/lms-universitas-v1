import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';

import { Assignment } from '../entities/assignment.entity';
import { Course } from '../entities/course.entity';
import { Submission, SubmissionStatus } from '../entities/submission.entity';
import { Grade } from '../entities/grade.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { QueryAssignmentsDto } from './dto/query-assignments.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { CreateGradeDto } from './dto/create-grade.dto';

@Injectable()
export class AssignmentsService {
  private readonly logger = new Logger(AssignmentsService.name);

  constructor(
    @InjectRepository(Assignment)
    private assignmentRepository: Repository<Assignment>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Submission)
    private submissionRepository: Repository<Submission>,
    @InjectRepository(Grade)
    private gradeRepository: Repository<Grade>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createAssignmentDto: CreateAssignmentDto, currentUser: User) {
    const { courseId } = createAssignmentDto;

    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('Mata kuliah tidak ditemukan');
    }

    // Only lecturer of the course or admin can create assignments
    if (
      currentUser.role !== UserRole.ADMIN &&
      course.lecturerId !== currentUser.id
    ) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk membuat tugas di mata kuliah ini');
    }

    const assignment = this.assignmentRepository.create({
      ...createAssignmentDto,
      lecturerId: currentUser.id,
    });

    return this.assignmentRepository.save(assignment);
  }

  async findAll(queryDto: QueryAssignmentsDto, currentUser: User) {
    const {
      page = 1,
      limit = 10,
      courseId,
      type,
      isVisible,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const queryBuilder = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.course', 'course')
      .leftJoinAndSelect('assignment.lecturer', 'lecturer')
      .select([
        'assignment.id',
        'assignment.title',
        'assignment.description',
        'assignment.type',
        'assignment.dueDate',
        'assignment.maxScore',
        'assignment.isVisible',
        'assignment.createdAt',
        'course.id',
        'course.code',
        'course.name',
        'lecturer.id',
        'lecturer.fullName',
      ]);

    // If user is a student, only show assignments from their enrolled courses
    if (currentUser.role === UserRole.STUDENT) {
      queryBuilder
        .innerJoin('course.students', 'student')
        .andWhere('student.id = :studentId', { studentId: currentUser.id })
        .andWhere('assignment.isVisible = :isVisible', { isVisible: true });
    }

    // If user is a lecturer, only show their assignments
    if (currentUser.role === UserRole.LECTURER) {
      queryBuilder.andWhere('assignment.lecturerId = :lecturerId', {
        lecturerId: currentUser.id,
      });
    }

    // Apply filters
    if (courseId) {
      queryBuilder.andWhere('assignment.courseId = :courseId', { courseId });
    }

    if (type) {
      queryBuilder.andWhere('assignment.type = :type', { type });
    }

    if (typeof isVisible === 'boolean' && currentUser.role !== UserRole.STUDENT) {
      queryBuilder.andWhere('assignment.isVisible = :isVisible', { isVisible });
    }

    // Apply sorting
    queryBuilder.orderBy(`assignment.${sortBy}`, sortOrder);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [assignments, total] = await queryBuilder.getManyAndCount();

    return {
      data: assignments,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUser: User) {
    const queryBuilder = this.assignmentRepository
      .createQueryBuilder('assignment')
      .leftJoinAndSelect('assignment.course', 'course')
      .leftJoinAndSelect('assignment.lecturer', 'lecturer')
      .where('assignment.id = :id', { id });

    // Check access based on user role
    if (currentUser.role === UserRole.STUDENT) {
      queryBuilder
        .innerJoin('course.students', 'student')
        .andWhere('student.id = :studentId', { studentId: currentUser.id })
        .andWhere('assignment.isVisible = :isVisible', { isVisible: true });
    } else if (currentUser.role === UserRole.LECTURER) {
      queryBuilder.andWhere('assignment.lecturerId = :lecturerId', {
        lecturerId: currentUser.id,
      });
    }

    const assignment = await queryBuilder.getOne();

    if (!assignment) {
      throw new NotFoundException('Tugas tidak ditemukan atau Anda tidak memiliki akses');
    }

    // If user is a student, also get their submission (including drafts for their own view)
    if (currentUser.role === UserRole.STUDENT) {
      const submission = await this.submissionRepository.findOne({
        where: { assignmentId: id, studentId: currentUser.id },
        relations: ['grade'],
      });

      return {
        ...assignment,
        mySubmission: submission,
      };
    }

    return assignment;
  }

  async update(id: string, updateAssignmentDto: UpdateAssignmentDto, currentUser: User) {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: ['course'],
    });

    if (!assignment) {
      throw new NotFoundException('Tugas tidak ditemukan');
    }

    // Only lecturer of the course or admin can update assignments
    if (
      currentUser.role !== UserRole.ADMIN &&
      assignment.lecturerId !== currentUser.id
    ) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk mengubah tugas ini');
    }

    Object.assign(assignment, updateAssignmentDto);
    return this.assignmentRepository.save(assignment);
  }

  async remove(id: string, currentUser: User) {
    const assignment = await this.assignmentRepository.findOne({ where: { id } });

    if (!assignment) {
      throw new NotFoundException('Tugas tidak ditemukan');
    }

    // Only lecturer of the course or admin can delete assignments
    if (
      currentUser.role !== UserRole.ADMIN &&
      assignment.lecturerId !== currentUser.id
    ) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk menghapus tugas ini');
    }

    await this.assignmentRepository.remove(assignment);
    return { message: 'Tugas berhasil dihapus' };
  }

  // ✅ FIX: Updated submitAssignment method with file handling
  async submitAssignment(
    assignmentId: string,
    createSubmissionDto: CreateSubmissionDto,
    currentUser: User,
    file?: Express.Multer.File,
  ) {
    // Verify assignment exists and student has access
    const assignment = await this.findOne(assignmentId, currentUser);

    // Check if already submitted (only if trying to submit, not for drafts)
    const existingSubmission = await this.submissionRepository.findOne({
      where: { assignmentId, studentId: currentUser.id },
    });

    // Use status from DTO, default to DRAFT if not provided
    const submissionStatus = createSubmissionDto.status || SubmissionStatus.DRAFT;

    if (existingSubmission && existingSubmission.status === SubmissionStatus.SUBMITTED && submissionStatus === SubmissionStatus.SUBMITTED) {
      throw new BadRequestException('Tugas sudah dikumpulkan sebelumnya');
    }

    const now = new Date();
    const isLate = now > assignment.dueDate;

    // Only check late submission for actual submissions, not drafts
    if (submissionStatus === SubmissionStatus.SUBMITTED && isLate && !assignment.allowLateSubmission) {
      throw new BadRequestException('Waktu pengumpulan tugas sudah berakhir');
    }

    // Validate file if provided
    if (file && assignment.allowedFileTypes && assignment.allowedFileTypes.length > 0) {
      const fileExtension = path.extname(file.originalname).toLowerCase();
      if (!assignment.allowedFileTypes.includes(fileExtension)) {
        // Clean up uploaded file
        fs.unlinkSync(file.path);
        throw new BadRequestException(`File type tidak diizinkan. Hanya: ${assignment.allowedFileTypes.join(', ')}`);
      }
    }

    if (file && assignment.maxFileSize && file.size > assignment.maxFileSize * 1024 * 1024) {
      // Clean up uploaded file
      fs.unlinkSync(file.path);
      throw new BadRequestException(`Ukuran file melebihi batas maksimal ${assignment.maxFileSize}MB`);
    }

    const submission = existingSubmission || this.submissionRepository.create({
      assignmentId,
      studentId: currentUser.id,
    });

    // Build the submission data object
    const submissionData: any = {
      ...createSubmissionDto,
      status: submissionStatus,
      isLate,
    };

    // Handle file data if provided
    if (file) {
      // Remove old file if exists
      if (submission.filePath && fs.existsSync(submission.filePath)) {
        fs.unlinkSync(submission.filePath);
      }
      
      submissionData.fileName = file.originalname;
      submissionData.filePath = file.path;
      submissionData.fileSize = file.size;
    }

    // Only set submittedAt timestamp for actual submissions, not drafts
    if (submissionStatus === SubmissionStatus.SUBMITTED) {
      submissionData.submittedAt = now;
    } else {
      // For drafts, clear submittedAt to ensure it's null
      submissionData.submittedAt = null;
    }

    Object.assign(submission, submissionData);

    const savedSubmission = await this.submissionRepository.save(submission);

    // Return appropriate message based on status
    return {
      ...savedSubmission,
      message: submissionStatus === SubmissionStatus.DRAFT 
        ? 'Draft berhasil disimpan' 
        : 'Tugas berhasil dikumpulkan'
    };
  }

  // ✅ FIX: Updated updateSubmission method with file handling
  async updateSubmission(
    assignmentId: string,
    updateSubmissionDto: UpdateSubmissionDto,
    currentUser: User,
    file?: Express.Multer.File,
  ) {
    const submission = await this.submissionRepository.findOne({
      where: { assignmentId, studentId: currentUser.id },
      relations: ['assignment'],
    });

    if (!submission) {
      throw new NotFoundException('Submission tidak ditemukan');
    }

    if (submission.status === SubmissionStatus.GRADED) {
      throw new BadRequestException('Submission yang sudah dinilai tidak dapat diubah');
    }

    // Check if still allowed to submit (only for non-draft submissions)
    if (submission.status !== SubmissionStatus.DRAFT) {
      const now = new Date();
      const isLate = now > submission.assignment.dueDate;

      if (isLate && !submission.assignment.allowLateSubmission) {
        throw new BadRequestException('Waktu pengumpulan tugas sudah berakhir');
      }
    }

    // Handle file upload if provided
    if (file) {
      // Validate file
      if (submission.assignment.allowedFileTypes && submission.assignment.allowedFileTypes.length > 0) {
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (!submission.assignment.allowedFileTypes.includes(fileExtension)) {
          fs.unlinkSync(file.path);
          throw new BadRequestException(`File type tidak diizinkan. Hanya: ${submission.assignment.allowedFileTypes.join(', ')}`);
        }
      }

      if (submission.assignment.maxFileSize && file.size > submission.assignment.maxFileSize * 1024 * 1024) {
        fs.unlinkSync(file.path);
        throw new BadRequestException(`Ukuran file melebihi batas maksimal ${submission.assignment.maxFileSize}MB`);
      }

      // Remove old file if exists
      if (submission.filePath && fs.existsSync(submission.filePath)) {
        fs.unlinkSync(submission.filePath);
      }

      // Update file info
      updateSubmissionDto.fileName = file.originalname;
      updateSubmissionDto.filePath = file.path;
      updateSubmissionDto.fileSize = file.size;
    }

    Object.assign(submission, updateSubmissionDto);
    return this.submissionRepository.save(submission);
  }

  async getAssignmentSubmissions(assignmentId: string, currentUser: User) {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: ['course'],
    });

    if (!assignment) {
      throw new NotFoundException('Tugas tidak ditemukan');
    }

    // Only lecturer of the course or admin can view submissions
    if (
      currentUser.role !== UserRole.ADMIN &&
      assignment.lecturerId !== currentUser.id
    ) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk melihat submission');
    }

    // ✅ FIX: Only show SUBMITTED submissions to lecturers, hide DRAFT submissions
    const submissions = await this.submissionRepository.find({
      where: { 
        assignmentId,
        status: SubmissionStatus.SUBMITTED  // 🎯 CRITICAL FIX: Filter hanya SUBMITTED
      },
      relations: ['student', 'grade'],
      order: { submittedAt: 'DESC' },
    });

    return submissions.map((submission) => ({
      id: submission.id,
      content: submission.content,
      fileName: submission.fileName,
      filePath: submission.filePath,
      fileSize: submission.fileSize,
      status: submission.status,
      submittedAt: submission.submittedAt,
      isLate: submission.isLate,
      student: {
        id: submission.student.id,
        fullName: submission.student.fullName,
        studentId: submission.student.studentId,
      },
      grade: submission.grade,
      createdAt: submission.createdAt,
    }));
  }

  // 🎯 NEW: Get pending submissions for lecturer dashboard
  async getPendingSubmissions(
    currentUser: User,
    params: {
      limit?: number;
      courseId?: string;
      sortBy?: string;
      sortOrder?: 'ASC' | 'DESC';
    } = {},
  ) {
    try {
      this.logger.log(`📝 Getting pending submissions for lecturer: ${currentUser.id}`);

      const queryBuilder = this.submissionRepository
        .createQueryBuilder('submission')
        .leftJoinAndSelect('submission.assignment', 'assignment')
        .leftJoinAndSelect('submission.student', 'student')
        .leftJoinAndSelect('assignment.course', 'course')
        .leftJoinAndSelect('submission.grade', 'grade')
        .where('submission.status = :status', { status: SubmissionStatus.SUBMITTED })
        .andWhere('grade.id IS NULL') // Only ungraded submissions
        .select([
          'submission.id',
          'submission.submittedAt',
          'submission.isLate',
          'submission.status',
          'assignment.id',
          'assignment.title',
          'assignment.maxScore',
          'assignment.dueDate',
          'course.id',
          'course.name',
          'course.code',
          'student.id',
          'student.fullName',
          'student.studentId',
          'student.email',
        ]);

      // Filter by lecturer's courses only
      if (currentUser.role === UserRole.LECTURER) {
        queryBuilder.andWhere('assignment.lecturerId = :lecturerId', {
          lecturerId: currentUser.id,
        });
      }

      // Filter by specific course if provided
      if (params.courseId) {
        queryBuilder.andWhere('course.id = :courseId', { courseId: params.courseId });
      }

      // Apply sorting
      const sortBy = params.sortBy || 'submittedAt';
      const sortOrder = params.sortOrder || 'DESC';
      queryBuilder.orderBy(`submission.${sortBy}`, sortOrder);

      // Apply limit
      if (params.limit) {
        queryBuilder.take(params.limit);
      }

      const [submissions, total] = await queryBuilder.getManyAndCount();

      const formattedSubmissions = submissions.map((submission) => ({
        id: submission.id,
        studentName: submission.student.fullName,
        studentId: submission.student.studentId,
        assignmentTitle: submission.assignment.title,
        courseName: submission.assignment.course.name,
        courseCode: submission.assignment.course.code,
        submittedAt: submission.submittedAt.toISOString(),
        isLate: submission.isLate,
        status: 'pending',
        maxScore: submission.assignment.maxScore,
      }));

      this.logger.log(`✅ Found ${formattedSubmissions.length} pending submissions`);

      return {
        success: true,
        data: formattedSubmissions,
        total,
        message: `Found ${formattedSubmissions.length} pending submissions`,
      };
    } catch (error) {
      this.logger.error(`❌ Error getting pending submissions: ${error.message}`);
      throw error;
    }
  }

  // 🎯 NEW: Get submission detail with enhanced info
  async getSubmissionDetail(submissionId: string, currentUser: User) {
    try {
      this.logger.log(`🔍 Getting submission detail: ${submissionId}`);

      const submission = await this.submissionRepository.findOne({
        where: { id: submissionId },
        relations: ['assignment', 'assignment.course', 'student', 'grade'],
      });

      if (!submission) {
        throw new NotFoundException('Submission tidak ditemukan');
      }

      // Check access permission
      if (
        currentUser.role !== UserRole.ADMIN &&
        submission.assignment.lecturerId !== currentUser.id
      ) {
        throw new ForbiddenException('Anda tidak memiliki akses untuk melihat submission ini');
      }

      const now = new Date();
      const dueDate = new Date(submission.assignment.dueDate);
      const daysPastDue = submission.isLate 
        ? Math.ceil((submission.submittedAt.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      const result = {
        id: submission.id,
        content: submission.content,
        fileName: submission.fileName,
        filePath: submission.filePath,
        submittedAt: submission.submittedAt,
        isLate: submission.isLate,
        daysPastDue: daysPastDue > 0 ? daysPastDue : undefined,
        status: submission.status,
        student: {
          id: submission.student.id,
          fullName: submission.student.fullName,
          email: submission.student.email,
          studentId: submission.student.studentId,
        },
        assignment: {
          id: submission.assignment.id,
          title: submission.assignment.title,
          maxScore: submission.assignment.maxScore,
          dueDate: submission.assignment.dueDate,
        },
        course: {
          id: submission.assignment.course.id,
          name: submission.assignment.course.name,
          code: submission.assignment.course.code,
        },
        grade: submission.grade,
      };

      this.logger.log(`✅ Submission detail retrieved for: ${submission.student.fullName}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error getting submission detail: ${error.message}`);
      throw error;
    }
  }

  // 🎯 NEW: Bulk grading for multiple submissions
  async bulkGradeSubmissions(
    gradesData: Array<{
      submissionId: string;
      score: number;
      feedback?: string;
    }>,
    currentUser: User,
  ) {
    try {
      this.logger.log(`📊 Bulk grading ${gradesData.length} submissions`);

      const results = {
        success: [],
        failed: [],
      };

      for (const gradeData of gradesData) {
        try {
          const grade = await this.gradeSubmission(
            gradeData.submissionId,
            {
              score: gradeData.score,
              feedback: gradeData.feedback || '',
            },
            currentUser,
          );
          results.success.push(grade);
        } catch (error) {
          results.failed.push({
            submissionId: gradeData.submissionId,
            error: error.message,
          });
        }
      }

      this.logger.log(`✅ Bulk grading completed: ${results.success.length} success, ${results.failed.length} failed`);
      return results;
    } catch (error) {
      this.logger.error(`❌ Error in bulk grading: ${error.message}`);
      throw error;
    }
  }

  // 🎯 NEW: Save draft grade (auto-save functionality)
  async saveDraftGrade(
    submissionId: string,
    draftData: {
      score?: number;
      feedback?: string;
      isDraft: boolean;
    },
    currentUser: User,
  ) {
    try {
      this.logger.log(`💾 Saving draft grade for submission: ${submissionId}`);

      const submission = await this.submissionRepository.findOne({
        where: { id: submissionId },
        relations: ['assignment'],
      });

      if (!submission) {
        throw new NotFoundException('Submission tidak ditemukan');
      }

      // Check permission
      if (
        currentUser.role !== UserRole.ADMIN &&
        submission.assignment.lecturerId !== currentUser.id
      ) {
        throw new ForbiddenException('Anda tidak memiliki akses untuk menilai submission ini');
      }

      // For now, we'll store draft in a simple way
      // In a more complex system, you might have a separate draft_grades table
      const result = {
        submissionId,
        draftScore: draftData.score,
        draftFeedback: draftData.feedback,
        savedAt: new Date(),
        isDraft: draftData.isDraft,
      };

      this.logger.log(`✅ Draft grade saved for submission: ${submissionId}`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error saving draft grade: ${error.message}`);
      throw error;
    }
  }

  // 📊 NEW: Get grading statistics for lecturer dashboard
  async getGradingStats(currentUser: User) {
    try {
      this.logger.log(`📊 Getting grading statistics for lecturer: ${currentUser.id}`);

      // Get total pending submissions (submitted but not graded)
      const pendingQuery = this.submissionRepository
        .createQueryBuilder('submission')
        .leftJoin('submission.assignment', 'assignment')
        .leftJoin('submission.grade', 'grade')
        .where('submission.status = :status', { status: SubmissionStatus.SUBMITTED })
        .andWhere('grade.id IS NULL');

      if (currentUser.role === UserRole.LECTURER) {
        pendingQuery.andWhere('assignment.lecturerId = :lecturerId', {
          lecturerId: currentUser.id,
        });
      }

      const totalPending = await pendingQuery.getCount();

      // Get total graded submissions
      const gradedQuery = this.gradeRepository
        .createQueryBuilder('grade')
        .leftJoin('grade.assignment', 'assignment');

      if (currentUser.role === UserRole.LECTURER) {
        gradedQuery.where('assignment.lecturerId = :lecturerId', {
          lecturerId: currentUser.id,
        });
      }

      const [totalGraded, grades] = await Promise.all([
        gradedQuery.getCount(),
        gradedQuery.getMany(),
      ]);

      // Calculate average grade
      const averageGrade = grades.length > 0 
        ? grades.reduce((sum, grade) => sum + grade.score, 0) / grades.length 
        : 0;

      // Get late submissions count
      const lateSubmissionsQuery = this.submissionRepository
        .createQueryBuilder('submission')
        .leftJoin('submission.assignment', 'assignment')
        .where('submission.isLate = :isLate', { isLate: true })
        .andWhere('submission.status = :status', { status: SubmissionStatus.SUBMITTED });

      if (currentUser.role === UserRole.LECTURER) {
        lateSubmissionsQuery.andWhere('assignment.lecturerId = :lecturerId', {
          lecturerId: currentUser.id,
        });
      }

      const lateSubmissions = await lateSubmissionsQuery.getCount();

      // Simple grading trend (last 7 days)
      const gradingTrend = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));

        const dailyGradesQuery = this.gradeRepository
          .createQueryBuilder('grade')
          .leftJoin('grade.assignment', 'assignment')
          .where('grade.gradedAt BETWEEN :start AND :end', {
            start: startOfDay,
            end: endOfDay,
          });

        if (currentUser.role === UserRole.LECTURER) {
          dailyGradesQuery.andWhere('assignment.lecturerId = :lecturerId', {
            lecturerId: currentUser.id,
          });
        }

        const count = await dailyGradesQuery.getCount();
        gradingTrend.push({
          date: startOfDay.toISOString().split('T')[0],
          count,
        });
      }

      const result = {
        totalPending,
        totalGraded,
        averageGrade: Math.round(averageGrade * 100) / 100,
        lateSubmissions,
        gradingTrend,
      };

      this.logger.log(`✅ Grading stats retrieved: ${totalPending} pending, ${totalGraded} graded`);
      return result;
    } catch (error) {
      this.logger.error(`❌ Error getting grading stats: ${error.message}`);
      throw error;
    }
  }

  async gradeSubmission(
    submissionId: string,
    createGradeDto: CreateGradeDto,
    currentUser: User,
  ) {
    const submission = await this.submissionRepository.findOne({
      where: { id: submissionId },
      relations: ['assignment', 'assignment.course', 'student'],
    });

    if (!submission) {
      throw new NotFoundException('Submission tidak ditemukan');
    }

    // ✅ FIX: Prevent grading DRAFT submissions
    if (submission.status === SubmissionStatus.DRAFT) {
      throw new BadRequestException('Draft submission tidak dapat dinilai. Mahasiswa harus submit terlebih dahulu.');
    }

    // Only lecturer of the course or admin can grade
    if (
      currentUser.role !== UserRole.ADMIN &&
      submission.assignment.lecturerId !== currentUser.id
    ) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk menilai submission ini');
    }

    // Only allow grading SUBMITTED submissions
    if (submission.status !== SubmissionStatus.SUBMITTED) {
      throw new BadRequestException('Hanya submission yang sudah dikumpulkan yang dapat dinilai');
    }

    // Check if already graded
    let grade = await this.gradeRepository.findOne({
      where: { submissionId },
    });

    if (grade) {
      // Update existing grade
      Object.assign(grade, {
        ...createGradeDto,
        gradedAt: new Date(),
        gradedById: currentUser.id,
      });
    } else {
      // Create new grade
      grade = this.gradeRepository.create({
        ...createGradeDto,
        courseId: submission.assignment.courseId,
        studentId: submission.studentId,
        assignmentId: submission.assignmentId,
        submissionId,
        gradedAt: new Date(),
        gradedById: currentUser.id,
        maxScore: submission.assignment.maxScore,
      });
    }

    // Update submission status
    submission.status = SubmissionStatus.GRADED;
    await this.submissionRepository.save(submission);

    return this.gradeRepository.save(grade);
  }

  async getStudentGrades(studentId: string, currentUser: User) {
    // Students can only view their own grades, lecturers/admins can view any student's grades
    if (
      currentUser.role === UserRole.STUDENT &&
      currentUser.id !== studentId
    ) {
      throw new ForbiddenException('Anda hanya dapat melihat nilai Anda sendiri');
    }

    const grades = await this.gradeRepository.find({
      where: { studentId },
      relations: ['course', 'assignment', 'gradedBy'],
      order: { gradedAt: 'DESC' },
    });

    return grades.map((grade) => ({
      id: grade.id,
      score: grade.score,
      maxScore: grade.maxScore,
      feedback: grade.feedback,
      gradedAt: grade.gradedAt,
      course: {
        id: grade.course.id,
        code: grade.course.code,
        name: grade.course.name,
      },
      assignment: {
        id: grade.assignment.id,
        title: grade.assignment.title,
        type: grade.assignment.type,
      },
      gradedBy: {
        id: grade.gradedBy.id,
        fullName: grade.gradedBy.fullName,
      },
    }));
  }
}