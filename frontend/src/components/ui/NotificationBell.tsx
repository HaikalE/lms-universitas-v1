import React, { useState, useRef, useEffect } from 'react';
import { Bell, BellRing, X, Check, CheckCheck, Settings, Wifi, WifiOff, Loader } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { NotificationType } from '../../types';
import NotificationSettingsModal from './NotificationSettingsModal';

const NotificationBell: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isLoading,
    connectionStatus,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    clearError,
    error,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [showSettings, setShowSettings] = useState(false); // 🎛️ NEW: Settings modal state
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
      clearError();
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleDeleteNotification = async (notificationId: string) => {
    await deleteNotification(notificationId);
  };

  // 🎛️ NEW: Handle settings modal
  const handleOpenSettings = () => {
    setShowSettings(true);
    setIsOpen(false); // Close notification dropdown
  };

  const getNotificationIcon = (type: NotificationType) => {
    const iconMap = {
      [NotificationType.ASSIGNMENT_NEW]: '📝',
      [NotificationType.ASSIGNMENT_DUE]: '⏰',
      [NotificationType.ASSIGNMENT_GRADED]: '📊',
      [NotificationType.ANNOUNCEMENT]: '📢',
      [NotificationType.FORUM_REPLY]: '💬',
      [NotificationType.COURSE_ENROLLMENT]: '🎓',
      [NotificationType.GENERAL]: '🔔',
    };
    return iconMap[type] || '🔔';
  };

  const getNotificationColor = (type: NotificationType) => {
    const colorMap = {
      [NotificationType.ASSIGNMENT_NEW]: 'text-blue-500',
      [NotificationType.ASSIGNMENT_DUE]: 'text-red-500',
      [NotificationType.ASSIGNMENT_GRADED]: 'text-green-500',
      [NotificationType.ANNOUNCEMENT]: 'text-purple-500',
      [NotificationType.FORUM_REPLY]: 'text-indigo-500',
      [NotificationType.COURSE_ENROLLMENT]: 'text-emerald-500',
      [NotificationType.GENERAL]: 'text-gray-500',
    };
    return colorMap[type] || 'text-gray-500';
  };

  const filteredNotifications = notifications.filter(notification => {
    if (activeTab === 'unread') {
      return !notification.isRead;
    }
    return true;
  });

  const connectionStatusIcon = {
    connected: <Wifi className="w-3 h-3 text-green-500" />,
    connecting: <Loader className="w-3 h-3 text-yellow-500 animate-spin" />,
    disconnected: <WifiOff className="w-3 h-3 text-red-500" />,
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        {/* Bell Icon with Badge */}
        <button
          onClick={toggleDropdown}
          className={`relative p-2 rounded-lg transition-colors duration-200 ${
            isOpen 
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' 
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
          }`}
          title={`${unreadCount} notifikasi belum dibaca`}
        >
          {unreadCount > 0 ? (
            <BellRing className="w-6 h-6" />
          ) : (
            <Bell className="w-6 h-6" />
          )}
          
          {/* Unread Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}

          {/* Connection Status Indicator */}
          <span className="absolute -bottom-1 -right-1">
            {connectionStatusIcon[connectionStatus]}
          </span>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute right-0 z-50 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-[600px] overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Notifikasi
                </h3>
                <div className="flex items-center space-x-2">
                  {connectionStatus === 'connected' && (
                    <span className="text-xs text-green-600 dark:text-green-400 flex items-center">
                      <Wifi className="w-3 h-3 mr-1" />
                      Terhubung
                    </span>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex mt-3 space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'all'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Semua ({notifications.length})
                </button>
                <button
                  onClick={() => setActiveTab('unread')}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    activeTab === 'unread'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  Belum Dibaca ({unreadCount})
                </button>
              </div>

              {/* Actions */}
              {unreadCount > 0 && (
                <div className="flex justify-end mt-3">
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center"
                    disabled={isLoading}
                  >
                    <CheckCheck className="w-4 h-4 mr-1" />
                    Tandai Semua Sudah Dibaca
                  </button>
                </div>
              )}
            </div>

            {/* Error Display */}
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center p-8">
                  <Loader className="w-6 h-6 animate-spin text-gray-500" />
                  <span className="ml-2 text-gray-500">Memuat notifikasi...</span>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {activeTab === 'unread' 
                      ? 'Tidak ada notifikasi yang belum dibaca' 
                      : 'Tidak ada notifikasi'
                    }
                  </p>
                </div>
              ) : (
                <div>
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                        !notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          {/* Icon */}
                          <div className={`text-2xl ${getNotificationColor(notification.type)}`}>
                            {getNotificationIcon(notification.type)}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-medium ${
                              notification.isRead 
                                ? 'text-gray-700 dark:text-gray-300' 
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {notification.title}
                            </h4>
                            <p className={`text-sm mt-1 ${
                              notification.isRead 
                                ? 'text-gray-500 dark:text-gray-400' 
                                : 'text-gray-700 dark:text-gray-300'
                            }`}>
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: id,
                              })}
                            </p>
                          </div>

                          {/* Unread Indicator */}
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="p-1 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
                              title="Tandai sudah dibaca"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteNotification(notification.id)}
                            className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                            title="Hapus notifikasi"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Status: {connectionStatus === 'connected' ? 'Terhubung' : 'Terputus'}
                </div>
                <button
                  onClick={handleOpenSettings} // 🎛️ UPDATED: Open settings modal
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center transition-colors"
                >
                  <Settings className="w-3 h-3 mr-1" />
                  Pengaturan
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🎛️ NEW: Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
};

export default NotificationBell;
