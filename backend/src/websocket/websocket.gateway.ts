import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from '../notifications/notifications.service';
import { User } from '../entities/user.entity';

interface AuthenticatedSocket extends Socket {
  user?: User;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationGateway.name);
  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private readonly jwtService: JwtService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from handshake
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token);
      const user = payload.user || payload;
      
      if (!user || !user.id) {
        this.logger.warn(`Connection rejected: Invalid token`);
        client.disconnect();
        return;
      }

      // Attach user to socket
      client.user = user;
      
      // Store connection
      this.connectedUsers.set(user.id, client.id);
      
      // Join user-specific room
      client.join(`user:${user.id}`);
      
      // Join role-based rooms
      client.join(`role:${user.role}`);
      
      this.logger.log(`User ${user.fullName} (${user.id}) connected via WebSocket`);
      
      // Send unread count on connection
      const unreadCount = await this.notificationsService.getUnreadCount(user.id);
      client.emit('unread_count', unreadCount);
      
    } catch (error) {
      this.logger.error(`WebSocket connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      this.connectedUsers.delete(client.user.id);
      this.logger.log(`User ${client.user.fullName} (${client.user.id}) disconnected`);
    }
  }

  @SubscribeMessage('join_course')
  handleJoinCourse(@MessageBody() courseId: string, @ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.user) return;
    
    client.join(`course:${courseId}`);
    this.logger.log(`User ${client.user.id} joined course room: ${courseId}`);
  }

  @SubscribeMessage('leave_course')
  handleLeaveCourse(@MessageBody() courseId: string, @ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.user) return;
    
    client.leave(`course:${courseId}`);
    this.logger.log(`User ${client.user.id} left course room: ${courseId}`);
  }

  @SubscribeMessage('mark_notification_read')
  async handleMarkAsRead(@MessageBody() notificationId: string, @ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.user) return;

    try {
      await this.notificationsService.markAsRead(notificationId, client.user);
      
      // Send updated unread count
      const unreadCount = await this.notificationsService.getUnreadCount(client.user.id);
      client.emit('unread_count', unreadCount);
      
    } catch (error) {
      this.logger.error(`Error marking notification as read: ${error.message}`);
      client.emit('error', { message: 'Failed to mark notification as read' });
    }
  }

  // Public methods for sending notifications
  async sendToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.server.to(`user:${userId}`).emit(event, data);
      this.logger.log(`Sent ${event} to user ${userId}`);
    }
  }

  async sendToCourse(courseId: string, event: string, data: any) {
    this.server.to(`course:${courseId}`).emit(event, data);
    this.logger.log(`Sent ${event} to course ${courseId}`);
  }

  async sendToRole(role: string, event: string, data: any) {
    this.server.to(`role:${role}`).emit(event, data);
    this.logger.log(`Sent ${event} to role ${role}`);
  }

  async broadcastNotification(userIds: string[], notification: any) {
    for (const userId of userIds) {
      await this.sendToUser(userId, 'new_notification', notification);
      
      // Update unread count
      const unreadCount = await this.notificationsService.getUnreadCount(userId);
      await this.sendToUser(userId, 'unread_count', unreadCount);
    }
  }

  async notifyAssignmentCreated(studentIds: string[], assignmentData: any) {
    const notification = {
      type: 'assignment_new',
      title: 'Tugas Baru Tersedia',
      message: `Tugas "${assignmentData.title}" telah dibuat untuk mata kuliah ${assignmentData.courseName}`,
      data: assignmentData,
      timestamp: new Date().toISOString(),
    };

    await this.broadcastNotification(studentIds, notification);
  }

  async notifyAssignmentDue(studentIds: string[], assignmentData: any) {
    const notification = {
      type: 'assignment_due',
      title: 'Reminder: Tugas Akan Berakhir',
      message: `Tugas "${assignmentData.title}" akan berakhir dalam ${assignmentData.hoursUntilDue} jam`,
      data: assignmentData,
      timestamp: new Date().toISOString(),
    };

    await this.broadcastNotification(studentIds, notification);
  }

  async notifyAssignmentGraded(studentId: string, assignmentData: any) {
    const notification = {
      type: 'assignment_graded',
      title: 'Tugas Telah Dinilai',
      message: `Tugas "${assignmentData.title}" telah dinilai. Nilai: ${assignmentData.score}/${assignmentData.maxScore}`,
      data: assignmentData,
      timestamp: new Date().toISOString(),
    };

    await this.sendToUser(studentId, 'new_notification', notification);
    
    // Update unread count
    const unreadCount = await this.notificationsService.getUnreadCount(studentId);
    await this.sendToUser(studentId, 'unread_count', unreadCount);
  }

  async notifyForumReply(userId: string, forumData: any) {
    const notification = {
      type: 'forum_reply',
      title: 'Balasan Forum Baru',
      message: `${forumData.replyAuthor} telah membalas post "${forumData.postTitle}"`,
      data: forumData,
      timestamp: new Date().toISOString(),
    };

    await this.sendToUser(userId, 'new_notification', notification);
    
    // Update unread count
    const unreadCount = await this.notificationsService.getUnreadCount(userId);
    await this.sendToUser(userId, 'unread_count', unreadCount);
  }

  async notifyNewAnnouncement(userIds: string[], announcementData: any) {
    const notification = {
      type: 'announcement',
      title: 'Pengumuman Baru',
      message: `Pengumuman baru: "${announcementData.title}"`,
      data: announcementData,
      timestamp: new Date().toISOString(),
    };

    await this.broadcastNotification(userIds, notification);
  }

  async notifyCourseEnrollment(studentId: string, courseData: any) {
    const notification = {
      type: 'course_enrollment',
      title: 'Pendaftaran Mata Kuliah Berhasil',
      message: `Anda telah berhasil didaftarkan ke mata kuliah ${courseData.courseCode} - ${courseData.courseName}`,
      data: courseData,
      timestamp: new Date().toISOString(),
    };

    await this.sendToUser(studentId, 'new_notification', notification);
    
    // Update unread count
    const unreadCount = await this.notificationsService.getUnreadCount(studentId);
    await this.sendToUser(studentId, 'unread_count', unreadCount);
  }

  // Utility methods
  getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }
}
