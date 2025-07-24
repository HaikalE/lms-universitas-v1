import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Unique,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { CourseMaterial } from './course-material.entity';

@Entity('video_progress')
@Unique(['studentId', 'materialId']) // One progress record per student per video
@Index(['studentId', 'materialId']) // Performance optimization
export class VideoProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  student: User;

  @Column()
  studentId: string;

  @ManyToOne(() => CourseMaterial, { onDelete: 'CASCADE' })
  material: CourseMaterial;

  @Column()
  materialId: string;

  @Column({ type: 'float', default: 0 })
  currentTime: number; // detik terakhir ditonton

  @Column({ type: 'float', nullable: true })
  totalDuration: number; // total durasi video

  @Column({ type: 'float', default: 0 })
  watchedPercentage: number; // % video yang sudah ditonton

  @Column({ type: 'float', default: 0 })
  watchedSeconds: number; // total detik yang benar-benar ditonton (tidak termasuk skip)

  @Column({ default: false })
  isCompleted: boolean; // apakah video selesai ditonton (>= threshold)

  @Column({ nullable: true })
  completedAt: Date; // kapan video selesai ditonton

  @Column({ default: false })
  hasTriggeredAttendance: boolean; // prevent double attendance

  @Column({ type: 'json', nullable: true })
  watchSessions: { // track viewing sessions untuk analytics
    startTime: number;
    endTime: number;
    duration: number;
    timestamp: Date;
  }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
