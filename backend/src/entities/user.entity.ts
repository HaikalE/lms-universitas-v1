import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Course } from './course.entity';
import { Assignment } from './assignment.entity';
import { Submission } from './submission.entity';
import { ForumPost } from './forum-post.entity';
import { ForumLike } from './forum-like.entity';
import { ForumNotification } from './forum-notification.entity';
import { Announcement } from './announcement.entity';
import { Grade } from './grade.entity';

export enum UserRole {
  ADMIN = 'admin',
  LECTURER = 'lecturer',
  STUDENT = 'student',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  fullName: string;

  @Column({ unique: true, nullable: true })
  studentId: string; // NIM untuk mahasiswa

  @Column({ unique: true, nullable: true })
  lecturerId: string; // NIDN untuk dosen

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.STUDENT,
  })
  role: UserRole;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations untuk dosen
  @OneToMany(() => Course, (course) => course.lecturer)
  coursesAsLecturer: Course[];

  @OneToMany(() => Assignment, (assignment) => assignment.lecturer)
  assignments: Assignment[];

  @OneToMany(() => Announcement, (announcement) => announcement.author)
  announcements: Announcement[];

  // Relations untuk mahasiswa
  @ManyToMany(() => Course, (course) => course.students)
  coursesAsStudent: Course[];

  @OneToMany(() => Submission, (submission) => submission.student)
  submissions: Submission[];

  @OneToMany(() => Grade, (grade) => grade.student)
  grades: Grade[];

  // Enhanced Forum Relations
  @OneToMany(() => ForumPost, (post) => post.author)
  forumPosts: ForumPost[];

  @OneToMany(() => ForumLike, (like) => like.user)
  forumLikes: ForumLike[];

  @OneToMany(() => ForumNotification, (notification) => notification.user)
  forumNotifications: ForumNotification[];

  @OneToMany(() => ForumNotification, (notification) => notification.triggeredBy)
  triggeredNotifications: ForumNotification[];

  // Virtual properties for forum stats
  get isLecturer(): boolean {
    return this.role === UserRole.LECTURER;
  }

  get isStudent(): boolean {
    return this.role === UserRole.STUDENT;
  }

  get isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  get canModerate(): boolean {
    return this.role === UserRole.LECTURER || this.role === UserRole.ADMIN;
  }
}
