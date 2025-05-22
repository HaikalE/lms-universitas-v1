import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

    // If user is a student, also get their submission
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

  async submitAssignment(
    assignmentId: string,
    createSubmissionDto: CreateSubmissionDto,
    currentUser: User,
  ) {
    // Verify assignment exists and student has access
    const assignment = await this.findOne(assignmentId, currentUser);

    // Check if already submitted
    const existingSubmission = await this.submissionRepository.findOne({
      where: { assignmentId, studentId: currentUser.id },
    });

    if (existingSubmission && existingSubmission.status === SubmissionStatus.SUBMITTED) {
      throw new BadRequestException('Tugas sudah dikumpulkan sebelumnya');
    }

    const now = new Date();
    const isLate = now > assignment.dueDate;

    if (isLate && !assignment.allowLateSubmission) {
      throw new BadRequestException('Waktu pengumpulan tugas sudah berakhir');
    }

    const submission = existingSubmission || this.submissionRepository.create({
      assignmentId,
      studentId: currentUser.id,
    });

    Object.assign(submission, {
      ...createSubmissionDto,
      status: SubmissionStatus.SUBMITTED,
      submittedAt: now,
      isLate,
    });

    return this.submissionRepository.save(submission);
  }

  async updateSubmission(
    assignmentId: string,
    updateSubmissionDto: UpdateSubmissionDto,
    currentUser: User,
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

    // Check if still allowed to submit
    const now = new Date();
    const isLate = now > submission.assignment.dueDate;

    if (isLate && !submission.assignment.allowLateSubmission) {
      throw new BadRequestException('Waktu pengumpulan tugas sudah berakhir');
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

    const submissions = await this.submissionRepository.find({
      where: { assignmentId },
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

    // Only lecturer of the course or admin can grade
    if (
      currentUser.role !== UserRole.ADMIN &&
      submission.assignment.lecturerId !== currentUser.id
    ) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk menilai submission ini');
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
