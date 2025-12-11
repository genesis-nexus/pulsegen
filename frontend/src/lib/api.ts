import axios from 'axios';
import type { IndustryPersona, AutomationConfig, AutomationResult } from '../types';

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

export default api;
