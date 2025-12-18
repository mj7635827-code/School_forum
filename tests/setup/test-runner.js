#!/usr/bin/env node

/**
 * School Forum System - Test Runner
 * Executes comprehensive test suite with proper setup and teardown
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, skipped: 0 },
      integration: { passed: 0, failed: 0, skipped: 0 },
      e2e: { passed: 0, failed: 0, skipped: 0 },
      security: { passed: 0, failed: 0, skipped: 0 },
      performance: { passed: 0, failed: 0, skipped: 0 }
    };
    this.startTime = Date.now();
  }

  async run(testType = 'all') {
    console.log('🧪 School Forum System - Test Suite Runner');
    console.log('=' .repeat(50));
    
    try {
      // Setup test environment
      await this.setupTestEnvironment();
      
      // Run tests based on type
      switch (testType) {
        case 'unit':
          await this.runUnitTests();
          break;
        case 'integration':
          await this.runIntegrationTests();
          break;
        case 'e2e':
          await this.runE2ETests();
          break;
        case 'security':
          await this.runSecurityTests();
          break;
        case 'performance':
          await this.runPerformanceTests();
          break;
        case 'smoke':
          await this.runSmokeTests();
          break;
        case 'all':
        default:
          await this.runAllTests();
          break;
      }
      
      // Generate report
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }

  async setupTestEnvironment() {
    console.log('\n🔧 Setting up test environment...');
    
    // Check if test database exists
    try {
      execSync('node tests/setup/check-test-db.js', { stdio: 'inherit' });
    } catch (error) {
      console.log('📝 Creating test database...');
      execSync('node tests/setup/create-test-db.js', { stdio: 'inherit' });
    }
    
    // Seed test data
    console.log('🌱 Seeding test data...');
    execSync('node tests/setup/seed-test-data.js', { stdio: 'inherit' });
    
    console.log('✅ Test environment ready!');
  }

  async runUnitTests() {
    console.log('\n🔬 Running Unit Tests...');
    
    const testSuites = [
      'tests/unit/auth.test.js',
      'tests/unit/email.test.js',
      'tests/unit/points.test.js',
      'tests/unit/avatar.test.js',
      'tests/unit/contributor-check.test.js'
    ];
    
    for (const suite of testSuites) {
      try {
        console.log(`  Running ${path.basename(suite)}...`);
        execSync(`npx jest ${suite}`, { stdio: 'inherit' });
        this.results.unit.passed++;
      } catch (error) {
        console.error(`  ❌ Failed: ${path.basename(suite)}`);
        this.results.unit.failed++;
      }
    }
  }

  async runIntegrationTests() {
    console.log('\n🔗 Running Integration Tests...');
    
    const testSuites = [
      'tests/integration/auth-flow.test.js',
      'tests/integration/email-change.test.js',
      'tests/integration/forum-operations.test.js',
      'tests/integration/database.test.js',
      'tests/integration/notifications.test.js'
    ];
    
    for (const suite of testSuites) {
      try {
        console.log(`  Running ${path.basename(suite)}...`);
        execSync(`npx jest ${suite}`, { stdio: 'inherit' });
        this.results.integration.passed++;
      } catch (error) {
        console.error(`  ❌ Failed: ${path.basename(suite)}`);
        this.results.integration.failed++;
      }
    }
  }

  async runE2ETests() {
    console.log('\n🎯 Running End-to-End Tests...');
    
    // Start servers for E2E testing
    console.log('  Starting test servers...');
    const backend = execSync('cd backend && npm start &', { stdio: 'pipe' });
    const frontend = execSync('cd frontend && npm start &', { stdio: 'pipe' });
    
    // Wait for servers to start
    await this.waitForServers();
    
    try {
      execSync('npx playwright test', { stdio: 'inherit' });
      this.results.e2e.passed++;
    } catch (error) {
      console.error('  ❌ E2E tests failed');
      this.results.e2e.failed++;
    }
  }

  async runSecurityTests() {
    console.log('\n🔒 Running Security Tests...');
    
    const securityTests = [
      'npm audit --audit-level moderate',
      'npx snyk test',
      'node tests/security/auth-security.test.js',
      'node tests/security/input-validation.test.js'
    ];
    
    for (const test of securityTests) {
      try {
        console.log(`  Running ${test}...`);
        execSync(test, { stdio: 'inherit' });
        this.results.security.passed++;
      } catch (error) {
        console.error(`  ❌ Security test failed: ${test}`);
        this.results.security.failed++;
      }
    }
  }

  async runPerformanceTests() {
    console.log('\n⚡ Running Performance Tests...');
    
    try {
      execSync('npx artillery run tests/performance/load-test.yml', { stdio: 'inherit' });
      this.results.performance.passed++;
    } catch (error) {
      console.error('  ❌ Performance tests failed');
      this.results.performance.failed++;
    }
  }

  async runSmokeTests() {
    console.log('\n💨 Running Smoke Tests...');
    
    const smokeTests = [
      'node tests/smoke/api-health.js',
      'node tests/smoke/database-connection.js',
      'node tests/smoke/email-service.js'
    ];
    
    for (const test of smokeTests) {
      try {
        console.log(`  Running ${path.basename(test)}...`);
        execSync(test, { stdio: 'inherit' });
      } catch (error) {
        console.error(`  ❌ Smoke test failed: ${path.basename(test)}`);
        throw error;
      }
    }
  }

  async runAllTests() {
    await this.runUnitTests();
    await this.runIntegrationTests();
    await this.runSecurityTests();
    await this.runSmokeTests();
    // Skip E2E and Performance for 'all' to save time
  }

  async waitForServers() {
    console.log('  Waiting for servers to start...');
    // Simple wait - in real implementation, would ping health endpoints
    await new Promise(resolve => setTimeout(resolve, 10000));
  }

  async generateReport() {
    const endTime = Date.now();
    const duration = (endTime - this.startTime) / 1000;
    
    console.log('\n📊 Test Results Summary');
    console.log('=' .repeat(50));
    
    const totalPassed = Object.values(this.results).reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = Object.values(this.results).reduce((sum, r) => sum + r.failed, 0);
    const totalTests = totalPassed + totalFailed;
    
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${totalPassed} ✅`);
    console.log(`Failed: ${totalFailed} ${totalFailed > 0 ? '❌' : ''}`);
    console.log(`Duration: ${duration}s`);
    
    // Detailed breakdown
    console.log('\nDetailed Results:');
    Object.entries(this.results).forEach(([type, result]) => {
      if (result.passed > 0 || result.failed > 0) {
        console.log(`  ${type.toUpperCase()}: ${result.passed}✅ ${result.failed}❌`);
      }
    });
    
    // Generate HTML report
    const htmlReport = this.generateHTMLReport(duration, totalPassed, totalFailed);
    fs.writeFileSync('test-results.html', htmlReport);
    console.log('\n📄 Detailed report saved to: test-results.html');
    
    // Exit with error code if any tests failed
    if (totalFailed > 0) {
      process.exit(1);
    }
  }

  generateHTMLReport(duration, passed, failed) {
    return `
<!DOCTYPE html>
<html>
<head>
    <title>School Forum Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f8f9fa; padding: 20px; border-radius: 8px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .results-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .results-table th, .results-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .results-table th { background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 School Forum System - Test Results</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div style="font-size: 2em; font-weight: bold;">${passed + failed}</div>
        </div>
        <div class="metric">
            <h3>Passed</h3>
            <div style="font-size: 2em; font-weight: bold;" class="passed">${passed}</div>
        </div>
        <div class="metric">
            <h3>Failed</h3>
            <div style="font-size: 2em; font-weight: bold;" class="failed">${failed}</div>
        </div>
        <div class="metric">
            <h3>Duration</h3>
            <div style="font-size: 2em; font-weight: bold;">${duration}s</div>
        </div>
    </div>
    
    <table class="results-table">
        <thead>
            <tr>
                <th>Test Suite</th>
                <th>Passed</th>
                <th>Failed</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${Object.entries(this.results).map(([type, result]) => `
                <tr>
                    <td>${type.toUpperCase()}</td>
                    <td class="passed">${result.passed}</td>
                    <td class="failed">${result.failed}</td>
                    <td>${result.failed === 0 ? '✅ PASS' : '❌ FAIL'}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test environment...');
    
    try {
      // Kill test servers
      execSync('pkill -f "npm start"', { stdio: 'ignore' });
      
      // Clean test database
      execSync('node tests/setup/cleanup-test-db.js', { stdio: 'ignore' });
      
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.log('⚠️  Cleanup had some issues (this is usually fine)');
    }
  }
}

// CLI interface
if (require.main === module) {
  const testType = process.argv[2] || 'all';
  const runner = new TestRunner();
  runner.run(testType);
}

module.exports = TestRunner;