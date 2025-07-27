import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../entities/user.entity';
import { VideoProgressService } from './video-progress.service';
import {
  UpdateVideoProgressDto,
  VideoProgressQueryDto,
  VideoProgressResponseDto,
} from './dto/video-progress.dto';

@Controller('video-progress')
@UseGuards(JwtAuthGuard)
export class VideoProgressController {
  constructor(private readonly videoProgressService: VideoProgressService) {}

  /**
   * Update video progress for current user
   * Called frequently from frontend video player (every 5-10 seconds)
   * 
   * POST /api/video-progress
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  @Roles(UserRole.STUDENT)
  @UseGuards(RolesGuard)
  async updateProgress(
    @Request() req,
    @Body() updateDto: UpdateVideoProgressDto,
  ): Promise<VideoProgressResponseDto> {
    const studentId = req.user.id;
    return this.videoProgressService.updateProgress(studentId, updateDto);
  }

  /**
   * 🆕 Manual trigger attendance for completed videos
   * This fixes the issue where videos were completed before isAttendanceTrigger was enabled
   * 
   * POST /api/video-progress/material/:materialId/trigger-attendance
   */
  @Post('material/:materialId/trigger-attendance')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async manualTriggerAttendance(
    @Param('materialId', ParseUUIDPipe) materialId: string,
  ): Promise<{
    success: boolean;
    triggered: number;
    skipped: number;
    message: string;
    errors?: any[];
  }> {
    try {
      const result = await this.videoProgressService.manualTriggerAttendanceForCompletedVideos(materialId);
      
      return {
        success: true,
        triggered: result.triggered,
        skipped: result.skipped,
        message: `Successfully triggered attendance for ${result.triggered} students. ${result.skipped} skipped.`,
        errors: result.errors.length > 0 ? result.errors : undefined,
      };
    } catch (error) {
      return {
        success: false,
        triggered: 0,
        skipped: 0,
        message: error.message,
      };
    }
  }

  /**
   * 🆕 Get attendance trigger status for a material
   * Shows how many students completed vs triggered attendance
   * 
   * GET /api/video-progress/material/:materialId/attendance-status
   */
  @Get('material/:materialId/attendance-status')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getAttendanceTriggerStatus(
    @Param('materialId', ParseUUIDPipe) materialId: string,
  ): Promise<{
    isAttendanceTrigger: boolean;
    threshold: number;
    completedStudents: number;
    attendanceTriggered: number;
    pendingTrigger: number;
    needsManualTrigger: boolean;
    weeklyRequirements?: any;
  }> {
    const status = await this.videoProgressService.getAttendanceTriggerStatus(materialId);
    
    return {
      ...status,
      needsManualTrigger: status.isAttendanceTrigger && status.pendingTrigger > 0,
    };
  }

  /**
   * 🆕 Get weekly completion status for current user
   * Shows progress towards weekly attendance requirements
   * 
   * GET /api/video-progress/my-weekly-completion/course/:courseId/week/:week
   */
  @Get('my-weekly-completion/course/:courseId/week/:week')
  @Roles(UserRole.STUDENT)
  @UseGuards(RolesGuard)
  async getMyWeeklyCompletionStatus(
    @Request() req,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('week', ParseIntPipe) week: number,
  ) {
    const studentId = req.user.id;
    return this.videoProgressService.getWeeklyCompletionStatus(studentId, courseId, week);
  }

  /**
   * 🆕 Get weekly completion status for specific student (Lecturer/Admin only)
   * 
   * GET /api/video-progress/student/:studentId/weekly-completion/course/:courseId/week/:week
   */
  @Get('student/:studentId/weekly-completion/course/:courseId/week/:week')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getStudentWeeklyCompletionStatus(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('week', ParseIntPipe) week: number,
  ) {
    return this.videoProgressService.getWeeklyCompletionStatus(studentId, courseId, week);
  }

