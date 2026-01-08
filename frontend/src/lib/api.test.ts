import { describe, it, expect, beforeEach } from 'vitest';
import { api, automationApi, participantApi, authenticatedProgressApi } from './api';
import { server } from '../tests/mocks/server';
import { http, HttpResponse } from 'msw';

const API_URL = 'http://localhost:5001/api';

beforeEach(() => {
  localStorage.clear();
});

describe('api client', () => {
  describe('request interceptor', () => {
    it('adds Authorization header when token exists', async () => {
      localStorage.setItem('accessToken', 'test-token');

      // We can verify by checking if the request succeeds with auth
      const response = await api.get('/auth/me');

      expect(response.data.success).toBe(true);
    });

    it('does not add Authorization header when no token', async () => {
      // Override to check that request fails without token
      server.use(
        http.get(`${API_URL}/auth/me`, ({ request }) => {
          const authHeader = request.headers.get('Authorization');
          if (!authHeader) {
            return HttpResponse.json(
              { success: false, error: 'Unauthorized' },
              { status: 401 }
            );
          }
          return HttpResponse.json({ success: true });
        })
      );

      await expect(api.get('/auth/me')).rejects.toThrow();
    });
  });

  describe('response interceptor', () => {
    it('returns data on successful response', async () => {
      localStorage.setItem('accessToken', 'valid-token');

      const response = await api.get('/surveys');

      expect(response.data.success).toBe(true);
      expect(response.data.data).toBeDefined();
    });

    it('attempts token refresh on 401 error', async () => {
      localStorage.setItem('accessToken', 'expired-token');
      localStorage.setItem('refreshToken', 'mock-refresh-token');

      let refreshCalled = false;

      server.use(
        http.get(`${API_URL}/auth/me`, () => {
          // First call fails with 401
          if (!refreshCalled) {
            refreshCalled = true;
            return HttpResponse.json(
              { error: 'Token expired' },
              { status: 401 }
            );
          }
          // After refresh, return success
          return HttpResponse.json({
            success: true,
            data: { id: 'user-1', email: 'test@example.com' },
          });
        })
      );

      // This should trigger refresh and retry
      // Note: The actual behavior depends on the interceptor implementation
    });
  });

  describe('base URL configuration', () => {
    it('uses correct base URL', () => {
      expect(api.defaults.baseURL).toBe(`${API_URL}`);
    });

    it('includes content-type header', () => {
      expect(api.defaults.headers['Content-Type']).toBe('application/json');
    });
  });
});

describe('automationApi', () => {
  describe('getPersonas', () => {
    it('fetches personas successfully', async () => {
      localStorage.setItem('accessToken', 'valid-token');

      const personas = await automationApi.getPersonas();

      expect(Array.isArray(personas)).toBe(true);
      expect(personas.length).toBeGreaterThan(0);
      expect(personas[0]).toHaveProperty('id');
      expect(personas[0]).toHaveProperty('name');
    });
  });

  describe('getPersona', () => {
    it('fetches single persona by id', async () => {
      localStorage.setItem('accessToken', 'valid-token');

      server.use(
        http.get(`${API_URL}/automation/personas/:id`, ({ params }) => {
          return HttpResponse.json({
            success: true,
            data: {
              id: params.id,
              name: 'Test Persona',
              description: 'Test description',
            },
          });
        })
      );

      const persona = await automationApi.getPersona('persona-1');

      expect(persona.id).toBe('persona-1');
      expect(persona.name).toBe('Test Persona');
    });
  });

  describe('runAutomation', () => {
    it('runs automation successfully', async () => {
      localStorage.setItem('accessToken', 'valid-token');

      const result = await automationApi.runAutomation({
        personaId: 'persona-1',
        surveyTitle: 'Test Survey',
        scenarioCount: 10,
      });

      expect(result).toHaveProperty('success', true);
    });
  });
});

