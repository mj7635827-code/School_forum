/**
 * Integration Test: Netflix-Style Email Change Flow
 * Tests the complete email change process from request to completion
 */

const request = require('supertest');
const app = require('../../backend/src/app');
const db = require('../../backend/src/config/database');

describe('Email Change Integration', () => {
  let authToken;
  let userId;
  let testUser;

  beforeAll(async () => {
    // Create test user
    testUser = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'TestPass123!',
      yearLevel: 'G11',
      role: 'student',
      status: 'active'
    };

    // Register and login test user
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    authToken = loginResponse.body.token;
    userId = loginResponse.body.user.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await db.execute('DELETE FROM email_change_codes WHERE user_id = ?', [userId]);
    await db.execute('DELETE FROM users WHERE email LIKE ?', ['%@test-example.com']);
  });

  describe('Netflix-Style Email Change Flow', () => {
    const newEmail = 'newemail@test-example.com';
    let verificationCode;

    test('Step 1: Request email change with password', async () => {
      const response = await request(app)
        .post('/api/auth/request-email-change')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newEmail: newEmail,
          password: testUser.password
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Verification code sent');
      expect(response.body.newEmail).toBe(newEmail);

      // Verify code was saved in database
      const [codes] = await db.execute(
        'SELECT * FROM email_change_codes WHERE user_id = ? AND new_email = ?',
        [userId, newEmail]
      );

      expect(codes.length).toBe(1);
      expect(codes[0].used).toBe(0);
      verificationCode = codes[0].verification_code;
    });

    test('Step 2: Verify code and complete email change', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email-change')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: verificationCode,
          firstName: testUser.firstName,
          lastName: testUser.lastName
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Email changed successfully');
      expect(response.body.newEmail).toBe(newEmail);

      // Verify user email was updated
      const [users] = await db.execute(
        'SELECT email, email_verified FROM users WHERE id = ?',
        [userId]
      );

      expect(users[0].email).toBe(newEmail);
      expect(users[0].email_verified).toBe(1);

      // Verify code was marked as used
      const [codes] = await db.execute(
        'SELECT used FROM email_change_codes WHERE verification_code = ?',
        [verificationCode]
      );

      expect(codes[0].used).toBe(1);
    });
  });

  describe('Error Handling', () => {
    test('Should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/request-email-change')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newEmail: 'another@test-example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Incorrect password');
    });

    test('Should reject duplicate email', async () => {
      // Create another user first
      await request(app)
        .post('/api/auth/register')
        .send({
          firstName: 'Another',
          lastName: 'User',
          email: 'existing@test-example.com',
          password: 'TestPass123!',
          yearLevel: 'G12'
        });

      const response = await request(app)
        .post('/api/auth/request-email-change')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newEmail: 'existing@test-example.com',
          password: testUser.password
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email already in use');
    });

    test('Should reject invalid verification code', async () => {
      const response = await request(app)
        .post('/api/auth/verify-email-change')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: '999999',
          firstName: testUser.firstName,
          lastName: testUser.lastName
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired code');
    });

    test('Should reject expired verification code', async () => {
      // Create expired code
      const expiredCode = '123456';
      const expiredTime = new Date(Date.now() - 60000); // 1 minute ago

      await db.execute(
        'INSERT INTO email_change_codes (user_id, new_email, verification_code, expires_at) VALUES (?, ?, ?, ?)',
        [userId, 'expired@test-example.com', expiredCode, expiredTime]
      );

      const response = await request(app)
        .post('/api/auth/verify-email-change')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: expiredCode,
          firstName: testUser.firstName,
          lastName: testUser.lastName
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or expired code');
    });
  });

  describe('Security Tests', () => {
    test('Should require authentication', async () => {
      const response = await request(app)
        .post('/api/auth/request-email-change')
        .send({
          newEmail: 'test@example.com',
          password: 'password'
        });

      expect(response.status).toBe(401);
    });

    test('Should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/request-email-change')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newEmail: 'invalid-email',
          password: testUser.password
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Valid email required');
    });

    test('Should require password', async () => {
      const response = await request(app)
        .post('/api/auth/request-email-change')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newEmail: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Password required');
    });
  });

  describe('Performance Tests', () => {
    test('Should complete email change within acceptable time', async () => {
      const startTime = Date.now();

      // Request email change
      await request(app)
        .post('/api/auth/request-email-change')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          newEmail: 'performance@test-example.com',
          password: testUser.password
        });

      const requestTime = Date.now() - startTime;
      expect(requestTime).toBeLessThan(1000); // Should complete within 1 second

      // Get the code for verification
      const [codes] = await db.execute(
        'SELECT verification_code FROM email_change_codes WHERE user_id = ? AND new_email = ?',
        [userId, 'performance@test-example.com']
      );

      const verifyStartTime = Date.now();

      // Verify email change
      await request(app)
        .post('/api/auth/verify-email-change')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          code: codes[0].verification_code,
          firstName: testUser.firstName,
          lastName: testUser.lastName
        });

      const verifyTime = Date.now() - verifyStartTime;
      expect(verifyTime).toBeLessThan(500); // Should complete within 500ms
    });
  });
});