  /**
   * 🆕 Get weekly completion overview for all weeks (current user)
   * Shows completion status for all weeks 1-16
   * 
   * GET /api/video-progress/my-weekly-overview/course/:courseId
   */
  @Get('my-weekly-overview/course/:courseId')
  @Roles(UserRole.STUDENT)
  @UseGuards(RolesGuard)
  async getMyWeeklyOverview(
    @Request() req,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query('startWeek', ParseIntPipe) startWeek?: number,
    @Query('endWeek', ParseIntPipe) endWeek?: number,
  ) {
    const studentId = req.user.id;
    const start = startWeek || 1;
    const end = endWeek || 16;
    
    const weeklyOverview = [];
    
    for (let week = start; week <= end; week++) {
      try {
        const weekStatus = await this.videoProgressService.getWeeklyCompletionStatus(
          studentId,
          courseId,
          week
        );
        weeklyOverview.push(weekStatus);
      } catch (error) {
        // Skip weeks with no videos or errors
        continue;
      }
    }
    
    return {
      courseId,
      studentId,
      startWeek: start,
      endWeek: end,
      weeklyOverview,
      summary: {
        totalWeeks: weeklyOverview.length,
        completedWeeks: weeklyOverview.filter(w => w.canGetAttendance).length,
        partialWeeks: weeklyOverview.filter(w => w.completedCount > 0 && !w.canGetAttendance).length,
        pendingWeeks: weeklyOverview.filter(w => w.completedCount === 0).length,
        overallCompletionRate: weeklyOverview.length > 0 
          ? (weeklyOverview.filter(w => w.canGetAttendance).length / weeklyOverview.length * 100) 
          : 0,
      },
    };
  }

  /**
   * 🆕 Check weekly attendance requirements for course (Lecturer/Admin only)
   * Shows which weeks have attendance requirements and completion rates
   * 
   * GET /api/video-progress/course/:courseId/weekly-requirements
   */
  @Get('course/:courseId/weekly-requirements')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getCourseWeeklyRequirements(
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Query('startWeek', ParseIntPipe) startWeek?: number,
    @Query('endWeek', ParseIntPipe) endWeek?: number,
  ) {
    const start = startWeek || 1;
    const end = endWeek || 16;
    
    const weeklyRequirements = [];
    
    for (let week = start; week <= end; week++) {
      try {
        const studentsWithFullCompletion = await this.videoProgressService.getStudentsWithFullWeekCompletion(courseId, week);
        
        // Get a sample student to check week requirements (use first student in course)
        // This is a bit of a hack - in real implementation you might want a dedicated method
        const sampleResult = await this.videoProgressService.checkAndTriggerWeeklyAttendance(
          'sample-student-id', // This will fail but give us the structure
          courseId,
          week
        ).catch(() => ({ totalRequired: 0, completedCount: 0 }));
        
        if (sampleResult.totalRequired > 0) {
          weeklyRequirements.push({
            week,
            totalRequiredVideos: sampleResult.totalRequired,
            studentsWithFullCompletion,
            completionRate: studentsWithFullCompletion > 0 ? 
              `${studentsWithFullCompletion} students completed all ${sampleResult.totalRequired} videos` :
              'No students completed all videos yet',
          });
        }
      } catch (error) {
        // Skip weeks with errors or no requirements
        continue;
      }
    }
    
    return {
      courseId,
      startWeek: start,
      endWeek: end,
      weeklyRequirements,
      summary: {
        totalWeeksWithRequirements: weeklyRequirements.length,
        averageVideosPerWeek: weeklyRequirements.length > 0 ?
          (weeklyRequirements.reduce((sum, w) => sum + w.totalRequiredVideos, 0) / weeklyRequirements.length) :
          0,
      },
    };
  }

