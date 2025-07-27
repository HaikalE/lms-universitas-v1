import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
  Ip,
  Headers,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { AttendanceService } from './attendance.service';
import {
  CreateAttendanceDto,
  UpdateAttendanceDto,
  AttendanceQueryDto,
  AutoSubmitAttendanceDto,
  AttendanceResponseDto,
  AttendanceStatsDto,
} from './dto/attendance.dto';

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**
   * Auto-submit attendance via video completion (Internal API)
   * This is called from VideoProgressService, not directly from frontend
   * 
   * POST /api/attendance/auto-submit
   */
  @Post('auto-submit')
  @HttpCode(HttpStatus.CREATED)
  async autoSubmitAttendance(
    @Body() autoSubmitDto: AutoSubmitAttendanceDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<AttendanceResponseDto> {
    return this.attendanceService.autoSubmitAttendance(
      autoSubmitDto,
      ipAddress,
      userAgent,
    );
  }

  /**
   * 🆕 Cleanup null attendance dates (Admin only)
   * Fixes database integrity issues
   * 
   * POST /api/attendance/cleanup-null-dates
   */
  @Post('cleanup-null-dates')
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async cleanupNullAttendanceDates(): Promise<{
    success: boolean;
    fixed: number;
    deleted: number;
    message: string;
  }> {
    try {
      const result = await this.attendanceService.cleanupNullAttendanceDates();
      
      return {
        success: true,
        fixed: result.fixed,
        deleted: result.deleted,
        message: `Successfully processed ${result.fixed + result.deleted} records. Fixed: ${result.fixed}, Deleted: ${result.deleted}`,
      };
    } catch (error) {
      return {
        success: false,
        fixed: 0,
        deleted: 0,
        message: `Cleanup failed: ${error.message}`,
      };
    }
  }

  /**
   * Create manual attendance record (Lecturer/Admin only)
   * 
   * POST /api/attendance
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async createAttendance(
    @Request() req,
    @Body() createDto: CreateAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    const createdBy = req.user.id;
    return this.attendanceService.createAttendance(createDto, createdBy);
  }

  /**
   * Update attendance record (Lecturer/Admin only)
   * 
   * PUT /api/attendance/:id
   */
  @Put(':id')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async updateAttendance(
    @Request() req,
    @Param('id', ParseUUIDPipe) attendanceId: string,
    @Body() updateDto: UpdateAttendanceDto,
  ): Promise<AttendanceResponseDto> {
    const updatedBy = req.user.id;
    return this.attendanceService.updateAttendance(attendanceId, updateDto, updatedBy);
  }

  /**
   * Get attendance records with filtering (Lecturer/Admin only)
   * 
   * GET /api/attendance
   */
  @Get()
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getAttendances(
    @Query() queryDto: AttendanceQueryDto,
  ) {
    return this.attendanceService.getAttendances(queryDto);
  }

  /**
   * 🆕 Get weekly attendance summary for course (Lecturer/Admin only)
   * Shows attendance breakdown by week with required videos info
   * 
   * GET /api/attendance/course/:courseId/weekly-summary
   */
  @Get('course/:courseId/weekly-summary')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getWeeklyAttendanceSummary(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query('startWeek', ParseIntPipe) startWeek?: number,
    @Query('endWeek', ParseIntPipe) endWeek?: number,
  ) {
    return this.attendanceService.getWeeklyAttendanceSummary(
      courseId,
      startWeek || 1,
      endWeek || 16
    );
  }

  /**
   * 🆕 Get current user's weekly attendance status (Student)
   * Shows which weeks have attendance and which don't
   * 
   * GET /api/attendance/my-weekly-status/course/:courseId
   */
  @Get('my-weekly-status/course/:courseId')
  @Roles(UserRole.STUDENT)
  @UseGuards(RolesGuard)
  async getMyWeeklyAttendanceStatus(
    @Request() req,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query('startWeek', ParseIntPipe) startWeek?: number,
    @Query('endWeek', ParseIntPipe) endWeek?: number,
  ) {
    const studentId = req.user.id;
    return this.attendanceService.getStudentWeeklyAttendanceStatus(
      studentId,
      courseId,
      startWeek || 1,
      endWeek || 16
    );
  }

  /**
   * 🆕 Get specific student's weekly attendance status (Lecturer/Admin only)
   * 
   * GET /api/attendance/student/:studentId/weekly-status/course/:courseId
   */
  @Get('student/:studentId/weekly-status/course/:courseId')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getStudentWeeklyAttendanceStatus(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query('startWeek', ParseIntPipe) startWeek?: number,
    @Query('endWeek', ParseIntPipe) endWeek?: number,
  ) {
    return this.attendanceService.getStudentWeeklyAttendanceStatus(
      studentId,
      courseId,
      startWeek || 1,
      endWeek || 16
    );
  }

  /**
   * 🆕 Check if student has attendance for specific week
   * 
   * GET /api/attendance/check-weekly/:studentId/course/:courseId/week/:week
   */
  @Get('check-weekly/:studentId/course/:courseId/week/:week')
  @Roles(UserRole.LECTURER, UserRole.ADMIN, UserRole.STUDENT)
  @UseGuards(RolesGuard)
  async checkWeeklyAttendance(
    @Request() req,
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('week', ParseIntPipe) week: number,
  ) {
    // Students can only check their own attendance
    if (req.user.role === UserRole.STUDENT && req.user.id !== studentId) {
      throw new Error('Students can only check their own attendance');
    }

    const hasAttendance = await this.attendanceService.hasWeeklyAttendance(
      studentId,
      courseId,
      week
    );

    return {
      studentId,
      courseId,
      week,
      hasAttendance,
      checkedAt: new Date(),
    };
  }

  /**
   * Get current user's attendance for a course (Student)
   * 
   * GET /api/attendance/my-attendance/course/:courseId
   */
  @Get('my-attendance/course/:courseId')
  @Roles(UserRole.STUDENT)
  @UseGuards(RolesGuard)
  async getMyAttendance(
    @Request() req,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ): Promise<AttendanceResponseDto[]> {
    const studentId = req.user.id;
    return this.attendanceService.getStudentAttendance(studentId, courseId);
  }

  /**
   * Get specific student's attendance (Lecturer/Admin only)
   * 
   * GET /api/attendance/student/:studentId/course/:courseId
   */
  @Get('student/:studentId/course/:courseId')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getStudentAttendance(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ): Promise<AttendanceResponseDto[]> {
    return this.attendanceService.getStudentAttendance(studentId, courseId);
  }

  /**
   * Get course attendance statistics (Lecturer/Admin only)
   * 
   * GET /api/attendance/course/:courseId/stats
   */
  @Get('course/:courseId/stats')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getCourseStats(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AttendanceStatsDto> {
    return this.attendanceService.getCourseAttendanceStats(courseId, startDate, endDate);
  }

  /**
   * Get course attendance by week for lecturer dashboard
   * 
   * GET /api/attendance/course/:courseId/by-week
   */
  @Get('course/:courseId/by-week')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getCourseAttendanceByWeek(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query('week') week?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.attendanceService.getCourseAttendanceByWeek(courseId, week, startDate, endDate);
  }

  /**
   * Check if current user can auto-submit attendance today
   * 
   * GET /api/attendance/can-auto-submit/course/:courseId
   */
  @Get('can-auto-submit/course/:courseId')
  @Roles(UserRole.STUDENT)
  @UseGuards(RolesGuard)
  async canAutoSubmitToday(
    @Request() req,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ): Promise<{ canAutoSubmit: boolean }> {
    const studentId = req.user.id;
    const canAutoSubmit = await this.attendanceService.canAutoSubmitToday(studentId, courseId);
    return { canAutoSubmit };
  }

  /**
   * Get attendance summary for dashboard (current user)
   * 
   * GET /api/attendance/my-summary
   */
  @Get('my-summary')
  @Roles(UserRole.STUDENT)
  @UseGuards(RolesGuard)
  async getMyAttendanceSummary(
    @Request() req,
    @Query('courseId') courseId?: string,
  ) {
    const studentId = req.user.id;
    
    if (courseId) {
      // Get attendance for specific course
      const attendances = await this.attendanceService.getStudentAttendance(studentId, courseId);
      
      const summary = {
        totalDays: attendances.length,
        presentDays: attendances.filter(a => 
          a.status === 'present' || a.status === 'auto_present' || a.status === 'late'
        ).length,
        absentDays: attendances.filter(a => a.status === 'absent').length,
        excusedDays: attendances.filter(a => a.status === 'excused').length,
        autoAttendanceDays: attendances.filter(a => a.status === 'auto_present').length,
        attendanceRate: 0,
      };
      
      summary.attendanceRate = summary.totalDays > 0 
        ? (summary.presentDays / summary.totalDays * 100) 
        : 0;
      
      return {
        courseId,
        summary,
        recentAttendances: attendances.slice(0, 10), // Last 10 records
      };
    }
    
    // TODO: Get summary across all courses if no courseId provided
    return { message: 'Please provide courseId parameter' };
  }

  /**
   * Get today's attendance status for current user
   * 
   * GET /api/attendance/today-status/course/:courseId
   */
  @Get('today-status/course/:courseId')
  @Roles(UserRole.STUDENT)
  @UseGuards(RolesGuard)
  async getTodayAttendanceStatus(
    @Request() req,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    const studentId = req.user.id;
    const canAutoSubmit = await this.attendanceService.canAutoSubmitToday(studentId, courseId);
    
    if (!canAutoSubmit) {
      // Get today's attendance record
      const attendances = await this.attendanceService.getStudentAttendance(studentId, courseId);
      const today = new Date().toISOString().split('T')[0];
      const todayAttendance = attendances.find(a => a.attendanceDate === today);
      
      return {
        hasAttendanceToday: true,
        canAutoSubmit: false,
        attendance: todayAttendance,
      };
    }
    
    return {
      hasAttendanceToday: false,
      canAutoSubmit: true,
      attendance: null,
    };
  }

  /**
   * 🆕 Get enhanced attendance summary with weekly breakdown
   * Shows weekly attendance status for better insights
   * 
   * GET /api/attendance/enhanced-summary/course/:courseId
   */
  @Get('enhanced-summary/course/:courseId')
  @Roles(UserRole.STUDENT)
  @UseGuards(RolesGuard)
  async getEnhancedAttendanceSummary(
    @Request() req,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    const studentId = req.user.id;
    
    // Get regular attendance records
    const attendances = await this.attendanceService.getStudentAttendance(studentId, courseId);
    
    // Get weekly attendance status
    const weeklyStatus = await this.attendanceService.getStudentWeeklyAttendanceStatus(
      studentId,
      courseId
    );

    // Calculate summary stats
    const summary = {
      totalDays: attendances.length,
      presentDays: attendances.filter(a => 
        a.status === 'present' || a.status === 'auto_present' || a.status === 'late'
      ).length,
      absentDays: attendances.filter(a => a.status === 'absent').length,
      excusedDays: attendances.filter(a => a.status === 'excused').length,
      autoAttendanceDays: attendances.filter(a => a.status === 'auto_present').length,
      attendanceRate: 0,
      weeklyStats: {
        totalWeeks: weeklyStatus.length,
        weeksWithAttendance: weeklyStatus.filter(w => w.hasAttendance).length,
        weeklyAttendanceRate: 0,
      },
    };
    
    summary.attendanceRate = summary.totalDays > 0 
      ? (summary.presentDays / summary.totalDays * 100) 
      : 0;
      
    summary.weeklyStats.weeklyAttendanceRate = summary.weeklyStats.totalWeeks > 0
      ? (summary.weeklyStats.weeksWithAttendance / summary.weeklyStats.totalWeeks * 100)
      : 0;
    
    return {
      courseId,
      summary,
      weeklyStatus,
      recentAttendances: attendances.slice(0, 10),
    };
  }
}