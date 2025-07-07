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

    console.log('🔍 Creating forum post in service:');
    console.log('   - CourseId:', courseId);
    console.log('   - ParentId:', parentId || 'none (new post)');
    console.log('   - User:', currentUser.id);

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

    const savedPost = await this.forumPostRepository.save(post);
    
    // Return with relations for complete data
    return this.forumPostRepository.findOne({
      where: { id: savedPost.id },
      relations: ['author', 'course', 'parent'],
    });
  }

  async findByCourse(courseId: string, queryDto: QueryForumPostsDto, currentUser: User) {
    console.log('🔍 Finding posts by course in service:', courseId);
    
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
    console.log('🔍 Finding single post in service:', id);
    
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

    console.log('✅ Post found with tree structure');
    return tree;
  }

  // NEW: Get replies for a specific post
  async getPostReplies(postId: string, queryDto: any, currentUser: User): Promise<ForumPost[]> {
    console.log('💬 Getting replies for post:', postId);
    
    const post = await this.forumPostRepository.findOne({
      where: { id: postId },
      relations: ['course'],
    });

    if (!post) {
      throw new NotFoundException('Post tidak ditemukan');
    }

    // Verify access to course
    await this.verifyUserCourseAccess(post.courseId, currentUser);

    const { sort = 'oldest' } = queryDto;

    const queryBuilder = this.forumPostRepository
      .createQueryBuilder('reply')
      .leftJoinAndSelect('reply.author', 'author')
      .leftJoinAndSelect('reply.children', 'children')
      .leftJoinAndSelect('children.author', 'childAuthor')
      .where('reply.parent = :postId', { postId })
      .select([
        'reply.id',
        'reply.content',
        'reply.likesCount',
        'reply.createdAt',
        'reply.updatedAt',
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

    // Apply sorting
    switch (sort) {
      case 'latest':
        queryBuilder.orderBy('reply.createdAt', 'DESC');
        break;
      case 'popular':
        queryBuilder.orderBy('reply.likesCount', 'DESC');
        break;
      case 'oldest':
      default:
        queryBuilder.orderBy('reply.createdAt', 'ASC');
        break;
    }

    const replies = await queryBuilder.getMany();
    console.log(`✅ Found ${replies.length} replies`);
    return replies;
  }

  // NEW: Create reply for a post
  async createReply(postId: string, replyData: { content: string; parentId?: string }, currentUser: User): Promise<ForumPost> {
    console.log('💬 Creating reply for post:', postId);
    
    const post = await this.forumPostRepository.findOne({
      where: { id: postId },
      relations: ['course'],
    });

    if (!post) {
      throw new NotFoundException('Post tidak ditemukan');
    }

    if (post.isLocked) {
      throw new ForbiddenException('Post telah dikunci untuk balasan');
    }

    // Verify access to course
    await this.verifyUserCourseAccess(post.courseId, currentUser);

    // Determine parent - either the specific reply or the main post
    let parentPost = post;
    if (replyData.parentId && replyData.parentId !== postId) {
      const specificParent = await this.forumPostRepository.findOne({
        where: { id: replyData.parentId },
      });
      if (specificParent) {
        parentPost = specificParent;
      }
    }

    const reply = this.forumPostRepository.create({
      title: '', // Replies don't need titles
      content: replyData.content,
      courseId: post.courseId,
      authorId: currentUser.id,
      parent: parentPost,
    });

    const savedReply = await this.forumPostRepository.save(reply);
    
    // Return with relations
    return this.forumPostRepository.findOne({
      where: { id: savedReply.id },
      relations: ['author', 'course', 'parent'],
    });
  }

  // NEW: Mark post as viewed
  async markAsViewed(postId: string, currentUser: User): Promise<void> {
    console.log('👁️ Marking post as viewed:', postId);
    
    const post = await this.forumPostRepository.findOne({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post tidak ditemukan');
    }

    // Verify access to course
    await this.verifyUserCourseAccess(post.courseId, currentUser);

    // In a real app, you'd track individual views in a separate table
    // For now, just increment view count
    post.viewsCount = (post.viewsCount || 0) + 1;
    await this.forumPostRepository.save(post);
    
    console.log('✅ Post marked as viewed');
  }

  // NEW: Mark reply as answer
  async markAsAnswer(postId: string, replyId: string, currentUser: User): Promise<{ message: string }> {
    console.log('✅ Marking reply as answer:', { postId, replyId });
    
    const post = await this.forumPostRepository.findOne({
      where: { id: postId },
      relations: ['author'],
    });

    if (!post) {
      throw new NotFoundException('Post tidak ditemukan');
    }

    // Only post owner can mark answers
    if (post.authorId !== currentUser.id) {
      throw new ForbiddenException('Hanya pemilik post yang dapat menandai jawaban');
    }

    const reply = await this.forumPostRepository.findOne({
      where: { id: replyId },
    });

    if (!reply) {
      throw new NotFoundException('Balasan tidak ditemukan');
    }

    // Verify access to course
    await this.verifyUserCourseAccess(post.courseId, currentUser);

    // In a real app, you'd have an isAnswer field or separate answer tracking
    // For now, we'll just mark it conceptually
    reply.isAnswer = true;
    await this.forumPostRepository.save(reply);

    // Mark post as answered
    post.isAnswered = true;
    await this.forumPostRepository.save(post);
    
    console.log('✅ Reply marked as answer successfully');
    return { message: 'Balasan berhasil ditandai sebagai jawaban' };
  }

  async update(id: string, updateForumPostDto: UpdateForumPostDto, currentUser: User) {
    console.log('✏️ Updating post in service:', id);
    
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
    const updatedPost = await this.forumPostRepository.save(post);
    
    console.log('✅ Post updated successfully');
    return updatedPost;
  }

  async remove(id: string, currentUser: User) {
    console.log('🗑️ Removing post in service:', id);
    
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
    console.log('✅ Post removed successfully');
    return { message: 'Post berhasil dihapus' };
  }

  async togglePin(id: string, currentUser: User) {
    console.log('📌 Toggling pin in service:', id);
    
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

    console.log('✅ Pin toggled successfully');
    return {
      message: post.isPinned ? 'Post berhasil di-pin' : 'Post berhasil di-unpin',
      isPinned: post.isPinned,
    };
  }

  async toggleLock(id: string, currentUser: User) {
    console.log('🔒 Toggling lock in service:', id);
    
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

    console.log('✅ Lock toggled successfully');
    return {
      message: post.isLocked ? 'Post berhasil dikunci' : 'Post berhasil dibuka',
      isLocked: post.isLocked,
    };
  }

  async toggleLike(id: string, currentUser: User) {
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
  }

  private async verifyUserCourseAccess(courseId: string, currentUser: User): Promise<Course> {
    console.log('🔍 Verifying course access:', { courseId, userId: currentUser.id, role: currentUser.role });
    
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

    console.log('✅ Course access verified:', course.name);
    return course;
  }
}