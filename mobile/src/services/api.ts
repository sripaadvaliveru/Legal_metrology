import axios from 'axios';
import type { AuthResponse } from '../types';

const API_BASE = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  // Token will be added from storage
  return config;
});

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
};

export const assignmentApi = {
  list: () => api.get('/assignments'),
};

export const inspectionApi = {
  create: (appointmentId: string) =>
    api.post('/inspections', { appointmentId }),
  submit: (id: string, result: string, remarks?: string) =>
    api.post(`/inspections/${id}/submit`, { result, remarks }),
};

export default api;
