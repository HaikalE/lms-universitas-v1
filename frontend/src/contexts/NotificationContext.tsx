import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { notificationService, NotificationEventHandlers } from '../services/notificationService';
import { Notification, NotificationType } from '../types';
import { useAuth } from './AuthContext';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
}

interface NotificationContextType extends NotificationState {
  // Core Actions
  fetchNotifications: (params?: any) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  
  // Real-time Actions
  connectNotifications: () => void;
  disconnectNotifications: () => void;
  joinCourse: (courseId: string) => void;
  leaveCourse: (courseId: string) => void;
  
  // Settings
  requestNotificationPermission: () => Promise<NotificationPermission>;
  enableSounds: boolean;
  setEnableSounds: (enabled: boolean) => void;
  enableBrowserNotifications: boolean;
  setEnableBrowserNotifications: (enabled: boolean) => void;
  
  // State Management
  clearError: () => void;
  refreshUnreadCount: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  
  // Core state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  
  // Settings state (persist in localStorage)
  const [enableSounds, setEnableSounds] = useState(() => {
    const saved = localStorage.getItem('notification-sounds-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  const [enableBrowserNotifications, setEnableBrowserNotifications] = useState(() => {
    const saved = localStorage.getItem('browser-notifications-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Persist settings changes
  useEffect(() => {
    localStorage.setItem('notification-sounds-enabled', JSON.stringify(enableSounds));
  }, [enableSounds]);

  useEffect(() => {
    localStorage.setItem('browser-notifications-enabled', JSON.stringify(enableBrowserNotifications));
  }, [enableBrowserNotifications]);

  // ✨ Core Functions
  const fetchNotifications = useCallback(async (params?: any) => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await notificationService.getMyNotifications(params);
      setNotifications(response.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch notifications');
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await notificationService.getUnreadCount();
      setUnreadCount(response.unreadCount || 0);
    } catch (err: any) {
      console.error('Failed to fetch unread count:', err);
    }
  }, [isAuthenticated]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, isRead: true } : notif
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err: any) {
      setError(err.message || 'Failed to mark notification as read');
      console.error('Failed to mark as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      
      setUnreadCount(0);
    } catch (err: any) {
      setError(err.message || 'Failed to mark all as read');
      console.error('Failed to mark all as read:', err);
    }
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      
      // Update local state
      const notification = notifications.find(n => n.id === id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      
      // Update unread count if notification was unread
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete notification');
      console.error('Failed to delete notification:', err);
    }
  }, [notifications]);

  // ✨ Real-time Functions
  const connectNotifications = useCallback(() => {
    if (!isAuthenticated || !user) return;

    const handlers: NotificationEventHandlers = {
      onNewNotification: (notification) => {
        console.log('🔔 New notification received:', notification);
        
        // Add to notifications list
        setNotifications(prev => [notification, ...prev]);
        
        // Update unread count
        setUnreadCount(prev => prev + 1);
        
        // Play sound if enabled
        if (enableSounds) {
          notificationService.playNotificationSound(notification.type);
        }
        
        // Show toast notification (will be handled by UI components)
        // The notification will be picked up by NotificationToast component
      },
      
      onUnreadCountUpdate: (data) => {
        console.log('📊 Unread count updated:', data);
        setUnreadCount(data.unreadCount || 0);
      },
      
      onConnect: () => {
        console.log('🔗 Connected to notification server');
        setConnectionStatus('connected');
        setError(null);
      },
      
      onDisconnect: () => {
        console.log('🔌 Disconnected from notification server');
        setConnectionStatus('disconnected');
      },
      
      onError: (error) => {
        console.error('🔴 Notification service error:', error);
        setError('Connection to notification server failed');
        setConnectionStatus('disconnected');
      }
    };

    setConnectionStatus('connecting');
    notificationService.connect(handlers);
  }, [isAuthenticated, user, enableSounds]);

  const disconnectNotifications = useCallback(() => {
    notificationService.disconnect();
    setConnectionStatus('disconnected');
  }, []);

  const joinCourse = useCallback((courseId: string) => {
    notificationService.joinCourse(courseId);
  }, []);

  const leaveCourse = useCallback((courseId: string) => {
    notificationService.leaveCourse(courseId);
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    return await notificationService.requestNotificationPermission();
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ✨ Effects
  
  // Auto-connect when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      connectNotifications();
      fetchNotifications();
      refreshUnreadCount();
    } else {
      disconnectNotifications();
      setNotifications([]);
      setUnreadCount(0);
    }

    // Cleanup on unmount or auth change
    return () => {
      if (!isAuthenticated) {
        disconnectNotifications();
      }
    };
  }, [isAuthenticated, user, connectNotifications, fetchNotifications, refreshUnreadCount, disconnectNotifications]);

  // Update token when auth changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    notificationService.updateToken(token);
  }, [isAuthenticated]);

  // Request notification permission on mount (if browser notifications enabled)
  useEffect(() => {
    if (enableBrowserNotifications && isAuthenticated) {
      requestNotificationPermission();
    }
  }, [enableBrowserNotifications, isAuthenticated, requestNotificationPermission]);

  // ✨ Context Value
  const contextValue: NotificationContextType = {
    // State
    notifications,
    unreadCount,
    isLoading,
    error,
    connectionStatus,
    
    // Core Actions
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    
    // Real-time Actions
    connectNotifications,
    disconnectNotifications,
    joinCourse,
    leaveCourse,
    
    // Settings
    requestNotificationPermission,
    enableSounds,
    setEnableSounds,
    enableBrowserNotifications,
    setEnableBrowserNotifications,
    
    // State Management
    clearError,
    refreshUnreadCount,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// ✨ Custom Hook
export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// ✨ Additional Hooks for specific use cases

export const useNotificationCount = () => {
  const { unreadCount } = useNotifications();
  return unreadCount;
};

export const useNotificationConnection = () => {
  const { connectionStatus, connectNotifications, disconnectNotifications } = useNotifications();
  return { connectionStatus, connect: connectNotifications, disconnect: disconnectNotifications };
};

export const useNotificationSettings = () => {
  const {
    enableSounds,
    setEnableSounds,
    enableBrowserNotifications,
    setEnableBrowserNotifications,
    requestNotificationPermission,
  } = useNotifications();
  
  return {
    enableSounds,
    setEnableSounds,
    enableBrowserNotifications,
    setEnableBrowserNotifications,
    requestNotificationPermission,
  };
};

// ✨ Utility Hooks
export const useCourseNotifications = (courseId?: string) => {
  const { joinCourse, leaveCourse } = useNotifications();
  
  useEffect(() => {
    if (courseId) {
      joinCourse(courseId);
      return () => leaveCourse(courseId);
    }
  }, [courseId, joinCourse, leaveCourse]);
};
