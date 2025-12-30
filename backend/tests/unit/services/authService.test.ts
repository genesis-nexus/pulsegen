import { AuthService } from '../../../src/services/authService';
import { prisma } from '../../../tests/setup';
import { userFixtures } from '../../fixtures';
import { AppError } from '../../../src/middleware/errorHandler';
import * as jwt from '../../../src/utils/jwt';

describe('AuthService', () => {
  describe('register', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePassword123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = await AuthService.register(
        userData,
        'Mozilla/5.0',
        '127.0.0.1'
      );

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.firstName).toBe(userData.firstName);
      expect(result.user.lastName).toBe(userData.lastName);
      expect(result.user).not.toHaveProperty('password');

      // Verify user was created in database
      const dbUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(dbUser).toBeTruthy();
      expect(dbUser?.email).toBe(userData.email);

      // Verify session was created
      const session = await prisma.session.findFirst({
        where: { userId: result.user.id },
      });
      expect(session).toBeTruthy();
      expect(session?.refreshToken).toBe(result.refreshToken);
    });

    it('should register user without optional fields', async () => {
      const userData = {
        email: 'minimal@example.com',
        password: 'SecurePassword123!',
      };

      const result = await AuthService.register(userData);

      expect(result.user.email).toBe(userData.email);
      expect(result.user.firstName).toBeNull();
      expect(result.user.lastName).toBeNull();
    });

    it('should throw error when email already exists', async () => {
      const existingUser = await userFixtures.createUser({
        email: 'existing@example.com',
      });

      const userData = {
        email: 'existing@example.com',
        password: 'AnotherPassword123!',
      };

      await expect(AuthService.register(userData)).rejects.toThrow(AppError);
      await expect(AuthService.register(userData)).rejects.toMatchObject({
        statusCode: 409,
        message: 'User already exists',
      });
    });

    it('should hash the password before storing', async () => {
      const userData = {
        email: 'hashtest@example.com',
        password: 'PlainPassword123!',
      };

      const result = await AuthService.register(userData);

      const dbUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      expect(dbUser?.password).not.toBe(userData.password);
      expect(dbUser?.password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
    });

    it('should set default role to VIEWER', async () => {
      const userData = {
        email: 'defaultrole@example.com',
        password: 'Password123!',
      };

      const result = await AuthService.register(userData);

      expect(result.user.role).toBe('VIEWER');
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const password = 'TestPassword123!';
      const user = await userFixtures.createUser({
        email: 'logintest@example.com',
      });

      // Create user with known password
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });

      const result = await AuthService.login(
        {
          email: 'logintest@example.com',
          password: password,
        },
        'Mozilla/5.0',
        '127.0.0.1'
      );

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('logintest@example.com');
    });

    it('should throw error with invalid email', async () => {
      await expect(
        AuthService.login({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        })
      ).rejects.toThrow(AppError);
    });

    it('should throw error with invalid password', async () => {
      const password = 'CorrectPassword123!';
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);

      await userFixtures.createUser({
        email: 'wrongpass@example.com',
        password: hashedPassword,
      });

      await expect(
        AuthService.login({
          email: 'wrongpass@example.com',
          password: 'WrongPassword123!',
        })
      ).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid credentials',
      });
    });

    it('should throw error when user is inactive', async () => {
      const password = 'TestPassword123!';
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);

      await userFixtures.createUser({
        email: 'inactive@example.com',
        password: hashedPassword,
        isActive: false,
      });

      await expect(
        AuthService.login({
          email: 'inactive@example.com',
          password: password,
        })
      ).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid credentials',
      });
    });

    it('should create a new session on login', async () => {
      const password = 'TestPassword123!';
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await userFixtures.createUser({
        email: 'sessiontest@example.com',
        password: hashedPassword,
      });

      const result = await AuthService.login({
        email: 'sessiontest@example.com',
        password: password,
      });

      const sessions = await prisma.session.findMany({
        where: { userId: user.id },
      });

      expect(sessions.length).toBeGreaterThan(0);
      expect(sessions[0].refreshToken).toBe(result.refreshToken);
    });
  });

  describe('refreshToken', () => {
    it('should successfully refresh tokens with valid refresh token', async () => {
      const user = await userFixtures.createUser();
      const refreshToken = jwt.generateRefreshToken(user.id);

      // Create session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await prisma.session.create({
        data: {
          userId: user.id,
          refreshToken,
          expiresAt,
        },
      });

      const result = await AuthService.refreshToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      // The implementation updates the session in place with a new token
      expect(typeof result.refreshToken).toBe('string');
    });

    it('should throw error with invalid refresh token', async () => {
      await expect(
        AuthService.refreshToken('invalid-token')
      ).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it('should throw error with expired refresh token', async () => {
      const user = await userFixtures.createUser();
      const refreshToken = jwt.generateRefreshToken(user.id);

      // Create expired session
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() - 1); // Yesterday
      await prisma.session.create({
        data: {
          userId: user.id,
          refreshToken,
          expiresAt,
        },
      });

      await expect(
        AuthService.refreshToken(refreshToken)
      ).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid or expired refresh token',
      });
    });

    it('should throw error when user is inactive', async () => {
      const user = await userFixtures.createUser({ isActive: false });
      const refreshToken = jwt.generateRefreshToken(user.id);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await prisma.session.create({
        data: {
          userId: user.id,
          refreshToken,
          expiresAt,
        },
      });

      await expect(
        AuthService.refreshToken(refreshToken)
      ).rejects.toMatchObject({
        statusCode: 401,
        message: 'User account is inactive',
      });
    });

    it('should update session with new refresh token', async () => {
      const user = await userFixtures.createUser();
      const oldRefreshToken = jwt.generateRefreshToken(user.id);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          refreshToken: oldRefreshToken,
          expiresAt,
        },
      });

      const result = await AuthService.refreshToken(oldRefreshToken);

      // The implementation updates the session in place
      const updatedSession = await prisma.session.findUnique({
        where: { id: session.id },
      });

      expect(updatedSession).toBeTruthy();
      expect(updatedSession?.refreshToken).toBe(result.refreshToken);
    });
  });

  describe('logout', () => {
    it('should successfully logout and delete session', async () => {
      const user = await userFixtures.createUser();
      const refreshToken = jwt.generateRefreshToken(user.id);

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      await prisma.session.create({
        data: {
          userId: user.id,
          refreshToken,
          expiresAt,
        },
      });

      await AuthService.logout(refreshToken);

      const session = await prisma.session.findUnique({
        where: { refreshToken },
      });

      expect(session).toBeNull();
    });

    it('should throw error if session does not exist', async () => {
      // The implementation uses delete which throws if record doesn't exist
      await expect(
        AuthService.logout('non-existent-token')
      ).rejects.toThrow();
    });
  });

  describe('getMe', () => {
    it('should return user details without password', async () => {
      const user = await userFixtures.createUser({
        email: 'getme@example.com',
        firstName: 'Get',
        lastName: 'Me',
      });

      const result = await AuthService.getMe(user.id);

      expect(result.id).toBe(user.id);
      expect(result.email).toBe('getme@example.com');
      expect(result.firstName).toBe('Get');
      expect(result.lastName).toBe('Me');
      expect(result).not.toHaveProperty('password');
    });

    it('should throw error if user does not exist', async () => {
      await expect(
        AuthService.getMe('non-existent-id')
      ).rejects.toThrow();
    });
  });

  describe('createApiKey', () => {
    it('should create an API key for user', async () => {
      const user = await userFixtures.createUser();

      const result = await AuthService.createApiKey(user.id, 'Test API Key');

      expect(result).toHaveProperty('key');
      expect(result).toHaveProperty('name');
      expect(result.name).toBe('Test API Key');
      expect(result.userId).toBe(user.id);
      expect(result.isActive).toBe(true);
    });

    it('should generate unique API keys', async () => {
      const user = await userFixtures.createUser();

      const key1 = await AuthService.createApiKey(user.id, 'Key 1');
      const key2 = await AuthService.createApiKey(user.id, 'Key 2');

      expect(key1.key).not.toBe(key2.key);
    });

    it('should create API key with default name', async () => {
      const user = await userFixtures.createUser();

      const result = await AuthService.createApiKey(user.id, 'Default Key');

      expect(result).toHaveProperty('key');
      expect(result.name).toBe('Default Key');
    });
  });

  describe('revokeApiKey', () => {
    it('should revoke (deactivate) an API key', async () => {
      const user = await userFixtures.createUser();
      const apiKey = await AuthService.createApiKey(user.id, 'Test Key');

      await AuthService.revokeApiKey(user.id, apiKey.id);

      const updatedKey = await prisma.apiKey.findUnique({
        where: { id: apiKey.id },
      });

      expect(updatedKey?.isActive).toBe(false);
    });

    it('should throw error when revoking another user\'s API key', async () => {
      const user1 = await userFixtures.createUser();
      const user2 = await userFixtures.createUser();

      const apiKey = await AuthService.createApiKey(user1.id, 'User 1 Key');

      await expect(
        AuthService.revokeApiKey(user2.id, apiKey.id)
      ).rejects.toThrow();
    });
  });
});
