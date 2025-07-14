import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
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

  // Create forum post or reply
  async create(createForumPostDto: CreateForumPostDto, currentUser: User) {
    try {
      console.log('📝 Creating forum post in service:', createForumPostDto.title);
      
      const { courseId, parentId, type = ForumPostType.DISCUSSION } = createForumPostDto;

      // Verify course exists and user has access
      await this.verifyUserCourseAccess(courseId, currentUser);

      // If this is a reply, verify parent post exists
      let parentPost = null;
      if (parentId) {
        parentPost = await this.forumPostRepository.findOne({
          where: { id: parentId, courseId },
        });
        
        if (!parentPost) {
          throw new NotFoundException('Post induk tidak ditemukan');
        }

        // Check if parent post is locked
        if (parentPost.isLocked) {
          throw new ForbiddenException('Tidak dapat membalas post yang dikunci');
        }
      }

      const forumPost = this.forumPostRepository.create({
        ...createForumPostDto,
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

      const savedPost = await this.forumPostRepository.save(forumPost);

      // Increment replies count for parent post if this is a reply
      if (parentPost) {
        await this.forumPostRepository.increment(
          { id: parentPost.id },
          'repliesCount',
          1
        );
      }

      console.log('✅ Forum post created successfully:', savedPost.id);
      return await this.findOne(savedPost.id, currentUser);
    } catch (error) {
      console.error('❌ Error creating forum post:', error.message);
      throw error;
    }
  }

  // Find posts by course
  async findByCourse(courseId: string, queryDto: QueryForumPostsDto, currentUser: User) {
    try {
      console.log('🔍 Finding forum posts for course:', courseId);
      
      // Verify course access
      await this.verifyUserCourseAccess(courseId, currentUser);

      const {
        page = 1,
        limit = 20,
        search,
        type,
        sortBy = 'createdAt',
        sortOrder = 'DESC',
        parentId = null, // Only root posts by default
      } = queryDto;

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

      console.log(`✅ Found ${posts.length} forum posts for course ${courseId}`);

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
      console.error('❌ Error finding forum posts:', error.message);
      throw error;
    }
  }

  // Find single post with details
  async findOne(id: string, currentUser: User) {
    try {
      console.log('🔍 Finding forum post:', id);

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

      console.log('✅ Forum post found:', post.title);
      return post;
    } catch (error) {
      console.error('❌ Error finding forum post:', error.message);
      throw error;
    }
  }

  // Get replies for a post
  async getPostReplies(postId: string, queryDto: any, currentUser: User) {
    try {
      console.log('💬 Getting replies for post:', postId);

      // Verify parent post exists and get course access
      const parentPost = await this.findOne(postId, currentUser);

      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'ASC',
      } = queryDto;

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

      console.log(`✅ Found ${replies.length} replies for post ${postId}`);
      return replies;
    } catch (error) {
      console.error('❌ Error getting post replies:', error.message);
      throw error;
    }
  }

  // Create reply for a post
  async createReply(postId: string, replyData: { content: string; parentId?: string }, currentUser: User) {
    try {
      console.log('💬 Creating reply for post:', postId);

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
      console.error('❌ Error creating reply:', error.message);
      throw error;
    }
  }

  // Mark post as viewed
  async markAsViewed(id: string, currentUser: User) {
    try {
      console.log('👁️ Marking post as viewed:', id);

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

      console.log('✅ Post marked as viewed successfully');
    } catch (error) {
      console.error('❌ Error marking post as viewed:', error.message);
      // Don't throw error for view tracking
    }
  }

  // Mark reply as answer
  async markAsAnswer(postId: string, replyId: string, currentUser: User) {
    try {
      console.log('✅ Marking reply as answer:', replyId, 'for post:', postId);

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

      console.log('✅ Reply marked as answer successfully');
      return {
        message: 'Balasan berhasil ditandai sebagai jawaban',
      };
    } catch (error) {
      console.error('❌ Error marking reply as answer:', error.message);
      throw error;
    }
  }

  // Update forum post
  async update(id: string, updateForumPostDto: UpdateForumPostDto, currentUser: User) {
    try {
      console.log('✏️ Updating forum post:', id);

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

      console.log('✅ Forum post updated successfully');
      return await this.findOne(updatedPost.id, currentUser);
    } catch (error) {
      console.error('❌ Error updating forum post:', error.message);
      throw error;
    }
  }

  // Delete forum post
  async remove(id: string, currentUser: User) {
    try {
      console.log('🗑️ Deleting forum post:', id);

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

      console.log('✅ Forum post deleted successfully');
      return {
        message: 'Post berhasil dihapus',
      };
    } catch (error) {
      console.error('❌ Error deleting forum post:', error.message);
      throw error;
    }
  }

  // Toggle pin post
  async togglePin(id: string, currentUser: User) {
    try {
      console.log('📌 Toggling pin for post:', id);

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

      console.log('✅ Post pin toggled successfully');
      return {
        message: post.isPinned ? 'Post berhasil disematkan' : 'Post berhasil dibatalkan sematannya',
        isPinned: post.isPinned,
      };
    } catch (error) {
      console.error('❌ Error toggling pin:', error.message);
      throw error;
    }
  }

  // Toggle lock post
  async toggleLock(id: string, currentUser: User) {
    try {
      console.log('🔒 Toggling lock for post:', id);

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

      console.log('✅ Post lock toggled successfully');
      return {
        message: post.isLocked ? 'Post berhasil dikunci' : 'Post berhasil dibuka kuncinya',
        isLocked: post.isLocked,
      };
    } catch (error) {
      console.error('❌ Error toggling lock:', error.message);
      throw error;
    }
  }

  // Toggle like post
  async toggleLike(id: string, currentUser: User) {
    try {
      console.log('❤️ Toggling like in service:', id);
      
      const post = await this.forumPostRepository.findOne({
        where: { id },
      });

      if (!post) {
        throw new NotFoundException('Post tidak ditemukan');
      }

      // Verify access to course
      await this.verifyUserCourseAccess(post.courseId, currentUser);

      // Simple like count increment (in real app, you'd track individual likes)
      post.likesCount = (post.likesCount || 0) + 1;
      await this.forumPostRepository.save(post);

      console.log('✅ Like toggled successfully');
      return {
        message: 'Like berhasil ditambahkan',
        likesCount: post.likesCount,
      };
    } catch (error) {
      console.error('❌ Error toggling like:', error.message);
      throw error;
    }
  }

  // Helper method to verify user has access to course
  private async verifyUserCourseAccess(courseId: string, currentUser: User) {
    try {
      console.log('🔐 Verifying course access:', courseId, 'for user:', currentUser.id);

      const course = await this.courseRepository.findOne({
        where: { id: courseId },
        relations: ['students', 'lecturer'],
      });

      if (!course) {
        throw new NotFoundException('Mata kuliah tidak ditemukan');
      }

      // Admin has access to all courses
      if (currentUser.role === UserRole.ADMIN) {
        console.log('✅ Admin access granted');
        return;
      }

      // Lecturer access - must be the course lecturer
      if (currentUser.role === UserRole.LECTURER) {
        if (course.lecturerId === currentUser.id) {
          console.log('✅ Lecturer access granted');
          return;
        } else {
          throw new ForbiddenException('Anda tidak memiliki akses ke mata kuliah ini');
        }
      }

      // Student access - must be enrolled in the course
      if (currentUser.role === UserRole.STUDENT) {
        const isEnrolled = course.students.some(student => student.id === currentUser.id);
        if (isEnrolled) {
          console.log('✅ Student access granted');
          return;
        } else {
          throw new ForbiddenException('Anda tidak terdaftar di mata kuliah ini');
        }
      }

      throw new ForbiddenException('Anda tidak memiliki akses ke mata kuliah ini');
    } catch (error) {
      console.error('❌ Course access verification failed:', error.message);
      throw error;
    }
  }
}