import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ForumPost, ForumPostType } from '../entities/forum-post.entity';
import { User, UserRole } from '../entities/user.entity';
import { Course } from '../entities/course.entity';
import { CreateForumPostDto } from './dto/create-forum-post.dto';
import { UpdateForumPostDto } from './dto/update-forum-post.dto';
import { QueryForumPostsDto } from './dto/query-forum-posts.dto';

@Injectable()
export class ForumsService {
  constructor(
    @InjectRepository(ForumPost)
    private forumPostRepository: Repository<ForumPost>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
  ) {}

  // Get user's own discussions
  async getMyDiscussions(currentUser: User, queryDto: QueryForumPostsDto) {
    try {
      const {
        page = 1,
        limit = 20,
        search,
        type,
      } = queryDto;

      const sortBy = queryDto.getSortBy();
      const sortOrder = queryDto.getSortOrder();

      const queryBuilder = this.forumPostRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .leftJoinAndSelect('post.course', 'course')
        .where('post.authorId = :authorId', { authorId: currentUser.id })
        .select([
          'post.id',
          'post.title',
          'post.content',
          'post.type',
          'post.likesCount',
          'post.viewsCount',
          'post.repliesCount',
          'post.isPinned',
          'post.isLocked',
          'post.isAnswer',
          'post.isAnswered',
          'post.createdAt',
          'post.updatedAt',
          'author.id',
          'author.fullName',
          'author.role',
          'course.id',
          'course.name',
          'course.code',
        ]);

      // Apply search filter
      if (search) {
        queryBuilder.andWhere(
          '(post.title ILIKE :search OR post.content ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      // Apply type filter
      if (type && type !== 'all') {
        queryBuilder.andWhere('post.type = :type', { type });
      }

      // Apply sorting
      queryBuilder.orderBy(`post.${sortBy}`, sortOrder);

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
    } catch (error) {
      throw error;
    }
  }

  // ✅ FIXED: Create forum post or reply with courseId inheritance
  async create(createForumPostDto: CreateForumPostDto, currentUser: User) {
    try {
      let { courseId, parentId, type = ForumPostType.DISCUSSION } = createForumPostDto;

      // ✅ FIXED: Handle courseId inheritance for replies
      let parentPost = null;
      if (parentId) {
        // This is a reply - find parent post and inherit courseId if not provided
        parentPost = await this.forumPostRepository.findOne({
          where: { id: parentId },
          relations: ['course'],
        });
        
        if (!parentPost) {
          throw new NotFoundException('Post induk tidak ditemukan');
        }

        // ✅ INHERIT COURSEID: If courseId not provided, inherit from parent
        if (!courseId) {
          courseId = parentPost.courseId;
          console.log(`🔄 Reply inheriting courseId from parent: ${courseId}`);
        }

        // Check if parent post is locked
        if (parentPost.isLocked) {
          throw new ForbiddenException('Tidak dapat membalas post yang dikunci');
        }
      } else {
        // This is a root post - courseId is required
        if (!courseId) {
          throw new BadRequestException('Course ID wajib diisi untuk post utama');
        }
      }

      // Verify course exists and user has access
      await this.verifyUserCourseAccess(courseId, currentUser);

      // ✅ FIXED: Auto-generate title for replies if not provided
      let title = createForumPostDto.title;
      if (parentId && !title) {
        const rootPost = parentPost.parentId ? 
          await this.forumPostRepository.findOne({ where: { id: parentPost.parentId } }) : 
          parentPost;
        title = `Re: ${rootPost?.title || 'Discussion'}`;
      }

      const forumPost = this.forumPostRepository.create({
        ...createForumPostDto,
        title,
        type,
        authorId: currentUser.id,
        courseId,
        parentId: parentId || null,
        likesCount: 0,
        viewsCount: 0,
        isPinned: false,
        isLocked: false,
        isAnswer: false,
        isAnswered: false,
      });

      console.log('💾 Creating forum post with data:', {
        title,
        courseId,
        parentId,
        authorId: currentUser.id
      });

      const savedPost = await this.forumPostRepository.save(forumPost);

      // Increment replies count for parent post if this is a reply
      if (parentPost) {
        await this.forumPostRepository.increment(
          { id: parentPost.id },
          'repliesCount',
          1
        );
      }

      return await this.findOne(savedPost.id, currentUser);
    } catch (error) {
      console.error('❌ Error creating forum post:', error);
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new InternalServerErrorException('Database connection error');
      }
      throw error;
    }
  }

  // Find posts by course with enhanced error handling
  async findByCourse(courseId: string, queryDto: QueryForumPostsDto, currentUser: User) {
    try {
      // Add database connection test
      try {
        await this.forumPostRepository.query('SELECT 1');
      } catch (dbError) {
        throw new InternalServerErrorException('Database connection failed');
      }

      // Verify course access with better error handling
      try {
        await this.verifyUserCourseAccess(courseId, currentUser);
      } catch (accessError) {
        throw accessError;
      }

      const {
        page = 1,
        limit = 20,
        search,
        type,
        parentId = null, // Only root posts by default
      } = queryDto;

      const sortBy = queryDto.getSortBy();
      const sortOrder = queryDto.getSortOrder();

      // Build query with proper error handling
      try {
        const queryBuilder = this.forumPostRepository
          .createQueryBuilder('post')
          .leftJoinAndSelect('post.author', 'author')
          .leftJoinAndSelect('post.course', 'course')
          .where('post.courseId = :courseId', { courseId })
          .select([
            'post.id',
            'post.title',
            'post.content',
            'post.type',
            'post.likesCount',
            'post.viewsCount',
            'post.repliesCount',
            'post.isPinned',
            'post.isLocked',
            'post.isAnswer',
            'post.isAnswered',
            'post.createdAt',
            'post.updatedAt',
            'author.id',
            'author.fullName',
            'author.role',
            'course.id',
            'course.name',
            'course.code',
          ]);

        // Filter by parent (null for root posts, specific ID for replies)
        if (parentId === null) {
          queryBuilder.andWhere('post.parentId IS NULL');
        } else {
          queryBuilder.andWhere('post.parentId = :parentId', { parentId });
        }

        // Apply search filter
        if (search) {
          queryBuilder.andWhere(
            '(post.title ILIKE :search OR post.content ILIKE :search)',
            { search: `%${search}%` }
          );
        }

        // Apply type filter
        if (type && type !== 'all') {
          queryBuilder.andWhere('post.type = :type', { type });
        }

        // Apply sorting (pinned posts first, then by specified field)
        queryBuilder
          .orderBy('post.isPinned', 'DESC')
          .addOrderBy(`post.${sortBy}`, sortOrder);

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
      } catch (queryError) {
        throw new InternalServerErrorException('Failed to fetch forum posts');
      }
    } catch (error) {
      // Handle specific database errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new InternalServerErrorException('Database connection error');
      }
      if (error.code === '42P01') { // PostgreSQL: relation does not exist
        throw new InternalServerErrorException('Database tables not found. Please run migrations.');
      }
      if (error.code === '42703') { // PostgreSQL: column does not exist
        throw new InternalServerErrorException('Database schema error. Please update database.');
      }
      
      throw error;
    }
  }

