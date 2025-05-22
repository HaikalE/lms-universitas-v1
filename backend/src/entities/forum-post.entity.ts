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
} from 'typeorm';
import { Course } from './course.entity';
import { User } from './user.entity';

@Entity('forum_posts')
@Tree('materialized-path')
export class ForumPost {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false })
  isPinned: boolean;

  @Column({ default: false })
  isLocked: boolean;

  @Column({ default: 0 })
  likesCount: number;

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
  courseId: string;

  @ManyToOne(() => User, (user) => user.forumPosts)
  author: User;

  @Column()
  authorId: string;

  // Tree structure untuk replies
  @TreeParent()
  parent: ForumPost;

  @TreeChildren()
  children: ForumPost[];
}
