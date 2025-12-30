# PulseGen Testing Guide

## Quick Start

This guide will help you run the comprehensive test suite for PulseGen.

## Prerequisites

1. **Node.js** (v20 or higher)
2. **PostgreSQL** (for test database)
3. **All dependencies installed**

```bash
# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
```

## Test Database Setup

### 1. Create Test Database

```bash
# Create PostgreSQL test database
createdb pulsegen_test
```

### 2. Set Environment Variables

Create `.env.test` in the backend directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pulsegen_test"
DATABASE_URL_TEST="postgresql://user:password@localhost:5432/pulsegen_test"
JWT_SECRET="test-jwt-secret-key-at-least-32-characters-long"
JWT_REFRESH_SECRET="test-refresh-secret-key-at-least-32-characters"
NODE_ENV="test"
```

### 3. Run Migrations

```bash
cd backend
DATABASE_URL="postgresql://user:password@localhost:5432/pulsegen_test" npx prisma migrate deploy
npx prisma generate
```

## Running Tests

### All Tests

```bash
# From project root
npm run test:all
```

This runs:
1. Backend unit tests
2. Backend integration tests
3. Frontend unit tests
4. E2E tests

### Backend Tests Only

```bash
# From project root
npm run test:backend

# Or from backend directory
cd backend
npm test
```

#### Specific Backend Test Types

```bash
cd backend

# Unit tests only
npm test -- --testPathPattern=unit

# Integration tests only
npm test -- --testPathPattern=integration

# Specific test file
npm test -- authService.test.ts

# Watch mode (re-runs on file changes)
npm test -- --watch

# Coverage report
npm test -- --coverage
```

### Frontend Tests Only

```bash
# From project root
npm run test:frontend

# Or from frontend directory
cd frontend
npm test
```

#### Specific Frontend Test Commands

```bash
cd frontend

# Run tests once
npm test

# Watch mode
npm run test:watch

# UI mode (interactive browser-based testing)
npm run test:ui

# Coverage report
npm run test:coverage
```

### E2E Tests Only

```bash
# From project root
npm run test:e2e
```

#### Specific E2E Test Commands

```bash
# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# UI mode (interactive test runner)
npm run test:e2e:ui

# Specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Mobile devices
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"

# Specific test file
npx playwright test e2e/tests/public-survey-creation.spec.ts

# Update snapshots
npx playwright test --update-snapshots
```

## Test Coverage

### View Coverage Reports

#### Backend Coverage

```bash
cd backend
npm test -- --coverage

# Open HTML report
open coverage/index.html
```

#### Frontend Coverage

```bash
cd frontend
npm run test:coverage

# Open HTML report
open coverage/index.html
```

## Test Structure

### Backend Tests

```
backend/tests/
├── setup.ts                    # Global test configuration
├── fixtures/                   # Test data factories
│   ├── users.ts
│   ├── surveys.ts
│   ├── questions.ts
│   └── responses.ts
├── unit/
│   └── services/
│       ├── authService.test.ts          # ~20 tests
│       ├── surveyService.test.ts        # ~18 tests
│       ├── responseService.test.ts      # ~25 tests
│       ├── skipLogic.test.ts            # ~15 tests
│       └── quotaService.test.ts         # ~20 tests
└── integration/
    └── api/
        └── auth.test.ts                 # ~20 tests
```

### Frontend Tests

```
frontend/src/
├── tests/
│   ├── setup.ts               # Test configuration
│   └── test-utils.tsx         # Testing utilities
└── components/
    └── *.test.tsx             # Component tests (to be added)
```

### E2E Tests

```
e2e/
├── tests/
│   └── public-survey-creation.spec.ts   # ~8 comprehensive scenarios
├── fixtures/
└── utils/
```

## What's Tested

### ✅ Backend (Completed)

**Unit Tests** (98 test cases):
- ✅ Authentication (register, login, logout, token refresh, API keys)
- ✅ Survey CRUD operations
- ✅ Response submission and validation
- ✅ Skip logic (all types and operators)
- ✅ Quota management (all actions)

**Integration Tests** (20 test cases):
- ✅ Auth API endpoints
- ✅ Request/response validation
- ✅ Error handling

### ✅ Frontend (Infrastructure Completed)

**Setup**:
- ✅ Vitest configuration
- ✅ Testing Library integration
- ✅ Test utilities and providers
- ✅ MSW setup for API mocking

**Tests to be added**:
- Component tests for all 24 question types
- Survey builder tests
- Survey taking flow tests
- Theme customization tests

### ✅ E2E (Core Flows Completed)

**Completed**:
- ✅ User registration → Survey creation → Publishing → Public survey taking
- ✅ All 24 question types
- ✅ Skip logic configuration and testing
- ✅ Anonymous survey completion
- ✅ Save and continue later
- ✅ Theme customization

**To be added**:
- Authenticated user survey flow
- Response management
- Analytics viewing
- Export functionality

## Continuous Integration

### GitHub Actions

The test suite runs automatically on:
- Pull requests
- Pushes to main branch
- Before deployments

See `.github/workflows/test.yml` (to be created)

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors

```bash
# Ensure database exists
createdb pulsegen_test

