export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  studentId?: string;
  lecturerId?: string;
  phone?: string;
  address?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  LECTURER = 'lecturer',
  STUDENT = 'student',
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
  credits: number;
  semester: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
  lecturer: {
    id: string;
    fullName: string;
    lecturerId?: string;
  };
  students?: User[];
  studentsCount?: number;
}

export interface CourseMaterial {
  id: string;
  title: string;
  description?: string;
  type: MaterialType;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  url?: string;
  week: number;
  orderIndex: number;
  isVisible: boolean;
  createdAt: string;
  uploadedBy: {
    id: string;
    fullName: string;
  };
}

export enum MaterialType {
  PDF = 'pdf',
  VIDEO = 'video',
  DOCUMENT = 'document',
  PRESENTATION = 'presentation',
  LINK = 'link',
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  type: AssignmentType;
  dueDate: string;
  maxScore: number;
  allowLateSubmission: boolean;
  latePenaltyPercent: number;
  allowedFileTypes: string[];
  maxFileSize: number;
  isVisible: boolean;
  createdAt: string;
  course: {
    id: string;
    code: string;
    name: string;
  };
  lecturer: {
    id: string;
    fullName: string;
  };
  mySubmission?: Submission;
}

export enum AssignmentType {
  INDIVIDUAL = 'individual',
  GROUP = 'group',
  QUIZ = 'quiz',
  EXAM = 'exam',
}

export interface Submission {
  id: string;
  content?: string;
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  status: SubmissionStatus;
  submittedAt?: string;
  isLate: boolean;
  createdAt: string;
  student?: {
    id: string;
    fullName: string;
    studentId?: string;
  };
  grade?: Grade;
}

export enum SubmissionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  LATE = 'late',
  GRADED = 'graded',
}

export interface Grade {
  id: string;
  score: number;
  maxScore: number;
  feedback?: string;
  gradedAt?: string;
  course: {
    id: string;
    code: string;
    name: string;
  };
  assignment: {
    id: string;
    title: string;
    type: AssignmentType;
  };
  gradedBy: {
    id: string;
    fullName: string;
  };
}

// Forward declaration for ForumReply
export interface ForumReply {
  id: string;
  content: string;
  authorId: string; // FIXED: Use authorId to match backend
  userId?: string; // Keep for backward compatibility
  isLiked: boolean;
  likesCount: number;
  isAnswer: boolean;
  createdAt: string;
  updatedAt?: string;
  author: {
    id: string;
    fullName: string; // FIXED: Use fullName to match backend User entity
    role?: UserRole;
  };
  user?: {
    id: string;
    name: string;
    role?: UserRole;
  };
  children?: ForumReply[]; // FIXED: Add children for nested replies
  replies?: ForumReply[];
}

export enum ForumPostType {
  QUESTION = 'question',
  DISCUSSION = 'discussion',
  ANNOUNCEMENT = 'announcement',
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  type?: ForumPostType | string;
  isPinned: boolean;
  isLocked: boolean;
  likesCount: number;
  viewsCount: number;
  repliesCount: number;
  isLiked?: boolean;
  isAnswered?: boolean;
  tags?: string[];
  authorId: string; // FIXED: Add authorId to match backend entity
  courseId: string; // FIXED: Add courseId to match backend entity
  userId?: string; // Keep for backward compatibility
  createdAt: string;
  updatedAt?: string;
  author: {
    id: string;
    fullName: string;
    role: UserRole;
  };
  user?: {
    id: string;
    name: string;
    role: UserRole;
  };
  children?: ForumPost[]; // For tree structure replies
  course?: {
    id: string;
    code: string;
    name: string;
  };
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
  author: {
    id: string;
    fullName: string;
  };
  course?: {
    id: string;
    code: string;
    name: string;
  };
}

export enum AnnouncementPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  metadata?: any;
  createdAt: string;
}

export enum NotificationType {
  ASSIGNMENT_NEW = 'assignment_new',
  ASSIGNMENT_DUE = 'assignment_due',
  ASSIGNMENT_GRADED = 'assignment_graded',
  ANNOUNCEMENT = 'announcement',
  FORUM_REPLY = 'forum_reply',
  COURSE_ENROLLMENT = 'course_enrollment',
  GENERAL = 'general',
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
