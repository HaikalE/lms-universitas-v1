import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { User } from '../entities/user.entity';
import { Course } from '../entities/course.entity';
import { ForumPost } from '../entities/forum-post.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Course, ForumPost])],
  controllers: [HealthController],
})
export class HealthModule {}