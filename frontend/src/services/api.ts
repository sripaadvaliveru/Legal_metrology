import axios from 'axios';
import type { AuthResponse, User, Instrument, Application, Assignment, Certificate, Notification, DashboardKPIs, InstrumentType, ChecklistTemplate } from '@/types';

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string; role: string }) =>
    api.post<User>('/auth/register', data),
  me: () => api.get<User>('/auth/me'),
};

// Instruments
export const instrumentApi = {
  list: (page = 0, size = 20) =>
    api.get<{ items: Instrument[]; total: number }>('/instruments', { params: { page, size } }),
  get: (id: string) => api.get<Instrument>(`/instruments/${id}`),
  create: (data: any) => api.post<Instrument>('/instruments', data),
};

// Applications
export const applicationApi = {
  list: () => api.get<Application[]>('/applications'),
  get: (id: string) => api.get<Application>(`/applications/${id}`),
  create: (data: any) => api.post<Application>('/applications', data),
};

// Assignments
export const assignmentApi = {
  autoAssign: (applicationId: string) =>
    api.post<Assignment>('/assignments/auto', { applicationId }),
  manualAssign: (applicationId: string, assigneeId: string) =>
    api.post<Assignment>('/assignments/manual', { applicationId, assigneeId }),
  reassign: (id: string, newAssigneeId: string, reason: string) =>
    api.post<Assignment>(`/assignments/${id}/reassign`, { newAssigneeId, reason }),
};

// Inspections
export const inspectionApi = {
  create: (appointmentId: string) =>
    api.post('/inspections', { appointmentId }),
  get: (id: string) => api.get(`/inspections/${id}`),
  submit: (id: string, result: string, remarks?: string) =>
    api.post(`/inspections/${id}/submit`, { result, remarks }),
};

// Certificates
export const certificateApi = {
  get: (id: string) => api.get<Certificate>(`/certificates/${id}`),
  revoke: (id: string, reason: string) =>
    api.post(`/certificates/${id}/revoke`, { reason }),
};

// Public Verification
export const publicApi = {
  verify: (token: string) => api.get(`/public/verify/${token}`),
};

// Notifications
export const notificationApi = {
  list: () => api.get<Notification[]>('/notifications'),
  unreadCount: () => api.get<{ count: number }>('/notifications/unread-count'),
};

// Analytics
export const analyticsApi = {
  dashboard: () => api.get<DashboardKPIs>('/analytics/dashboard'),
};

// Instrument Types
export const instrumentTypeApi = {
  list: () => api.get<InstrumentType[]>('/instrument-types'),
};

// Checklist Templates
export const checklistApi = {
  list: (instrumentTypeId?: string) =>
    api.get<ChecklistTemplate[]>('/checklist-templates', { params: instrumentTypeId ? { instrumentTypeId } : {} }),
  get: (id: string) => api.get<ChecklistTemplate>(`/checklist-templates/${id}`),
  create: (data: { instrumentTypeId: string; templateName: string; description: string; checklistItems: string }) =>
    api.post<ChecklistTemplate>('/checklist-templates', data),
  update: (id: string, data: { templateName: string; description: string; checklistItems: string }) =>
    api.put<ChecklistTemplate>(`/checklist-templates/${id}`, data),
  delete: (id: string) => api.delete(`/checklist-templates/${id}`),
};

export default api;