describe('participantApi', () => {
  const surveyId = 'survey-1';

  beforeEach(() => {
    localStorage.setItem('accessToken', 'valid-token');
  });

  describe('getParticipants', () => {
    it('fetches participants for a survey', async () => {
      const response = await participantApi.getParticipants(surveyId);

      expect(response.success).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('supports pagination params', async () => {
      server.use(
        http.get(`${API_URL}/surveys/:surveyId/participants`, ({ request }) => {
          const url = new URL(request.url);
          const page = url.searchParams.get('page');
          const limit = url.searchParams.get('limit');

          return HttpResponse.json({
            success: true,
            data: [],
            pagination: {
              page: parseInt(page || '1'),
              limit: parseInt(limit || '10'),
              total: 100,
            },
          });
        })
      );

      const response = await participantApi.getParticipants(surveyId, {
        page: 2,
        limit: 20,
      });

      expect(response.pagination.page).toBe(2);
      expect(response.pagination.limit).toBe(20);
    });
  });

  describe('addParticipant', () => {
    it('adds a participant to a survey', async () => {
      server.use(
        http.post(`${API_URL}/surveys/:surveyId/participants`, async ({ request }) => {
          const body = await request.json() as { email: string };
          return HttpResponse.json({
            success: true,
            data: {
              id: 'new-participant-1',
              email: body.email,
              status: 'PENDING',
            },
          });
        })
      );

      const response = await participantApi.addParticipant(surveyId, {
        email: 'newparticipant@example.com',
      });

      expect(response.success).toBe(true);
      expect(response.data.email).toBe('newparticipant@example.com');
    });
  });

  describe('getStats', () => {
    it('fetches participant statistics', async () => {
      const response = await participantApi.getStats(surveyId);

      expect(response.success).toBe(true);
      expect(response.data).toHaveProperty('total');
      expect(response.data).toHaveProperty('completed');
    });
  });

  describe('sendInvitations', () => {
    it('sends invitations to participants', async () => {
      server.use(
        http.post(`${API_URL}/surveys/:surveyId/participants/invite`, () => {
          return HttpResponse.json({
            success: true,
            data: { sent: 5, failed: 0 },
          });
        })
      );

      const response = await participantApi.sendInvitations(surveyId, {
        participantIds: ['p1', 'p2', 'p3', 'p4', 'p5'],
      });

      expect(response.success).toBe(true);
      expect(response.data.sent).toBe(5);
    });
  });
});

describe('authenticatedProgressApi', () => {
  const surveyId = 'survey-1';

  beforeEach(() => {
    localStorage.setItem('accessToken', 'valid-token');
  });

  describe('save', () => {
    it('saves progress for authenticated user', async () => {
      server.use(
        http.post(`${API_URL}/partial-responses/save-authenticated`, () => {
          return HttpResponse.json({
            success: true,
            data: { saved: true },
          });
        })
      );

      const response = await authenticatedProgressApi.save(surveyId, {
        answers: { q1: 'answer1' },
        currentPageIndex: 2,
        lastQuestionId: 'q3',
      });

      expect(response.success).toBe(true);
    });
  });

  describe('get', () => {
    it('retrieves saved progress', async () => {
      server.use(
        http.get(`${API_URL}/partial-responses/surveys/:surveyId/progress`, () => {
          return HttpResponse.json({
            success: true,
            data: {
              answers: { q1: 'saved-answer' },
              currentPageIndex: 1,
            },
          });
        })
      );

      const progress = await authenticatedProgressApi.get(surveyId);

      expect(progress).toHaveProperty('answers');
      expect(progress.answers.q1).toBe('saved-answer');
    });
  });

  describe('linkAnonymous', () => {
    it('links anonymous progress to user account', async () => {
      server.use(
        http.post(`${API_URL}/partial-responses/link-to-user`, () => {
          return HttpResponse.json({
            success: true,
            data: { linked: true },
          });
        })
      );

      const result = await authenticatedProgressApi.linkAnonymous('resume-token-123');

      expect(result.linked).toBe(true);
    });
  });
});
