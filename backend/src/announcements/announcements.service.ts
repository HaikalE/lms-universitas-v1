import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Announcement } from '../entities/announcement.entity';
import { Course } from '../entities/course.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { QueryAnnouncementsDto } from './dto/query-announcements.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    @InjectRepository(Announcement)
    private announcementRepository: Repository<Announcement>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createAnnouncementDto: CreateAnnouncementDto, currentUser: User) {
    const { courseId } = createAnnouncementDto;

    // If courseId is provided, verify access to course
    if (courseId) {
      const course = await this.courseRepository.findOne({ where: { id: courseId } });
      if (!course) {
        throw new NotFoundException('Mata kuliah tidak ditemukan');
      }

      // Only lecturer of the course or admin can create course announcements
      if (
        currentUser.role !== UserRole.ADMIN &&
        course.lecturerId !== currentUser.id
      ) {
        throw new ForbiddenException('Anda tidak memiliki akses untuk membuat pengumuman di mata kuliah ini');
      }
    } else {
      // Global announcements can only be created by admin
      if (currentUser.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Hanya admin yang dapat membuat pengumuman global');
      }
    }

    const announcement = this.announcementRepository.create({
      ...createAnnouncementDto,
      authorId: currentUser.id,
    });

    return this.announcementRepository.save(announcement);
  }

  async findAll(queryDto: QueryAnnouncementsDto, currentUser: User) {
    const {
      page = 1,
      limit = 10,
      courseId,
      priority,
      isActive,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const queryBuilder = this.announcementRepository
      .createQueryBuilder('announcement')
      .leftJoinAndSelect('announcement.author', 'author')
      .leftJoinAndSelect('announcement.course', 'course')
      .select([
        'announcement.id',
        'announcement.title',
        'announcement.content',
        'announcement.priority',
        'announcement.isActive',
        'announcement.expiresAt',
        'announcement.createdAt',
        'author.id',
        'author.fullName',
        'course.id',
        'course.code',
        'course.name',
      ]);

    // Filter based on user role and access
    if (currentUser.role === UserRole.STUDENT) {
      // Students see global announcements and announcements from their enrolled courses
      queryBuilder.andWhere(
        '(announcement.courseId IS NULL OR announcement.courseId IN ' +
        '(SELECT ce.courseId FROM course_enrollments ce WHERE ce.studentId = :studentId))',
        { studentId: currentUser.id },
      );
    } else if (currentUser.role === UserRole.LECTURER) {
      // Lecturers see global announcements and announcements from their courses
      queryBuilder.andWhere(
        '(announcement.courseId IS NULL OR course.lecturerId = :lecturerId)',
        { lecturerId: currentUser.id },
      );
    }
    // Admin sees all announcements

    // Apply filters
    if (courseId) {
      queryBuilder.andWhere('announcement.courseId = :courseId', { courseId });
    }

    if (priority) {
      queryBuilder.andWhere('announcement.priority = :priority', { priority });
    }

    if (typeof isActive === 'boolean') {
      queryBuilder.andWhere('announcement.isActive = :isActive', { isActive });
    }

    if (search) {
      queryBuilder.andWhere(
        '(announcement.title ILIKE :search OR announcement.content ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Only show active and non-expired announcements for non-admin users
    if (currentUser.role !== UserRole.ADMIN) {
      queryBuilder
        .andWhere('announcement.isActive = :isActive', { isActive: true })
        .andWhere(
          '(announcement.expiresAt IS NULL OR announcement.expiresAt > :now)',
          { now: new Date() },
        );
    }

    // Apply sorting
    if (sortBy === 'priority') {
      queryBuilder
        .orderBy(
          `CASE announcement.priority 
           WHEN 'urgent' THEN 1 
           WHEN 'high' THEN 2 
           WHEN 'medium' THEN 3 
           WHEN 'low' THEN 4 
           END`,
        )
        .addOrderBy('announcement.createdAt', 'DESC');
    } else {
      queryBuilder.orderBy(`announcement.${sortBy}`, sortOrder);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [announcements, total] = await queryBuilder.getManyAndCount();

    return {
      data: announcements,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUser: User) {
    const queryBuilder = this.announcementRepository
      .createQueryBuilder('announcement')
      .leftJoinAndSelect('announcement.author', 'author')
      .leftJoinAndSelect('announcement.course', 'course')
      .where('announcement.id = :id', { id });

    // Apply access control based on user role
    if (currentUser.role === UserRole.STUDENT) {
      queryBuilder.andWhere(
        '(announcement.courseId IS NULL OR announcement.courseId IN ' +
        '(SELECT ce.courseId FROM course_enrollments ce WHERE ce.studentId = :studentId))',
        { studentId: currentUser.id },
      );
    } else if (currentUser.role === UserRole.LECTURER) {
      queryBuilder.andWhere(
        '(announcement.courseId IS NULL OR course.lecturerId = :lecturerId)',
        { lecturerId: currentUser.id },
      );
    }

    const announcement = await queryBuilder.getOne();

    if (!announcement) {
      throw new NotFoundException('Pengumuman tidak ditemukan atau Anda tidak memiliki akses');
    }

    return announcement;
  }

  async update(id: string, updateAnnouncementDto: UpdateAnnouncementDto, currentUser: User) {
    const announcement = await this.announcementRepository.findOne({
      where: { id },
      relations: ['course'],
    });

    if (!announcement) {
      throw new NotFoundException('Pengumuman tidak ditemukan');
    }

    // Check permission: only author, admin, or lecturer of the course can update
    const canUpdate =
      announcement.authorId === currentUser.id ||
      currentUser.role === UserRole.ADMIN ||
      (announcement.course && announcement.course.lecturerId === currentUser.id);

    if (!canUpdate) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk mengubah pengumuman ini');
    }

    Object.assign(announcement, updateAnnouncementDto);
    return this.announcementRepository.save(announcement);
  }

  async remove(id: string, currentUser: User) {
    const announcement = await this.announcementRepository.findOne({
      where: { id },
      relations: ['course'],
    });

    if (!announcement) {
      throw new NotFoundException('Pengumuman tidak ditemukan');
    }

    // Check permission: only author, admin, or lecturer of the course can delete
    const canDelete =
      announcement.authorId === currentUser.id ||
      currentUser.role === UserRole.ADMIN ||
      (announcement.course && announcement.course.lecturerId === currentUser.id);

    if (!canDelete) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk menghapus pengumuman ini');
    }

    await this.announcementRepository.remove(announcement);
    return { message: 'Pengumuman berhasil dihapus' };
  }

  async getRecentAnnouncements(currentUser: User, limit: number = 5) {
    const queryBuilder = this.announcementRepository
      .createQueryBuilder('announcement')
      .leftJoinAndSelect('announcement.author', 'author')
      .leftJoinAndSelect('announcement.course', 'course')
      .select([
        'announcement.id',
        'announcement.title',
        'announcement.priority',
        'announcement.createdAt',
        'author.fullName',
        'course.code',
        'course.name',
      ])
      .where('announcement.isActive = :isActive', { isActive: true })
      .andWhere(
        '(announcement.expiresAt IS NULL OR announcement.expiresAt > :now)',
        { now: new Date() },
      );

    // Filter based on user role
    if (currentUser.role === UserRole.STUDENT) {
      queryBuilder.andWhere(
        '(announcement.courseId IS NULL OR announcement.courseId IN ' +
        '(SELECT ce.courseId FROM course_enrollments ce WHERE ce.studentId = :studentId))',
        { studentId: currentUser.id },
      );
    } else if (currentUser.role === UserRole.LECTURER) {
      queryBuilder.andWhere(
        '(announcement.courseId IS NULL OR course.lecturerId = :lecturerId)',
        { lecturerId: currentUser.id },
      );
    }

    return queryBuilder
      .orderBy(
        `CASE announcement.priority 
         WHEN 'urgent' THEN 1 
         WHEN 'high' THEN 2 
         WHEN 'medium' THEN 3 
         WHEN 'low' THEN 4 
         END`,
      )
      .addOrderBy('announcement.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }
}
