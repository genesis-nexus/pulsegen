import request from 'supertest';
import express, { Application } from 'express';
import authRoutes from '../../../src/routes/authRoutes';
import { errorHandler } from '../../../src/middleware/errorHandler';
import { prisma } from '../../setup';
import { userFixtures } from '../../fixtures';

// Create test app
const createTestApp = (): Application => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
  return app;
};

describe('Auth API Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'SecurePass123!',
        firstName: 'Test',
        lastName: 'User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should return 409 when email already exists', async () => {
      const existingUser = await userFixtures.createUser({
        email: 'existing@test.com',
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@test.com',
          password: 'Password123!',
        })
        .expect(409);

      expect(response.body.success).toBeFalsy();
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
        })
        .expect(400);

      expect(response.body.success).toBeFalsy();
    });

    it('should validate password requirements', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123', // Too short
        })
        .expect(400);

      expect(response.body.success).toBeFalsy();
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          // Missing password
        })
        .expect(400);

      expect(response.body.success).toBeFalsy();
    });
  });

  describe('POST /api/auth/login', () => {
    const password = 'TestPassword123!';

    it('should login successfully with correct credentials', async () => {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);
      const uniqueEmail = `login-success-${Date.now()}@test.com`;
      await userFixtures.createUser({
        email: uniqueEmail,
        password: hashedPassword,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: uniqueEmail,
          password: password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.user.email).toBe(uniqueEmail);
    });

    it('should return 401 with incorrect password', async () => {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);
      const uniqueEmail = `login-wrongpass-${Date.now()}@test.com`;
      await userFixtures.createUser({
        email: uniqueEmail,
        password: hashedPassword,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: uniqueEmail,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body.success).toBeFalsy();
    });

    it('should return 401 with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: password,
        })
        .expect(401);

      expect(response.body.success).toBeFalsy();
    });

    it('should not login inactive user', async () => {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);
      const uniqueEmail = `login-inactive-${Date.now()}@test.com`;
      await userFixtures.createUser({
        email: uniqueEmail,
        password: hashedPassword,
        isActive: false,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: uniqueEmail,
          password: password,
        })
        .expect(401);

      expect(response.body.success).toBeFalsy();
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token with valid refresh token', async () => {
      // First register/login to get tokens
      const uniqueEmail = `refresh-${Date.now()}@test.com`;
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: uniqueEmail,
          password: 'Password123!',
        });

      const { refreshToken } = registerResponse.body.data;

      // Now refresh
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      // The implementation updates the session in place with a new token
      expect(typeof response.body.data.refreshToken).toBe('string');
    });

    it('should return 400 when refresh token is missing', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body.success).toBeFalsy();
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      // First login
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await userFixtures.createUser({
        email: 'logout@test.com',
        password: hashedPassword,
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'logout@test.com',
          password: 'Password123!',
        });

      const { accessToken, refreshToken } = loginResponse.body.data;

      // Now logout
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify session is deleted
      const session = await prisma.session.findUnique({
        where: { refreshToken },
      });
      expect(session).toBeNull();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken: 'some-token' })
        .expect(401);

      expect(response.body.success).toBeFalsy();
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user information', async () => {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await userFixtures.createUser({
        email: 'me@test.com',
        password: hashedPassword,
        firstName: 'Current',
        lastName: 'User',
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'me@test.com',
          password: 'Password123!',
        });

      const { accessToken } = loginResponse.body.data;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('me@test.com');
      expect(response.body.data.firstName).toBe('Current');
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body.success).toBeFalsy();
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBeFalsy();
    });
  });

  describe('POST /api/auth/api-keys', () => {
    it('should create an API key for authenticated user', async () => {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      await userFixtures.createUser({
        email: 'apikey@test.com',
        password: hashedPassword,
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'apikey@test.com',
          password: 'Password123!',
        });

      const { accessToken } = loginResponse.body.data;

      const response = await request(app)
        .post('/api/auth/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Test API Key' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('key');
      expect(response.body.data.name).toBe('Test API Key');
      expect(response.body.data.isActive).toBe(true);
    });

    it('should require authentication to create API key', async () => {
      const response = await request(app)
        .post('/api/auth/api-keys')
        .send({ name: 'Test Key' })
        .expect(401);

      expect(response.body.success).toBeFalsy();
    });
  });

  describe('DELETE /api/auth/api-keys/:keyId', () => {
    it('should revoke (delete) an API key', async () => {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const user = await userFixtures.createUser({
        email: 'revokekey@test.com',
        password: hashedPassword,
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'revokekey@test.com',
          password: 'Password123!',
        });

      const { accessToken } = loginResponse.body.data;

      // Create API key
      const createResponse = await request(app)
        .post('/api/auth/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ name: 'Key to Revoke' });

      const apiKeyId = createResponse.body.data.id;

      // Revoke it
      const response = await request(app)
        .delete(`/api/auth/api-keys/${apiKeyId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify it's deactivated
      const apiKey = await prisma.apiKey.findUnique({
        where: { id: apiKeyId },
      });
      expect(apiKey?.isActive).toBe(false);
    });
  });
});
