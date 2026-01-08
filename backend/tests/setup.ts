import { PrismaClient } from '@prisma/client';

// Test database setup
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST || process.env.DATABASE_URL,
    },
  },
});

// Global test setup
beforeAll(async () => {
  // Note: Database migrations should be run BEFORE tests start
  // - In CI: The workflow runs `prisma migrate deploy` before `npm test`
  // - Locally: Run `npm run test:reset-db` for a fresh database or ensure migrations are applied

  // Clean database before all tests
  await cleanDatabase();
});

// Clean up after each test
afterEach(async () => {
  // Clean specific tables that might interfere with other tests
  await prisma.session.deleteMany({});
  await prisma.answer.deleteMany({});
  await prisma.response.deleteMany({});
});

// Global teardown
afterAll(async () => {
  await cleanDatabase();
  await prisma.$disconnect();
});

// Helper function to clean database
async function cleanDatabase() {
  // Use deleteMany in reverse dependency order to avoid foreign key issues
  // This is slower than TRUNCATE but safer and avoids deadlocks
  try {
    await prisma.$transaction([
      // Session & Auth related
      prisma.session.deleteMany({}),
      prisma.apiKey.deleteMany({}),

      // Response & Survey data
      prisma.answer.deleteMany({}),
      prisma.response.deleteMany({}),
      prisma.partialResponse.deleteMany({}),
      prisma.quotaResponse.deleteMany({}),
      prisma.quota.deleteMany({}),

      // Survey structure
      prisma.surveyLogic.deleteMany({}),
      prisma.questionOption.deleteMany({}),
      prisma.question.deleteMany({}),
      prisma.surveyTheme.deleteMany({}),
      prisma.surveyAnalytics.deleteMany({}),
      prisma.survey.deleteMany({}),

      // Workspace & Users
      prisma.workspaceMember.deleteMany({}),
      prisma.workspace.deleteMany({}),
      prisma.user.deleteMany({}),
    ]);
  } catch (error) {
    console.warn('Could not clean database:', error);
  }
}

// Export prisma instance for tests
export { prisma };

// Global test utilities
export const testUtils = {
  /**
   * Generate a unique email for testing
   */
  generateUniqueEmail: () => `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,

  /**
   * Generate a random string
   */
  randomString: (length: number = 10) => Math.random().toString(36).substring(2, length + 2),

  /**
   * Sleep for testing async operations
   */
  sleep: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Generate a JWT access token for testing
   */
  generateAccessToken: async (userId: string): Promise<string> => {
    const jwt = await import('../src/utils/jwt');
    return jwt.generateAccessToken(userId);
  },

  /**
   * Generate a JWT refresh token for testing
   */
  generateRefreshToken: async (userId: string): Promise<string> => {
    const jwt = await import('../src/utils/jwt');
    return jwt.generateRefreshToken(userId);
  },

  /**
   * Create an authorization header for authenticated requests
   */
  authHeader: async (userId: string): Promise<{ Authorization: string }> => {
    const token = await testUtils.generateAccessToken(userId);
    return { Authorization: `Bearer ${token}` };
  },
};
