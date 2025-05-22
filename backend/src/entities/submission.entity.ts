import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';
import { Assignment } from './assignment.entity';
import { User } from './user.entity';
import { Grade } from './grade.entity';

export enum SubmissionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  LATE = 'late',
  GRADED = 'graded',
}

@Entity('submissions')
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  content: string; // text submission

  @Column({ nullable: true })
  fileName: string;

  @Column({ nullable: true })
  filePath: string;

  @Column({ nullable: true })
  fileSize: number;

  @Column({
    type: 'enum',
    enum: SubmissionStatus,
    default: SubmissionStatus.DRAFT,
  })
  status: SubmissionStatus;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ default: false })
  isLate: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Assignment, (assignment) => assignment.submissions, {
    onDelete: 'CASCADE',
  })
  assignment: Assignment;

  @Column()
  assignmentId: string;

  @ManyToOne(() => User, (user) => user.submissions)
  student: User;

  @Column()
  studentId: string;

  @OneToOne(() => Grade, (grade) => grade.submission)
  grade: Grade;
}
