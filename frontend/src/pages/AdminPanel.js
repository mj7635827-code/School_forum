import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { 
  UserIcon, 
  ExclamationTriangleIcon, 
  NoSymbolIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';
import { CheckCircleIcon as CheckCircleIconOutline } from '@heroicons/react/24/outline';
import { removeKeycapEmojis } from '../utils/removeKeycapEmojis';

const AdminPanel = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [clearingChat, setClearingChat] = useState(false);

  // Fetch all users
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleClearChat = async () => {
    if (!window.confirm('Are you sure you want to clear all chat messages? This cannot be undone.')) {
      return;
    }

    setClearingChat(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/chat/clear', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Chat box cleared successfully');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to clear chat');
      }
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast.error('Failed to clear chat');
    } finally {
      setClearingChat(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error('Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update user status (suspend/ban/activate)
  const updateUserStatus = async (userId, newStatus) => {
    setActionLoading(prev => ({ ...prev, [userId]: true }));
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        // Update local state
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, status: newStatus } : u
        ));
        toast.success(`User ${newStatus} successfully!`);
      } else {
        const error = await response.json();
        toast.error(`Failed to update user: ${error.message}`);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error('Error updating user status');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: false }));
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'suspended': return 'text-orange-600 bg-orange-100';
      case 'banned': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircleIconSolid className="w-4 h-4" />;
      case 'suspended': return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'banned': return <NoSymbolIcon className="w-4 h-4" />;
      default: return <UserIcon className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage users, monitor activity, and maintain forum integrity</p>
        </div>
        <button
          onClick={handleClearChat}
          disabled={clearingChat}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
        >
          {clearingChat ? 'Clearing...' : 'Clear Chat Box'}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.status === 'active').length}
              </p>
            </div>
            <CheckCircleIconSolid className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Approval</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.status === 'pending').length}
              </p>
            </div>
            <UserIcon className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.status === 'suspended').length}
              </p>
            </div>
            <ExclamationTriangleIcon className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Banned</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.status === 'banned').length}
              </p>
            </div>
            <NoSymbolIcon className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((userItem) => (
                <tr key={userItem.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <UserIcon className="h-5 w-5 text-orange-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {userItem.firstName} {userItem.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {userItem.role}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center gap-2">
                      {userItem.emailVerified ? (
                        <CheckCircleIconSolid className="h-5 w-5 text-emerald-500" title="Email Verified" />
                      ) : (
                        <CheckCircleIconOutline className="h-5 w-5 text-gray-300" title="Email Not Verified" />
                      )}
                      <span>{userItem.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      {removeKeycapEmojis(userItem.gradeLevel) || userItem.gradeLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {removeKeycapEmojis(userItem.schoolIdNumber) || <span className="text-gray-400 italic">Not provided</span>}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(userItem.status)}`}>
                      {getStatusIcon(userItem.status)}
                      {userItem.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {removeKeycapEmojis(new Date(userItem.createdAt).toLocaleDateString())}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    {userItem.id !== user?.id && (
                      <>
                        {userItem.status !== 'active' && (
                          <button
                            onClick={() => updateUserStatus(userItem.id, 'active')}
                            disabled={actionLoading[userItem.id]}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="Activate User"
                          >
                            {actionLoading[userItem.id] ? '...' : 'Activate'}
                          </button>
                        )}
                        
                        {userItem.status !== 'suspended' && (
                          <button
                            onClick={() => updateUserStatus(userItem.id, 'suspended')}
                            disabled={actionLoading[userItem.id]}
                            className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                            title="Suspend User"
                          >
                            {actionLoading[userItem.id] ? '...' : 'Suspend'}
                          </button>
                        )}
                        
                        {userItem.status !== 'banned' && (
                          <button
                            onClick={() => updateUserStatus(userItem.id, 'banned')}
                            disabled={actionLoading[userItem.id]}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Ban User"
                          >
                            {actionLoading[userItem.id] ? '...' : 'Ban'}
                          </button>
                        )}
                      </>
                    )}
                    {userItem.id === user?.id && (
                      <span className="text-gray-400 italic">You</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
            <p className="mt-1 text-sm text-gray-500">No users have registered yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;