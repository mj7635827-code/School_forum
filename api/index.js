module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  const { url, method } = req;

  // Handle different routes
  if (url === '/' || url === '/api' || url === '/api/') {
    return res.status(200).json({
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
      ],
      demo_accounts: {
        admin: 'admin@school.edu / AdminPass123!',
        moderator: 'moderator@school.edu / ModPass123!', 
        student: 'student@gmail.com / StudentPass123!'
      }
    });
  }

  if (url === '/api/health') {
    return res.status(200).json({ 
      status: 'OK', 
      message: 'Backend is running perfectly!',
      timestamp: new Date().toISOString(),
      server: 'Vercel Serverless'
    });
  }

  if (url === '/api/demo') {
    return res.status(200).json({
      message: 'School Forum Demo API',
      demo_accounts: {
        admin: 'admin@school.edu / AdminPass123!',
        moderator: 'moderator@school.edu / ModPass123!', 
        student: 'student@gmail.com / StudentPass123!'
      },
      endpoints: [
        'GET /api/health - Health check',
        'GET /api/demo - This demo endpoint',
        'POST /api/auth/login - User login (coming soon)',
        'POST /api/auth/register - User registration (coming soon)',
        'GET /api/forum/posts - Get forum posts (coming soon)'
      ],
      note: 'This is a demo version. Full functionality requires database setup.'
    });
  }

  // Default 404 response
  return res.status(404).json({
    error: 'Route not found',
    message: 'This endpoint is not available',
    available_routes: [
      'GET /',
      'GET /api/health', 
      'GET /api/demo'
    ],
    requested_url: url,
    method: method
  });
};