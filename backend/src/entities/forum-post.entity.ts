import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Tree,
  TreeParent,
  TreeChildren,
  Index,
  BeforeUpdate,
} from 'typeorm';
import { Course } from './course.entity';
import { User } from './user.entity';
import { ForumLike } from './forum-like.entity';
import { ForumAttachment } from './forum-attachment.entity';

export enum PostCategory {
  GENERAL = 'general',
  QUESTION = 'question',
  DISCUSSION = 'discussion',
  ANNOUNCEMENT = 'announcement',
  ASSIGNMENT_HELP = 'assignment_help',
  EXAM_DISCUSSION = 'exam_discussion',
}

@Entity('forum_posts')
@Tree('materialized-path')
@Index(['courseId', 'createdAt'])
@Index(['authorId', 'createdAt'])
@Index(['category', 'createdAt'])
@Index(['isPinned', 'createdAt'])
export class ForumPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index('IDX_FORUM_POST_TITLE')
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: PostCategory,
    default: PostCategory.GENERAL,
  })
  @Index('IDX_FORUM_POST_CATEGORY')
  category: PostCategory;

  @Column('text', { array: true, default: [] })
  tags: string[];

  @Column({ default: false })
  @Index('IDX_FORUM_POST_PINNED')
  isPinned: boolean;

  @Column({ default: false })
  isLocked: boolean;

  @Column({ default: false })
  isAnnouncement: boolean;

  @Column({ default: 0 })
  @Index('IDX_FORUM_POST_LIKES')
  likesCount: number;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ default: 0 })
  replyCount: number;

  @Column({ type: 'timestamp', nullable: true })
  @Index('IDX_FORUM_POST_ACTIVITY')
  lastActivityAt: Date;

  @Column({ type: 'uuid', nullable: true })
  bestAnswerId: string;

  @CreateDateColumn()
  @Index('IDX_FORUM_POST_CREATED')
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Course, (course) => course.forumPosts, {
    onDelete: 'CASCADE',
  })
  course: Course;

  @Column()
  @Index('IDX_FORUM_POST_COURSE')
  courseId: string;

  @ManyToOne(() => User, (user) => user.forumPosts)
  author: User;

  @Column()
  @Index('IDX_FORUM_POST_AUTHOR')
  authorId: string;

  // Tree structure untuk replies
  @TreeParent()
  parent: ForumPost;

  @TreeChildren()
  children: ForumPost[];

  // Enhanced relations
  @OneToMany(() => ForumLike, (like) => like.post)
  likes: ForumLike[];

  @OneToMany(() => ForumAttachment, (attachment) => attachment.post)
  attachments: ForumAttachment[];

  // Best answer relation (self-referential)
  @ManyToOne(() => ForumPost, { nullable: true })
  bestAnswer: ForumPost;

  // Update lastActivityAt before saving
  @BeforeUpdate()
  updateLastActivity() {
    this.lastActivityAt = new Date();
  }

  // Virtual properties untuk frontend
  get isQuestion(): boolean {
    return this.category === PostCategory.QUESTION;
  }

  get hasAttachments(): boolean {
    return this.attachments && this.attachments.length > 0;
  }

  get shortContent(): string {
    if (this.content.length <= 150) return this.content;
    return this.content.substring(0, 150) + '...';
  }
}
