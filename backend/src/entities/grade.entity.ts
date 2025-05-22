import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Course } from './course.entity';
import { User } from './user.entity';
import { Assignment } from './assignment.entity';
import { Submission } from './submission.entity';

@Entity('grades')
export class Grade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  score: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  maxScore: number;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ type: 'timestamp', nullable: true })
  gradedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Course, (course) => course.grades, {
    onDelete: 'CASCADE',
  })
  course: Course;

  @Column()
  courseId: string;

  @ManyToOne(() => User, (user) => user.grades)
  student: User;

  @Column()
  studentId: string;

  @ManyToOne(() => Assignment, (assignment) => assignment.grades, {
    onDelete: 'CASCADE',
  })
  assignment: Assignment;

  @Column()
  assignmentId: string;

  @OneToOne(() => Submission, (submission) => submission.grade, {
    nullable: true,
  })
  @JoinColumn()
  submission: Submission;

  @Column({ nullable: true })
  submissionId: string;

  @ManyToOne(() => User)
  gradedBy: User;

  @Column()
  gradedById: string;
}
