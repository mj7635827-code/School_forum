import { useState, useEffect } from 'react';
import { 
  UserIcon, 
  EnvelopeIcon, 
  AcademicCapIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
  HeartIcon,
  BookmarkIcon,
  PencilIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserPlusIcon,
  UserMinusIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { getApiBaseUrl } from '../utils/apiUrl';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    postsCount: 0,
    repliesCount: 0,
    reactionsReceived: 0,
    bookmarksCount: 0
  });
  const [followStats, setFollowStats] = useState({
    followers: 0,
    following: 0
  });
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  
  // Email change states
  const [showEmailChangeModal, setShowEmailChangeModal] = useState(false);
  const [emailChangeStep, setEmailChangeStep] = useState('request'); // 'request', 'verify'
  const [newEmail, setNewEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailChangeLoading, setEmailChangeLoading] = useState(false);
  const [emailChangeError, setEmailChangeError] = useState('');
  
  // Change password states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordStep, setPasswordStep] = useState('request'); // 'request', 'verify', 'change'
  const [verificationCode, setVerificationCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  // Posts and bookmarks states
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [myPosts, setMyPosts] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  
  // Follow states
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);

  useEffect(() => {
    fetchProfile();
    fetchStats();
    fetchFollowStats();
  }, []);

  const fetchProfile = () => {
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    setUser(userData);
    setEditData({
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: userData.email || ''
    });
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/profile-stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchFollowStats = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(`${getApiBaseUrl()}/api/follows/stats/${userData.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFollowStats(data);
      }
    } catch (error) {
      console.error('Error fetching follow stats:', error);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    // Check if email changed
    if (editData.email !== user.email) {
      // Show email change modal instead
      setNewEmail(editData.email);
      setShowEmailChangeModal(true);
      setEmailChangeStep('request');
      return;
    }
    
    // Just update name
    setLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(editData)
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const updatedUser = { ...user, ...editData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setEditing(false);
        alert('Profile updated successfully!');
      } else {
        alert(data.error || 'Failed to update profile');
      }
    } catch (error) {
      alert('Failed to update profile: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRequestEmailChange = async () => {
    setEmailChangeLoading(true);
    setEmailChangeError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/request-email-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ newEmail })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setEmailChangeStep('verify');
        alert('Verification code sent to ' + newEmail);
      } else {
        setEmailChangeError(data.error || 'Failed to send code');
      }
    } catch (error) {
      setEmailChangeError('Failed to send verification code');
    } finally {
      setEmailChangeLoading(false);
    }
  };
  
  const handleVerifyEmailChange = async () => {
    setEmailChangeLoading(true);
    setEmailChangeError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-email-change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          code: emailCode,
          firstName: editData.firstName,
          lastName: editData.lastName
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const updatedUser = { ...user, email: data.newEmail, firstName: editData.firstName, lastName: editData.lastName, emailVerified: true };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setShowEmailChangeModal(false);
        setEditing(false);
        setEmailCode('');
        alert('Email changed successfully!');
      } else {
        setEmailChangeError(data.error || 'Invalid code');
      }
    } catch (error) {
      setEmailChangeError('Failed to verify code');
    } finally {
      setEmailChangeLoading(false);
    }
  };
  
  const handleCloseEmailChangeModal = () => {
    setShowEmailChangeModal(false);
    setEmailChangeStep('request');
    setNewEmail('');
    setEmailCode('');
    setEmailChangeError('');
  };

  const handleResendVerification = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ email: user.email })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Verification email sent! Check your inbox.');
      } else {
        alert(data.error || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      alert('Failed to send verification email');
    }
  };

  const fetchMyPosts = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/my-posts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMyPosts(data.posts);
        setShowMyPosts(true);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  const fetchBookmarks = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/forum/bookmarks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBookmarks(data.bookmarks);
        setShowBookmarks(true);
      }
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const fetchFollowers = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(`${getApiBaseUrl()}/api/follows/followers/${userData.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFollowers(data);
        setShowFollowers(true);
      }
    } catch (error) {
      console.error('Error fetching followers:', error);
    }
  };

  const fetchFollowing = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const response = await fetch(`${getApiBaseUrl()}/api/follows/following/${userData.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFollowing(data);
        setShowFollowing(true);
      }
    } catch (error) {
      console.error('Error fetching following:', error);
    }
  };

  const handleRequestCode = async () => {
    setPasswordLoading(true);
    setPasswordError('');
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/request-password-change-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setVerificationCode(data.code); // For development - remove in production
        setPasswordStep('verify');
        alert('Verification code sent to your email!');
      } else {
        setPasswordError(data.error || 'Failed to send code');
      }
    } catch (error) {
      setPasswordError('Failed to send verification code');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleVerifyCode = () => {
    if (enteredCode === verificationCode) {
      setPasswordStep('change');
      setPasswordError('');
    } else {
      setPasswordError('Invalid verification code');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    setPasswordLoading(true);
    
    try {
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          verificationCode,
          newPassword
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Password changed successfully!');
        handleClosePasswordModal();
      } else {
        setPasswordError(data.error || 'Failed to change password');
      }
    } catch (error) {
      setPasswordError('Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleClosePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordStep('request');
    setVerificationCode('');
    setEnteredCode('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pending Approval' },
      suspended: { bg: 'bg-red-100', text: 'text-red-700', label: 'Suspended' },
      banned: { bg: 'bg-red-100', text: 'text-red-700', label: 'Banned' }
    };
    
    const badge = badges[status] || badges.pending;
    return (
      <span className={`px-3 py-1 ${badge.bg} ${badge.text} text-sm font-medium rounded-full`}>
        {badge.label}
      </span>
    );
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: { bg: 'bg-red-100', text: 'text-red-700', label: 'Admin' },
      moderator: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Moderator' },
      student: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Student' }
    };
    
    const badge = badges[role] || badges.student;
    return (
      <span className={`px-3 py-1 ${badge.bg} ${badge.text} text-sm font-medium rounded-full`}>
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600">Unable to load profile</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Profile Card */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Profile Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {user.firstName} {user.lastName}
                  </h2>
                  <div className="flex items-center gap-2 mt-2">
                    {getRoleBadge(user.role)}
                    {getStatusBadge(user.status)}
                  </div>
                </div>
              </div>
              
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                >
                  <PencilIcon className="h-5 w-5" />
                  Edit Profile
                </button>
              )}
            </div>

            {/* Profile Info */}
            {editing ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editData.firstName}
                      onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editData.lastName}
                      onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editData.email}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
                  >
                    <CheckCircleIcon className="h-5 w-5" />
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setEditData({
                        firstName: user.firstName || '',
                        lastName: user.lastName || '',
                        email: user.email || ''
                      });
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    <XCircleIcon className="h-5 w-5" />
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-gray-700">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  <span>{user.email}</span>
                </div>

                {user.grade && (
                  <div className="flex items-center gap-3 text-gray-700">
                    <AcademicCapIcon className="h-5 w-5 text-gray-400" />
                    <span>Grade {user.grade}</span>
                  </div>
                )}

                <div className="flex items-center gap-3 text-gray-700">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <span>Joined {new Date(user.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Activity Stats */}
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Activity Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-emerald-50 rounded-lg">
                <ChatBubbleLeftIcon className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.postsCount}</div>
                <div className="text-sm text-gray-600">Posts</div>
              </div>
              
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <ChatBubbleLeftIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.repliesCount}</div>
                <div className="text-sm text-gray-600">Replies</div>
              </div>
              
              <div className="text-center p-4 bg-pink-50 rounded-lg">
                <HeartIcon className="h-8 w-8 text-pink-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.reactionsReceived}</div>
                <div className="text-sm text-gray-600">Reactions</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <BookmarkIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{stats.bookmarksCount}</div>
                <div className="text-sm text-gray-600">Bookmarks</div>
              </div>
            </div>
          </div>

          {/* Follow Stats */}
          <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Network</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={fetchFollowers}
                className="text-center p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition cursor-pointer"
              >
                <UsersIcon className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{followStats.followers}</div>
                <div className="text-sm text-gray-600">Followers</div>
              </button>
              
              <button
                onClick={fetchFollowing}
                className="text-center p-4 bg-cyan-50 hover:bg-cyan-100 rounded-lg transition cursor-pointer"
              >
                <UserPlusIcon className="h-8 w-8 text-cyan-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{followStats.following}</div>
                <div className="text-sm text-gray-600">Following</div>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Account Status */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Account Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Email Verified</span>
                {user.emailVerified ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-red-500" />
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Account Status</span>
                <span className="text-sm font-medium text-gray-900 capitalize">{user.status}</span>
              </div>

              {user.status === 'active' && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-xs text-green-700">
                    ✓ Your school ID has been verified by admin
                  </p>
                </div>
              )}

              {user.status === 'pending' && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs text-yellow-700">
                    ⏳ Your school ID is pending admin approval
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button 
                onClick={() => setShowPasswordModal(true)}
                className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
              >
                Change Password
              </button>
              <button 
                onClick={fetchMyPosts}
                className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
              >
                View My Posts ({stats.postsCount})
              </button>
              <button 
                onClick={fetchBookmarks}
                className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition"
              >
                View Bookmarks ({stats.bookmarksCount})
              </button>
              <button className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
              <button
                onClick={handleClosePasswordModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            {passwordError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {passwordError}
              </div>
            )}

            {/* Step 1: Request Code */}
            {passwordStep === 'request' && (
              <div>
                <p className="text-gray-600 mb-6">
                  We'll send a 4-digit verification code to your email: <strong>{user.email}</strong>
                </p>
                <button
                  onClick={handleRequestCode}
                  disabled={passwordLoading}
                  className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {passwordLoading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
            )}

            {/* Step 2: Verify Code */}
            {passwordStep === 'verify' && (
              <div>
                <p className="text-gray-600 mb-4">
                  Enter the 4-digit code sent to your email
                </p>
                <input
                  type="text"
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="Enter 4-digit code"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center text-2xl tracking-widest mb-4"
                  maxLength="4"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleVerifyCode}
                    disabled={enteredCode.length !== 4}
                    className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    Verify Code
                  </button>
                  <button
                    onClick={() => setPasswordStep('request')}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Change Password */}
            {passwordStep === 'change' && (
              <form onSubmit={handleChangePassword}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter new password"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Confirm new password"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {passwordLoading ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* My Posts Modal */}
      {showMyPosts && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">My Posts</h3>
              <button
                onClick={() => setShowMyPosts(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            {myPosts.length > 0 ? (
              <div className="space-y-3">
                {myPosts.map(post => (
                  <a
                    key={post.id}
                    href={`/forum/${post.forumType}/thread/${post.id}`}
                    className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                  >
                    <h4 className="font-semibold text-gray-900 mb-1">{post.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{post.replyCount} replies</span>
                      <span>{post.viewCount} views</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No posts yet</p>
            )}
          </div>
        </div>
      )}

      {/* Bookmarks Modal */}
      {showBookmarks && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">My Bookmarks</h3>
              <button
                onClick={() => setShowBookmarks(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            {bookmarks.length > 0 ? (
              <div className="space-y-3">
                {bookmarks.map(bookmark => (
                  <a
                    key={bookmark.id}
                    href={`/forum/${bookmark.forumType}/thread/${bookmark.postId}`}
                    className="block p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
                  >
                    <h4 className="font-semibold text-gray-900 mb-1">{bookmark.title}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{bookmark.replyCount} replies</span>
                      <span>{bookmark.viewCount} views</span>
                      <span>Bookmarked {new Date(bookmark.bookmarkedAt).toLocaleDateString()}</span>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No bookmarks yet</p>
            )}
          </div>
        </div>
      )}

      {/* Followers Modal */}
      {showFollowers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Followers</h3>
              <button
                onClick={() => setShowFollowers(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            {followers.length > 0 ? (
              <div className="space-y-3">
                {followers.map(follower => (
                  <div
                    key={follower.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                        {follower.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{follower.username}</div>
                        <div className="text-sm text-gray-500">
                          {follower.year_level && `Grade ${follower.year_level}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(follower.followed_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No followers yet</p>
            )}
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Following</h3>
              <button
                onClick={() => setShowFollowing(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            {following.length > 0 ? (
              <div className="space-y-3">
                {following.map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
                        {user.username?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">
                          {user.year_level && `Grade ${user.year_level}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(user.followed_at).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">Not following anyone yet</p>
            )}
          </div>
        </div>
      )}
      {/* Email Change Modal */}
      {showEmailChangeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Change Email Address</h3>
              <button
                onClick={handleCloseEmailChangeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircleIcon className="h-6 w-6" />
              </button>
            </div>

            {emailChangeError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {emailChangeError}
              </div>
            )}

            {emailChangeStep === 'request' && (
              <div>
                <p className="text-gray-600 mb-4">
                  We'll send a 6-digit verification code to your new email address: <strong>{newEmail}</strong>
                </p>
                <button
                  onClick={handleRequestEmailChange}
                  disabled={emailChangeLoading}
                  className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {emailChangeLoading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </div>
            )}

            {emailChangeStep === 'verify' && (
              <div>
                <p className="text-gray-600 mb-4">
                  Enter the 6-digit code sent to <strong>{newEmail}</strong>
                </p>
                <input
                  type="text"
                  value={emailCode}
                  onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit code"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-center text-2xl tracking-widest mb-4"
                  maxLength="6"
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleVerifyEmailChange}
                    disabled={emailCode.length !== 6 || emailChangeLoading}
                    className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {emailChangeLoading ? 'Verifying...' : 'Verify & Change Email'}
                  </button>
                  <button
                    onClick={() => setEmailChangeStep('request')}
                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                  >
                    Back
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
