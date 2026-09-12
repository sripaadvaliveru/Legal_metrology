export type Role = 'BUSINESS' | 'LMO' | 'GATC' | 'DISTRICT_OFFICER' | 'STATE_OFFICER' | 'SUPER_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface Assignment {
  id: string;
  applicationId: string;
  assigneeId: string;
  method: string;
  score?: number;
}

export interface Appointment {
  id: string;
  assignmentId: string;
  scheduledAt: string;
  location?: string;
  status: string;
}

export interface Instrument {
  id: string;
  instrumentId: string;
  type: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  capacityRange?: string;
  status: string;
}

export interface Inspection {
  id: string;
  appointmentId: string;
  result: string;
  remarks?: string;
  measurements: Measurement[];
}

export interface Measurement {
  parameter: string;
  observedValue: string;
  tolerance?: string;
  withinTolerance?: boolean;
}
