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
}
