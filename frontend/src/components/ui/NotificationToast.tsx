import React, { useState, useEffect } from 'react';
import { X, Bell, CheckCircle, AlertTriangle, Info, MessageCircle, GraduationCap } from 'lucide-react';
import { NotificationType } from '../../types';
import { useNotifications } from '../../contexts/NotificationContext';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  duration?: number;
}

interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);

    // Auto-close after duration
    const duration = toast.duration || 5000;
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [toast.duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300);
  };

  const getToastConfig = (type: NotificationType) => {
    const configs = {
      [NotificationType.ASSIGNMENT_NEW]: {
        icon: <Bell className="w-5 h-5" />,
        bgColor: 'bg-blue-500',
        borderColor: 'border-blue-200',
        iconColor: 'text-blue-500',
        priority: 'normal' as const,
      },
      [NotificationType.ASSIGNMENT_DUE]: {
        icon: <AlertTriangle className="w-5 h-5" />,
        bgColor: 'bg-red-500',
        borderColor: 'border-red-200',
        iconColor: 'text-red-500',
        priority: 'high' as const,
      },
      [NotificationType.ASSIGNMENT_GRADED]: {
        icon: <CheckCircle className="w-5 h-5" />,
        bgColor: 'bg-green-500',
        borderColor: 'border-green-200',
        iconColor: 'text-green-500',
        priority: 'normal' as const,
      },
      [NotificationType.ANNOUNCEMENT]: {
        icon: <Info className="w-5 h-5" />,
        bgColor: 'bg-purple-500',
        borderColor: 'border-purple-200',
        iconColor: 'text-purple-500',
        priority: 'normal' as const,
      },
      [NotificationType.FORUM_REPLY]: {
        icon: <MessageCircle className="w-5 h-5" />,
        bgColor: 'bg-indigo-500',
        borderColor: 'border-indigo-200',
        iconColor: 'text-indigo-500',
        priority: 'low' as const,
      },
      [NotificationType.COURSE_ENROLLMENT]: {
        icon: <GraduationCap className="w-5 h-5" />,
        bgColor: 'bg-emerald-500',
        borderColor: 'border-emerald-200',
        iconColor: 'text-emerald-500',
        priority: 'normal' as const,
      },
      [NotificationType.GENERAL]: {
        icon: <Bell className="w-5 h-5" />,
        bgColor: 'bg-gray-500',
        borderColor: 'border-gray-200',
        iconColor: 'text-gray-500',
        priority: 'low' as const,
      },
    };

    return configs[type] || configs[NotificationType.GENERAL];
  };

  const config = getToastConfig(toast.type);

  return (
    <div
      className={`transform transition-all duration-300 ease-out ${
        isVisible && !isLeaving 
          ? 'translate-x-0 opacity-100 scale-100' 
          : isLeaving 
            ? 'translate-x-full opacity-0 scale-95'
            : 'translate-x-full opacity-0 scale-95'
      }`}
    >
      <div className={`
        w-full max-w-sm bg-white dark:bg-gray-800 rounded-lg shadow-lg border-l-4 ${config.borderColor}
        p-4 mb-3 hover:shadow-xl transition-shadow duration-200
        ${config.priority === 'high' ? 'ring-2 ring-red-300 dark:ring-red-700' : ''}
      `}>
        <div className="flex items-start">
          {/* Icon */}
          <div className={`flex-shrink-0 mr-3 ${config.iconColor}`}>
            {config.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {toast.title}
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {toast.message}
            </p>
            
            {/* Timestamp */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              {new Date(toast.timestamp).toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 ml-2 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Tutup notifikasi"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar for Auto-close */}
        <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1 overflow-hidden">
          <div
            className={`h-1 ${config.bgColor} rounded-full animate-progress`}
            style={{
              animation: `progress ${toast.duration || 5000}ms linear`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

const NotificationToast: React.FC = () => {
  const { notifications } = useNotifications();
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Listen for new notifications and create toasts
  useEffect(() => {
    // Get the latest notification
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      
      // Check if this notification is already displayed as a toast
      const alreadyShown = toasts.some(toast => 
        toast.id === latestNotification.id || 
        (toast.title === latestNotification.title && 
         toast.message === latestNotification.message &&
         new Date(toast.timestamp).getTime() - new Date(latestNotification.createdAt).getTime() < 1000)
      );

      if (!alreadyShown && !latestNotification.isRead) {
        const newToast: Toast = {
          id: latestNotification.id || `toast-${Date.now()}`,
          title: latestNotification.title,
          message: latestNotification.message,
          type: latestNotification.type,
          timestamp: latestNotification.createdAt,
          duration: getDurationByType(latestNotification.type),
        };

        setToasts(prev => [newToast, ...prev.slice(0, 4)]); // Keep max 5 toasts
      }
    }
  }, [notifications, toasts]);

  const getDurationByType = (type: NotificationType): number => {
    const durations = {
      [NotificationType.ASSIGNMENT_DUE]: 10000, // 10 seconds for urgent
      [NotificationType.ASSIGNMENT_GRADED]: 7000, // 7 seconds for important
      [NotificationType.ASSIGNMENT_NEW]: 6000, // 6 seconds for new assignments
      [NotificationType.ANNOUNCEMENT]: 8000, // 8 seconds for announcements
      [NotificationType.COURSE_ENROLLMENT]: 5000, // 5 seconds for enrollment
      [NotificationType.FORUM_REPLY]: 4000, // 4 seconds for forum replies
      [NotificationType.GENERAL]: 5000, // 5 seconds for general
    };

    return durations[type] || 5000;
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Auto-cleanup old toasts
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setToasts(prev => prev.filter(toast => {
        const toastTime = new Date(toast.timestamp).getTime();
        const maxAge = 30000; // 30 seconds max age
        return now - toastTime < maxAge;
      }));
    }, 5000);

    return () => clearInterval(cleanup);
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <>
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
        <div className="space-y-2 pointer-events-auto">
          {toasts.map((toast) => (
            <ToastItem
              key={toast.id}
              toast={toast}
              onClose={removeToast}
            />
          ))}
        </div>
      </div>

      {/* Custom CSS for progress animation */}
      <style jsx>{`
        @keyframes progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-progress {
          animation-fill-mode: forwards;
        }
      `}</style>
    </>
  );
};

export default NotificationToast;
