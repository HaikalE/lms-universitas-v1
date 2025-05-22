import React, { useState, Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { useQuery } from 'react-query';
import { notificationService } from '../../services/notificationService';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const { data: unreadCount } = useQuery(
    'unreadNotifications',
    notificationService.getUnreadCount,
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const { data: notifications } = useQuery(
    'recentNotifications',
    () => notificationService.getMyNotifications({ limit: 5 }),
    {
      enabled: showNotifications,
    }
  );

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="ml-4 md:ml-0">
            <h1 className="text-lg font-semibold text-gray-900">
              Learning Management System
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Menu as="div" className="relative">
            <Menu.Button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <BellIcon className="h-6 w-6" />
              {unreadCount && unreadCount.unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount.unreadCount > 9 ? '9+' : unreadCount.unreadCount}
                </span>
              )}
            </Menu.Button>

            <Transition
              as={Fragment}
              show={showNotifications}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">
                    Notifikasi Terbaru
                  </h3>
                  
                  {notifications?.data?.length === 0 ? (
                    <p className="text-sm text-gray-500">Tidak ada notifikasi baru</p>
                  ) : (
                    <div className="space-y-2">
                      {notifications?.data?.slice(0, 5).map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-2 rounded-md text-sm ${
                            notification.isRead ? 'bg-gray-50' : 'bg-blue-50'
                          }`}
                        >
                          <p className="font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-gray-600 text-xs mt-1">
                            {notification.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <Link
                      to="/notifications"
                      className="text-sm text-primary-600 hover:text-primary-500"
                      onClick={() => setShowNotifications(false)}
                    >
                      Lihat semua notifikasi
                    </Link>
                  </div>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* User menu */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
              <div className="flex-shrink-0">
                {user?.avatar ? (
                  <img
                    className="h-8 w-8 rounded-full"
                    src={user.avatar}
                    alt={user.fullName}
                  />
                ) : (
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/profile"
                        className={`${active ? 'bg-gray-100' : ''} flex items-center px-4 py-2 text-sm text-gray-700`}
                      >
                        <UserCircleIcon className="mr-3 h-5 w-5 text-gray-400" />
                        Profil Saya
                      </Link>
                    )}
                  </Menu.Item>
                  
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        to="/settings"
                        className={`${active ? 'bg-gray-100' : ''} flex items-center px-4 py-2 text-sm text-gray-700`}
                      >
                        <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-400" />
                        Pengaturan
                      </Link>
                    )}
                  </Menu.Item>
                  
                  <div className="border-t border-gray-100"></div>
                  
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={logout}
                        className={`${active ? 'bg-gray-100' : ''} flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-5 w-5 text-gray-400" />
                        Keluar
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </header>
  );
};

export default Header;
