import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { 
  Attendance, 
  AttendanceStatus, 
  AttendanceType 
} from '../entities/attendance.entity';
import { User } from '../entities/user.entity';
import { Course } from '../entities/course.entity';
import { CourseMaterial } from '../entities/course-material.entity';
import {
  CreateAttendanceDto,
  UpdateAttendanceDto,
  AttendanceQueryDto,
  AutoSubmitAttendanceDto,
  AttendanceResponseDto,
  AttendanceStatsDto,
} from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);
  private readonly attendanceTimeWindow: number;

  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    
    @InjectRepository(CourseMaterial)
    private readonly courseMaterialRepository: Repository<CourseMaterial>,
    
    private readonly configService: ConfigService,
  ) {
    // Get attendance time window from environment (default 24 hours)
    this.attendanceTimeWindow = this.configService.get<number>(
      'ATTENDANCE_TIME_WINDOW',
      24,
    );
  }

  /**
   * Auto-submit attendance when video is completed
   * This is called from VideoProgressService when completion threshold is reached
   */
  async autoSubmitAttendance(
    autoSubmitDto: AutoSubmitAttendanceDto,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AttendanceResponseDto> {
    const { studentId, courseId, triggerMaterialId, completionPercentage, metadata } = autoSubmitDto;

    // 🔍 Validate student exists
    const student = await this.userRepository.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    // 🔍 Validate course exists
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    // 🔍 Validate material exists and is attendance trigger
    const material = await this.courseMaterialRepository.findOne({
      where: { id: triggerMaterialId },
    });

    if (!material) {
      throw new NotFoundException(`Material with ID ${triggerMaterialId} not found`);
    }

    if (!material.isAttendanceTrigger) {
      throw new BadRequestException('This material is not configured to trigger attendance');
    }

    // 📅 Check if attendance already exists for today
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const existingAttendance = await this.attendanceRepository.findOne({
      where: {
        studentId,
        courseId,
        attendanceDate: Between(startOfDay, endOfDay),
      },
    });

    if (existingAttendance) {
      this.logger.warn(`Attendance already exists for student ${studentId} in course ${courseId} on ${today.toISOString().split('T')[0]}`);
      throw new ConflictException('Attendance for today already submitted');
    }

    // ✅ Create auto attendance record
    const attendance = this.attendanceRepository.create({
      studentId,
      courseId,
      triggerMaterialId,
      student,
      course,
      triggerMaterial: material,
      attendanceDate: startOfDay,
      status: AttendanceStatus.AUTO_PRESENT,
      attendanceType: AttendanceType.VIDEO_COMPLETION,
      submittedAt: new Date(),
      notes: `Auto-submitted via video completion (${completionPercentage.toFixed(1)}%)`,
      metadata: {
        videoProgress: completionPercentage,
        completionTime: new Date(),
        ipAddress,
        userAgent,
        ...metadata,
      },
    });

    const savedAttendance = await this.attendanceRepository.save(attendance);

    this.logger.log(`✅ Auto-attendance submitted: Student ${student.fullName} (${student.studentId}) - Course ${course.title} - ${completionPercentage.toFixed(1)}% completion`);

    return this.mapToResponseDto(savedAttendance);
  }

  /**
   * Create manual attendance record
   */
  async createAttendance(
    createDto: CreateAttendanceDto,
    createdBy?: string,
  ): Promise<AttendanceResponseDto> {
    // 🔍 Validate student and course exist
    const student = await this.userRepository.findOne({
      where: { id: createDto.studentId },
    });

    const course = await this.courseRepository.findOne({
      where: { id: createDto.courseId },
    });

    if (!student || !course) {
      throw new NotFoundException('Student or course not found');
    }

    // 📅 Check for duplicate attendance on same date
    const attendanceDate = new Date(createDto.attendanceDate);
    const existingAttendance = await this.attendanceRepository.findOne({
      where: {
        studentId: createDto.studentId,
        courseId: createDto.courseId,
        attendanceDate,
      },
    });

    if (existingAttendance) {
      throw new ConflictException('Attendance for this date already exists');
    }

    // ✅ Create attendance record
    const attendance = this.attendanceRepository.create({
      ...createDto,
      student,
      course,
      attendanceDate,
      submittedAt: new Date(),
      verifiedBy: createdBy,
      verifiedAt: createdBy ? new Date() : null,
    });

    const savedAttendance = await this.attendanceRepository.save(attendance);
    return this.mapToResponseDto(savedAttendance);
  }

  /**
   * Update existing attendance record
   */
  async updateAttendance(
    attendanceId: string,
    updateDto: UpdateAttendanceDto,
    updatedBy?: string,
  ): Promise<AttendanceResponseDto> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id: attendanceId },
      relations: ['student', 'course', 'triggerMaterial'],
    });

    if (!attendance) {
      throw new NotFoundException(`Attendance with ID ${attendanceId} not found`);
    }

    // Update fields
    Object.assign(attendance, updateDto);
    
    if (updatedBy) {
      attendance.verifiedBy = updatedBy;
      attendance.verifiedAt = new Date();
    }

    const savedAttendance = await this.attendanceRepository.save(attendance);
    return this.mapToResponseDto(savedAttendance);
  }

  /**
   * Get attendance records with filtering and pagination
   */
  async getAttendances(queryDto: AttendanceQueryDto): Promise<{
    data: AttendanceResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      courseId,
      studentId,
      startDate,
      endDate,
      status,
      attendanceType,
      page = 1,
      limit = 20,
    } = queryDto;

    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.student', 'student')
      .leftJoinAndSelect('attendance.course', 'course')
      .leftJoinAndSelect('attendance.triggerMaterial', 'material');

    // Apply filters
    if (courseId) {
      queryBuilder.andWhere('attendance.courseId = :courseId', { courseId });
    }

    if (studentId) {
      queryBuilder.andWhere('attendance.studentId = :studentId', { studentId });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('attendance.attendanceDate BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    if (status) {
      queryBuilder.andWhere('attendance.status = :status', { status });
    }

    if (attendanceType) {
      queryBuilder.andWhere('attendance.attendanceType = :attendanceType', { attendanceType });
    }

    // Order by date descending
    queryBuilder.orderBy('attendance.attendanceDate', 'DESC');

    // Pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [attendances, total] = await queryBuilder.getManyAndCount();

    return {
      data: attendances.map(a => this.mapToResponseDto(a)),
      total,
      page,
      limit,
    };
  }

  /**
   * Get attendance statistics for a course
   */
  async getCourseAttendanceStats(
    courseId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<AttendanceStatsDto> {
    // Get course enrollment count
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['students'],
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    const totalStudents = course.students.length;

    // Build date filter
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        attendanceDate: Between(new Date(startDate), new Date(endDate)),
      };
    }

    // Get attendance counts by status
    const stats = await this.attendanceRepository
      .createQueryBuilder('attendance')
      .select('attendance.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('attendance.courseId = :courseId', { courseId })
      .andWhere(dateFilter)
      .groupBy('attendance.status')
      .getRawMany();

    // Process stats
    let presentCount = 0;
    let absentCount = 0;
    let excusedCount = 0;
    let lateCount = 0;
    let autoAttendanceCount = 0;

    stats.forEach(stat => {
      const count = parseInt(stat.count);
      switch (stat.status) {
        case AttendanceStatus.PRESENT:
          presentCount = count;
          break;
        case AttendanceStatus.ABSENT:
          absentCount = count;
          break;
        case AttendanceStatus.EXCUSED:
          excusedCount = count;
          break;
        case AttendanceStatus.LATE:
          lateCount = count;
          break;
        case AttendanceStatus.AUTO_PRESENT:
          autoAttendanceCount = count;
          break;
      }
    });

    const totalAttendanceRecords = presentCount + autoAttendanceCount + excusedCount + lateCount;
    const attendanceRate = totalStudents > 0 
      ? (totalAttendanceRecords / totalStudents * 100)
      : 0;

    return {
      courseId,
      totalStudents,
      presentCount,
      absentCount,
      excusedCount,
      lateCount,
      autoAttendanceCount,
      attendanceRate: parseFloat(attendanceRate.toFixed(2)),
    };
  }

  /**
   * Get student's attendance for a course
   */
  async getStudentAttendance(
    studentId: string,
    courseId: string,
  ): Promise<AttendanceResponseDto[]> {
    const attendances = await this.attendanceRepository.find({
      where: { studentId, courseId },
      relations: ['course', 'triggerMaterial'],
      order: { attendanceDate: 'DESC' },
    });

    return attendances.map(a => this.mapToResponseDto(a));
  }

  /**
   * Check if student can get auto-attendance today
   */
  async canAutoSubmitToday(studentId: string, courseId: string): Promise<boolean> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const existingAttendance = await this.attendanceRepository.findOne({
      where: {
        studentId,
        courseId,
        attendanceDate: Between(startOfDay, endOfDay),
      },
    });

    return !existingAttendance;
  }

  /**
   * Get course attendance grouped by week with student details
   * For lecturer dashboard to see attendance by week/pertemuan
   */
  async getCourseAttendanceByWeek(
    courseId: string,
    week?: string,
    startDate?: string,
    endDate?: string,
  ): Promise<{
    attendancesByWeek: any;
    students: any[];
    weeklyStats: any[];
  }> {
    // Get course enrollment count
    const course = await this.courseRepository.findOne({
      where: { id: courseId },
      relations: ['students'],
    });

    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }

    const students = course.students.map(student => ({
      id: student.id,
      fullName: student.fullName,
      studentId: student.studentId,
      email: student.email,
    }));

    // Build query for attendances
    const queryBuilder = this.attendanceRepository
      .createQueryBuilder('attendance')
      .leftJoinAndSelect('attendance.student', 'student')
      .leftJoinAndSelect('attendance.triggerMaterial', 'material')
      .where('attendance.courseId = :courseId', { courseId })
      .orderBy('attendance.attendanceDate', 'DESC')
      .addOrderBy('student.fullName', 'ASC');

    // Apply date filters
    if (startDate && endDate) {
      queryBuilder.andWhere('attendance.attendanceDate BETWEEN :startDate AND :endDate', {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
      });
    }

    const attendances = await queryBuilder.getMany();

    // Group attendances by week if materials have week info
    const attendancesByWeek: any = {};
    const weeklyStats: any = {};

    // Initialize weeks 1-16
    for (let weekNum = 1; weekNum <= 16; weekNum++) {
      attendancesByWeek[weekNum] = [];
      weeklyStats[weekNum] = {
        week: weekNum,
        totalStudents: students.length,
        presentCount: 0,
        absentCount: 0,
        autoAttendanceCount: 0,
        attendanceRate: 0,
      };
    }

    // Group attendances by date and categorize
    const attendancesByDate: any = {};
    attendances.forEach(attendance => {
      const dateKey = attendance.attendanceDate.toISOString().split('T')[0];
      if (!attendancesByDate[dateKey]) {
        attendancesByDate[dateKey] = [];
      }
      attendancesByDate[dateKey].push({
        ...this.mapToResponseDto(attendance),
        week: attendance.triggerMaterial?.week || this.getWeekFromDate(attendance.attendanceDate),
      });
    });

    // Calculate attendance for each week based on date patterns
    Object.entries(attendancesByDate).forEach(([date, dayAttendances]: [string, any[]]) => {
      // Determine week number (you might want to adjust this logic)
      const weekNumber = dayAttendances[0]?.week || this.getWeekFromDate(new Date(date));
      
      if (weekNumber >= 1 && weekNumber <= 16) {
        attendancesByWeek[weekNumber].push({
          date,
          attendances: dayAttendances,
          presentStudents: dayAttendances.filter(a => 
            a.status === 'present' || a.status === 'auto_present' || a.status === 'late'
          ),
          absentStudents: students.filter(student => 
            !dayAttendances.some(a => a.studentId === student.id)
          ),
        });

        // Update weekly stats
        const presentCount = dayAttendances.filter(a => 
          a.status === 'present' || a.status === 'auto_present' || a.status === 'late'
        ).length;
        const autoCount = dayAttendances.filter(a => a.status === 'auto_present').length;
        
        weeklyStats[weekNumber].presentCount += presentCount;
        weeklyStats[weekNumber].autoAttendanceCount += autoCount;
        weeklyStats[weekNumber].attendanceRate = students.length > 0 
          ? (weeklyStats[weekNumber].presentCount / students.length * 100) 
          : 0;
      }
    });

    // Filter by specific week if requested
    if (week) {
      const weekNum = parseInt(week);
      if (weekNum >= 1 && weekNum <= 16) {
        return {
          attendancesByWeek: { [weekNum]: attendancesByWeek[weekNum] },
          students,
          weeklyStats: [weeklyStats[weekNum]],
        };
      }
    }

    return {
      attendancesByWeek: Object.entries(attendancesByWeek)
        .filter(([_, data]: [string, any]) => data.length > 0)
        .reduce((acc, [week, data]) => {
          acc[week] = data;
          return acc;
        }, {} as any),
      students,
      weeklyStats: Object.values(weeklyStats).filter((stat: any) => stat.presentCount > 0),
    };
  }

  /**
   * Helper method to determine week number from date
   * You can customize this logic based on your academic calendar
   */
  private getWeekFromDate(date: Date): number {
    // Simple calculation - you might want to adjust based on semester start date
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((date.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));
    return Math.min(Math.max(weekNumber % 16 || 16, 1), 16);
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(attendance: Attendance): AttendanceResponseDto {
    return {
      id: attendance.id,
      studentId: attendance.studentId,
      courseId: attendance.courseId,
      triggerMaterialId: attendance.triggerMaterialId,
      attendanceDate: attendance.attendanceDate.toISOString().split('T')[0],
      status: attendance.status,
      attendanceType: attendance.attendanceType,
      notes: attendance.notes,
      submittedAt: attendance.submittedAt,
      verifiedBy: attendance.verifiedBy,
      verifiedAt: attendance.verifiedAt,
      metadata: attendance.metadata,
      createdAt: attendance.createdAt,
      updatedAt: attendance.updatedAt,
      student: attendance.student ? {
        id: attendance.student.id,
        fullName: attendance.student.fullName,
        studentId: attendance.student.studentId,
        email: attendance.student.email,
      } : undefined,
      course: attendance.course ? {
        id: attendance.course.id,
        title: attendance.course.title,
        code: attendance.course.code,
      } : undefined,
      triggerMaterial: attendance.triggerMaterial ? {
        id: attendance.triggerMaterial.id,
        title: attendance.triggerMaterial.title,
        type: attendance.triggerMaterial.type,
      } : undefined,
    };
  }
}
