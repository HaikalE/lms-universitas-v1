import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository, In, SelectQueryBuilder } from 'typeorm';

import { 
  ForumPost, 
  ForumLike, 
  ForumAttachment, 
  ForumNotification,
  PostCategory,
  NotificationType 
} from '../entities';
import { Course } from '../entities/course.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateForumPostDto } from './dto/create-forum-post.dto';
import { UpdateForumPostDto, MarkBestAnswerDto, ForumAnalyticsDto } from './dto/additional-forum.dto';
import { QueryForumPostsDto } from './dto/query-forum-posts.dto';

@Injectable()
export class ForumsService {
  constructor(
    @InjectRepository(ForumPost)
    private forumPostRepository: TreeRepository<ForumPost>,
    @InjectRepository(ForumLike)
    private forumLikeRepository: Repository<ForumLike>,
    @InjectRepository(ForumAttachment)
    private forumAttachmentRepository: Repository<ForumAttachment>,
    @InjectRepository(ForumNotification)
    private forumNotificationRepository: Repository<ForumNotification>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createForumPostDto: CreateForumPostDto, currentUser: User) {
    const { courseId, parentId, attachments = [] } = createForumPostDto;

    // Verify access to course
    const course = await this.verifyUserCourseAccess(courseId, currentUser);

    let parentPost: ForumPost = null;
    if (parentId) {
      parentPost = await this.forumPostRepository.findOne({
        where: { id: parentId, courseId },
        relations: ['author'],
      });
      if (!parentPost) {
        throw new NotFoundException('Parent post tidak ditemukan');
      }

      if (parentPost.isLocked) {
        throw new ForbiddenException('Post telah dikunci untuk balasan');
      }
    }

    // Create the post
    const post = this.forumPostRepository.create({
      ...createForumPostDto,
      authorId: currentUser.id,
      parent: parentPost,
      lastActivityAt: new Date(),
    });

    const savedPost = await this.forumPostRepository.save(post);

    // Process attachments if any
    if (attachments.length > 0) {
      await this.processAttachments(savedPost.id, attachments);
    }

    // Update parent post reply count and activity
    if (parentPost) {
      await this.updatePostActivity(parentPost.id);
      await this.incrementReplyCount(parentPost.id);
      
      // Send notification to parent post author
      if (parentPost.authorId !== currentUser.id) {
        await this.createNotification({
          userId: parentPost.authorId,
          postId: parentPost.id,
          type: NotificationType.REPLY,
          triggeredById: currentUser.id,
          message: `${currentUser.fullName} membalas post Anda: ${parentPost.title}`,
        });
      }
    }

    return this.findOne(savedPost.id, currentUser);
  }

