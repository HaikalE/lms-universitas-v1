import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoProgress } from '../entities/video-progress.entity';
import { CourseMaterial } from '../entities/course-material.entity';
import { User } from '../entities/user.entity';
import { VideoProgressService } from './video-progress.service';
import { VideoProgressController } from './video-progress.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VideoProgress,
      CourseMaterial,
      User,
    ]),
  ],
  providers: [VideoProgressService],
  controllers: [VideoProgressController],
  exports: [VideoProgressService], // Export for use in other modules
})
export class VideoProgressModule {}
