import React, { useState, useMemo, useCallback } from 'react';
import {
  UserPlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EnvelopeIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import AdvancedDataTable, { Column } from '../ui/AdvancedDataTable';
import Modal from '../ui/Modal';
import { formatDistanceToNow } from 'date-fns';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'student' | 'lecturer' | 'admin';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  avatar?: string;
  phone?: string;
  department?: string;
  enrolledCourses?: number;
  createdCourses?: number;
  lastLogin?: Date;
  joinedDate: Date;
  verified: boolean;
  metadata?: {
    studentId?: string;
    employeeId?: string;
    graduationYear?: number;
    specialization?: string;
  };
}

interface EnhancedUserManagementProps {
  users: User[];
  loading?: boolean;
  onCreateUser?: (userData: Partial<User>) => Promise<void>;
  onUpdateUser?: (userId: string, userData: Partial<User>) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  onBulkAction?: (userIds: string[], action: string) => Promise<void>;
  onSendEmail?: (userIds: string[], template: string) => Promise<void>;
  onResetPassword?: (userId: string) => Promise<void>;
  className?: string;
}

const EnhancedUserManagement: React.FC<EnhancedUserManagementProps> = ({
  users,
  loading = false,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onBulkAction,
  onSendEmail,
  onResetPassword,
  className = ''
}) => {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [bulkAction, setBulkAction] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  // Filter and search users
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = !searchQuery || 
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.metadata?.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.metadata?.employeeId?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      inactive: { color: 'bg-gray-100 text-gray-800', icon: XCircleIcon },
      suspended: { color: 'bg-red-100 text-red-800', icon: ExclamationTriangleIcon },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ExclamationTriangleIcon }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getRoleBadge = (role: string) => {
    const roleColors = {
      admin: 'bg-purple-100 text-purple-800',
      lecturer: 'bg-blue-100 text-blue-800',
      student: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800'
      }`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </span>
    );
  };

  const columns: Column<User>[] = [
    {
      id: 'user',
      header: 'User',
      accessor: (user) => user,
      cell: (_, user) => (
        <div className="flex items-center">
          {user.avatar ? (
            <img 
              src={user.avatar} 
              alt={`${user.firstName} ${user.lastName}`}
              className="w-10 h-10 rounded-full mr-3"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded-full mr-3 flex items-center justify-center">
              <span className="text-sm font-medium text-gray-600">
                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <div className="font-medium text-gray-900">
              {user.firstName} {user.lastName}
              {!user.verified && (
                <ExclamationTriangleIcon className="w-4 h-4 text-yellow-500 inline ml-2" title="Unverified" />
              )}
            </div>
            <div className="text-sm text-gray-500">{user.email}</div>
            {(user.metadata?.studentId || user.metadata?.employeeId) && (
              <div className="text-xs text-gray-400">
                ID: {user.metadata.studentId || user.metadata.employeeId}
              </div>
            )}
          </div>
        </div>
      ),
      sortable: true,
      width: 'w-64'
    },
    {
      id: 'role',
      header: 'Role',
      accessor: 'role',
      cell: (role) => getRoleBadge(role),
      sortable: true,
      filterable: true,
      filter: {
        type: 'select',
        options: [
          { label: 'All Roles', value: '' },
          { label: 'Student', value: 'student' },
          { label: 'Lecturer', value: 'lecturer' },
          { label: 'Admin', value: 'admin' }
        ]
      }
    },
    {
      id: 'status',
      header: 'Status',
      accessor: 'status',
      cell: (status) => getStatusBadge(status),
      sortable: true,
      filterable: true,
      filter: {
        type: 'select',
        options: [
          { label: 'All Status', value: '' },
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Suspended', value: 'suspended' },
          { label: 'Pending', value: 'pending' }
        ]
      }
    },
    {
      id: 'department',
      header: 'Department',
      accessor: 'department',
      cell: (dept) => dept || '-',
      sortable: true,
      filterable: true
    },
    {
      id: 'courses',
      header: 'Courses',
      accessor: (user) => user.enrolledCourses || user.createdCourses || 0,
      cell: (_, user) => (
        <div className="text-sm">
          {user.role === 'student' ? (
            <span>{user.enrolledCourses || 0} enrolled</span>
          ) : user.role === 'lecturer' ? (
            <span>{user.createdCourses || 0} created</span>
          ) : (
            <span>-</span>
          )}
        </div>
      ),
      sortable: true
    },
    {
      id: 'lastLogin',
      header: 'Last Login',
      accessor: 'lastLogin',
      cell: (lastLogin) => lastLogin ? formatDistanceToNow(lastLogin, { addSuffix: true }) : 'Never',
      sortable: true
    },
    {
      id: 'joinedDate',
      header: 'Joined',
      accessor: 'joinedDate',
      cell: (date) => formatDistanceToNow(date, { addSuffix: true }),
      sortable: true
    },
    {
      id: 'actions',
      header: 'Actions',
      accessor: () => '',
      cell: (_, user) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleViewUser(user)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="View Details"
          >
            <EyeIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => handleEditUser(user)}
            className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
            title="Edit User"
          >
            <PencilIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => handleResetPassword(user.id)}
            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
            title="Reset Password"
          >
            <KeyIcon className="w-4 h-4" />
          </button>
          
          <button
            onClick={() => handleDeleteUser(user.id)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete User"
          >
            <TrashIcon className="w-4 h-4" />
          </button>
        </div>
      ),
      width: 'w-32'
    }
  ];

  const handleViewUser = (user: User) => {
    // Implement view user details
    console.log('View user:', user);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await onDeleteUser?.(userId);
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (window.confirm('Are you sure you want to reset this user\'s password?')) {
      await onResetPassword?.(userId);
    }
  };

  const handleBulkAction = async () => {
    if (selectedUsers.length === 0 || !bulkAction) return;
    
    const userIds = selectedUsers.map(user => user.id);
    await onBulkAction?.(userIds, bulkAction);
    setSelectedUsers([]);
    setShowBulkModal(false);
    setBulkAction('');
  };

  const handleSendBulkEmail = async (template: string) => {
    if (selectedUsers.length === 0) return;
    
    const userIds = selectedUsers.map(user => user.id);
    await onSendEmail?.(userIds, template);
    setSelectedUsers([]);
  };

  const stats = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === 'active').length;
    const students = users.filter(u => u.role === 'student').length;
    const lecturers = users.filter(u => u.role === 'lecturer').length;
    const admins = users.filter(u => u.role === 'admin').length;
    
    return { total, active, students, lecturers, admins };
  }, [users]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage users, roles, and permissions</p>
        </div>
        
        <div className="flex items-center space-x-3">
          {selectedUsers.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedUsers.length} selected
              </span>
              
              <button
                onClick={() => setShowBulkModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
              >
                <UserGroupIcon className="w-4 h-4 mr-2" />
                Bulk Actions
              </button>
            </div>
          )}
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <UserPlusIcon className="w-4 h-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Users</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-sm text-gray-600">Active Users</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.students}</div>
          <div className="text-sm text-gray-600">Students</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.lecturers}</div>
          <div className="text-sm text-gray-600">Lecturers</div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-red-600">{stats.admins}</div>
          <div className="text-sm text-gray-600">Admins</div>
        </div>
      </div>

      {/* Data Table */}
      <AdvancedDataTable
        data={filteredUsers}
        columns={columns}
        loading={loading}
        pagination={{
          page: currentPage,
          pageSize,
          total: filteredUsers.length,
          onPageChange: setCurrentPage,
          onPageSizeChange: setPageSize
        }}
        searchable={true}
        filterable={true}
        exportable={true}
        selectable={true}
        onRowSelect={setSelectedUsers}
        emptyMessage="No users found"
      />

      {/* Bulk Actions Modal */}
      <Modal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        title="Bulk Actions"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Perform actions on {selectedUsers.length} selected users
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Action
            </label>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Choose an action...</option>
              <option value="activate">Activate Users</option>
              <option value="deactivate">Deactivate Users</option>
              <option value="suspend">Suspend Users</option>
              <option value="delete">Delete Users</option>
              <option value="reset_password">Reset Passwords</option>
            </select>
          </div>
          
          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 mb-2">Send Email</h4>
            <div className="space-y-2">
              <button
                onClick={() => handleSendBulkEmail('welcome')}
                className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border"
              >
                Send Welcome Email
              </button>
              <button
                onClick={() => handleSendBulkEmail('reminder')}
                className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border"
              >
                Send Login Reminder
              </button>
              <button
                onClick={() => handleSendBulkEmail('announcement')}
                className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded border"
              >
                Send Announcement
              </button>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={() => setShowBulkModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Execute Action
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EnhancedUserManagement;