import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Notification, NotificationType } from '../entities/notification.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@Injectable()
export class NotificationsService {
  private notificationGateway: any; // Will be injected via setter to avoid circular dependency

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Setter injection to avoid circular dependency
  setNotificationGateway(gateway: any) {
    this.notificationGateway = gateway;
  }

  async create(createNotificationDto: CreateNotificationDto, currentUser?: User) {
    // Only admin can create notifications manually
    if (currentUser && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Hanya admin yang dapat membuat notifikasi');
    }

    const notification = this.notificationRepository.create(createNotificationDto);
    const savedNotification = await this.notificationRepository.save(notification);

    // Send real-time notification if gateway is available
    if (this.notificationGateway && savedNotification.userId) {
      await this.notificationGateway.sendToUser(
        savedNotification.userId,
        'new_notification',
        savedNotification,
      );
      
      // Update unread count
      const unreadCount = await this.getUnreadCount(savedNotification.userId);
      await this.notificationGateway.sendToUser(
        savedNotification.userId,
        'unread_count',
        unreadCount,
      );
    }

    return savedNotification;
  }

  async createSystemNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    metadata?: any,
  ) {
    const notification = this.notificationRepository.create({
      userId,
      type,
      title,
      message,
      metadata,
    });

    const savedNotification = await this.notificationRepository.save(notification);

    // Send real-time notification if gateway is available
    if (this.notificationGateway) {
      await this.notificationGateway.sendToUser(
        userId,
        'new_notification',
        {
          ...savedNotification,
          timestamp: new Date().toISOString(),
        },
      );
      
      // Update unread count
      const unreadCount = await this.getUnreadCount(userId);
      await this.notificationGateway.sendToUser(userId, 'unread_count', unreadCount);
    }

    return savedNotification;
  }

  async createBulkNotifications(
    userIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    metadata?: any,
  ) {
    const notifications = userIds.map((userId) =>
      this.notificationRepository.create({
        userId,
        type,
        title,
        message,
        metadata,
      }),
    );

    const savedNotifications = await this.notificationRepository.save(notifications);

    // Send real-time notifications if gateway is available
    if (this.notificationGateway) {
      for (const notification of savedNotifications) {
        await this.notificationGateway.sendToUser(
          notification.userId,
          'new_notification',
          {
            ...notification,
            timestamp: new Date().toISOString(),
          },
        );
        
        // Update unread count for each user
        const unreadCount = await this.getUnreadCount(notification.userId);
        await this.notificationGateway.sendToUser(
          notification.userId,
          'unread_count',
          unreadCount,
        );
      }
    }

    return savedNotifications;
  }

  async findUserNotifications(userId: string, queryDto: QueryNotificationsDto) {
    const {
      page = 1,
      limit = 10,
      type,
      isRead,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .where('notification.userId = :userId', { userId })
      .select([
        'notification.id',
        'notification.title',
        'notification.message',
        'notification.type',
        'notification.isRead',
        'notification.metadata',
        'notification.createdAt',
      ]);

    // Apply filters
    if (type) {
      queryBuilder.andWhere('notification.type = :type', { type });
    }

    if (typeof isRead === 'boolean') {
      queryBuilder.andWhere('notification.isRead = :isRead', { isRead });
    }

    // Apply sorting
    queryBuilder.orderBy(`notification.${sortBy}`, sortOrder);

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [notifications, total] = await queryBuilder.getManyAndCount();

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMyNotifications(currentUser: User, queryDto: QueryNotificationsDto) {
    return this.findUserNotifications(currentUser.id, queryDto);
  }

  async markAsRead(id: string, currentUser: User) {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notifikasi tidak ditemukan');
    }

    // Users can only mark their own notifications as read
    if (notification.userId !== currentUser.id) {
      throw new ForbiddenException('Anda tidak memiliki akses ke notifikasi ini');
    }

    notification.isRead = true;
    await this.notificationRepository.save(notification);

    // Send updated unread count via WebSocket
    if (this.notificationGateway) {
      const unreadCount = await this.getUnreadCount(currentUser.id);
      await this.notificationGateway.sendToUser(
        currentUser.id,
        'unread_count',
        unreadCount,
      );
    }

    return { message: 'Notifikasi berhasil ditandai sebagai dibaca' };
  }

  async markAllAsRead(currentUser: User) {
    await this.notificationRepository.update(
      { userId: currentUser.id, isRead: false },
      { isRead: true },
    );

    // Send updated unread count via WebSocket
    if (this.notificationGateway) {
      const unreadCount = await this.getUnreadCount(currentUser.id);
      await this.notificationGateway.sendToUser(
        currentUser.id,
        'unread_count',
        unreadCount,
      );
    }

    return { message: 'Semua notifikasi berhasil ditandai sebagai dibaca' };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationRepository.count({
      where: { userId, isRead: false },
    });

    return { unreadCount: count };
  }

  async getMyUnreadCount(currentUser: User) {
    return this.getUnreadCount(currentUser.id);
  }

  async deleteNotification(id: string, currentUser: User) {
    const notification = await this.notificationRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notifikasi tidak ditemukan');
    }

    // Users can only delete their own notifications, admin can delete any
    if (
      notification.userId !== currentUser.id &&
      currentUser.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Anda tidak memiliki akses ke notifikasi ini');
    }

    await this.notificationRepository.remove(notification);

    // Send updated unread count via WebSocket
    if (this.notificationGateway && !notification.isRead) {
      const unreadCount = await this.getUnreadCount(notification.userId);
      await this.notificationGateway.sendToUser(
        notification.userId,
        'unread_count',
        unreadCount,
      );
    }

    return { message: 'Notifikasi berhasil dihapus' };
  }

  async deleteOldNotifications(daysOld: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .from(Notification)
      .where('createdAt < :cutoffDate', { cutoffDate })
      .andWhere('isRead = :isRead', { isRead: true })
      .execute();

    return {
      message: `${result.affected} notifikasi lama berhasil dihapus`,
      deletedCount: result.affected,
    };
  }

  // ✨ ENHANCED: Helper methods with WebSocket integration
  async notifyAssignmentCreated(
    studentIds: string[],
    assignmentTitle: string,
    courseName: string,
    assignmentId: string,
    dueDate: Date,
  ) {
    const title = 'Tugas Baru Tersedia';
    const message = `Tugas baru "${assignmentTitle}" telah dibuat untuk mata kuliah ${courseName}. Deadline: ${dueDate.toLocaleDateString('id-ID')}`;
    
    const notifications = await this.createBulkNotifications(
      studentIds,
      NotificationType.ASSIGNMENT_NEW,
      title,
      message,
      { assignmentId, courseName, dueDate },
    );

    // Additional WebSocket notification for real-time alerts
    if (this.notificationGateway) {
      await this.notificationGateway.notifyAssignmentCreated(studentIds, {
        title: assignmentTitle,
        courseName,
        assignmentId,
        dueDate,
      });
    }

    return notifications;
  }

  async notifyAssignmentDue(
    studentIds: string[],
    assignmentTitle: string,
    courseName: string,
    assignmentId: string,
    hoursUntilDue: number,
  ) {
    const title = 'Reminder: Tugas Akan Berakhir';
    const message = `Tugas "${assignmentTitle}" untuk mata kuliah ${courseName} akan berakhir dalam ${hoursUntilDue} jam.`;
    
    const notifications = await this.createBulkNotifications(
      studentIds,
      NotificationType.ASSIGNMENT_DUE,
      title,
      message,
      { assignmentId, courseName, hoursUntilDue },
    );

    // Additional WebSocket notification for urgent alerts
    if (this.notificationGateway) {
      await this.notificationGateway.notifyAssignmentDue(studentIds, {
        title: assignmentTitle,
        courseName,
        assignmentId,
        hoursUntilDue,
      });
    }

    return notifications;
  }

  async notifyAssignmentGraded(
    studentId: string,
    assignmentTitle: string,
    courseName: string,
    assignmentId: string,
    score: number,
    maxScore: number,
  ) {
    const title = 'Tugas Telah Dinilai';
    const message = `Tugas "${assignmentTitle}" untuk mata kuliah ${courseName} telah dinilai. Nilai: ${score}/${maxScore}`;
    
    const notification = await this.createSystemNotification(
      studentId,
      NotificationType.ASSIGNMENT_GRADED,
      title,
      message,
      { assignmentId, courseName, score, maxScore },
    );

    // Additional WebSocket notification for grade alerts
    if (this.notificationGateway) {
      await this.notificationGateway.notifyAssignmentGraded(studentId, {
        title: assignmentTitle,
        courseName,
        assignmentId,
        score,
        maxScore,
      });
    }

    return notification;
  }

  async notifyNewAnnouncement(
    userIds: string[],
    announcementTitle: string,
    courseName: string | null,
    announcementId: string,
  ) {
    const title = 'Pengumuman Baru';
    const message = courseName
      ? `Pengumuman baru "${announcementTitle}" untuk mata kuliah ${courseName}`
      : `Pengumuman global baru "${announcementTitle}"`;
    
    const notifications = await this.createBulkNotifications(
      userIds,
      NotificationType.ANNOUNCEMENT,
      title,
      message,
      { announcementId, courseName },
    );

    // Additional WebSocket notification for announcements
    if (this.notificationGateway) {
      await this.notificationGateway.notifyNewAnnouncement(userIds, {
        title: announcementTitle,
        courseName,
        announcementId,
      });
    }

    return notifications;
  }

  async notifyCourseEnrollment(
    studentId: string,
    courseName: string,
    courseCode: string,
    courseId: string,
  ) {
    const title = 'Pendaftaran Mata Kuliah Berhasil';
    const message = `Anda telah berhasil didaftarkan ke mata kuliah ${courseCode} - ${courseName}`;
    
    const notification = await this.createSystemNotification(
      studentId,
      NotificationType.COURSE_ENROLLMENT,
      title,
      message,
      { courseId, courseName, courseCode },
    );

    // Additional WebSocket notification for enrollment success
    if (this.notificationGateway) {
      await this.notificationGateway.notifyCourseEnrollment(studentId, {
        courseName,
        courseCode,
        courseId,
      });
    }

    return notification;
  }

  async notifyForumReply(
    userId: string,
    postTitle: string,
    courseName: string,
    postId: string,
    replyAuthor: string,
  ) {
    const title = 'Balasan Forum Baru';
    const message = `${replyAuthor} telah membalas post "${postTitle}" di forum mata kuliah ${courseName}`;
    
    const notification = await this.createSystemNotification(
      userId,
      NotificationType.FORUM_REPLY,
      title,
      message,
      { postId, courseName, replyAuthor },
    );

    // Additional WebSocket notification for forum interactions
    if (this.notificationGateway) {
      await this.notificationGateway.notifyForumReply(userId, {
        postTitle,
        courseName,
        postId,
        replyAuthor,
      });
    }

    return notification;
  }
}
