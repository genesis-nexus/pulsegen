import axios from 'axios';
import type { IndustryPersona, AutomationConfig, AutomationResult, User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
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

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken } = response.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    return response.data;
  },

  register: async (email: string, password: string, firstName?: string, lastName?: string) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      firstName,
      lastName,
    });
    const { accessToken, refreshToken } = response.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Automation API
export const automationApi = {
  getPersonas: async (): Promise<IndustryPersona[]> => {
    const response = await api.get('/automation/personas');
    return response.data;
  },

  getPersona: async (id: string): Promise<IndustryPersona> => {
    const response = await api.get(`/automation/personas/${id}`);
    return response.data;
  },

  runAutomation: async (config: AutomationConfig): Promise<AutomationResult> => {
    const response = await api.post('/automation/run', config);
    return response.data.result;
  },

  getAutomationStatus: async (surveyId: string) => {
    const response = await api.get(`/automation/status/${surveyId}`);
    return response.data;
  },
};

// Surveys API
export const surveysApi = {
  getSurveys: async () => {
    const response = await api.get('/surveys');
    return response.data;
  },

  getSurvey: async (id: string) => {
    const response = await api.get(`/surveys/${id}`);
    return response.data;
  },

  getAnalytics: async (surveyId: string) => {
    const response = await api.get(`/analytics/surveys/${surveyId}`);
    return response.data;
  },
};

export default api;
