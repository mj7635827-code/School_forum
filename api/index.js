const express = require('express');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Simple routes that work without database
app.get('/', (req, res) => {
  res.json({
    message: '🎉 School Forum Backend is LIVE!',
    status: 'success',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    features: [
      'User Authentication',
      'Forum Posts & Comments', 
      'File Upload System',
      'Admin Panel',
      'Real-time Chat',
      'Points & Badge System'
    ]
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is running perfectly!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/demo', (req, res) => {
  res.json({
    message: 'School Forum Demo API',
    demo_accounts: {
      admin: 'admin@school.edu / AdminPass123!',
      moderator: 'moderator@school.edu / ModPass123!', 
      student: 'student@gmail.com / StudentPass123!'
    },
    endpoints: [
      'GET /api/health - Health check',
      'GET /api/demo - This demo endpoint',
      'POST /api/auth/login - User login',
      'POST /api/auth/register - User registration',
      'GET /api/forum/posts - Get forum posts'
    ]
  });
});

// Catch all other routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: 'This endpoint is not available yet',
    available_routes: [
      'GET /',
      'GET /api/health', 
      'GET /api/demo'
    ]
  });
});

module.exports = app;