  async findByCourse(courseId: string, queryDto: QueryForumPostsDto, currentUser: User) {
    // Verify access to course
    await this.verifyUserCourseAccess(courseId, currentUser);

    const {
      page = 1,
      limit = 10,
      search,
      category,
      tags,
      isPinned,
      isAnnouncement,
      hasAttachments,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      authorId,
      onlyQuestions,
      unanswered,
    } = queryDto;

    const queryBuilder = this.forumPostRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.attachments', 'attachments')
      .leftJoinAndSelect('post.likes', 'likes')
      .where('post.courseId = :courseId', { courseId })
      .andWhere('post.parent IS NULL'); // Only root posts

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        '(post.title ILIKE :search OR post.content ILIKE :search OR :search = ANY(post.tags))',
        { search: `%${search}%` },
      );
    }

    if (category) {
      queryBuilder.andWhere('post.category = :category', { category });
    }

    if (tags && tags.length > 0) {
      queryBuilder.andWhere('post.tags && :tags', { tags });
    }

    if (typeof isPinned === 'boolean') {
      queryBuilder.andWhere('post.isPinned = :isPinned', { isPinned });
    }

    if (typeof isAnnouncement === 'boolean') {
      queryBuilder.andWhere('post.isAnnouncement = :isAnnouncement', { isAnnouncement });
    }

    if (hasAttachments) {
      queryBuilder.andWhere('EXISTS (SELECT 1 FROM forum_attachments fa WHERE fa.postId = post.id)');
    }

    if (authorId) {
      queryBuilder.andWhere('post.authorId = :authorId', { authorId });
    }

    if (onlyQuestions) {
      queryBuilder.andWhere('post.category = :questionCategory', { 
        questionCategory: PostCategory.QUESTION 
      });
    }

    if (unanswered) {
      queryBuilder.andWhere('post.bestAnswerId IS NULL AND post.replyCount = 0');
    }

    // Apply sorting
    if (sortBy === 'isPinned') {
      queryBuilder
        .orderBy('post.isPinned', 'DESC')
        .addOrderBy('post.lastActivityAt', 'DESC');
    } else {
      queryBuilder.orderBy(`post.${sortBy}`, sortOrder);
    }

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [posts, total] = await queryBuilder.getManyAndCount();

    // Add user like status
    const postsWithLikes = await this.addUserLikeStatus(posts, currentUser.id);

    return {
      data: postsWithLikes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string, currentUser: User) {
    const post = await this.forumPostRepository.findOne({
      where: { id },
      relations: ['author', 'course', 'parent', 'attachments', 'likes', 'likes.user'],
    });

    if (!post) {
      throw new NotFoundException('Post tidak ditemukan');
    }

    // Verify access to course
    await this.verifyUserCourseAccess(post.courseId, currentUser);

    // Increment view count (only once per user per session)
    await this.incrementViewCount(post.id);

    // Get the full tree of replies
    const tree = await this.forumPostRepository.findDescendantsTree(post, {
      relations: ['author', 'attachments', 'likes'],
    });

    // Add user like status
    const postWithLikes = await this.addUserLikeStatus([tree], currentUser.id);

    return postWithLikes[0];
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

    // Check permissions
    if (!this.canModifyPost(post, currentUser)) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk mengubah post ini');
    }

    Object.assign(post, updateForumPostDto);
    return this.forumPostRepository.save(post);
  }

  async remove(id: string, currentUser: User) {
    const post = await this.forumPostRepository.findOne({
      where: { id },
      relations: ['author', 'course', 'parent'],
    });

    if (!post) {
      throw new NotFoundException('Post tidak ditemukan');
    }

    // Verify access to course
    await this.verifyUserCourseAccess(post.courseId, currentUser);

    // Check permissions
    if (!this.canModifyPost(post, currentUser)) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk menghapus post ini');
    }

    // Update parent reply count if this is a reply
    if (post.parent) {
      await this.decrementReplyCount(post.parent.id);
    }

    await this.forumPostRepository.remove(post);
    return { message: 'Post berhasil dihapus' };
  }

  async toggleLike(id: string, currentUser: User): Promise<{ liked: boolean; likesCount: number }> {
    const post = await this.forumPostRepository.findOne({
      where: { id },
    });

    if (!post) {
      throw new NotFoundException('Post tidak ditemukan');
    }

    // Verify access to course
    await this.verifyUserCourseAccess(post.courseId, currentUser);

    // Check if user already liked this post
    const existingLike = await this.forumLikeRepository.findOne({
      where: { userId: currentUser.id, postId: id },
    });

    let liked: boolean;
    let likesCount: number;

    if (existingLike) {
      // Unlike
      await this.forumLikeRepository.remove(existingLike);
      likesCount = await this.updateLikesCount(id, -1);
      liked = false;
    } else {
      // Like
      const like = this.forumLikeRepository.create({
        userId: currentUser.id,
        postId: id,
      });
      await this.forumLikeRepository.save(like);
      likesCount = await this.updateLikesCount(id, 1);
      liked = true;

      // Send notification to post author
      if (post.authorId !== currentUser.id) {
        await this.createNotification({
          userId: post.authorId,
          postId: id,
          type: NotificationType.LIKE,
          triggeredById: currentUser.id,
          message: `${currentUser.fullName} menyukai post Anda`,
        });
      }
    }

    return { liked, likesCount };
  }

  async markBestAnswer(postId: string, dto: MarkBestAnswerDto, currentUser: User) {
    const post = await this.forumPostRepository.findOne({
      where: { id: postId },
      relations: ['course', 'author'],
    });

    if (!post) {
      throw new NotFoundException('Post tidak ditemukan');
    }

    // Only lecturer, post author, or admin can mark best answer
    if (!this.canModeratePost(post, currentUser) && post.authorId !== currentUser.id) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk menandai jawaban terbaik');
    }

    const reply = await this.forumPostRepository.findOne({
      where: { id: dto.replyId },
      relations: ['author'],
    });

    if (!reply || reply.courseId !== post.courseId) {
      throw new NotFoundException('Reply tidak ditemukan');
    }

    post.bestAnswerId = dto.replyId;
    await this.forumPostRepository.save(post);

    // Send notification to reply author
    if (reply.authorId !== currentUser.id) {
      await this.createNotification({
        userId: reply.authorId,
        postId: postId,
        type: NotificationType.BEST_ANSWER,
        triggeredById: currentUser.id,
        message: `Jawaban Anda telah dipilih sebagai jawaban terbaik`,
      });
    }

    return { message: 'Jawaban terbaik berhasil ditandai' };
  }

  async getForumAnalytics(courseId: string, queryDto: ForumAnalyticsDto, currentUser: User) {
    // Verify access to course
    const course = await this.verifyUserCourseAccess(courseId, currentUser);

    // Only lecturer or admin can view analytics
    if (currentUser.role === UserRole.STUDENT) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk melihat analytics');
    }

    const { startDate, endDate, category } = queryDto;

    let whereConditions = 'post.courseId = :courseId';
    const parameters: any = { courseId };

    if (startDate) {
      whereConditions += ' AND post.createdAt >= :startDate';
      parameters.startDate = startDate;
    }

    if (endDate) {
      whereConditions += ' AND post.createdAt <= :endDate';
      parameters.endDate = endDate;
    }

    if (category) {
      whereConditions += ' AND post.category = :category';
      parameters.category = category;
    }

    // Get basic statistics
    const totalPosts = await this.forumPostRepository
      .createQueryBuilder('post')
      .where(whereConditions, parameters)
      .getCount();

    const totalReplies = await this.forumPostRepository
      .createQueryBuilder('post')
      .where(whereConditions + ' AND post.parent IS NOT NULL', parameters)
      .getCount();

    const totalLikes = await this.forumLikeRepository
      .createQueryBuilder('like')
      .innerJoin('like.post', 'post')
      .where(whereConditions.replace('post.courseId', 'post.courseId'), parameters)
      .getCount();

    // Get most active users
    const topUsers = await this.forumPostRepository
      .createQueryBuilder('post')
      .select(['author.id', 'author.fullName', 'COUNT(post.id) as postCount'])
      .innerJoin('post.author', 'author')
      .where(whereConditions, parameters)
      .groupBy('author.id, author.fullName')
      .orderBy('postCount', 'DESC')
      .limit(10)
      .getRawMany();

    // Get posts by category
    const postsByCategory = await this.forumPostRepository
      .createQueryBuilder('post')
      .select(['post.category', 'COUNT(post.id) as count'])
      .where(whereConditions, parameters)
      .groupBy('post.category')
      .getRawMany();

    return {
      summary: {
        totalPosts,
        totalReplies,
        totalLikes,
        totalParticipants: topUsers.length,
      },
      topUsers,
      postsByCategory,
      course: {
        id: course.id,
        name: course.name,
        code: course.code,
      },
    };
  }

  // Helper methods
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

  private canModifyPost(post: ForumPost, user: User): boolean {
    return (
      post.authorId === user.id ||
      user.role === UserRole.ADMIN ||
      this.canModeratePost(post, user)
    );
  }

  private canModeratePost(post: ForumPost, user: User): boolean {
    return (
      user.role === UserRole.ADMIN ||
      (user.role === UserRole.LECTURER && post.course?.lecturerId === user.id)
    );
  }

  private async addUserLikeStatus(posts: ForumPost[], userId: string): Promise<ForumPost[]> {
    if (!posts.length) return posts;

    const postIds = posts.map(post => post.id);
    const userLikes = await this.forumLikeRepository.find({
      where: {
        userId,
        postId: In(postIds),
      },
    });

    const likedPostIds = new Set(userLikes.map(like => like.postId));

    return posts.map(post => ({
      ...post,
      isLikedByUser: likedPostIds.has(post.id),
    }));
  }

  private async updateLikesCount(postId: string, increment: number): Promise<number> {
    await this.forumPostRepository
      .createQueryBuilder()
      .update(ForumPost)
      .set({ likesCount: () => `likes_count + ${increment}` })
      .where('id = :id', { id: postId })
      .execute();

    const post = await this.forumPostRepository.findOne({
      where: { id: postId },
      select: ['likesCount'],
    });

    return post?.likesCount || 0;
  }

  private async incrementReplyCount(postId: string): Promise<void> {
    await this.forumPostRepository
      .createQueryBuilder()
      .update(ForumPost)
      .set({ replyCount: () => 'reply_count + 1' })
      .where('id = :id', { id: postId })
      .execute();
  }

  private async decrementReplyCount(postId: string): Promise<void> {
    await this.forumPostRepository
      .createQueryBuilder()
      .update(ForumPost)
      .set({ replyCount: () => 'GREATEST(reply_count - 1, 0)' })
      .where('id = :id', { id: postId })
      .execute();
  }

  private async incrementViewCount(postId: string): Promise<void> {
    await this.forumPostRepository
      .createQueryBuilder()
      .update(ForumPost)
      .set({ viewCount: () => 'view_count + 1' })
      .where('id = :id', { id: postId })
      .execute();
  }

  private async updatePostActivity(postId: string): Promise<void> {
    await this.forumPostRepository
      .createQueryBuilder()
      .update(ForumPost)
      .set({ lastActivityAt: new Date() })
      .where('id = :id', { id: postId })
      .execute();
  }

  private async processAttachments(postId: string, attachments: string[]): Promise<void> {
    // This would typically process uploaded files
    // For now, we'll create placeholder records
    const attachmentEntities = attachments.map(filename => 
      this.forumAttachmentRepository.create({
        postId,
        filename,
        originalName: filename,
        fileSize: 0, // Would be actual file size
        mimeType: 'application/octet-stream', // Would be detected
      })
    );

    await this.forumAttachmentRepository.save(attachmentEntities);
  }

  private async createNotification(data: {
    userId: string;
    postId: string;
    type: NotificationType;
    triggeredById: string;
    message: string;
  }): Promise<void> {
    const notification = this.forumNotificationRepository.create(data);
    await this.forumNotificationRepository.save(notification);
  }

  // Legacy methods for backward compatibility
  async togglePin(id: string, currentUser: User) {
    const post = await this.forumPostRepository.findOne({
      where: { id },
      relations: ['course'],
    });

    if (!post) {
      throw new NotFoundException('Post tidak ditemukan');
    }

    if (!this.canModeratePost(post, currentUser)) {
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

    if (!this.canModeratePost(post, currentUser)) {
      throw new ForbiddenException('Anda tidak memiliki akses untuk lock/unlock post ini');
    }

    post.isLocked = !post.isLocked;
    await this.forumPostRepository.save(post);

    return {
      message: post.isLocked ? 'Post berhasil dikunci' : 'Post berhasil dibuka',
      isLocked: post.isLocked,
    };
  }
}
