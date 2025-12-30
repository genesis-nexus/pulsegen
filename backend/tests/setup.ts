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
  const tables = [
    'Session',
    'ApiKey',
    'Answer',
    'Response',
    'PartialResponse',
    'QuotaResponse',
    'Quota',
    'SurveyLogic',
    'QuestionOption',
    'Question',
    'SurveyTheme',
    'SurveyAnalytics',
    'Survey',
    'WorkspaceMember',
    'Workspace',
    'User',
  ];

  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    } catch (error) {
      // Table might not exist or be empty
      console.warn(`Could not truncate ${table}:`, error);
    }
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
};
