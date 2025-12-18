/**
 * Smoke Test: API Health Check
 * Verifies that all critical API endpoints are responding
 */

const axios = require('axios');

const API_BASE = process.env.API_BASE_URL || 'http://localhost:5000';

const endpoints = [
  { name: 'Health Check', path: '/api/health', method: 'GET' },
  { name: 'Auth Status', path: '/api/auth/status', method: 'GET' },
  { name: 'Forum List', path: '/api/forum/posts', method: 'GET' },
];

async function runHealthChecks() {
  console.log('🏥 Running API Health Checks...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${API_BASE}${endpoint.path}`,
        timeout: 5000,
        validateStatus: (status) => status < 500 // Accept 4xx but not 5xx
      });
      
      console.log(`✅ ${endpoint.name}: ${response.status} ${response.statusText}`);
      passed++;
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`\n📊 Health Check Results: ${passed}✅ ${failed}❌`);
  
  if (failed > 0) {
    console.error('❌ Some health checks failed!');
    process.exit(1);
  }
  
  console.log('✅ All health checks passed!');
}

runHealthChecks().catch(error => {
  console.error('❌ Health check failed:', error.message);
  process.exit(1);
});