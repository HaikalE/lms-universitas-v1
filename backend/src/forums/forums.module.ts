import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ForumsService } from './forums.service';
import { ForumsController } from './forums.controller';
import { ForumPost } from '../entities/forum-post.entity';
import { Course } from '../entities/course.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ForumPost, Course, User])],
  controllers: [ForumsController],
  providers: [ForumsService],
  exports: [ForumsService],
})
export class ForumsModule {}
