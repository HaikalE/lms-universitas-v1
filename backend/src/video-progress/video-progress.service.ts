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
        this.logger.log(`🎯 Student ${studentId} completed video ${materialId} (${calculatedPercentage.toFixed(1)}%)`);
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
        this.logger.log(`🎯 Student ${studentId} completed video ${materialId} on first watch (${calculatedPercentage.toFixed(1)}%)`);
      }
    }

    // 💾 Save progress
    progress = await this.videoProgressRepository.save(progress);

    // 🔥 ENHANCED LOGIC: Check weekly completion - ALWAYS check if completed and is attendance trigger
    if (isCompleted && material.isAttendanceTrigger && !progress.hasTriggeredAttendance) {
      this.logger.log(`🔥 ATTENDANCE TRIGGER CHECK: Video ${materialId} completed, isAttendanceTrigger=${material.isAttendanceTrigger}, hasTriggeredAttendance=${progress.hasTriggeredAttendance}`);
      this.logger.log(`🔥 Conditions: isCompleted=${isCompleted}, wasCompletedBefore=${wasCompletedBefore}, material.week=${material.week}`);
      
      try {
        // Check if material has week info
        if (!material.week) {
          this.logger.warn(`⚠️ Material ${materialId} has no week info - cannot check weekly completion`);
        } else {
          this.logger.log(`🔥 WEEKLY ATTENDANCE CHECK: Material ${materialId} completed, checking week ${material.week} completion...`);
          
          // Check if ALL videos in this week are completed
          const weeklyCompletionResult = await this.checkAndTriggerWeeklyAttendance(
            studentId, 
            material.courseId, 
            material.week
          );
          
          if (weeklyCompletionResult.canTriggerAttendance) {
            this.logger.log(`🎉 WEEKLY COMPLETION: Student ${studentId} completed ALL videos for week ${material.week}`);
            
            // Trigger attendance for the week
            await this.triggerAttendance(
              studentId, 
              material.courseId, 
              materialId, 
              calculatedPercentage,
              weeklyCompletionResult
            );
            
            // Mark ALL completed videos in this week as triggered
            await this.markWeekVideosAsTriggered(studentId, material.courseId, material.week);
          } else {
            this.logger.log(`⏳ PARTIAL COMPLETION: Student ${studentId} completed ${weeklyCompletionResult.completedCount}/${weeklyCompletionResult.totalRequired} videos for week ${material.week}`);
          }
        }
        
      } catch (error) {
        this.logger.error(`❌ Failed to check weekly completion for student ${studentId}, week ${material.week}:`, error);
        this.logger.error(`❌ Full error stack:`, error.stack);
        // Don't throw error - video progress should still be saved
      }
    } else {
      // Log why attendance check was skipped
      if (!isCompleted) {
        this.logger.log(`⏭️ SKIP ATTENDANCE: Video ${materialId} not completed (${calculatedPercentage.toFixed(1)}% < ${completionThreshold}%)`);
      } else if (!material.isAttendanceTrigger) {
        this.logger.log(`⏭️ SKIP ATTENDANCE: Video ${materialId} not configured as attendance trigger`);
      } else if (progress.hasTriggeredAttendance) {
        this.logger.log(`⏭️ SKIP ATTENDANCE: Video ${materialId} already triggered attendance`);
      }
    }

    return this.mapToResponseDto(progress);
  }

  /**
   * 🆕 Check if all required videos in a week are completed
   * Only trigger attendance when ALL videos with attendance trigger are completed
   */
  async checkAndTriggerWeeklyAttendance(
    studentId: string,
    courseId: string,
    week: number
  ): Promise<{
    canTriggerAttendance: boolean;
    totalRequired: number;
    completedCount: number;
    pendingVideos: any[];
    completedVideos: any[];
    weeklyCompletionRate: number;
  }> {
    this.logger.log(`🔍 Checking weekly attendance completion for student ${studentId}, course ${courseId}, week ${week}`);

    // Get all videos with attendance trigger in this week
    const requiredVideos = await this.courseMaterialRepository.find({
      where: {
        courseId,
        week,
        type: MaterialType.VIDEO,
        isAttendanceTrigger: true,
      },
      order: { orderIndex: 'ASC' },
    });

    if (requiredVideos.length === 0) {
      this.logger.log(`⚠️ No attendance-trigger videos found for week ${week} in course ${courseId}`);
      return {
        canTriggerAttendance: false,
        totalRequired: 0,
        completedCount: 0,
        pendingVideos: [],
        completedVideos: [],
        weeklyCompletionRate: 0,
      };
    }

    this.logger.log(`📹 Found ${requiredVideos.length} attendance-trigger videos for week ${week} in course ${courseId}:`);
    requiredVideos.forEach(video => {
      this.logger.log(`  - ${video.title} (ID: ${video.id}, threshold: ${video.attendanceThreshold || this.defaultCompletionThreshold}%)`);
    });

    // Check completion status for each video
    const completedVideos = [];
    const pendingVideos = [];

    for (const video of requiredVideos) {
      const progress = await this.videoProgressRepository.findOne({
        where: { studentId, materialId: video.id },
      });

      const threshold = video.attendanceThreshold || this.defaultCompletionThreshold;
      const isCompleted = progress && progress.isCompleted && progress.watchedPercentage >= threshold;

      this.logger.log(`  📊 Video "${video.title}": ${progress?.watchedPercentage || 0}% (threshold: ${threshold}%) - ${isCompleted ? 'COMPLETED ✅' : 'PENDING ❌'}`);

      if (isCompleted) {
        completedVideos.push({
          videoId: video.id,
          title: video.title,
          completedAt: progress.completedAt,
          watchedPercentage: progress.watchedPercentage,
          threshold,
        });
      } else {
        pendingVideos.push({
          videoId: video.id,
          title: video.title,
          currentProgress: progress?.watchedPercentage || 0,
          threshold,
        });
      }
    }

    const completedCount = completedVideos.length;
    const totalRequired = requiredVideos.length;
    const weeklyCompletionRate = (completedCount / totalRequired) * 100;
    const canTriggerAttendance = completedCount === totalRequired;

    this.logger.log(`📊 Weekly completion status: ${completedCount}/${totalRequired} videos completed (${weeklyCompletionRate.toFixed(1)}%)`);

    if (canTriggerAttendance) {
      this.logger.log(`✅ ALL VIDEOS COMPLETED! Student ${studentId} can get attendance for week ${week}`);
    } else {
      this.logger.log(`⏳ Still pending: ${pendingVideos.map(v => v.title).join(', ')}`);
    }

    return {
      canTriggerAttendance,
      totalRequired,
      completedCount,
      pendingVideos,
      completedVideos,
      weeklyCompletionRate,
    };
  }

  /**
   * 🆕 Mark all completed videos in a week as attendance-triggered
   */
  async markWeekVideosAsTriggered(studentId: string, courseId: string, week: number): Promise<void> {
    const result = await this.videoProgressRepository
      .createQueryBuilder()
      .update(VideoProgress)
      .set({ hasTriggeredAttendance: true })
      .where('studentId = :studentId', { studentId })
      .andWhere('materialId IN (SELECT id FROM course_materials WHERE "courseId" = :courseId AND week = :week AND type = :type AND "isAttendanceTrigger" = true)', {
        courseId,
        week,
        type: MaterialType.VIDEO,
      })
      .andWhere('isCompleted = true')
      .execute();

    this.logger.log(`📝 Marked ${result.affected} videos as attendance-triggered for student ${studentId}, week ${week}`);
  }

  /**
   * 🆕 Get weekly completion status for a student
   */
  async getWeeklyCompletionStatus(
    studentId: string,
    courseId: string,
    week: number
  ): Promise<{
    week: number;
    totalRequired: number;
    completedCount: number;
    canGetAttendance: boolean;
    weeklyCompletionRate: number;
    videoDetails: any[];
    hasAttendance: boolean;
  }> {
    const completionResult = await this.checkAndTriggerWeeklyAttendance(studentId, courseId, week);

    // Check if student already has attendance for this week
    const hasAttendance = await this.attendanceService.hasWeeklyAttendance(studentId, courseId, week);

    const videoDetails = [
      ...completionResult.completedVideos.map(v => ({ ...v, status: 'completed' })),
      ...completionResult.pendingVideos.map(v => ({ ...v, status: 'pending' })),
    ];

    return {
      week,
      totalRequired: completionResult.totalRequired,
      completedCount: completionResult.completedCount,
      canGetAttendance: completionResult.canTriggerAttendance,
      weeklyCompletionRate: completionResult.weeklyCompletionRate,
      videoDetails,
      hasAttendance,
    };
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
        // NEW: Check weekly completion instead of single video
        const weeklyResult = await this.checkAndTriggerWeeklyAttendance(
          progress.studentId,
          progress.material.courseId,
          progress.material.week
        );

        if (weeklyResult.canTriggerAttendance) {
          // Trigger attendance
          await this.triggerAttendance(
            progress.studentId,
            progress.material.courseId,
            materialId,
            progress.watchedPercentage,
            weeklyResult
          );
          
          // Mark ALL videos in week as triggered
          await this.markWeekVideosAsTriggered(
            progress.studentId,
            progress.material.courseId,
            progress.material.week
          );
          
          triggered++;
          this.logger.log(`✅ Triggered attendance for student ${progress.studentId} (weekly completion)`);
        } else {
          skipped++;
          this.logger.log(`⏭️ Skipped student ${progress.studentId} - only ${weeklyResult.completedCount}/${weeklyResult.totalRequired} videos completed`);
        }
        
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
    weeklyRequirements?: {
      week: number;
      totalVideosInWeek: number;
      studentsWithFullWeekCompletion: number;
    };
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

    // Get weekly requirements if this is an attendance trigger
    let weeklyRequirements;
    if (material.isAttendanceTrigger && material.week) {
      const weekVideos = await this.courseMaterialRepository.count({
        where: {
          courseId: material.courseId,
          week: material.week,
          type: MaterialType.VIDEO,
          isAttendanceTrigger: true,
        },
      });

      // Count students who completed ALL videos in this week
      const studentsWithFullCompletion = await this.getStudentsWithFullWeekCompletion(
        material.courseId,
        material.week
      );

      weeklyRequirements = {
        week: material.week,
        totalVideosInWeek: weekVideos,
        studentsWithFullWeekCompletion: studentsWithFullCompletion,
      };
    }

    return {
      isAttendanceTrigger: material.isAttendanceTrigger || false,
      threshold: material.attendanceThreshold || this.defaultCompletionThreshold,
      completedStudents,
      attendanceTriggered,
      pendingTrigger,
      weeklyRequirements,
    };
  }

  /**
   * 🆕 Get count of students who completed ALL videos in a week
   */
  async getStudentsWithFullWeekCompletion(courseId: string, week: number): Promise<number> {
    const requiredVideos = await this.courseMaterialRepository.find({
      where: {
        courseId,
        week,
        type: MaterialType.VIDEO,
        isAttendanceTrigger: true,
      },
      select: ['id'],
    });

    if (requiredVideos.length === 0) {
      return 0;
    }

    const videoIds = requiredVideos.map(v => v.id);

    // Count students who completed ALL required videos
    const result = await this.videoProgressRepository
      .createQueryBuilder('vp')
      .select('vp.studentId')
      .where('vp.materialId IN (:...videoIds)', { videoIds })
      .andWhere('vp.isCompleted = true')
      .groupBy('vp.studentId')
      .having('COUNT(vp.materialId) = :requiredCount', { requiredCount: videoIds.length })
      .getCount();

    return result;
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
    weeklyResult?: any,
  ): Promise<void> {
    this.logger.log(`🎯 TRIGGERING WEEKLY AUTO-ATTENDANCE: Student ${studentId} completed ALL required videos in course ${courseId}`);
    
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
          weeklyCompletion: weeklyResult ? {
            week: weeklyResult.week,
            totalRequired: weeklyResult.totalRequired,
            completedCount: weeklyResult.completedCount,
            weeklyCompletionRate: weeklyResult.weeklyCompletionRate,
            completedVideos: weeklyResult.completedVideos,
          } : undefined,
        },
      });

      this.logger.log(`✅ WEEKLY AUTO-ATTENDANCE SUCCESS: Student ${studentId} attendance submitted for course ${courseId}`);
      
    } catch (error) {
      this.logger.error(`❌ WEEKLY AUTO-ATTENDANCE FAILED: ${error.message}`, error.stack);
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
   * ✅ FIXED: Map entity to response DTO with week field included
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
        week: progress.material.week,  // ✅ FIXED: Include week field!
        isAttendanceTrigger: progress.material.isAttendanceTrigger,
        attendanceThreshold: progress.material.attendanceThreshold,
      } : undefined,
    };
  }
}