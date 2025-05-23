import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  BookOpenIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  SpeakerWaveIcon,
  UsersIcon,
  CogIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: UserRole[];
  children?: NavigationItem[];
}

const navigation: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: HomeIcon,
  },
  {
    name: 'Mata Kuliah',
    href: '/courses',
    icon: BookOpenIcon,
  },
  {
    name: 'Tugas',
    href: '/assignments',
    icon: DocumentTextIcon,
  },
  {
    name: 'Forum Diskusi',
    href: '/forums',
    icon: ChatBubbleLeftRightIcon,
  },
  {
    name: 'Pengumuman',
    href: '/announcements',
    icon: SpeakerWaveIcon,
  },
];

const adminNavigation: NavigationItem[] = [
  {
    name: 'Administrasi',
    href: '/admin',
    icon: CogIcon,
    roles: [UserRole.ADMIN],
    children: [
      {
        name: 'Manajemen Pengguna',
        href: '/admin/users',
        icon: UsersIcon,
      },
      {
        name: 'Manajemen Mata Kuliah',
        href: '/admin/courses',
        icon: AcademicCapIcon,
      },
    ],
  },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  const isActiveLink = (href: string) => {
    if (href === '/dashboard') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  const canAccessItem = (item: NavigationItem) => {
    if (!item.roles) return true;
    return user && item.roles.includes(user.role);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 px-4 bg-gradient-to-r from-primary-600 to-primary-700 shadow-lg">
        <div className="flex items-center">
          <div className="p-2 bg-white bg-opacity-20 rounded-lg">
            <AcademicCapIcon className="h-6 w-6 text-white" />
          </div>
          <span className="ml-3 text-lg font-bold text-white hidden lg:block">
            LMS Universitas
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {/* Main Navigation */}
        <div className="space-y-1">
          {navigation.map((item) => {
            if (!canAccessItem(item)) return null;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`${
                  isActiveLink(item.href)
                    ? 'bg-primary-50 border-r-3 border-primary-500 text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out`}
              >
                <item.icon
                  className={`${
                    isActiveLink(item.href)
                      ? 'text-primary-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  } flex-shrink-0 mr-3 h-5 w-5 transition-colors`}
                />
                <span className="truncate">{item.name}</span>
                {isActiveLink(item.href) && (
                  <div className="ml-auto w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Admin Navigation */}
        {user?.role === UserRole.ADMIN && (
          <div className="pt-6">
            <div className="px-3 mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Administrasi
              </h3>
              <div className="mt-2 w-8 h-0.5 bg-primary-200 rounded-full"></div>
            </div>
            
            <div className="space-y-1">
              {adminNavigation.map((section) => {
                if (!canAccessItem(section)) return null;
                
                return (
                  <div key={section.name}>
                    {section.children?.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={onClose}
                        className={`${
                          isActiveLink(item.href)
                            ? 'bg-primary-50 border-r-3 border-primary-500 text-primary-700 shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        } group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out`}
                      >
                        <item.icon
                          className={`${
                            isActiveLink(item.href)
                              ? 'text-primary-500'
                              : 'text-gray-400 group-hover:text-gray-500'
                          } flex-shrink-0 mr-3 h-5 w-5 transition-colors`}
                        />
                        <span className="truncate">{item.name}</span>
                        {isActiveLink(item.href) && (
                          <div className="ml-auto w-1.5 h-1.5 bg-primary-500 rounded-full"></div>
                        )}
                      </Link>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User Info Card */}
      <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center p-3 bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="flex-shrink-0">
            {user?.avatar ? (
              <img
                className="h-10 w-10 rounded-full ring-2 ring-primary-100"
                src={user.avatar}
                alt={user.fullName}
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-inner">
                <span className="text-sm font-semibold text-white">
                  {user?.fullName?.charAt(0)}
                </span>
              </div>
            )}
          </div>
          <div className="ml-3 min-w-0 flex-1 hidden lg:block">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.fullName}
            </p>
            <p className="text-xs text-gray-500 flex items-center mt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
              {user?.role === UserRole.STUDENT && 'Mahasiswa'}
              {user?.role === UserRole.LECTURER && 'Dosen'}
              {user?.role === UserRole.ADMIN && 'Administrator'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 md:hidden" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex z-50">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-white shadow-xl">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex h-10 w-10 items-center justify-center rounded-full bg-black bg-opacity-20 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-all"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                
                <SidebarContent />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 z-30">
        <div className="flex flex-col flex-grow border-r border-gray-200 shadow-lg overflow-hidden">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar;