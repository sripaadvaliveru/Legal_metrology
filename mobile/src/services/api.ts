import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import type { AuthResponse, Business, Instrument, Application, Certificate, Appointment, Inspection, Notification, DashboardKPIs, InstrumentType, Assignment, Measurement, ChecklistTemplate } from '../types';

const PRODUCTION_URL = 'https://api.legalmetrology.gov.in/api';

function getBaseUrl(): string {
  const extra = Constants.expoConfig?.extra ?? Constants.manifest?.extra;
  if (extra?.apiBaseUrl) return extra.apiBaseUrl;

  const hostUri = Constants.expoConfig?.hostUri ?? (Constants.manifest as any)?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:8080/api`;
  }

  return PRODUCTION_URL;
}

const API_BASE = getBaseUrl();

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
  register: (data: any) => api.post<AuthResponse>('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const businessApi = {
  getMyBusiness: () => api.get<Business>('/business/me'),
};

export const instrumentTypeApi = {
  list: () => api.get<InstrumentType[]>('/instrument-types'),
};

export const instrumentApi = {
  listMy: () => api.get<Instrument[]>('/instruments/my'),
  get: (id: string) => api.get<Instrument>(`/instruments/${id}`),
  create: (data: any) => api.post<Instrument>('/instruments', data),
};

export const applicationApi = {
  list: () => api.get<Application[]>('/applications'),
  get: (id: string) => api.get<Application>(`/applications/${id}`),
  create: (data: any) => api.post<Application>('/applications', data),
  delete: (id: string) => api.delete(`/applications/${id}`),
  getByInstrument: (instrumentId: string) => api.get<Application[]>(`/applications/by-instrument/${instrumentId}`),
  getHistory: (id: string) => api.get<any[]>(`/applications/${id}/history`),
};

export const assignmentApi = {
  listMy: () => api.get<Assignment[]>('/assignments/my'),
  getByApplication: (applicationId: string) => api.get(`/assignments?applicationId=${applicationId}`),
};

export const appointmentApi = {
  listMy: () => api.get<Appointment[]>('/appointments/my'),
  get: (id: string) => api.get<Appointment>(`/appointments/${id}`),
  complete: (id: string) => api.patch<Appointment>(`/appointments/${id}/complete`),
};

export const inspectionApi = {
  listMy: () => api.get<Inspection[]>('/inspections/my'),
  create: (appointmentId: string) =>
    api.post<Inspection>('/inspections', { appointmentId }),
  get: (id: string) => api.get<Inspection>(`/inspections/${id}`),
  getPrevious: (id: string) => api.get<Inspection>(`/inspections/${id}/previous`),
  getMeasurements: (id: string) => api.get<Measurement[]>(`/inspections/${id}/measurements`),
  submit: (id: string, result: string, remarks?: string) =>
    api.post<Inspection>(`/inspections/${id}/submit`, { result, remarks }),
  recordMeasurements: (id: string, readings: any[], checklistId?: string) =>
    api.post(`/inspections/${id}/measurements`, { readings, checklistId }),
  updateGps: (id: string, latitude: number, longitude: number) =>
    api.post<Inspection>(`/inspections/${id}/gps`, { latitude, longitude }),
  addEvidence: (id: string, url: string) =>
    api.post<Inspection>(`/inspections/${id}/evidence`, { url }),
  uploadEvidence: (id: string, formData: FormData) =>
    api.post<Inspection>(`/inspections/${id}/upload-evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    }),
};

export const evidenceApi = {
  upload: (formData: FormData) =>
    api.post<{ url: string; filename: string }>('/evidence/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    }),
};

export const certificateApi = {
  listMy: () => api.get<Certificate[]>('/certificates/my'),
  get: (id: string) => api.get<Certificate>(`/certificates/${id}`),
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

export const checklistApi = {
  getByInstrumentType: (instrumentTypeId: string) => api.get<ChecklistTemplate[]>(`/checklist-templates?instrumentTypeId=${instrumentTypeId}`),
  get: (id: string) => api.get<ChecklistTemplate>(`/checklist-templates/${id}`),
};

export default api;
