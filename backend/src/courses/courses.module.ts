import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { Course } from '../entities/course.entity';
import { User } from '../entities/user.entity';
import { CourseMaterial } from '../entities/course-material.entity';
import { Assignment } from '../entities/assignment.entity';
import { Announcement } from '../entities/announcement.entity';
import { ForumPost } from '../entities/forum-post.entity';
import { Submission } from '../entities/submission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      User,
      CourseMaterial,
      Assignment,
      Announcement,
      ForumPost,
      Submission,
    ]),
  ],
  controllers: [CoursesController],
  providers: [CoursesService],
  exports: [CoursesService],
})
export class CoursesModule {}
