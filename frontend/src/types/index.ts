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
  isAttendanceTrigger?: boolean;
  attendanceThreshold?: number;
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

export enum ForumPostType {
  QUESTION = 'question',
  DISCUSSION = 'discussion',
  ANNOUNCEMENT = 'announcement',
}

// ✅ ENHANCED: ForumPost interface with replies support and student interaction features
export interface ForumPost {
  id: string;
  title: string;
  content: string;
  type?: ForumPostType | string;
  isPinned: boolean;
  isLocked: boolean;
  likesCount: number;
  viewsCount: number;
  repliesCount?: number;
  isLiked?: boolean;
  isAnswered?: boolean;
  isAnswer: boolean;
  tags?: string[];
  authorId: string;
  courseId: string;
  parentId?: string; // ✅ ADDED: For reply relationships
  userId?: string; // Keep for backward compatibility
  createdAt: string;
  updatedAt?: string;
  
  // ✅ NEW: Replies array - this is what the backend now returns
  replies?: ForumPost[];
  
  // Enhanced student interaction features
  quickReactions?: {
    thumbsUp: number;
    heart: number;
    thinking: number;
    lightbulb: number;
  };
  userReactions?: string[]; // Array of reaction types user has made
  bookmarked?: boolean;
  bookmarkCount?: number;
  
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
  
  // Tree structure - children are also ForumPost objects (for nested replies)
  children?: ForumPost[];
  parent?: ForumPost;
  
  course?: {
    id: string;
    code: string;
    name: string;
  };
  
  // Additional metadata for student features
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  studyLevel?: string;
  estimatedReadTime?: number; // in minutes
  lastActivity?: string; // ISO string
}

// ✅ ENHANCED: ForumReply type alias with additional features
export type ForumReply = ForumPost;

// NEW: Student engagement interfaces
export interface StudentReputation {
  userId: string;
  totalPoints: number;
  level: 'newbie' | 'active' | 'helper' | 'expert';
  badges: StudentBadge[];
  questionsAsked: number;
  answersGiven: number;
  bestAnswers: number;
  helpfulVotes: number;
  weeklyActivity: number;
  studyStreak: number;
  monthlyRank?: number;
}

export interface StudentBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'bronze' | 'silver' | 'gold' | 'platinum';
  earnedAt: string;
  criteria: {
    requirement: string;
    threshold: number;
  };
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  courseId: string;
  createdBy: string;
  members: User[];
  maxMembers: number;
  isPrivate: boolean;
  tags: string[];
  createdAt: string;
  lastActivity: string;
  stats: {
    totalPosts: number;
    activeMembers: number;
    weeklyActivity: number;
  };
}

export interface ForumNotification {
  id: string;
  type: 'new_reply' | 'post_liked' | 'mentioned' | 'answer_marked' | 'post_bookmarked';
  title: string;
  message: string;
  postId: string;
  triggeredBy: string;
  userId: string;
  read: boolean;
  createdAt: string;
  metadata?: {
    postTitle?: string;
    reactionType?: string;
    points?: number;
  };
}

export interface ForumActivity {
  id: string;
  type: 'question_asked' | 'answer_given' | 'post_liked' | 'best_answer' | 'mentioned' | 'badge_earned';
  title: string;
  description: string;
  postId?: string;
  points?: number;
  timestamp: string;
  metadata?: any;
}

// NEW: Enhanced search and filter interfaces
export interface ForumSearchFilters {
  query?: string;
  courseId?: string;
  type?: ForumPostType | 'all';
  status?: 'answered' | 'unanswered' | 'all';
  sortBy?: 'latest' | 'popular' | 'trending' | 'unanswered';
  timeRange?: 'today' | 'week' | 'month' | 'all';
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'all';
  tags?: string[];
  authorRole?: UserRole | 'all';
}

export interface ForumQuickFilter {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
  filter: Partial<ForumSearchFilters>;
}

// Existing interfaces remain the same
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
  FORUM_MENTION = 'forum_mention',
  FORUM_LIKE = 'forum_like',
  FORUM_BEST_ANSWER = 'forum_best_answer',
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
  success?: boolean;
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