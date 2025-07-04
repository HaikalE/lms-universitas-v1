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

@Entity('forum_likes')
@Index(['userId', 'postId'], { unique: true })
export class ForumLike {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  @Index('IDX_FORUM_LIKE_USER')
  userId: string;

  @ManyToOne(() => ForumPost, (post) => post.likes, { onDelete: 'CASCADE' })
  post: ForumPost;

  @Column()
  @Index('IDX_FORUM_LIKE_POST')
  postId: string;

  @CreateDateColumn()
  createdAt: Date;
}
