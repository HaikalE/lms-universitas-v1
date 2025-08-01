import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssignmentsService } from './assignments.service';
import { AssignmentsController } from './assignments.controller';
import { Assignment } from '../entities/assignment.entity';
import { Course } from '../entities/course.entity';
import { Submission } from '../entities/submission.entity';
import { Grade } from '../entities/grade.entity';
import { User } from '../entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Assignment,
      Course,
      Submission,
      Grade,
      User,
    ]),
    NotificationsModule, // 🔔 Import for notification triggers
  ],
  controllers: [AssignmentsController],
  providers: [AssignmentsService],
  exports: [AssignmentsService],
})
export class AssignmentsModule {}
