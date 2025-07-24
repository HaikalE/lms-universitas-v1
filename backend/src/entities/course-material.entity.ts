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

export enum MaterialType {
  PDF = 'pdf',
  VIDEO = 'video',
  DOCUMENT = 'document',
  PRESENTATION = 'presentation',
  LINK = 'link',
}

@Entity('course_materials')
export class CourseMaterial {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: MaterialType,
  })
  type: MaterialType;

  @Column({ nullable: true })
  fileName: string;

  @Column({ nullable: true })
  filePath: string;

  @Column({ nullable: true })
  fileSize: number;

  @Column({ nullable: true })
  url: string; // untuk link eksternal

  @Column({ default: 1 })
  week: number; // minggu ke berapa

  @Column({ default: 1 })
  orderIndex: number; // urutan dalam minggu tersebut

  @Column({ default: true })
  isVisible: boolean;

  // ✨ NEW: Flag untuk auto-attendance trigger
  @Column({ default: false })
  isAttendanceTrigger: boolean; // apakah video ini trigger absensi otomatis

  // ✨ NEW: Minimum completion percentage for attendance (optional override)
  @Column({ type: 'float', nullable: true })
  attendanceThreshold: number; // custom threshold per video (override global setting)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Course, (course) => course.materials, {
    onDelete: 'CASCADE',
  })
  course: Course;

  @Column()
  courseId: string;

  @ManyToOne(() => User)
  uploadedBy: User;

  @Column()
  uploadedById: string;

  // ✨ NEW: Relation to video progress (for analytics)
  @OneToMany('VideoProgress', 'material')
  videoProgress: any[];

  // ✨ NEW: Relation to attendances triggered by this material
  @OneToMany('Attendance', 'triggerMaterial')
  triggeredAttendances: any[];
}
