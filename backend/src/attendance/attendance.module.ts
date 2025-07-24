import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from '../entities/attendance.entity';
import { User } from '../entities/user.entity';
import { Course } from '../entities/course.entity';
import { CourseMaterial } from '../entities/course-material.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Attendance,
      User,
      Course,
      CourseMaterial,
    ]),
  ],
  providers: [AttendanceService],
  controllers: [AttendanceController],
  exports: [AttendanceService], // Export for use in VideoProgressModule
})
export class AttendanceModule {}
