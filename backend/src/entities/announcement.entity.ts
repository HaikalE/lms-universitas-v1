import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Course } from './course.entity';
import { User } from './user.entity';

export enum AnnouncementPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

@Entity('announcements')
export class Announcement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({
    type: 'enum',
    enum: AnnouncementPriority,
    default: AnnouncementPriority.MEDIUM,
  })
  priority: AnnouncementPriority;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Course, (course) => course.announcements, {
    onDelete: 'CASCADE',
    nullable: true, // nullable untuk pengumuman global
  })
  course: Course;

  @Column({ nullable: true })
  courseId: string;

  @ManyToOne(() => User, (user) => user.announcements)
  author: User;

  @Column()
  authorId: string;
}
