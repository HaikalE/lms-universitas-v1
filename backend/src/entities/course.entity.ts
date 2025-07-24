import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { User } from './user.entity';
import { CourseMaterial } from './course-material.entity';
import { Assignment } from './assignment.entity';
import { ForumPost } from './forum-post.entity';
import { Announcement } from './announcement.entity';
import { Grade } from './grade.entity';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // Kode mata kuliah (misal: CS101)

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  credits: number; // SKS

  @Column()
  semester: string; // Misal: 2024/1

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Add getter for backward compatibility with existing code that expects 'title'
  get title(): string {
    return this.name;
  }

  // Relations
  @ManyToOne(() => User, (user) => user.coursesAsLecturer)
  lecturer: User;

  @Column()
  lecturerId: string;

  @ManyToMany(() => User, (user) => user.coursesAsStudent)
  @JoinTable({
    name: 'course_enrollments',
    joinColumn: {
      name: 'courseId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'studentId',
      referencedColumnName: 'id',
    },
  })
  students: User[];

  @OneToMany(() => CourseMaterial, (material) => material.course)
  materials: CourseMaterial[];

  @OneToMany(() => Assignment, (assignment) => assignment.course)
  assignments: Assignment[];

  @OneToMany(() => ForumPost, (post) => post.course)
  forumPosts: ForumPost[];

  @OneToMany(() => Announcement, (announcement) => announcement.course)
  announcements: Announcement[];

  @OneToMany(() => Grade, (grade) => grade.course)
  grades: Grade[];
}
