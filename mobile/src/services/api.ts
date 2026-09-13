import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthResponse } from '../types';

const API_BASE = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export const instrumentApi = {
  list: (page = 0, size = 20) => api.get(`/instruments?page=${page}&size=${size}`),
  get: (id: string) => api.get(`/instruments/${id}`),
  create: (data: any) => api.post('/instruments', data),
};

export const applicationApi = {
  list: () => api.get('/applications'),
  get: (id: string) => api.get(`/applications/${id}`),
  create: (data: any) => api.post('/applications', data),
};

export const assignmentApi = {
  list: () => api.get('/assignments'),
  getByApplication: (applicationId: string) => api.get(`/assignments?applicationId=${applicationId}`),
};

export const inspectionApi = {
  create: (appointmentId: string) =>
    api.post('/inspections', { appointmentId }),
  get: (id: string) => api.get(`/inspections/${id}`),
  submit: (id: string, result: string, remarks?: string) =>
    api.post(`/inspections/${id}/submit`, { result, remarks }),
  recordMeasurements: (id: string, readings: any[]) =>
    api.post(`/inspections/${id}/measurements`, { readings }),
  addEvidence: (id: string, url: string) =>
    api.post(`/inspections/${id}/evidence`, { url }),
  updateGps: (id: string, latitude: number, longitude: number) =>
    api.post(`/inspections/${id}/gps`, { latitude, longitude }),
};

export const certificateApi = {
  get: (id: string) => api.get(`/certificates/${id}`),
  getByNumber: (number: string) => api.get(`/certificates/by-number/${number}`),
  generate: (inspectionId: string) => api.post(`/certificates/generate/${inspectionId}`),
};

export const notificationApi = {
  list: () => api.get('/notifications'),
  unreadCount: () => api.get('/notifications/unread-count'),
};

export const publicApi = {
  verify: (token: string) => api.get(`/public/verify/${token}`),
};

export default api;
