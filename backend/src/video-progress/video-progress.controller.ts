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
} from './dto/video-progress.dto.ts';

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
}
