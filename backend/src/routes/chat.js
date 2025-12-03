const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');

// Get recent messages (last 10 only) - public group chat
router.get('/messages', authMiddleware, async (req, res) => {
  try {
    const db = require('../config/database');
    
    const [messages] = await db.execute(`
      SELECT 
        cm.id,
        cm.message,
        cm.created_at as createdAt,
        cm.user_id as userId,
        u.first_name as firstName,
        u.last_name as lastName,
        u.role
      FROM chat_messages cm
      JOIN users u ON cm.user_id = u.id
      ORDER BY cm.created_at DESC
      LIMIT 10
    `);
    
    // Reverse to show oldest first
    res.json({ messages: messages.reverse() });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

/**
 * Private 1-on-1 conversations
 * These endpoints use a separate private_messages table
 */

// Get full conversation between current user and another user
router.get('/conversations/:otherUserId', authMiddleware, async (req, res) => {
  try {
    const db = require('../config/database');
    const currentUserId = req.user.id;
    const otherUserId = parseInt(req.params.otherUserId, 10);

    if (!otherUserId || Number.isNaN(otherUserId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    if (otherUserId === currentUserId) {
      return res.status(400).json({ error: 'Cannot start a conversation with yourself' });
    }

    const [messages] = await db.execute(`
      SELECT 
        pm.id,
        pm.message,
        pm.created_at AS createdAt,
        pm.sender_id AS senderId,
        pm.receiver_id AS receiverId,
        su.first_name AS senderFirstName,
        su.last_name AS senderLastName
      FROM private_messages pm
      JOIN users su ON pm.sender_id = su.id
      WHERE (pm.sender_id = ? AND pm.receiver_id = ?)
         OR (pm.sender_id = ? AND pm.receiver_id = ?)
      ORDER BY pm.created_at ASC
    `, [currentUserId, otherUserId, otherUserId, currentUserId]);

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching private conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Send a private message to another user
router.post('/conversations/:otherUserId', authMiddleware, async (req, res) => {
  try {
    const db = require('../config/database');
    const currentUserId = req.user.id;
    const otherUserId = parseInt(req.params.otherUserId, 10);
    const { message } = req.body;

    if (!otherUserId || Number.isNaN(otherUserId)) {
      return res.status(400).json({ error: 'Invalid user id' });
    }

    if (otherUserId === currentUserId) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message too long (max 1000 characters)' });
    }

    // Ensure receiver exists
    const [users] = await db.execute(
      'SELECT id FROM users WHERE id = ? LIMIT 1',
      [otherUserId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [result] = await db.execute(
      'INSERT INTO private_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)',
      [currentUserId, otherUserId, message.trim()]
    );

    res.json({
      success: true,
      messageId: result.insertId
    });
  } catch (error) {
    console.error('Error sending private message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Send a message
router.post('/messages', authMiddleware, async (req, res) => {
  try {
    const db = require('../config/database');
    const { message } = req.body;
    const userId = req.user.id;
    
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }
    
    if (message.length > 500) {
      return res.status(400).json({ error: 'Message too long (max 500 characters)' });
    }
    
    // Insert message
    const [result] = await db.execute(
      'INSERT INTO chat_messages (user_id, message) VALUES (?, ?)',
      [userId, message.trim()]
    );
    
    // Check for @mentions
    const mentionRegex = /@(\w+)/g;
    const mentions = message.match(mentionRegex);
    
    if (mentions) {
      // Get sender's name
      const [sender] = await db.execute(
        'SELECT first_name, last_name FROM users WHERE id = ?',
        [userId]
      );
      const senderName = `${sender[0].first_name} ${sender[0].last_name}`;
      
      // Process each mention
      for (const mention of mentions) {
        const username = mention.substring(1); // Remove @
        
        // Find user by first name (case insensitive)
        const [users] = await db.execute(
          'SELECT id FROM users WHERE LOWER(first_name) = LOWER(?)',
          [username]
        );
        
        if (users.length > 0 && users[0].id !== userId) {
          // Create notification
          await db.execute(
            'INSERT INTO notifications (user_id, type, message, related_id) VALUES (?, ?, ?, ?)',
            [
              users[0].id,
              'mention',
              `${senderName} mentioned you in chat`,
              result.insertId
            ]
          );
        }
      }
    }
    
    res.json({ 
      success: true,
      messageId: result.insertId
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Clear all chat messages (Admin/Moderator only)
router.delete('/clear', authMiddleware, async (req, res) => {
  try {
    const db = require('../config/database');
    
    // Check if user is admin or moderator
    if (req.user.role !== 'admin' && req.user.role !== 'moderator') {
      return res.status(403).json({ error: 'Only admins and moderators can clear chat' });
    }
    
    // Delete all messages
    await db.execute('DELETE FROM chat_messages');
    
    // Post system message
    const systemMessage = `Chat box has been cleared by ${req.user.firstName} ${req.user.lastName}`;
    await db.execute(
      'INSERT INTO chat_messages (user_id, message) VALUES (?, ?)',
      [req.user.id, systemMessage]
    );
    
    res.json({ 
      success: true,
      message: 'Chat cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing chat:', error);
    res.status(500).json({ error: 'Failed to clear chat' });
  }
});

module.exports = router;
