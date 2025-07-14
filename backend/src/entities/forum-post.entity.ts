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
} from 'typeorm';
import { Course } from './course.entity';
import { User } from './user.entity';

export enum ForumPostType {
  DISCUSSION = 'discussion',
  QUESTION = 'question',
  ANNOUNCEMENT = 'announcement',
}

@Entity('forum_posts')
@Tree('materialized-path')
@Index(['courseId', 'createdAt'])
@Index(['courseId', 'isPinned'])
export class ForumPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: ForumPostType,
    default: ForumPostType.DISCUSSION,
  })
  type: ForumPostType;

  @Column({ default: false })
  isPinned: boolean;

  @Column({ default: false })
  isLocked: boolean;

  @Column({ default: 0 })
  likesCount: number;

  @Column({ default: 0 })
  viewsCount: number;

  @Column({ default: 0 })
  repliesCount: number;

  @Column({ default: false })
  isAnswer: boolean;

  @Column({ default: false })
  isAnswered: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Course, (course) => course.forumPosts, {
    onDelete: 'CASCADE',
  })
  course: Course;

  @Column()
  @Index()
  courseId: string;

  @ManyToOne(() => User, (user) => user.forumPosts)
  author: User;

  @Column()
  @Index()
  authorId: string;

  // Simple parent-child relationship for easier querying
  @Column({ nullable: true })
  @Index()
  parentId: string;

  @ManyToOne(() => ForumPost, (post) => post.replies, { nullable: true })
  parentPost: ForumPost;

  @OneToMany(() => ForumPost, (post) => post.parentPost)
  replies: ForumPost[];

  // Tree structure untuk compatibility (can be used for advanced hierarchical operations)
  @TreeParent()
  parent: ForumPost;

  @TreeChildren()
  children: ForumPost[];
}