  // Enhanced findOne with better error handling
  async findOne(id: string, currentUser: User) {
    try {
      const post = await this.forumPostRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .leftJoinAndSelect('post.course', 'course')
        .where('post.id = :id', { id })
        .select([
          'post.id',
          'post.title',
          'post.content',
          'post.type',
          'post.likesCount',
          'post.viewsCount',
          'post.repliesCount',
          'post.isPinned',
          'post.isLocked',
          'post.isAnswer',
          'post.isAnswered',
          'post.parentId',
          'post.createdAt',
          'post.updatedAt',
          'author.id',
          'author.fullName',
          'author.role',
          'course.id',
          'course.name',
          'course.code',
        ])
        .getOne();

      if (!post) {
        throw new NotFoundException('Post tidak ditemukan');
      }

      // Verify course access
      await this.verifyUserCourseAccess(post.course.id, currentUser);

      return post;
    } catch (error) {
      throw error;
    }
  }

  // Get replies for a post
  async getPostReplies(postId: string, queryDto: any, currentUser: User) {
    try {
      // Verify parent post exists and get course access
      const parentPost = await this.findOne(postId, currentUser);

      const {
        page = 1,
        limit = 20,
      } = queryDto;

      // For replies, we typically want chronological order (oldest first)
      const sortBy = 'createdAt';
      const sortOrder = 'ASC';

      const queryBuilder = this.forumPostRepository
        .createQueryBuilder('post')
        .leftJoinAndSelect('post.author', 'author')
        .where('post.parentId = :parentId', { parentId: postId })
        .select([
          'post.id',
          'post.content',
          'post.likesCount',
          'post.isAnswer',
          'post.createdAt',
          'post.updatedAt',
          'author.id',
          'author.fullName',
          'author.role',
        ]);

      // Apply sorting
      queryBuilder.orderBy(`post.${sortBy}`, sortOrder);

      // Apply pagination
      const offset = (page - 1) * limit;
      queryBuilder.skip(offset).take(limit);

      const replies = await queryBuilder.getMany();

      return replies;
    } catch (error) {
      throw error;
    }
  }

