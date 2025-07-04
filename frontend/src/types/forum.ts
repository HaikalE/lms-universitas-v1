// Enhanced Forum Types for Frontend
export interface User {
  id: string;
  email: string;
  fullName: string;
  studentId?: string;
  lecturerId?: string;
  role: 'admin' | 'lecturer' | 'student';
  phone?: string;
  address?: string;
  avatar?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
  credits: number;
  semester: string;
  isActive: boolean;
  lecturer: User;
  lecturerId: string;
  students?: User[];
  createdAt: string;
  updatedAt: string;
}

export enum PostCategory {
  GENERAL = 'general',
  QUESTION = 'question',
  DISCUSSION = 'discussion',
  ANNOUNCEMENT = 'announcement',
  ASSIGNMENT_HELP = 'assignment_help',
  EXAM_DISCUSSION = 'exam_discussion',
}

export interface ForumAttachment {
  id: string;
  postId: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  uploadedAt: string;
}

export interface ForumLike {
  id: string;
  userId: string;
  postId: string;
  user?: User;
  createdAt: string;
}

export enum NotificationType {
  REPLY = 'reply',
  LIKE = 'like',
  MENTION = 'mention',
  BEST_ANSWER = 'best_answer',
  PIN = 'pin',
  ANNOUNCEMENT = 'announcement',
}

export interface ForumNotification {
  id: string;
  userId: string;
  postId: string;
  type: NotificationType;
  message?: string;
  isRead: boolean;
  triggeredBy?: User;
  triggeredById?: string;
  post?: ForumPost;
  createdAt: string;
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  category: PostCategory;
  tags: string[];
  isPinned: boolean;
  isLocked: boolean;
  isAnnouncement: boolean;
  likesCount: number;
  viewCount: number;
  replyCount: number;
  lastActivityAt?: string;
  bestAnswerId?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  course: Course;
  courseId: string;
  author: User;
  authorId: string;
  parent?: ForumPost;
  children?: ForumPost[];
  likes?: ForumLike[];
  attachments?: ForumAttachment[];
  bestAnswer?: ForumPost;
  
  // Virtual properties
  isQuestion?: boolean;
  hasAttachments?: boolean;
  shortContent?: string;
  isLikedByUser?: boolean;
}

// For backward compatibility
export interface ForumReply extends ForumPost {
  // ForumReply is essentially a ForumPost with a parent
}

export interface CreateForumPostRequest {
  title: string;
  content: string;
  courseId: string;
  parentId?: string;
  category?: PostCategory;
  tags?: string[];
  isAnnouncement?: boolean;
  attachments?: string[];
}

export interface UpdateForumPostRequest {
  title?: string;
  content?: string;
  category?: PostCategory;
  tags?: string[];
  isPinned?: boolean;
  isLocked?: boolean;
  isAnnouncement?: boolean;
}

export interface QueryForumPostsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: PostCategory;
  tags?: string[];
  isPinned?: boolean;
  isAnnouncement?: boolean;
  hasAttachments?: boolean;
  sortBy?: 'createdAt' | 'updatedAt' | 'likesCount' | 'viewCount' | 'replyCount' | 'lastActivityAt';
  sortOrder?: 'ASC' | 'DESC';
  authorId?: string;
  onlyQuestions?: boolean;
  unanswered?: boolean;
}

export interface ForumPostsResponse {
  data: ForumPost[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface MarkBestAnswerRequest {
  replyId: string;
}

export interface ForumAnalyticsParams {
  startDate?: string;
  endDate?: string;
  category?: PostCategory;
}

export interface ForumAnalyticsResponse {
  summary: {
    totalPosts: number;
    totalReplies: number;
    totalLikes: number;
    totalParticipants: number;
  };
  topUsers: Array<{
    id: string;
    fullName: string;
    postCount: number;
  }>;
  postsByCategory: Array<{
    category: string;
    count: number;
  }>;
  course: {
    id: string;
    name: string;
    code: string;
  };
}

export interface LikeResponse {
  liked: boolean;
  likesCount: number;
}

export interface CategoryCount {
  [key: string]: number;
}

export interface PopularTag {
  tag: string;
  count: number;
}

export interface UserActivity {
  totalPosts: number;
  totalReplies: number;
  totalLikes: number;
  recentPosts: ForumPost[];
}

export interface Leaderboard {
  topContributors: Array<{
    id: string;
    fullName: string;
    postCount: number;
  }>;
  totalParticipants: number;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

// Forum UI State Types
export interface ForumState {
  posts: ForumPost[];
  currentPost: ForumPost | null;
  loading: boolean;
  error: string | null;
  filters: QueryForumPostsParams;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ForumFilters {
  search: string;
  category: PostCategory | '';
  tags: string[];
  sortBy: string;
  sortOrder: 'ASC' | 'DESC';
  showPinned: boolean;
  showAnnouncements: boolean;
  showQuestions: boolean;
  showUnanswered: boolean;
}

// Category labels for UI
export const POST_CATEGORY_LABELS: Record<PostCategory, string> = {
  [PostCategory.GENERAL]: 'Umum',
  [PostCategory.QUESTION]: 'Pertanyaan',
  [PostCategory.DISCUSSION]: 'Diskusi',
  [PostCategory.ANNOUNCEMENT]: 'Pengumuman',
  [PostCategory.ASSIGNMENT_HELP]: 'Bantuan Tugas',
  [PostCategory.EXAM_DISCUSSION]: 'Diskusi Ujian',
};

// Category colors for UI
export const POST_CATEGORY_COLORS: Record<PostCategory, string> = {
  [PostCategory.GENERAL]: 'bg-gray-100 text-gray-800',
  [PostCategory.QUESTION]: 'bg-blue-100 text-blue-800',
  [PostCategory.DISCUSSION]: 'bg-green-100 text-green-800',
  [PostCategory.ANNOUNCEMENT]: 'bg-red-100 text-red-800',
  [PostCategory.ASSIGNMENT_HELP]: 'bg-yellow-100 text-yellow-800',
  [PostCategory.EXAM_DISCUSSION]: 'bg-purple-100 text-purple-800',
};

// Notification type labels
export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  [NotificationType.REPLY]: 'Balasan Baru',
  [NotificationType.LIKE]: 'Disukai',
  [NotificationType.MENTION]: 'Disebutkan',
  [NotificationType.BEST_ANSWER]: 'Jawaban Terbaik',
  [NotificationType.PIN]: 'Post Dipasang',
  [NotificationType.ANNOUNCEMENT]: 'Pengumuman',
};

export default {
  User,
  Course,
  ForumPost,
  ForumReply,
  ForumAttachment,
  ForumLike,
  ForumNotification,
  PostCategory,
  NotificationType,
  POST_CATEGORY_LABELS,
  POST_CATEGORY_COLORS,
  NOTIFICATION_TYPE_LABELS,
};
