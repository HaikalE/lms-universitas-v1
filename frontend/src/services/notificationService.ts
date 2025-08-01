import { io, Socket } from 'socket.io-client';
import api from './api';
import { ApiResponse, Notification, NotificationType } from '../types';

export interface NotificationQuery {
  page?: number;
  limit?: number;
  type?: NotificationType | 'all';
  isRead?: boolean;
  sortBy?: 'createdAt' | 'title';
  sortOrder?: 'ASC' | 'DESC';
}

export interface NotificationEventHandlers {
  onNewNotification?: (notification: any) => void;
  onUnreadCountUpdate?: (data: { unreadCount: number }) => void;
  onError?: (error: any) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

class NotificationService {
  private socket: Socket | null = null;
  private token: string | null = null;
  private eventHandlers: NotificationEventHandlers = {};
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    this.token = localStorage.getItem('token');
  }

  // ✨ Socket.IO Connection Management
  connect(handlers: NotificationEventHandlers = {}) {
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    this.eventHandlers = handlers;
    this.token = localStorage.getItem('token');

    if (!this.token) {
      console.warn('No auth token found, cannot connect to notification socket');
      return;
    }

    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:3000';
    
    this.socket = io(`${backendUrl}/notifications`, {
      auth: {
        token: this.token,
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: this.maxReconnectAttempts,
    });

    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('🔔 Connected to notification server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.eventHandlers.onConnect?.();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from notification server:', reason);
      this.isConnected = false;
      this.eventHandlers.onDisconnect?.();
      
      // Auto-reconnect logic
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        setTimeout(() => this.reconnect(), 2000);
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('🔴 Socket connection error:', error);
      this.isConnected = false;
      this.eventHandlers.onError?.(error);
      
      // Exponential backoff for reconnection
      this.reconnectAttempts++;
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        const delay = Math.pow(2, this.reconnectAttempts) * 1000;
        setTimeout(() => this.reconnect(), delay);
      }
    });

    // Notification events
    this.socket.on('new_notification', (notification) => {
      console.log('🔔 New notification received:', notification);
      this.eventHandlers.onNewNotification?.(notification);
      
      // Show browser notification if permission granted
      this.showBrowserNotification(notification);
    });

    this.socket.on('unread_count', (data) => {
      console.log('📊 Unread count updated:', data);
      this.eventHandlers.onUnreadCountUpdate?.(data);
    });

    this.socket.on('error', (error) => {
      console.error('🔴 Socket error:', error);
      this.eventHandlers.onError?.(error);
    });
  }

  private reconnect() {
    if (this.socket && !this.socket.connected) {
      console.log('🔄 Attempting to reconnect...');
      this.socket.connect();
    }
  }

  private showBrowserNotification(notification: any) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id || `notification-${Date.now()}`,
        requireInteraction: notification.type === 'assignment_due',
        silent: false,
      });

      // Auto-close after 5 seconds (except for urgent notifications)
      if (notification.type !== 'assignment_due') {
        setTimeout(() => browserNotification.close(), 5000);
      }

      browserNotification.onclick = () => {
        window.focus();
        browserNotification.close();
        // TODO: Navigate to relevant page based on notification type
      };
    }
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting from notification server');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Join/Leave rooms for real-time updates
  joinCourse(courseId: string) {
    if (this.socket?.connected) {
      this.socket.emit('join_course', courseId);
      console.log(`📚 Joined course room: ${courseId}`);
    }
  }

  leaveCourse(courseId: string) {
    if (this.socket?.connected) {
      this.socket.emit('leave_course', courseId);
      console.log(`📚 Left course room: ${courseId}`);
    }
  }

  markAsReadRealtime(notificationId: string) {
    if (this.socket?.connected) {
      this.socket.emit('mark_notification_read', notificationId);
    }
  }

  // ✨ REST API Methods
  async getMyNotifications(params?: NotificationQuery): Promise<ApiResponse<Notification[]>> {
    const response = await api.get('/notifications/my-notifications', { params });
    return response.data;
  }

  async getUnreadCount(): Promise<{ unreadCount: number }> {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  }

  async markAsRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
    // Also mark via socket for real-time update
    this.markAsReadRealtime(id);
  }

  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/mark-all-read');
  }

  async deleteNotification(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  }

  // ✨ Browser Notification Permission
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  // ✨ Utility Methods
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  getConnectionStatus(): 'connected' | 'disconnected' | 'connecting' {
    if (!this.socket) return 'disconnected';
    if (this.socket.connecting) return 'connecting';
    if (this.socket.connected) return 'connected';
    return 'disconnected';
  }

  // ✨ Sound Notifications
  playNotificationSound(type: NotificationType = NotificationType.GENERAL) {
    try {
      // Different sounds for different types
      const soundMap: Record<string, string> = {
        [NotificationType.ASSIGNMENT_NEW]: '/sounds/new-assignment.mp3',
        [NotificationType.ASSIGNMENT_DUE]: '/sounds/urgent.mp3',
        [NotificationType.ASSIGNMENT_GRADED]: '/sounds/success.mp3',
        [NotificationType.FORUM_REPLY]: '/sounds/message.mp3',
        [NotificationType.ANNOUNCEMENT]: '/sounds/announcement.mp3',
        [NotificationType.COURSE_ENROLLMENT]: '/sounds/success.mp3',
        [NotificationType.GENERAL]: '/sounds/notification.mp3',
      };

      const soundFile = soundMap[type] || soundMap[NotificationType.GENERAL];
      const audio = new Audio(soundFile);
      audio.volume = 0.6; // Adjust volume
      audio.play().catch(e => console.log('Could not play notification sound:', e));
    } catch (error) {
      console.log('Sound notification failed:', error);
    }
  }

  // ✨ Update token when user logs in/out
  updateToken(newToken: string | null) {
    this.token = newToken;
    
    if (newToken) {
      // Reconnect with new token
      this.disconnect();
      setTimeout(() => this.connect(this.eventHandlers), 1000);
    } else {
      // Disconnect when logged out
      this.disconnect();
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();

// Export class for type definitions
export { NotificationService };
