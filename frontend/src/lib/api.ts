import axios from 'axios';
import type { IndustryPersona, AutomationConfig, AutomationResult, Participant } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refreshToken,
          }, {
            withCredentials: true,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;

          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ----- AI streaming -----

export interface AIGenerationEvent {
  type: 'status' | 'survey' | 'question' | 'done' | 'error';
  stage?: string;
  message?: string;
  title?: string;
  description?: string;
  questionCount?: number;
  index?: number;
  total?: number;
  question?: {
    type: string;
    text: string;
    isRequired?: boolean;
    options?: { text: string; value: string }[];
  };
}

/** Thrown when the streaming endpoint itself is unreachable (fall back to the plain POST). */
export class StreamUnavailableError extends Error {
  constructor(status?: number) {
    super(`Streaming endpoint unavailable${status ? ` (${status})` : ''}`);
    this.name = 'StreamUnavailableError';
  }
}

/**
 * POST-based server-sent-events client for AI survey generation.
 * Calls onEvent for each event as it arrives so the UI can render a live preview.
 */
export async function streamSurveyGeneration(
  body: { prompt: string; questionCount?: number; includeLogic?: boolean },
  onEvent: (event: AIGenerationEvent) => void,
  signal?: AbortSignal
): Promise<void> {
  const token = localStorage.getItem('accessToken');
  let response: globalThis.Response;
  try {
    response = await fetch(`${API_URL}/api/ai/generate-survey/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      body: JSON.stringify(body),
      signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new StreamUnavailableError();
  }

  if (!response.ok || !response.body) {
    throw new StreamUnavailableError(response.status);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE events are separated by blank lines
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';
    for (const rawEvent of events) {
      const dataLine = rawEvent
        .split('\n')
        .find((line) => line.startsWith('data: '));
      if (!dataLine) continue; // comments / keep-alives
      try {
        onEvent(JSON.parse(dataLine.slice(6)) as AIGenerationEvent);
      } catch {
        // Ignore malformed events
      }
    }
  }
}

// Automation API
export const automationApi = {
  getPersonas: async (): Promise<IndustryPersona[]> => {
    const response = await api.get('/automation/personas');
    return response.data.data || response.data;
  },

  getPersona: async (id: string): Promise<IndustryPersona> => {
    const response = await api.get(`/automation/personas/${id}`);
    return response.data.data || response.data;
  },

  runAutomation: async (config: AutomationConfig): Promise<AutomationResult> => {
    const response = await api.post('/automation/run', config);
    return response.data.data?.result || response.data.result || response.data;
  },

  getAutomationStatus: async (surveyId: string) => {
    const response = await api.get(`/automation/status/${surveyId}`);
    return response.data.data || response.data;
  },

};

// Participant API
export const participantApi = {
  getParticipants: async (surveyId: string, params?: any) => {
    const response = await api.get(`/surveys/${surveyId}/participants`, { params });
    return response.data;
  },

  addParticipant: async (surveyId: string, data: Partial<Participant>) => {
    const response = await api.post(`/surveys/${surveyId}/participants`, data);
    return response.data;
  },

  importParticipants: async (surveyId: string, file: File, options: any) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('options', JSON.stringify(options));

    const response = await api.post(`/surveys/${surveyId}/participants/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: options.onProgress,
    });
    return response.data;
  },

  sendInvitations: async (surveyId: string, data: any) => {
    const response = await api.post(`/surveys/${surveyId}/participants/invite`, data);
    return response.data;
  },

  sendReminders: async (surveyId: string, data: any) => {
    const response = await api.post(`/surveys/${surveyId}/participants/remind`, data);
    return response.data;
  },

  getStats: async (surveyId: string) => {
    const response = await api.get(`/surveys/${surveyId}/participants/stats`);
    return response.data;
  },
};

// Authenticated Progress API
export const authenticatedProgressApi = {
  save: async (
    surveyId: string,
    data: {
      answers: Record<string, any>;
      currentPageIndex: number;
      lastQuestionId?: string;
    }
  ) => {
    const response = await api.post('/partial-responses/save-authenticated', {
      surveyId,
      ...data,
    });
    return response.data;
  },

  get: async (surveyId: string) => {
    const response = await api.get(`/partial-responses/surveys/${surveyId}/progress`);
    return response.data.data;
  },

  linkAnonymous: async (resumeToken: string) => {
    const response = await api.post('/partial-responses/link-to-user', {
      resumeToken,
    });
    return response.data.data;
  },
};

export default api;
