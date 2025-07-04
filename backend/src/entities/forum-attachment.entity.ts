import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { ForumPost } from './forum-post.entity';

@Entity('forum_attachments')
export class ForumAttachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ForumPost, (post) => post.attachments, { onDelete: 'CASCADE' })
  post: ForumPost;

  @Column()
  @Index('IDX_FORUM_ATTACHMENT_POST')
  postId: string;

  @Column()
  filename: string;

  @Column()
  originalName: string;

  @Column()
  fileSize: number;

  @Column()
  mimeType: string;

  @Column({ nullable: true })
  fileUrl: string;

  @Column({ nullable: true })
  thumbnailUrl: string;

  @CreateDateColumn()
  uploadedAt: Date;
}
