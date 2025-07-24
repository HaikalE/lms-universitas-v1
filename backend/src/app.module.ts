import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

// Modules
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CoursesModule } from './courses/courses.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { ForumsModule } from './forums/forums.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { NotificationsModule } from './notifications/notifications.module';
import { UploadsModule } from './uploads/uploads.module';
import { HealthModule } from './health/health.module';
import { AdminModule } from './admin/admin.module';

// ✨ NEW: Video-based attendance modules
import { VideoProgressModule } from './video-progress/video-progress.module';
import { AttendanceModule } from './attendance/attendance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    AssignmentsModule,
    ForumsModule,
    AnnouncementsModule,
    NotificationsModule,
    UploadsModule,
    HealthModule,
    AdminModule,
    
    // ✨ NEW: Video progress tracking and attendance modules
    AttendanceModule,      // Register first (no dependencies)
    VideoProgressModule,   // Register second (depends on AttendanceModule)
  ],
})
export class AppModule {}
