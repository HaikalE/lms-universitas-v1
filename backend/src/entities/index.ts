export { User, UserRole } from './user.entity';
export { Course } from './course.entity';
export { CourseMaterial, MaterialType } from './course-material.entity';
export { Assignment, AssignmentType } from './assignment.entity';
export { Submission, SubmissionStatus } from './submission.entity';
export { Grade } from './grade.entity';
export { ForumPost } from './forum-post.entity';
export { Announcement, AnnouncementPriority } from './announcement.entity';
export { Notification, NotificationType } from './notification.entity';

// ✨ NEW: Video progress tracking and attendance entities
export { VideoProgress } from './video-progress.entity';
export { 
  Attendance, 
  AttendanceStatus, 
  AttendanceType 
} from './attendance.entity';
