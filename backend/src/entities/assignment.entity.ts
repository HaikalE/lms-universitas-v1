import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Course } from './course.entity';
import { User } from './user.entity';
import { Submission } from './submission.entity';
import { Grade } from './grade.entity';

export enum AssignmentType {
  INDIVIDUAL = 'individual',
  GROUP = 'group',
  QUIZ = 'quiz',
  EXAM = 'exam',
}

@Entity('assignments')
export class Assignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: AssignmentType,
    default: AssignmentType.INDIVIDUAL,
  })
  type: AssignmentType;

  @Column({ type: 'timestamp' })
  dueDate: Date;

  @Column({ default: 100 })
  maxScore: number;

  @Column({ default: true })
  allowLateSubmission: boolean;

  @Column({ default: 0 })
  latePenaltyPercent: number; // persentase pengurangan nilai untuk terlambat

  @Column({ type: 'text', array: true, default: [] })
  allowedFileTypes: string[]; // ['pdf', 'doc', 'docx']

  @Column({ default: 10485760 }) // 10MB default
  maxFileSize: number;

  @Column({ default: true })
  isVisible: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Course, (course) => course.assignments, {
    onDelete: 'CASCADE',
  })
  course: Course;

  @Column()
  courseId: string;

  @ManyToOne(() => User, (user) => user.assignments)
  lecturer: User;

  @Column()
  lecturerId: string;

  @OneToMany(() => Submission, (submission) => submission.assignment)
  submissions: Submission[];

  @OneToMany(() => Grade, (grade) => grade.assignment)
  grades: Grade[];
}
