import { http, HttpResponse, delay } from 'msw';

const API_URL = 'http://localhost:5001/api';

// Mock data factories
export const mockUser = (overrides = {}) => ({
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  role: 'MANAGER',
  isActive: true,
  emailVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const mockSurvey = (overrides = {}) => ({
  id: `survey-${Date.now()}`,
  title: 'Test Survey',
  description: 'A test survey',
  slug: `test-survey-${Date.now()}`,
  status: 'DRAFT',
  visibility: 'PUBLIC',
  isAnonymous: true,
  createdBy: 'user-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  questions: [],
  ...overrides,
});

export const mockQuestion = (overrides = {}) => ({
  id: `question-${Date.now()}`,
  text: 'Test Question',
  type: 'SHORT_TEXT',
  isRequired: false,
  order: 1,
  options: [],
  ...overrides,
});

export const mockResponse = (overrides = {}) => ({
  id: `response-${Date.now()}`,
  surveyId: 'survey-1',
  isComplete: true,
  source: 'direct',
  createdAt: new Date().toISOString(),
  answers: [],
  ...overrides,
});

// Auth handlers
export const authHandlers = [
  // Login
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    await delay(100);
    const body = await request.json() as { email: string; password: string };

    if (body.email === 'test@example.com' && body.password === 'password123') {
      return HttpResponse.json({
        success: true,
        data: {
          user: mockUser(),
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      });
    }

    return HttpResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  }),

  // Register
  http.post(`${API_URL}/auth/register`, async ({ request }) => {
    await delay(100);
    const body = await request.json() as { email: string; password: string; firstName?: string; lastName?: string };

    if (body.email === 'existing@example.com') {
      return HttpResponse.json(
        { success: false, error: 'User already exists' },
        { status: 409 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: {
        user: mockUser({
          email: body.email,
          firstName: body.firstName || null,
          lastName: body.lastName || null,
        }),
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      },
    }, { status: 201 });
  }),

  // Get current user
  http.get(`${API_URL}/auth/me`, async ({ request }) => {
    await delay(50);
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: mockUser(),
    });
  }),

  // Logout
  http.post(`${API_URL}/auth/logout`, async () => {
    await delay(50);
    return HttpResponse.json({ success: true });
  }),

  // Refresh token
  http.post(`${API_URL}/auth/refresh`, async ({ request }) => {
    await delay(50);
    const body = await request.json() as { refreshToken: string };

    if (body.refreshToken === 'mock-refresh-token') {
      return HttpResponse.json({
        success: true,
        data: {
          accessToken: 'new-mock-access-token',
          refreshToken: 'new-mock-refresh-token',
        },
      });
    }

    return HttpResponse.json(
      { success: false, error: 'Invalid refresh token' },
      { status: 401 }
    );
  }),
];

// Survey handlers
export const surveyHandlers = [
  // List surveys
  http.get(`${API_URL}/surveys`, async () => {
    await delay(100);
    return HttpResponse.json({
      success: true,
      data: [
        mockSurvey({ id: 'survey-1', title: 'Customer Feedback' }),
        mockSurvey({ id: 'survey-2', title: 'Employee Satisfaction', status: 'ACTIVE' }),
        mockSurvey({ id: 'survey-3', title: 'Product Research', status: 'CLOSED' }),
      ],
    });
  }),

  // Get single survey
  http.get(`${API_URL}/surveys/:id`, async ({ params }) => {
    await delay(50);
    const { id } = params;

    if (id === 'not-found') {
      return HttpResponse.json(
        { success: false, error: 'Survey not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: mockSurvey({
        id,
        questions: [
          mockQuestion({ id: 'q1', text: 'What is your name?', type: 'SHORT_TEXT' }),
          mockQuestion({ id: 'q2', text: 'Rate our service', type: 'RATING_SCALE' }),
        ],
      }),
    });
  }),

  // Create survey
  http.post(`${API_URL}/surveys`, async ({ request }) => {
    await delay(100);
    const body = await request.json() as { title: string; description?: string };

    return HttpResponse.json({
      success: true,
      data: mockSurvey({
        title: body.title,
        description: body.description,
      }),
    }, { status: 201 });
  }),

  // Update survey
  http.patch(`${API_URL}/surveys/:id`, async ({ params, request }) => {
    await delay(100);
    const { id } = params;
    const body = await request.json() as Record<string, unknown>;

    return HttpResponse.json({
      success: true,
      data: mockSurvey({ id, ...body }),
    });
  }),

  // Delete survey
  http.delete(`${API_URL}/surveys/:id`, async () => {
    await delay(100);
    return HttpResponse.json({ success: true });
  }),

  // Get survey by slug (public)
  http.get(`${API_URL}/public/surveys/:slug`, async ({ params }) => {
    await delay(50);
    const { slug } = params;

    return HttpResponse.json({
      success: true,
      data: mockSurvey({
        slug: slug as string,
        status: 'ACTIVE',
        questions: [
          mockQuestion({ id: 'q1', text: 'What is your name?', isRequired: true }),
          mockQuestion({ id: 'q2', text: 'Your email', type: 'EMAIL' }),
        ],
      }),
    });
  }),
];

