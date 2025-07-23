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

  // Relations untuk forum
  @OneToMany(() => ForumPost, (post) => post.author)
  forumPosts: ForumPost[];
}
