import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository } from 'typeorm';

import { ForumPost } from '../entities/forum-post.entity';
import { Course } from '../entities/course.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateForumPostDto } from './dto/create-forum-post.dto';
import { UpdateForumPostDto } from './dto/update-forum-post.dto';
import { QueryForumPostsDto } from './dto/query-forum-posts.dto';

@Injectable()
export class ForumsService {
  constructor(
    @InjectRepository(ForumPost)
    private forumPostRepository: TreeRepository<ForumPost>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createForumPostDto: CreateForumPostDto, currentUser: User) {
    const { courseId, parentId } = createForumPostDto;

    // Verify access to course
    const course = await this.verifyUserCourseAccess(courseId, currentUser);

    let parentPost: ForumPost = null;
    if (parentId) {
      parentPost = await this.forumPostRepository.findOne({
        where: { id: parentId, courseId },
      });
      if (!parentPost) {
        throw new NotFoundException('Parent post tidak ditemukan');
      }

      if (parentPost.isLocked) {
        throw new ForbiddenException('Post telah dikunci untuk balasan');
      }
    }

    const post = this.forumPostRepository.create({
      ...createForumPostDto,
      authorId: currentUser.id,
      parent: parentPost,
    });

    return this.forumPostRepository.save(post);
  }

  async findByCourse(courseId: string, queryDto: QueryForumPostsDto, currentUser: User) {
    // Verify access to course
    await this.verifyUserCourseAccess(courseId, currentUser);

    const {
      page = 1,
      limit = 10,
      search,
      isPinned,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const queryBuilder = this.forumPostRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.children', 'children')
      .leftJoinAndSelect('children.author', 'childAuthor')
      .where('post.courseId = :courseId', { courseId })
      .andWhere('post.parent IS NULL') // Only root posts
      .select([
        'post.id',
        'post.title',
        'post.content',
        'post.isPinned',
        'post.isLocked',
        'post.likesCount',
        'post.createdAt',
        'post.updatedAt',
        'author.id',
        'author.fullName',
        'author.role',
        'children.id',
        'children.content',
        'children.createdAt',
        'childAuthor.id',
        'childAuthor.fullName',
        'childAuthor.role',
      ]);

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(post.title ILIKE :search OR post.content ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (typeof isPinned === 'boolean') {
      queryBuilder.andWhere('post.isPinned = :isPinned', { isPinned });
    }

    // Apply sorting
    if (sortBy === 'isPinned') {
      queryBuilder
        .orderBy('post.isPinned', 'DESC')
        .addOrderBy('post.createdAt', 'DESC');
    } else {
      queryBuilder.orderBy(`post.${sortBy}`, sortOrder);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [posts, total] = await queryBuilder.getManyAndCount();

    return {
      data: posts,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, currentUser: User) {
    const post = await this.forumPostRepository.findOne({
      where: { id },
      relations: ['author', 'course', 'parent'],
    });

    if (!post) {
      throw new NotFoundException('Post tidak ditemukan');
    }

    // Verify access to course
    await this.verifyUserCourseAccess(post.courseId, currentUser);

    // Get the full tree of replies
    const tree = await this.forumPostRepository.findDescendantsTree(post);

    return tree;
  }

  async update(id: string, updateForumPostDto: UpdateForumPostDto, currentUser: User) {
    const post = await this.forumPostRepository.findOne({
      where: { id },
      relations: ['author', 'course'],
    });

    if (!post) {
      throw new NotFoundException('Post tidak ditemukan');
    }

    // Verify access to course
    await this.verifyUserCourseAccess(post.courseId, currentUser);

    // Only author, lecturer of the course, or admin can update
    if (
      post.authorId !== currentUser.id &&
      currentUser.role !== UserRole.ADMIN &&
      (currentUser.role !== UserRole.LECTURER ||
        post.course.lecturerId !== currentUser.id)
    ) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk mengubah post ini');
    }

    Object.assign(post, updateForumPostDto);
    return this.forumPostRepository.save(post);
  }

  async remove(id: string, currentUser: User) {
    const post = await this.forumPostRepository.findOne({
      where: { id },
      relations: ['author', 'course'],
    });

    if (!post) {
      throw new NotFoundException('Post tidak ditemukan');
    }

    // Verify access to course
    await this.verifyUserCourseAccess(post.courseId, currentUser);

    // Only author, lecturer of the course, or admin can delete
    if (
      post.authorId !== currentUser.id &&
      currentUser.role !== UserRole.ADMIN &&
      (currentUser.role !== UserRole.LECTURER ||
        post.course.lecturerId !== currentUser.id)
    ) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk menghapus post ini');
    }

    await this.forumPostRepository.remove(post);
    return { message: 'Post berhasil dihapus' };
  }

  async togglePin(id: string, currentUser: User) {
    const post = await this.forumPostRepository.findOne({
      where: { id },
      relations: ['course'],
    });

    if (!post) {
      throw new NotFoundException('Post tidak ditemukan');
    }

    // Only lecturer of the course or admin can pin/unpin
    if (
      currentUser.role !== UserRole.ADMIN &&
      (currentUser.role !== UserRole.LECTURER ||
        post.course.lecturerId !== currentUser.id)
    ) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk pin/unpin post ini');
    }

    post.isPinned = !post.isPinned;
    await this.forumPostRepository.save(post);

    return {
      message: post.isPinned ? 'Post berhasil di-pin' : 'Post berhasil di-unpin',
      isPinned: post.isPinned,
    };
  }

  async toggleLock(id: string, currentUser: User) {
    const post = await this.forumPostRepository.findOne({
      where: { id },
      relations: ['course'],
    });

    if (!post) {
      throw new NotFoundException('Post tidak ditemukan');
    }

    // Only lecturer of the course or admin can lock/unlock
    if (
      currentUser.role !== UserRole.ADMIN &&
      (currentUser.role !== UserRole.LECTURER ||
        post.course.lecturerId !== currentUser.id)
    ) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk lock/unlock post ini');
    }

    post.isLocked = !post.isLocked;
    await this.forumPostRepository.save(post);

    return {
      message: post.isLocked ? 'Post berhasil dikunci' : 'Post berhasil dibuka',
      isLocked: post.isLocked,
    };
  }

  async toggleLike(id: string, currentUser: User) {
    const post = await this.forumPostRepository.findOne({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post tidak ditemukan');
    }

    // Verify access to course
    await this.verifyUserCourseAccess(post.courseId, currentUser);

    // Simple like count increment (in real app, you'd track individual likes)
    post.likesCount += 1;
    await this.forumPostRepository.save(post);

    return {
      message: 'Like berhasil ditambahkan',
      likesCount: post.likesCount,
    };
  }

  private async verifyUserCourseAccess(courseId: string, currentUser: User): Promise<Course> {
    const queryBuilder = this.courseRepository
      .createQueryBuilder('course')
      .where('course.id = :courseId', { courseId });

    // Check access based on user role
    if (currentUser.role === UserRole.STUDENT) {
      queryBuilder
        .innerJoin('course.students', 'student')
        .andWhere('student.id = :studentId', { studentId: currentUser.id });
    } else if (currentUser.role === UserRole.LECTURER) {
      queryBuilder.andWhere('course.lecturerId = :lecturerId', {
        lecturerId: currentUser.id,
      });
    }
    // Admin has access to all courses

    const course = await queryBuilder.getOne();

    if (!course) {
      throw new NotFoundException('Mata kuliah tidak ditemukan atau Anda tidak memiliki akses');
    }

    return course;
  }
}