// Response handlers
export const responseHandlers = [
  // Submit response
  http.post(`${API_URL}/responses`, async ({ request }) => {
    await delay(100);
    const body = await request.json() as { surveyId: string; answers: unknown[] };

    return HttpResponse.json({
      success: true,
      data: mockResponse({
        surveyId: body.surveyId,
        answers: body.answers,
      }),
    }, { status: 201 });
  }),

  // Get responses for survey
  http.get(`${API_URL}/surveys/:surveyId/responses`, async ({ params }) => {
    await delay(100);
    const { surveyId } = params;

    return HttpResponse.json({
      success: true,
      data: [
        mockResponse({ surveyId: surveyId as string, id: 'resp-1' }),
        mockResponse({ surveyId: surveyId as string, id: 'resp-2' }),
        mockResponse({ surveyId: surveyId as string, id: 'resp-3' }),
      ],
    });
  }),
];

// Question handlers
export const questionHandlers = [
  // Add question to survey
  http.post(`${API_URL}/surveys/:surveyId/questions`, async ({ request }) => {
    await delay(100);
    const body = await request.json() as { text: string; type: string };

    return HttpResponse.json({
      success: true,
      data: mockQuestion({
        text: body.text,
        type: body.type,
      }),
    }, { status: 201 });
  }),

  // Update question
  http.patch(`${API_URL}/questions/:id`, async ({ params, request }) => {
    await delay(100);
    const { id } = params;
    const body = await request.json() as Record<string, unknown>;

    return HttpResponse.json({
      success: true,
      data: mockQuestion({ id, ...body }),
    });
  }),

  // Delete question
  http.delete(`${API_URL}/questions/:id`, async () => {
    await delay(50);
    return HttpResponse.json({ success: true });
  }),
];

// Participant handlers
export const participantHandlers = [
  // Get participants
  http.get(`${API_URL}/surveys/:surveyId/participants`, async () => {
    await delay(100);
    return HttpResponse.json({
      success: true,
      data: [
        { id: 'p1', email: 'participant1@example.com', status: 'PENDING', invitedAt: new Date().toISOString() },
        { id: 'p2', email: 'participant2@example.com', status: 'COMPLETED', invitedAt: new Date().toISOString() },
        { id: 'p3', email: 'participant3@example.com', status: 'BOUNCED', invitedAt: new Date().toISOString() },
      ],
      pagination: { total: 3, page: 1, limit: 10 },
    });
  }),

  // Get participant stats
  http.get(`${API_URL}/surveys/:surveyId/participants/stats`, async () => {
    await delay(50);
    return HttpResponse.json({
      success: true,
      data: {
        total: 100,
        pending: 30,
        sent: 50,
        opened: 40,
        completed: 20,
        bounced: 5,
      },
    });
  }),
];

// Automation handlers
export const automationHandlers = [
  http.get(`${API_URL}/automation/personas`, async () => {
    await delay(100);
    return HttpResponse.json({
      success: true,
      data: [
        { id: 'persona-1', name: 'Healthcare', description: 'Healthcare industry persona' },
        { id: 'persona-2', name: 'Retail', description: 'Retail industry persona' },
      ],
    });
  }),

  http.post(`${API_URL}/automation/run`, async () => {
    await delay(200);
    return HttpResponse.json({
      success: true,
      data: {
        result: {
          success: true,
          responsesGenerated: 10,
        },
      },
    });
  }),
];

// Analytics handlers
export const analyticsHandlers = [
  http.get(`${API_URL}/surveys/:surveyId/analytics`, async () => {
    await delay(100);
    return HttpResponse.json({
      success: true,
      data: {
        totalResponses: 150,
        completionRate: 0.78,
        averageTime: 245,
        responsesByDay: [
          { date: '2024-01-01', count: 10 },
          { date: '2024-01-02', count: 15 },
          { date: '2024-01-03', count: 12 },
        ],
        questionStats: [],
      },
    });
  }),
];

// Combine all handlers
export const handlers = [
  ...authHandlers,
  ...surveyHandlers,
  ...responseHandlers,
  ...questionHandlers,
  ...participantHandlers,
  ...automationHandlers,
  ...analyticsHandlers,
];
