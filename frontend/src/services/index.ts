// Service exports for easy importing
export { adminService } from './adminService';
export { announcementService } from './announcementService';
export { assignmentService } from './assignmentService';
export { authService } from './authService';
export { courseService } from './courseService';
export { forumService } from './forumService';
export { notificationService } from './notificationService';
export { uploadService } from './uploadService';
export { userService } from './userService';

// Re-export API instance for direct use
export { default as api } from './api';

// Re-export utility functions from adminService
export { downloadFile, formatFileSize, formatUptime } from './adminService';
