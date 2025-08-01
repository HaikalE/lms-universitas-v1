import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForumsService } from './forums.service';
import { ForumsController } from './forums.controller';
import { ForumPost } from '../entities/forum-post.entity';
import { Course } from '../entities/course.entity';
import { User } from '../entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ForumPost, Course, User]),
    NotificationsModule, // 🔔 Add notifications for auto-triggers
  ],
  controllers: [ForumsController],
  providers: [ForumsService],
  exports: [ForumsService],
})
export class ForumsModule {}