  // Create reply for a post
  async createReply(postId: string, replyData: { content: string; parentId?: string }, currentUser: User) {
    try {
      // Verify parent post exists
      const parentPost = await this.findOne(postId, currentUser);

      if (parentPost.isLocked) {
        throw new ForbiddenException('Tidak dapat membalas post yang dikunci');
      }

      const createDto: CreateForumPostDto = {
        title: `Re: ${parentPost.title}`,
        content: replyData.content,
        courseId: parentPost.course.id,
        parentId: replyData.parentId || postId,
        type: ForumPostType.DISCUSSION,
      };

      return await this.create(createDto, currentUser);
    } catch (error) {
      throw error;
    }
  }

  // Mark post as viewed
  async markAsViewed(id: string, currentUser: User) {
    try {
      const post = await this.forumPostRepository.findOne({
        where: { id },
      });

      if (!post) {
        throw new NotFoundException('Post tidak ditemukan');
      }

      // Verify access to course
      await this.verifyUserCourseAccess(post.courseId, currentUser);

      // Increment view count
      await this.forumPostRepository.increment(
        { id },
        'viewsCount',
        1
      );
    } catch (error) {
      // Don't throw error for view tracking
    }
  }

  // Mark reply as answer
  async markAsAnswer(postId: string, replyId: string, currentUser: User) {
    try {
      const post = await this.findOne(postId, currentUser);
      
      // Only post author, lecturer, or admin can mark answers
      if (
        currentUser.id !== post.author.id &&
        currentUser.role !== UserRole.LECTURER &&
        currentUser.role !== UserRole.ADMIN
      ) {
        throw new ForbiddenException('Hanya penulis post, dosen, atau admin yang dapat menandai jawaban');
      }

      const reply = await this.forumPostRepository.findOne({
        where: { id: replyId, parentId: postId },
      });

      if (!reply) {
        throw new NotFoundException('Balasan tidak ditemukan');
      }

      // Unmark previous answer if exists
      await this.forumPostRepository.update(
        { parentId: postId, isAnswer: true },
        { isAnswer: false }
      );

      // Mark this reply as answer
      await this.forumPostRepository.update(
        { id: replyId },
        { isAnswer: true }
      );

      // Mark parent post as answered
      await this.forumPostRepository.update(
        { id: postId },
        { isAnswered: true }
      );

      return {
        message: 'Balasan berhasil ditandai sebagai jawaban',
      };
    } catch (error) {
      throw error;
    }
  }

  // Update forum post
  async update(id: string, updateForumPostDto: UpdateForumPostDto, currentUser: User) {
    try {
      const post = await this.findOne(id, currentUser);

      // Only author, lecturer, or admin can update
      if (
        currentUser.id !== post.author.id &&
        currentUser.role !== UserRole.LECTURER &&
        currentUser.role !== UserRole.ADMIN
      ) {
        throw new ForbiddenException('Anda tidak memiliki akses untuk mengubah post ini');
      }

      Object.assign(post, updateForumPostDto);
      const updatedPost = await this.forumPostRepository.save(post);

      return await this.findOne(updatedPost.id, currentUser);
    } catch (error) {
      throw error;
    }
  }

  // Delete forum post
  async remove(id: string, currentUser: User) {
    try {
      const post = await this.findOne(id, currentUser);

      // Only author, lecturer, or admin can delete
      if (
        currentUser.id !== post.author.id &&
        currentUser.role !== UserRole.LECTURER &&
        currentUser.role !== UserRole.ADMIN
      ) {
        throw new ForbiddenException('Anda tidak memiliki akses untuk menghapus post ini');
      }

      // Check if post has replies
      const repliesCount = await this.forumPostRepository.count({
        where: { parentId: id },
      });

      if (repliesCount > 0) {
        throw new BadRequestException('Tidak dapat menghapus post yang memiliki balasan');
      }

      // Update parent post replies count if this is a reply
      if (post.parentId) {
        await this.forumPostRepository.decrement(
          { id: post.parentId },
          'repliesCount',
          1
        );
      }

      await this.forumPostRepository.remove(post);

      return {
        message: 'Post berhasil dihapus',
      };
    } catch (error) {
      throw error;
    }
  }

