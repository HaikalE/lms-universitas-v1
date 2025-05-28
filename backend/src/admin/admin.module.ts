import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../entities/user.entity';
import { Course } from '../entities/course.entity';
import { Assignment } from '../entities/assignment.entity';
import { Submission } from '../entities/submission.entity';
import { Announcement } from '../entities/announcement.entity';
import { ForumPost } from '../entities/forum-post.entity';
import { Grade } from '../entities/grade.entity';
import { Notification } from '../entities/notification.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Course,
      Assignment,
      Submission,
      Announcement,
      ForumPost,
      Grade,
      Notification,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