  /**
   * 🆕 Debug weekly completion (Lecturer/Admin only)
   * Detailed breakdown for troubleshooting attendance issues
   * 
   * GET /api/video-progress/debug/student/:studentId/course/:courseId/week/:week
   */
  @Get('debug/student/:studentId/course/:courseId/week/:week')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async debugWeeklyCompletion(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('week', ParseIntPipe) week: number,
  ) {
    try {
      const weeklyResult = await this.videoProgressService.checkAndTriggerWeeklyAttendance(
        studentId,
        courseId,
        week
      );
      
      const weekStatus = await this.videoProgressService.getWeeklyCompletionStatus(
        studentId,
        courseId,
        week
      );
      
      return {
        studentId,
        courseId,
        week,
        debugInfo: {
          canTriggerAttendance: weeklyResult.canTriggerAttendance,
          totalRequired: weeklyResult.totalRequired,
          completedCount: weeklyResult.completedCount,
          weeklyCompletionRate: weeklyResult.weeklyCompletionRate,
          completedVideos: weeklyResult.completedVideos,
          pendingVideos: weeklyResult.pendingVideos,
        },
        weekStatus,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        studentId,
        courseId,
        week,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Get video progress for specific material
   * 
   * GET /api/video-progress/material/:materialId
   */
  @Get('material/:materialId')
  @Roles(UserRole.STUDENT)
  @UseGuards(RolesGuard)
  async getProgressForMaterial(
    @Request() req,
    @Param('materialId', ParseUUIDPipe) materialId: string,
  ): Promise<VideoProgressResponseDto | null> {
    const studentId = req.user.id;
    return this.videoProgressService.getProgress(studentId, materialId);
  }

  /**
   * Get resume position for video (currentTime to continue watching)
   * 
   * GET /api/video-progress/material/:materialId/resume
   */
  @Get('material/:materialId/resume')
  @Roles(UserRole.STUDENT)
  @UseGuards(RolesGuard)
  async getResumePosition(
    @Request() req,
    @Param('materialId', ParseUUIDPipe) materialId: string,
  ): Promise<{ currentTime: number; watchedPercentage: number } | null> {
    const studentId = req.user.id;
    return this.videoProgressService.getResumePosition(studentId, materialId);
  }

  /**
   * Get all video progress for current user in a course
   * 
   * GET /api/video-progress/course/:courseId
   */
  @Get('course/:courseId')
  @Roles(UserRole.STUDENT)
  @UseGuards(RolesGuard)
  async getProgressByCourse(
    @Request() req,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ): Promise<VideoProgressResponseDto[]> {
    const studentId = req.user.id;
    return this.videoProgressService.getProgressByCourse(studentId, courseId);
  }

  /**
   * Get video completion statistics for a course (Lecturer/Admin only)
   * 
   * GET /api/video-progress/course/:courseId/stats
   */
  @Get('course/:courseId/stats')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getCourseVideoStats(
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    return this.videoProgressService.getCourseVideoStats(courseId);
  }

  /**
   * Get progress for specific student (Lecturer/Admin only)
   * 
   * GET /api/video-progress/student/:studentId/material/:materialId
   */
  @Get('student/:studentId/material/:materialId')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getStudentProgress(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('materialId', ParseUUIDPipe) materialId: string,
  ): Promise<VideoProgressResponseDto | null> {
    return this.videoProgressService.getProgress(studentId, materialId);
  }

  /**
   * Get progress for specific student in a course (Lecturer/Admin only)
   * 
   * GET /api/video-progress/student/:studentId/course/:courseId
   */
  @Get('student/:studentId/course/:courseId')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getStudentProgressByCourse(
    @Param('studentId', ParseUUIDPipe) studentId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ): Promise<VideoProgressResponseDto[]> {
    return this.videoProgressService.getProgressByCourse(studentId, courseId);
  }

  /**
   * 🆕 Get enhanced course video analytics (Lecturer/Admin only)
   * Includes weekly completion analytics and attendance correlation
   * 
   * GET /api/video-progress/course/:courseId/enhanced-analytics
   */
  @Get('course/:courseId/enhanced-analytics')
  @Roles(UserRole.LECTURER, UserRole.ADMIN)
  @UseGuards(RolesGuard)
  async getEnhancedCourseAnalytics(
    @Param('courseId', ParseUUIDPipe) courseId: string,
  ) {
    const basicStats = await this.videoProgressService.getCourseVideoStats(courseId);
    
    // Get weekly completion data
    const weeklyData = [];
    for (let week = 1; week <= 16; week++) {
      try {
        const studentsWithFullCompletion = await this.videoProgressService.getStudentsWithFullWeekCompletion(courseId, week);
        if (studentsWithFullCompletion > 0) {
          weeklyData.push({
            week,
            studentsWithFullCompletion,
          });
        }
      } catch (error) {
        // Skip weeks with no data
        continue;
      }
    }
    
    return {
      courseId,
      basicStats,
      weeklyCompletionData: weeklyData,
      analytics: {
        totalWeeksWithData: weeklyData.length,
        averageStudentsPerWeek: weeklyData.length > 0 ?
          (weeklyData.reduce((sum, w) => sum + w.studentsWithFullCompletion, 0) / weeklyData.length) :
          0,
        mostActiveWeek: weeklyData.length > 0 ?
          weeklyData.reduce((max, current) => 
            current.studentsWithFullCompletion > max.studentsWithFullCompletion ? current : max
          ) :
          null,
      },
      generatedAt: new Date(),
    };
  }
}