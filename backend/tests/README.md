# PulseGen Backend Test Suite

This directory contains comprehensive tests for the PulseGen survey platform backend.

## Test Structure

```
tests/
├── setup.ts                    # Global test setup and utilities
├── fixtures/                   # Test data factories
│   ├── users.ts               # User fixtures
│   ├── surveys.ts             # Survey fixtures
│   ├── questions.ts           # Question fixtures
│   ├── responses.ts           # Response fixtures
│   └── index.ts               # Export all fixtures
├── unit/                      # Unit tests
│   ├── services/
│   │   ├── authService.test.ts
│   │   ├── surveyService.test.ts
│   │   ├── responseService.test.ts
│   │   ├── skipLogic.test.ts
│   │   └── quotaService.test.ts
│   ├── utils/
│   │   ├── validators.test.ts
│   │   ├── jwt.test.ts
│   │   └── password.test.ts
│   └── middleware/
│       ├── auth.test.ts
│       └── rateLimiter.test.ts
└── integration/               # Integration tests
    └── api/
        ├── auth.test.ts
        ├── surveys.test.ts
        ├── responses.test.ts
        └── quotas.test.ts
```

## Running Tests

### All Tests
```bash
npm test
```

### Unit Tests Only
```bash
npm test -- --testPathPattern=unit
```

### Integration Tests Only
```bash
npm test -- --testPathPattern=integration
```

### Watch Mode
```bash
npm test -- --watch
```

### Coverage Report
```bash
npm test -- --coverage
```

## Test Database Setup

Tests use a separate test database to avoid affecting development data.

### Environment Variables

Create a `.env.test` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pulsegen_test"
JWT_SECRET="test-secret-key"
JWT_REFRESH_SECRET="test-refresh-secret"
```

### Database Initialization

Before running tests for the first time:

```bash
# Create test database
createdb pulsegen_test

# Run migrations
DATABASE_URL="postgresql://user:password@localhost:5432/pulsegen_test" npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

## Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Cover all critical API endpoints
- **E2E Tests**: Cover main user workflows

## Test Categories

### 1. Unit Tests

#### Authentication Service (`authService.test.ts`)
- ✅ User registration
- ✅ User login
- ✅ Token refresh
- ✅ Logout
- ✅ API key management
- ✅ Password hashing
- ✅ Inactive user handling

#### Survey Service (`surveyService.test.ts`)
- ✅ Survey creation
- ✅ Survey retrieval (all, by ID)
- ✅ Survey updates
- ✅ Survey deletion
- ✅ Survey publishing
- ✅ Survey duplication
- ✅ Theme and analytics initialization
- ✅ Slug generation

#### Response Service (`responseService.test.ts`)
- ✅ Response submission (anonymous & authenticated)
- ✅ Required question validation
- ✅ Email format validation
- ✅ Response source tracking
- ✅ Closed survey rejection
- ✅ Analytics updates
- ✅ Response retrieval and filtering
- ✅ Response deletion
- ✅ Export (CSV, JSON)
- ✅ Completion rate calculation
- ✅ Duration tracking

#### Skip Logic (`skipLogic.test.ts`)
- ✅ SKIP_LOGIC type rules
- ✅ BRANCHING type rules
- ✅ DISPLAY_LOGIC type rules
- ✅ Complex conditions (AND logic)
- ✅ Multiple operators (EQUALS, IN, LESS_THAN, BETWEEN, etc.)
- ✅ Cascading skip logic
- ✅ END_SURVEY action
- ✅ Circular dependency prevention

#### Quota Service (`quotaService.test.ts`)
- ✅ Quota creation
- ✅ Quota checking
- ✅ Quota count incrementing
- ✅ Quota status retrieval
- ✅ Multiple quota actions (TERMINATE, REDIRECT, SHOW_MESSAGE, ALLOW_CONTINUE)
- ✅ Quota enforcement during response submission
- ✅ Alert threshold triggering
- ✅ Quota deletion

### 2. Integration Tests

#### Auth API (`auth.test.ts`)
- ✅ POST /api/auth/register
  - Successful registration
  - Duplicate email handling
  - Email validation
  - Password validation
  - Missing field handling
- ✅ POST /api/auth/login
  - Successful login
  - Invalid credentials
  - Inactive user rejection
- ✅ POST /api/auth/refresh
  - Token refresh
  - Invalid token handling
- ✅ POST /api/auth/logout
  - Session termination
- ✅ GET /api/auth/me
  - User profile retrieval
  - Authentication requirement
- ✅ POST /api/auth/api-keys
  - API key creation
- ✅ DELETE /api/auth/api-keys/:keyId
  - API key revocation

#### Survey API (To be implemented)
- POST /api/surveys - Create survey
- GET /api/surveys - List surveys
- GET /api/surveys/:id - Get survey
- PUT /api/surveys/:id - Update survey
- DELETE /api/surveys/:id - Delete survey
- POST /api/surveys/:id/publish - Publish survey
- POST /api/surveys/:id/duplicate - Duplicate survey
- POST /api/surveys/:id/questions - Add question
- PUT /api/surveys/:id/questions/:questionId - Update question
- DELETE /api/surveys/:id/questions/:questionId - Delete question

