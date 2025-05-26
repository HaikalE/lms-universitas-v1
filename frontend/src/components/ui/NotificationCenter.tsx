import React, { useState, useEffect, useCallback } from 'react';
import { BellIcon, XMarkIcon, CheckIcon, ClockIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import { Popover, Transition } from '@headlessui/react';
import { formatDistanceToNow } from 'date-fns';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  category?: string;
  actionUrl?: string;
  actionLabel?: string;
  avatar?: string;
  metadata?: Record<string, any>;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onNotificationRead?: (id: string) => void;
  onNotificationClick?: (notification: Notification) => void;
  onMarkAllRead?: () => void;
  onClearAll?: () => void;
  maxVisible?: number;
  showBadge?: boolean;
  className?: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  onNotificationRead,
  onNotificationClick,
  onMarkAllRead,
  onClearAll,
  maxVisible = 10,
  showBadge = true,
  className = ''
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const unreadCount = notifications.filter(n => !n.read).length;
  const categorySet = new Set(notifications.map(n => n.category).filter(Boolean));
  const categories = ['all', ...Array.from(categorySet)];

  const filteredNotifications = notifications
    .filter(notification => {
      if (filter === 'unread' && notification.read) return false;
      if (selectedCategory !== 'all' && notification.category !== selectedCategory) return false;
      return true;
    })
    .slice(0, maxVisible);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckIcon className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XMarkIcon className="w-4 h-4 text-red-500" />;
      default:
        return <ClockIcon className="w-4 h-4 text-blue-500" />;
    }
  };

  const getNotificationBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-l-green-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'error':
        return 'border-l-red-500';
      default:
        return 'border-l-blue-500';
    }
  };

  const handleNotificationClick = useCallback((notification: Notification) => {
    if (!notification.read && onNotificationRead) {
      onNotificationRead(notification.id);
    }
    onNotificationClick?.(notification);
  }, [onNotificationRead, onNotificationClick]);

  return (
    <Popover className={`relative ${className}`}>
      {({ open }) => (
        <>
          <Popover.Button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-lg">
            {unreadCount > 0 ? (
              <BellSolidIcon className="w-6 h-6" />
            ) : (
              <BellIcon className="w-6 h-6" />
            )}
            
            {/* Badge */}
            {showBadge && unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Popover.Button>

          <Transition
            enter="transition ease-out duration-200"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute right-0 z-50 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Notifications
                  </h3>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && onMarkAllRead && (
                      <button
                        onClick={onMarkAllRead}
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                    {onClearAll && (
                      <button
                        onClick={onClearAll}
                        className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Filters */}
                <div className="mt-3 flex items-center space-x-4">
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setFilter('all')}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        filter === 'all' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      All ({notifications.length})
                    </button>
                    <button
                      onClick={() => setFilter('unread')}
                      className={`px-3 py-1 text-sm rounded-full transition-colors ${
                        filter === 'unread' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      Unread ({unreadCount})
                    </button>
                  </div>
                  
                  {categories.length > 1 && (
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {categories.map(category => (
                        <option key={category} value={category}>
                          {category === 'all' ? 'All Categories' : category}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <BellIcon className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 font-medium">
                      {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                    </p>
                    <p className="text-gray-400 text-sm mt-1">
                      {filter === 'unread' 
                        ? 'All caught up! New notifications will appear here.' 
                        : 'Notifications will appear here when available.'
                      }
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`
                        relative p-4 border-l-4 hover:bg-gray-50 cursor-pointer transition-colors
                        ${getNotificationBorderColor(notification.type)}
                        ${!notification.read ? 'bg-blue-50/50' : ''}
                      `}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Avatar or Icon */}
                        <div className="flex-shrink-0">
                          {notification.avatar ? (
                            <img
                              src={notification.avatar}
                              alt=""
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                              {getNotificationIcon(notification.type)}
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className={`text-sm font-medium ${
                                !notification.read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h4>
                              <p className={`text-sm mt-1 ${
                                !notification.read ? 'text-gray-700' : 'text-gray-500'
                              }`}>
                                {notification.message}
                              </p>
                              
                              {/* Category */}
                              {notification.category && (
                                <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                  {notification.category}
                                </span>
                              )}
                              
                              {/* Action */}
                              {notification.actionUrl && notification.actionLabel && (
                                <button className="block mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium">
                                  {notification.actionLabel} →
                                </button>
                              )}
                            </div>
                            
                            {/* Unread indicator */}
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 mt-1 flex-shrink-0" />
                            )}
                          </div>
                          
                          {/* Timestamp */}
                          <p className="text-xs text-gray-400 mt-2">
                            {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* Footer */}
              {filteredNotifications.length > 0 && notifications.length > maxVisible && (
                <div className="p-3 border-t border-gray-200 text-center">
                  <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View all notifications
                  </button>
                </div>
              )}
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};

export default NotificationCenter;