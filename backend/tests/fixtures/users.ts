import { UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import { prisma } from '../setup';

export const userFixtures = {
  /**
   * Create a test user
   */
  createUser: async (overrides: any = {}) => {
    const defaultData = {
      email: `test-${Date.now()}@example.com`,
      password: await bcrypt.hash('password123', 10),
      firstName: 'Test',
      lastName: 'User',
      role: UserRole.MANAGER,
      isActive: true,
      emailVerified: true,
    };

    return await prisma.user.create({
      data: { ...defaultData, ...overrides },
    });
  },

  /**
   * Create an admin user
   */
  createAdminUser: async (overrides: any = {}) => {
    return await userFixtures.createUser({
      role: UserRole.ADMIN,
      firstName: 'Admin',
      lastName: 'User',
      ...overrides,
    });
  },

  /**
   * Create a viewer user
   */
  createViewerUser: async (overrides: any = {}) => {
    return await userFixtures.createUser({
      role: UserRole.VIEWER,
      firstName: 'Viewer',
      lastName: 'User',
      ...overrides,
    });
  },

  /**
   * Create multiple users
   */
  createMultipleUsers: async (count: number) => {
    const users = [];
    for (let i = 0; i < count; i++) {
      users.push(await userFixtures.createUser({
        email: `user${i}-${Date.now()}@example.com`,
        firstName: `User${i}`,
      }));
    }
    return users;
  },
};

export default userFixtures;