# Check connection
psql -d pulsegen_test -c "SELECT 1"

# Run migrations
cd backend
DATABASE_URL="your-test-db-url" npx prisma migrate deploy
```

#### 2. Test Timeouts

If tests timeout:
- Increase timeout in `jest.config.js`: `testTimeout: 30000`
- Check for unresolved promises
- Ensure database is responsive

#### 3. Port Already in Use (E2E)

```bash
# Kill processes on port 3000 and 5000
lsof -ti:3000 | xargs kill -9
lsof -ti:5000 | xargs kill -9
```

#### 4. Prisma Client Issues

```bash
cd backend
npx prisma generate
```

#### 5. Flaky E2E Tests

- Ensure servers are fully started before tests run
- Use `waitForURL` instead of fixed timeouts
- Clear browser storage between tests

### Debug Mode

#### Backend Tests

```bash
cd backend
node --inspect-brk node_modules/.bin/jest --runInBand
```

Then open `chrome://inspect` in Chrome.

#### Frontend Tests

```bash
cd frontend
npm run test:ui
```

#### E2E Tests

```bash
npm run test:e2e:debug
```

## Writing New Tests

### Backend Unit Test Example

```typescript
import { AuthService } from '../../../src/services/authService';
import { userFixtures } from '../../fixtures';

describe('AuthService', () => {
  it('should register a new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'SecurePass123!',
    };

    const result = await AuthService.register(userData);

    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('accessToken');
    expect(result.user.email).toBe(userData.email);
  });
});
```

### Frontend Component Test Example

```typescript
import { render, screen } from '@testing-library/react';
import { QuestionRenderer } from './QuestionRenderer';

describe('QuestionRenderer', () => {
  it('should render short text question', () => {
    render(
      <QuestionRenderer
        question={{ type: 'SHORT_TEXT', text: 'What is your name?' }}
      />
    );

    expect(screen.getByText('What is your name?')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('should create and publish survey', async ({ page }) => {
  await page.goto('/dashboard');
  await page.click('text=Create Survey');
  await page.fill('input[name="title"]', 'Test Survey');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/.*surveys.*/);
});
```

## Test Data

### Using Fixtures

```typescript
// Create test user
const user = await userFixtures.createUser();
const admin = await userFixtures.createAdminUser();

// Create test survey
const survey = await surveyFixtures.createSurvey(user.id);
const activeSurvey = await surveyFixtures.createActiveSurvey(user.id);

// Create test questions
const question = await questionFixtures.createQuestion(survey.id);
const mcq = await questionFixtures.createMultipleChoiceQuestion(
  survey.id,
  ['Option 1', 'Option 2', 'Option 3']
);

// Create test responses
const response = await responseFixtures.createResponse(survey.id);
const withAnswers = await responseFixtures.createResponseWithAnswers(
  survey.id,
  [{ questionId: question.id, value: 'Answer' }]
);
```

## Performance

### Test Execution Times

| Test Suite | Tests | Avg Time |
|------------|-------|----------|
| Backend Unit | ~98 | ~15s |
| Backend Integration | ~20 | ~10s |
| Frontend Unit | TBD | TBD |
| E2E (Chromium) | ~8 | ~60s |

### Optimization Tips

1. **Parallel Execution**: Jest and Playwright run tests in parallel by default
2. **Database**: Use transactions for faster cleanup
3. **Mocking**: Mock external services (email, AI)
4. **Fixtures**: Reuse test data where possible
5. **Selective Testing**: Run only affected tests during development

## Resources

- [Backend Test README](backend/tests/README.md)
- [Test Suite Documentation](TEST_SUITE_DOCUMENTATION.md)
- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)

## Getting Help

If you encounter issues:

1. Check this guide's troubleshooting section
2. Review test logs for specific errors
3. Check GitHub issues
4. Contact the development team

## Next Steps

1. Run the test suite to ensure everything works
2. Review existing tests to understand patterns
3. Add tests for new features
4. Maintain test coverage above 80%
5. Update documentation when adding new tests