#### Response API (To be implemented)
- POST /api/responses - Submit response
- GET /api/surveys/:id/responses - Get survey responses
- GET /api/responses/:id - Get response details
- DELETE /api/responses/:id - Delete response
- GET /api/surveys/:id/analytics - Get analytics
- GET /api/surveys/:id/export - Export responses

## Fixtures

Fixtures provide reusable test data factories:

### User Fixtures
```typescript
import { userFixtures } from '../fixtures';

const user = await userFixtures.createUser();
const admin = await userFixtures.createAdminUser();
const viewer = await userFixtures.createViewerUser();
const users = await userFixtures.createMultipleUsers(5);
```

### Survey Fixtures
```typescript
import { surveyFixtures } from '../fixtures';

const survey = await surveyFixtures.createSurvey(userId);
const activeSurvey = await surveyFixtures.createActiveSurvey(userId);
const privateSurvey = await surveyFixtures.createPrivateSurvey(userId);
const passwordProtected = await surveyFixtures.createPasswordProtectedSurvey(userId, 'password');
```

### Question Fixtures
```typescript
import { questionFixtures } from '../fixtures';

const question = await questionFixtures.createQuestion(surveyId);
const mcq = await questionFixtures.createMultipleChoiceQuestion(surveyId, ['A', 'B', 'C']);
const rating = await questionFixtures.createRatingScaleQuestion(surveyId, 1, 5);
const nps = await questionFixtures.createNPSQuestion(surveyId);
const allTypes = await questionFixtures.createAllQuestionTypes(surveyId);
```

### Response Fixtures
```typescript
import { responseFixtures } from '../fixtures';

const response = await responseFixtures.createResponse(surveyId);
const withAnswers = await responseFixtures.createResponseWithAnswers(surveyId, answers);
const authenticated = await responseFixtures.createAuthenticatedResponse(surveyId, userId);
const multiple = await responseFixtures.createMultipleResponses(surveyId, 10);
```

## Test Utilities

### From `setup.ts`:

```typescript
import { testUtils } from '../setup';

// Generate unique email
const email = testUtils.generateUniqueEmail();

// Generate random string
const str = testUtils.randomString(10);

// Sleep/delay
await testUtils.sleep(1000);
```

## Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` to set up test data
- Clean up in `afterEach` if necessary
- Don't rely on test execution order

### 2. Test Data
- Use fixtures for consistent test data
- Generate unique values to avoid conflicts
- Clean database between tests

### 3. Assertions
- Be specific with expectations
- Test both success and failure cases
- Verify database state changes
- Check response formats

### 4. Mocking
- Mock external services (email, AI providers)
- Don't mock database (use test database)
- Mock time-dependent functions if needed

### 5. Test Naming
- Use descriptive test names
- Follow pattern: "should [expected behavior] when [condition]"
- Group related tests with `describe` blocks

## Common Test Patterns

### Testing API Endpoints
```typescript
it('should create survey successfully', async () => {
  const response = await request(app)
    .post('/api/surveys')
    .set('Authorization', `Bearer ${token}`)
    .send(surveyData)
    .expect(201);

  expect(response.body.success).toBe(true);
  expect(response.body.data).toHaveProperty('id');
});
```

### Testing Service Functions
```typescript
it('should validate required questions', async () => {
  const responseData = {
    surveyId: survey.id,
    answers: [/* missing required answer */],
  };

  await expect(
    ResponseService.submitResponse(responseData)
  ).rejects.toThrow(AppError);
});
```

### Testing Database Changes
```typescript
it('should delete survey and related data', async () => {
  await SurveyService.delete(survey.id, user.id);

  const deleted = await prisma.survey.findUnique({
    where: { id: survey.id },
  });

  expect(deleted).toBeNull();
});
```

## Debugging Tests

### Run Single Test File
```bash
npm test -- auth.test.ts
```

### Run Single Test
```bash
npm test -- -t "should register a new user"
```

### Verbose Output
```bash
npm test -- --verbose
```

### Debug Mode
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Continuous Integration

Tests run automatically on:
- Pull requests
- Commits to main branch
- Before deployment

### CI Configuration
See `.github/workflows/test.yml`

## Contributing

When adding new features:

1. Write tests first (TDD)
2. Ensure all tests pass
3. Maintain coverage above 80%
4. Update this README if adding new test categories
5. Document any new fixtures or utilities

## Troubleshooting

### Database Connection Errors
- Ensure test database exists
- Check DATABASE_URL in .env.test
- Verify database migrations are up to date

### Timeout Errors
- Increase Jest timeout in `jest.config.js`
- Check for unresolved promises
- Ensure proper cleanup in `afterEach`

### Flaky Tests
- Check for race conditions
- Ensure test isolation
- Avoid time-dependent assertions
- Use `await` consistently

## Future Test Additions

### To Be Implemented:
- [ ] Middleware unit tests
- [ ] Utility function tests
- [ ] Validation schema tests
- [ ] Survey API integration tests
- [ ] Response API integration tests
- [ ] Quota API integration tests
- [ ] Partial response tests
- [ ] File upload tests
- [ ] Email service tests (with mocking)
- [ ] AI service tests (with mocking)
- [ ] Analytics calculation tests
- [ ] Performance/load tests
- [ ] Security tests (XSS, SQL injection prevention)

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Prisma Testing Guide](https://www.prisma.io/docs/guides/testing)
- [Testing Best Practices](https://testingjavascript.com/)
