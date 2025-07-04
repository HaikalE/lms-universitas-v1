import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { ForumPost } from './forum-post.entity';

export enum NotificationType {
  REPLY = 'reply',
  LIKE = 'like',
  MENTION = 'mention',
  BEST_ANSWER = 'best_answer',
  PIN = 'pin',
  ANNOUNCEMENT = 'announcement',
}

@Entity('forum_notifications')
@Index(['userId', 'isRead'])
@Index(['userId', 'createdAt'])
export class ForumNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  @Index('IDX_FORUM_NOTIFICATION_USER')
  userId: string;

  @ManyToOne(() => ForumPost, { onDelete: 'CASCADE' })
  post: ForumPost;

  @Column()
  postId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ type: 'text', nullable: true })
  message: string;

  @Column({ default: false })
  isRead: boolean;

  @ManyToOne(() => User, { nullable: true })
  triggeredBy: User;

  @Column({ nullable: true })
  triggeredById: string;

  @CreateDateColumn()
  createdAt: Date;
}
