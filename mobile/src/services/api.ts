import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthResponse, Business, Instrument, Application, Certificate, Appointment, Inspection, Notification, DashboardKPIs, InstrumentType } from '../types';

const API_BASE = 'http://192.168.1.8:8080/api';

let onAuthLogout: (() => void) | null = null;

export const setAuthLogoutHandler = (handler: (() => void) | null) => {
  onAuthLogout = handler;
};

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
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
      if (onAuthLogout) onAuthLogout();
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
};

export const businessApi = {
  getMyBusiness: () => api.get<Business>('/business/me'),
};

export const instrumentTypeApi = {
  list: () => api.get<InstrumentType[]>('/instrument-types'),
};

export const instrumentApi = {
  list: (page = 0, size = 20) => api.get(`/instruments?page=${page}&size=${size}`),
  listMy: () => api.get<Instrument[]>('/instruments/my'),
  get: (id: string) => api.get<Instrument>(`/instruments/${id}`),
  create: (data: any) => api.post<Instrument>('/instruments', data),
};

export const applicationApi = {
  list: () => api.get<Application[]>('/applications'),
  get: (id: string) => api.get<Application>(`/applications/${id}`),
  create: (data: any) => api.post<Application>('/applications', data),
};

export const assignmentApi = {
  list: () => api.get('/assignments'),
  getByApplication: (applicationId: string) => api.get(`/assignments?applicationId=${applicationId}`),
};

export const appointmentApi = {
  listMy: () => api.get<Appointment[]>('/appointments/my'),
  get: (id: string) => api.get<Appointment>(`/appointments/${id}`),
};

export const inspectionApi = {
  create: (appointmentId: string) =>
    api.post<Inspection>('/inspections', { appointmentId }),
  get: (id: string) => api.get<Inspection>(`/inspections/${id}`),
  submit: (id: string, result: string, remarks?: string) =>
    api.post<Inspection>(`/inspections/${id}/submit`, { result, remarks }),
  recordMeasurements: (id: string, readings: any[]) =>
    api.post(`/inspections/${id}/measurements`, { readings }),
  addEvidence: (id: string, url: string) =>
    api.post<Inspection>(`/inspections/${id}/evidence`, { url }),
  updateGps: (id: string, latitude: number, longitude: number) =>
    api.post<Inspection>(`/inspections/${id}/gps`, { latitude, longitude }),
};

export const certificateApi = {
  listMy: () => api.get<Certificate[]>('/certificates/my'),
  get: (id: string) => api.get<Certificate>(`/certificates/${id}`),
  getByNumber: (number: string) => api.get<Certificate>(`/certificates/by-number/${number}`),
  generate: (inspectionId: string) => api.post<Certificate>(`/certificates/generate/${inspectionId}`),
};

export const notificationApi = {
  list: () => api.get<Notification[]>('/notifications'),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
  markAsRead: (id: string) => api.put<Notification>(`/notifications/${id}/read`),
};

export const analyticsApi = {
  dashboard: () => api.get<DashboardKPIs>('/analytics/dashboard'),
};

export const publicApi = {
  verify: (token: string) => api.get(`/public/verify/${token}`),
};

export default api;
