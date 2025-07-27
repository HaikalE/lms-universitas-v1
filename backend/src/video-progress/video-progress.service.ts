import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { VideoProgress } from '../entities/video-progress.entity';
import { CourseMaterial, MaterialType } from '../entities/course-material.entity';
import { User } from '../entities/user.entity';
import { AttendanceService } from '../attendance/attendance.service';
import { UpdateVideoProgressDto, VideoProgressResponseDto } from './dto/video-progress.dto';

@Injectable()
export class VideoProgressService {
  private readonly logger = new Logger(VideoProgressService.name);
  private readonly defaultCompletionThreshold: number;

  constructor(
    @InjectRepository(VideoProgress)
    private readonly videoProgressRepository: Repository<VideoProgress>,
    
    @InjectRepository(CourseMaterial)
    private readonly courseMaterialRepository: Repository<CourseMaterial>,
    
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    
    private readonly attendanceService: AttendanceService,
    private readonly configService: ConfigService,
  ) {
    // Get completion threshold from environment (default 80%)
    this.defaultCompletionThreshold = this.configService.get<number>(
      'VIDEO_COMPLETION_THRESHOLD',
      80,
    );
  }

  /**
   * Update video progress for a student
   * This is called every few seconds from the frontend video player
   */
  async updateProgress(
    studentId: string,
    updateDto: UpdateVideoProgressDto,
  ): Promise<VideoProgressResponseDto> {
    const { materialId, currentTime, totalDuration, watchedPercentage, watchedSeconds, watchSession } = updateDto;

    // 🔍 Validate material exists and is a video
    const material = await this.courseMaterialRepository.findOne({
      where: { id: materialId },
      relations: ['course'],
    });

    if (!material) {
      throw new NotFoundException(`Course material with ID ${materialId} not found`);
    }

    if (material.type !== MaterialType.VIDEO) {
      throw new BadRequestException('Progress tracking is only available for video materials');
    }

    // 🔍 Validate student exists
    const student = await this.userRepository.findOne({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    // 📊 Calculate progress metrics
    const calculatedPercentage = totalDuration && totalDuration > 0 
      ? Math.min((currentTime / totalDuration) * 100, 100)
      : watchedPercentage || 0;

    // Get completion threshold (material-specific or global default)
    const completionThreshold = material.attendanceThreshold || this.defaultCompletionThreshold;
    const isCompleted = calculatedPercentage >= completionThreshold;

    // 🔍 Find or create progress record
    let progress = await this.videoProgressRepository.findOne({
      where: { studentId, materialId },
      relations: ['material'],
    });

    const wasCompletedBefore = progress?.isCompleted || false;

    if (progress) {
      // 📈 Update existing progress
      progress.currentTime = currentTime;
      
      if (totalDuration) {
        progress.totalDuration = totalDuration;
      }
      
      progress.watchedPercentage = calculatedPercentage;
      
      if (watchedSeconds !== undefined) {
        progress.watchedSeconds = watchedSeconds;
      }

      // Update completion status
      if (isCompleted && !progress.isCompleted) {
        progress.isCompleted = true;
        progress.completedAt = new Date();
        this.logger.log(`Student ${studentId} completed video ${materialId} (${calculatedPercentage.toFixed(1)}%)`);
      }

      // 📊 Add watch session to history
      if (watchSession) {
        const sessions = progress.watchSessions || [];
        sessions.push({
          ...watchSession,
          timestamp: new Date(),
        });
        progress.watchSessions = sessions;
      }

    } else {
      // 🆕 Create new progress record
      progress = this.videoProgressRepository.create({
        studentId,
        materialId,
        student,
        material,
        currentTime,
        totalDuration,
        watchedPercentage: calculatedPercentage,
        watchedSeconds: watchedSeconds || 0,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        hasTriggeredAttendance: false,
        watchSessions: watchSession ? [{
          ...watchSession,
          timestamp: new Date(),
        }] : [],
      });

      if (isCompleted) {
        this.logger.log(`Student ${studentId} completed video ${materialId} on first watch (${calculatedPercentage.toFixed(1)}%)`);
      }
    }

    // 💾 Save progress
    progress = await this.videoProgressRepository.save(progress);

    // 🎯 Check if we should trigger attendance
    if (isCompleted && !wasCompletedBefore && material.isAttendanceTrigger && !progress.hasTriggeredAttendance) {
      try {
        await this.triggerAttendance(studentId, material.courseId, materialId, calculatedPercentage);
        
        // Mark as triggered to prevent duplicates
        progress.hasTriggeredAttendance = true;
        await this.videoProgressRepository.save(progress);
        
      } catch (error) {
        this.logger.error(`Failed to trigger attendance for student ${studentId}, material ${materialId}:`, error);
        // Don't throw error - video progress should still be saved
      }
    }

    return this.mapToResponseDto(progress);
  }

  /**
   * 🆕 Manual trigger attendance for completed videos (Fix for existing issue)
   * This is used when videos were completed before isAttendanceTrigger was enabled
   */
  async manualTriggerAttendanceForCompletedVideos(materialId: string): Promise<{
    triggered: number;
    skipped: number;
    errors: any[];
  }> {
    this.logger.log(`🔧 Manual attendance trigger for material: ${materialId}`);

    // Validate material exists and is attendance trigger
    const material = await this.courseMaterialRepository.findOne({
      where: { id: materialId },
    });

    if (!material) {
      throw new NotFoundException(`Material ${materialId} not found`);
    }

    if (!material.isAttendanceTrigger) {
      throw new BadRequestException(`Material ${materialId} is not configured as attendance trigger`);
    }

    // Find all completed videos that haven't triggered attendance
    const completedProgress = await this.videoProgressRepository.find({
      where: { 
        materialId, 
        isCompleted: true, 
        hasTriggeredAttendance: false 
      },
      relations: ['material']
    });

    this.logger.log(`Found ${completedProgress.length} completed videos without attendance`);

    let triggered = 0;
    let skipped = 0;
    const errors = [];

    for (const progress of completedProgress) {
      try {
        // Trigger attendance
        await this.triggerAttendance(
          progress.studentId,
          progress.material.courseId,
          materialId,
          progress.watchedPercentage
        );
        
        // Mark as triggered
        progress.hasTriggeredAttendance = true;
        await this.videoProgressRepository.save(progress);
        
        triggered++;
        this.logger.log(`✅ Triggered attendance for student ${progress.studentId}`);
        
      } catch (error) {
        skipped++;
        errors.push({
          studentId: progress.studentId,
          error: error.message
        });
        this.logger.error(`❌ Failed to trigger attendance for student ${progress.studentId}:`, error.message);
      }
    }

    const result = { triggered, skipped, errors };
    this.logger.log(`🎯 Manual trigger completed: ${triggered} triggered, ${skipped} skipped`);
    return result;
  }

  /**
   * 🆕 Get attendance trigger status for a material
   */
  async getAttendanceTriggerStatus(materialId: string): Promise<{
    isAttendanceTrigger: boolean;
    threshold: number;
    completedStudents: number;
    attendanceTriggered: number;
    pendingTrigger: number;
  }> {
    const material = await this.courseMaterialRepository.findOne({
      where: { id: materialId },
    });

    if (!material) {
      throw new NotFoundException(`Material ${materialId} not found`);
    }

    // Count progress statistics
    const stats = await this.videoProgressRepository
      .createQueryBuilder('vp')
      .select([
        'COUNT(CASE WHEN vp.isCompleted THEN 1 END) as completedStudents',
        'COUNT(CASE WHEN vp.hasTriggeredAttendance THEN 1 END) as attendanceTriggered',
      ])
      .where('vp.materialId = :materialId', { materialId })
      .getRawOne();

    const completedStudents = parseInt(stats.completedStudents || '0');
    const attendanceTriggered = parseInt(stats.attendanceTriggered || '0');
    const pendingTrigger = material.isAttendanceTrigger 
      ? completedStudents - attendanceTriggered 
      : 0;

    return {
      isAttendanceTrigger: material.isAttendanceTrigger || false,
      threshold: material.attendanceThreshold || this.defaultCompletionThreshold,
      completedStudents,
      attendanceTriggered,
      pendingTrigger,
    };
  }

  /**
   * Get video progress for a student and material
   */
  async getProgress(
    studentId: string,
    materialId: string,
  ): Promise<VideoProgressResponseDto | null> {
    const progress = await this.videoProgressRepository.findOne({
      where: { studentId, materialId },
      relations: ['material'],
    });

    return progress ? this.mapToResponseDto(progress) : null;
  }

  /**
   * Get all video progress for a student in a course
   */
  async getProgressByCourse(
    studentId: string,
    courseId: string,
  ): Promise<VideoProgressResponseDto[]> {
    const progress = await this.videoProgressRepository
      .createQueryBuilder('vp')
      .leftJoinAndSelect('vp.material', 'material')
      .where('vp.studentId = :studentId', { studentId })
      .andWhere('material.courseId = :courseId', { courseId })
      .andWhere('material.type = :type', { type: MaterialType.VIDEO })
      .orderBy('material.week', 'ASC')
      .addOrderBy('material.orderIndex', 'ASC')
      .getMany();

    return progress.map(p => this.mapToResponseDto(p));
  }

  /**
   * Get video completion statistics for a course
   */
  async getCourseVideoStats(courseId: string) {
    const stats = await this.videoProgressRepository
      .createQueryBuilder('vp')
      .leftJoin('vp.material', 'material')
      .select([
        'material.id as materialId',
        'material.title as title',
        'COUNT(vp.id) as totalViewers',
        'COUNT(CASE WHEN vp.isCompleted THEN 1 END) as completedViewers',
        'AVG(vp.watchedPercentage) as avgCompletion',
        'COUNT(CASE WHEN vp.hasTriggeredAttendance THEN 1 END) as attendanceTriggered',
      ])
      .where('material.courseId = :courseId', { courseId })
      .andWhere('material.type = :type', { type: MaterialType.VIDEO })
      .groupBy('material.id, material.title')
      .getRawMany();

    return stats.map(stat => ({
      materialId: stat.materialId,
      title: stat.title,
      totalViewers: parseInt(stat.totalViewers),
      completedViewers: parseInt(stat.completedViewers),
      completionRate: stat.totalViewers > 0 
        ? (parseInt(stat.completedViewers) / parseInt(stat.totalViewers) * 100).toFixed(1)
        : '0.0',
      avgCompletion: stat.avgCompletion ? parseFloat(stat.avgCompletion).toFixed(1) : '0.0',
      attendanceTriggered: parseInt(stat.attendanceTriggered),
    }));
  }

  /**
   * Trigger automatic attendance via AttendanceService
   */
  private async triggerAttendance(
    studentId: string,
    courseId: string,
    materialId: string,
    completionPercentage: number,
  ): Promise<void> {
    this.logger.log(`🎯 TRIGGERING AUTO-ATTENDANCE: Student ${studentId} completed video ${materialId} in course ${courseId} (${completionPercentage.toFixed(1)}%)`);
    
    try {
      // ✅ Call AttendanceService to auto-submit attendance
      await this.attendanceService.autoSubmitAttendance({
        studentId,
        courseId,
        triggerMaterialId: materialId,
        completionPercentage,
        metadata: {
          videoProgress: completionPercentage,
          completionTime: new Date(),
        },
      });

      this.logger.log(`✅ AUTO-ATTENDANCE SUCCESS: Student ${studentId} attendance submitted for course ${courseId}`);
      
    } catch (error) {
      this.logger.error(`❌ AUTO-ATTENDANCE FAILED: ${error.message}`, error.stack);
      throw error; // Re-throw for proper error handling in calling method
    }
  }

  /**
   * Resume video from last watched position
   */
  async getResumePosition(
    studentId: string,
    materialId: string,
  ): Promise<{ currentTime: number; watchedPercentage: number } | null> {
    const progress = await this.videoProgressRepository.findOne({
      where: { studentId, materialId },
      select: ['currentTime', 'watchedPercentage'],
    });

    return progress ? {
      currentTime: progress.currentTime,
      watchedPercentage: progress.watchedPercentage,
    } : null;
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(progress: VideoProgress): VideoProgressResponseDto {
    return {
      id: progress.id,
      materialId: progress.materialId,
      currentTime: progress.currentTime,
      totalDuration: progress.totalDuration,
      watchedPercentage: progress.watchedPercentage,
      watchedSeconds: progress.watchedSeconds,
      isCompleted: progress.isCompleted,
      completedAt: progress.completedAt,
      hasTriggeredAttendance: progress.hasTriggeredAttendance,
      createdAt: progress.createdAt,
      updatedAt: progress.updatedAt,
      material: progress.material ? {
        id: progress.material.id,
        title: progress.material.title,
        type: progress.material.type,
        isAttendanceTrigger: progress.material.isAttendanceTrigger,
        attendanceThreshold: progress.material.attendanceThreshold,
      } : undefined,
    };
  }
}