# Test Execution Guide 🧪

## Quick Start

### 1. Run All Tests
```bash
# Windows
run-tests.bat

# Linux/Mac
node tests/setup/test-runner.js all
```

### 2. Run Specific Test Types
```bash
# Smoke tests (fastest - 30 seconds)
node tests/setup/test-runner.js smoke

# Unit tests (fast - 2 minutes)
node tests/setup/test-runner.js unit

# Integration tests (medium - 5 minutes)
node tests/setup/test-runner.js integration

# Security tests (medium - 3 minutes)
node tests/setup/test-runner.js security

# Performance tests (slow - 10 minutes)
node tests/setup/test-runner.js performance

# E2E tests (slowest - 15 minutes)
node tests/setup/test-runner.js e2e
```

## Test Categories

### 🏥 Smoke Tests
**Purpose**: Quick health check to ensure system is running
**Duration**: ~30 seconds
**When to run**: After deployment, before other tests

```bash
node tests/smoke/api-health.js
node tests/smoke/database-connection.js
node tests/smoke/email-service.js
```

### 🔬 Unit Tests
**Purpose**: Test individual functions and components
**Duration**: ~2 minutes
**When to run**: On every code commit

**Backend Unit Tests**:
- Authentication functions
- Email service functions
- Points calculation
- Avatar utilities
- Contributor checks

**Frontend Unit Tests**:
- React components
- Utility functions
- State management

### 🔗 Integration Tests
**Purpose**: Test API endpoints and database operations
**Duration**: ~5 minutes
**When to run**: Before merging to main branch

**Test Scenarios**:
- Complete user registration flow
- Netflix-style email change
- Forum post creation and interaction
- Notification system
- File upload process

### 🔒 Security Tests
**Purpose**: Identify vulnerabilities and security issues
**Duration**: ~3 minutes
**When to run**: Weekly and before releases

**Security Checks**:
- Dependency vulnerability scan
- Authentication bypass attempts
- SQL injection prevention
- XSS protection
- Authorization checks

### ⚡ Performance Tests
**Purpose**: Measure system performance under load
**Duration**: ~10 minutes
**When to run**: Before releases and monthly

**Load Scenarios**:
- 100 concurrent users
- Heavy forum activity
- Email service stress test
- Database connection limits
- File upload performance

### 🎯 End-to-End Tests
**Purpose**: Test complete user journeys
**Duration**: ~15 minutes
**When to run**: Before major releases

**User Journeys**:
- New student registration to first post
- Admin user management workflow
- Complete forum interaction flow
- Email change process
- Profile management

## Test Data

### Test Users
```javascript
// Automatically created during test setup
{
  admin: 'admin@test.com / Admin123!',
  moderator: 'mod@test.com / Mod123!',
  studentG11: 'student11@test.com / Student123!',
  studentG12: 'student12@test.com / Student123!',
  pending: 'pending@test.com / Pending123!'
}
```

### Test Environment
- **Database**: `test_school_forum`
- **Backend Port**: `5001` (test mode)
- **Frontend Port**: `3001` (test mode)
- **Email**: Mock email service (no real emails sent)

## Continuous Integration

### GitHub Actions Workflow
```yaml
# Runs on every push and pull request
- Unit Tests (required)
- Integration Tests (required)
- Security Scan (required)
- Smoke Tests (required)

# Runs on release
- Full Test Suite
- Performance Tests
- E2E Tests
```

### Local Development
```bash
# Before committing
npm run test:quick

# Before pushing
npm run test:full

# Before deploying
npm run test:all
```

## Test Reports

### HTML Report
After running tests, open `test-results.html` for detailed results:
- Test execution summary
- Performance metrics
- Failed test details
- Coverage reports

### Console Output
```
🧪 School Forum System - Test Suite Runner
==================================================

🔧 Setting up test environment...
✅ Test environment ready!

🔬 Running Unit Tests...
  Running auth.test.js...
  Running email.test.js...
  Running points.test.js...

📊 Test Results Summary
==================================================
Total Tests: 45
Passed: 43 ✅
Failed: 2 ❌
Duration: 127s

Detailed Results:
  UNIT: 15✅ 1❌
  INTEGRATION: 12✅ 0❌
  SECURITY: 8✅ 1❌
  SMOKE: 8✅ 0❌

📄 Detailed report saved to: test-results.html
```

## Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check if MySQL is running
mysql -u root -p

# Reset test database
node tests/setup/reset-test-db.js
```

**Port Already in Use**
```bash
# Kill processes on test ports
npx kill-port 5001 3001

# Or use different ports
TEST_PORT=5002 npm run test
```

**Email Service Tests Failing**
```bash
# Check email configuration
node tests/setup/check-email-config.js

# Use mock email service
MOCK_EMAIL=true npm run test
```

**Performance Tests Timeout**
```bash
# Increase timeout
PERFORMANCE_TIMEOUT=300000 npm run test:performance

# Run with fewer concurrent users
LOAD_USERS=50 npm run test:performance
```

## Best Practices

### Writing Tests
1. **Arrange, Act, Assert** pattern
2. **Descriptive test names**
3. **Independent tests** (no dependencies)
4. **Clean up after tests**
5. **Use realistic test data**

### Running Tests
1. **Run smoke tests first**
2. **Fix failing tests immediately**
3. **Don't skip security tests**
4. **Monitor performance trends**
5. **Review test reports**

### Maintenance
1. **Update test data regularly**
2. **Add tests for new features**
3. **Remove obsolete tests**
4. **Keep test environment clean**
5. **Document test scenarios**

## Metrics & Goals

### Performance Targets
- **API Response Time**: < 200ms (95th percentile)
- **Page Load Time**: < 2 seconds
- **Database Queries**: < 100ms
- **Email Delivery**: < 30 seconds

### Quality Targets
- **Test Coverage**: > 80%
- **Pass Rate**: > 95%
- **Security Score**: 0 high/critical vulnerabilities
- **Performance Score**: No regression > 10%

### Reliability Targets
- **Uptime**: 99.9%
- **Error Rate**: < 0.1%
- **Recovery Time**: < 5 minutes
- **Data Integrity**: 100%