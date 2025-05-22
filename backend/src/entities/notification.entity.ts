import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { User } from './user.entity';

export enum NotificationType {
  ASSIGNMENT_NEW = 'assignment_new',
  ASSIGNMENT_DUE = 'assignment_due',
  ASSIGNMENT_GRADED = 'assignment_graded',
  ANNOUNCEMENT = 'announcement',
  FORUM_REPLY = 'forum_reply',
  COURSE_ENROLLMENT = 'course_enrollment',
  GENERAL = 'general',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: any; // untuk menyimpan data tambahan seperti courseId, assignmentId, dll

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  user: User;

  @Column()
  userId: string;
}
