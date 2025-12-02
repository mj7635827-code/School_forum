const express = require('express');
const User = require('../models/User');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { sendApprovalEmail, sendRejectionEmail } = require('../utils/email');

const router = express.Router();

// Helper function to remove keycap emojis
const removeKeycapEmojis = (text) => {
  if (!text) return text;
  return String(text)
    .replace(/0️⃣/g, '0')
    .replace(/1️⃣/g, '1')
    .replace(/2️⃣/g, '2')
    .replace(/3️⃣/g, '3')
    .replace(/4️⃣/g, '4')
    .replace(/5️⃣/g, '5')
    .replace(/6️⃣/g, '6')
    .replace(/7️⃣/g, '7')
    .replace(/8️⃣/g, '8')
    .replace(/9️⃣/g, '9')
    .replace(/\*️⃣/g, '*')
    .replace(/#️⃣/g, '#');
};

// Get all users (Admin only)
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.findAll();
    
    // Clean emoji data from all fields
    const cleanedUsers = users.map(user => ({
      ...user,
      gradeLevel: removeKeycapEmojis(user.gradeLevel),
      schoolIdNumber: removeKeycapEmojis(user.schoolIdNumber),
      firstName: removeKeycapEmojis(user.firstName),
      lastName: removeKeycapEmojis(user.lastName)
    }));
    
    res.json({ 
      success: true, 
      users: cleanedUsers
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ 
      error: 'Failed to fetch users',
      message: 'Please try again later'
    });
  }
});

// Get pending users for approval
router.get('/pending', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pendingUsers = await User.getPendingUsers();
    
    res.json({
      users: pendingUsers,
      count: pendingUsers.length
    });
    
  } catch (error) {
    console.error('Fetch pending users error:', error);
    res.status(500).json({
      error: 'Failed to fetch pending users',
      message: 'Please try again later'
    });
  }
});

// Approve user
router.put('/approve/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { yearLevel, role = 'student' } = req.body;
    
    // Validate year level
    if (!['G11', 'G12'].includes(yearLevel)) {
      return res.status(400).json({
        error: 'Invalid year level',
        message: 'Year level must be G11 or G12'
      });
    }
    
    // Validate role
    if (!['student', 'moderator'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'Role must be student or moderator'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    if (user.status !== 'pending') {
      return res.status(400).json({
        error: 'User not pending approval',
        message: `User status is already: ${user.status}`
      });
    }
    
    // Update user status and year level
    await User.updateStatus(userId, 'active', role);
    await User.updateYearLevel(userId, yearLevel);
    
    // Send approval email
    await sendApprovalEmail(user.email, user.first_name, yearLevel);
    
    // Clean up uploaded school ID after approval
    if (user.school_id_path) {
      // Note: File cleanup will be handled by the upload route's delete endpoint
      // This keeps the audit trail intact while removing sensitive documents
    }
    
    res.json({
      message: 'User approved successfully',
      user: {
        id: userId,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        yearLevel,
        role,
        status: 'active'
      }
    });
    
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({
      error: 'Failed to approve user',
      message: 'Please try again later'
    });
  }
});

// Reject user
router.put('/reject/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = 'Document verification failed' } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    if (user.status !== 'pending') {
      return res.status(400).json({
        error: 'User not pending approval',
        message: `User status is already: ${user.status}`
      });
    }
    
    // Update user status
    await User.updateStatus(userId, 'rejected');
    
    // Send rejection email
    await sendRejectionEmail(user.email, user.first_name, reason);
    
    res.json({
      message: 'User rejected',
      user: {
        id: userId,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        status: 'rejected',
        reason
      }
    });
    
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({
      error: 'Failed to reject user',
      message: 'Please try again later'
    });
  }
});

// Get dashboard statistics
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const stats = await User.getStats();
    
    res.json({
      statistics: stats,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: 'Please try again later'
    });
  }
});

// Update user role (admin only)
router.put('/role/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;
    
    // Only super admin can create other admins
    if (role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied',
        message: 'Only administrators can assign admin roles'
      });
    }
    
    if (!['student', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role',
        message: 'Role must be student, moderator, or admin'
      });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }
    
    await User.updateStatus(userId, user.status, role);
    
    res.json({
      message: 'User role updated successfully',
      user: {
        id: userId,
        email: user.email,
        name: `${user.first_name} ${user.last_name}`,
        role: role
      }
    });
    
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({
      error: 'Failed to update role',
      message: 'Please try again later'
    });
  }
});

// Get all users (admin only)
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, role, yearLevel } = req.query;
    
    let query = 'SELECT id, email, first_name, last_name, year_level, status, role, email_verified, created_at FROM users WHERE 1=1';
    const params = [];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    if (role) {
      query += ' AND role = ?';
      params.push(role);
    }
    
    if (yearLevel) {
      query += ' AND year_level = ?';
      params.push(yearLevel);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    
    const users = await User.query(query, params);
    
    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: users.length
      }
    });
    
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({
      error: 'Failed to fetch users',
      message: 'Please try again later'
    });
  }
});

// Update user status (suspend/ban/activate)
router.patch('/users/:userId/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    console.log('🔧 Update user status request:', { 
      userId, 
      status, 
      requestingUser: req.user ? req.user.id : 'undefined',
      fullUser: req.user 
    });

    // Validate status
    const validStatuses = ['active', 'suspended', 'banned', 'pending'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be one of: active, suspended, banned, pending'
      });
    }

    // Prevent admin from changing their own status
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own account status'
      });
    }

    // Find user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'The specified user does not exist'
      });
    }

    // Prevent banning/suspending other admins
    if (user.role === 'admin' && ['suspended', 'banned'].includes(status)) {
      return res.status(403).json({
        success: false,
        message: 'Cannot suspend or ban other administrators'
      });
    }

    // Update user status
    await User.updateStatus(userId, status);

    // If activating a user, also verify their email
    if (status === 'active' && !user.emailVerified) {
      await User.updateEmailVerification(userId, true);
      console.log(`✅ Email verified for user ${userId} during activation`);
    }

    res.json({
      success: true,
      message: `User ${status} successfully`,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        status: status
      }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status. Please try again later.'
    });
  }
});

module.exports = router;