  // Toggle pin post
  async togglePin(id: string, currentUser: User) {
    try {
      const post = await this.findOne(id, currentUser);

      // Only lecturer or admin can pin posts
      if (
        currentUser.role !== UserRole.LECTURER &&
        currentUser.role !== UserRole.ADMIN
      ) {
        throw new ForbiddenException('Hanya dosen atau admin yang dapat menyematkan post');
      }

      post.isPinned = !post.isPinned;
      await this.forumPostRepository.save(post);

      return {
        message: post.isPinned ? 'Post berhasil disematkan' : 'Post berhasil dibatalkan sematannya',
        isPinned: post.isPinned,
      };
    } catch (error) {
      throw error;
    }
  }

  // Toggle lock post
  async toggleLock(id: string, currentUser: User) {
    try {
      const post = await this.findOne(id, currentUser);

      // Only lecturer or admin can lock posts
      if (
        currentUser.role !== UserRole.LECTURER &&
        currentUser.role !== UserRole.ADMIN
      ) {
        throw new ForbiddenException('Hanya dosen atau admin yang dapat mengunci post');
      }

      post.isLocked = !post.isLocked;
      await this.forumPostRepository.save(post);

      return {
        message: post.isLocked ? 'Post berhasil dikunci' : 'Post berhasil dibuka kuncinya',
        isLocked: post.isLocked,
      };
    } catch (error) {
      throw error;
    }
  }

  // ✅ FIXED: Toggle like post - PROPER IMPLEMENTATION
  async toggleLike(id: string, currentUser: User) {
    try {
      const post = await this.forumPostRepository.findOne({
        where: { id },
      });

      if (!post) {
        throw new NotFoundException('Post tidak ditemukan');
      }

      // Verify access to course
      await this.verifyUserCourseAccess(post.courseId, currentUser);

      // ✅ FIXED: Check if user already liked this post
      // In a real implementation, you would have a separate ForumPostLikes table
      // For now, we'll use a simple check mechanism
      const userLikeRecord = await this.forumPostRepository.query(
        `SELECT * FROM forum_post_likes WHERE post_id = $1 AND user_id = $2`,
        [id, currentUser.id]
      );

      if (userLikeRecord && userLikeRecord.length > 0) {
        // User already liked, so unlike (remove like)
        await this.forumPostRepository.query(
          `DELETE FROM forum_post_likes WHERE post_id = $1 AND user_id = $2`,
          [id, currentUser.id]
        );
        
        // Decrement like count
        await this.forumPostRepository.decrement({ id }, 'likesCount', 1);
        
        // Get updated count
        const updatedPost = await this.forumPostRepository.findOne({ where: { id } });
        
        return {
          message: 'Like berhasil dihapus',
          likesCount: updatedPost.likesCount,
          isLiked: false
        };
      } else {
        // User hasn't liked, so add like
        await this.forumPostRepository.query(
          `INSERT INTO forum_post_likes (post_id, user_id, created_at) VALUES ($1, $2, NOW())`,
          [id, currentUser.id]
        );
        
        // Increment like count
        await this.forumPostRepository.increment({ id }, 'likesCount', 1);
        
        // Get updated count
        const updatedPost = await this.forumPostRepository.findOne({ where: { id } });
        
        return {
          message: 'Like berhasil ditambahkan',
          likesCount: updatedPost.likesCount,
          isLiked: true
        };
      }
    } catch (error) {
      throw error;
    }
  }

  // Helper method to verify user has access to course with enhanced error handling
  private async verifyUserCourseAccess(courseId: string, currentUser: User) {
    try {
      // Test if course exists first
      const courseExists = await this.courseRepository
        .createQueryBuilder('course')
        .where('course.id = :id', { id: courseId })
        .getCount();

      if (courseExists === 0) {
        throw new NotFoundException('Mata kuliah tidak ditemukan');
      }

      const course = await this.courseRepository.findOne({
        where: { id: courseId },
        relations: ['students', 'lecturer'],
      });

      if (!course) {
        throw new NotFoundException('Mata kuliah tidak ditemukan');
      }

      // Admin has access to all courses
      if (currentUser.role === UserRole.ADMIN) {
        return;
      }

      // Lecturer access - must be the course lecturer
      if (currentUser.role === UserRole.LECTURER) {
        if (course.lecturerId === currentUser.id) {
          return;
        } else {
          throw new ForbiddenException('Anda tidak memiliki akses ke mata kuliah ini');
        }
      }

      // Student access - must be enrolled in the course
      if (currentUser.role === UserRole.STUDENT) {
        const isEnrolled = course.students.some(student => student.id === currentUser.id);
        if (isEnrolled) {
          return;
        } else {
          throw new ForbiddenException('Anda tidak terdaftar di mata kuliah ini');
        }
      }

      throw new ForbiddenException('Anda tidak memiliki akses ke mata kuliah ini');
    } catch (error) {
      throw error;
    }
  }
}