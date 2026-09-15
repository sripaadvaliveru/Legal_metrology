export type Role = 'BUSINESS' | 'LMO' | 'GATC' | 'DISTRICT_OFFICER' | 'STATE_OFFICER' | 'SUPER_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  jurisdiction?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export type InstrumentStatus = 'REGISTERED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'EXPIRED' | 'REJECTED';

export interface Instrument {
  id: string;
  instrumentId: string;
  type: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  capacityRange?: string;
  status: InstrumentStatus;
  establishmentId: string;
}

export type ApplicationStatus =
  | 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED'
  | 'ASSIGNMENT_PENDING' | 'ASSIGNED' | 'SCHEDULED' | 'INSPECTION_PENDING'
  | 'UNDER_INSPECTION' | 'PASSED' | 'FAILED' | 'REINSPECTION_REQUIRED'
  | 'CERTIFICATE_GENERATED' | 'COMPLETED' | 'CANCELLED';

export type ApplicationType = 'INITIAL_VERIFICATION' | 'RE_VERIFICATION';

export interface Application {
  id: string;
  applicationNumber: string;
  instrumentId: string;
  type: ApplicationType;
  status: ApplicationStatus;
  submittedAt?: string;
}

export interface Assignment {
  id: string;
  applicationId: string;
  application?: Application;
  assigneeId: string;
  assignee?: User;
  method: 'AUTO' | 'MANUAL' | 'REASSIGNED';
  score?: number;
  reason?: string;
  assignedAt?: string;
}

export type CertificateStatus = 'VALID' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED';

export interface Certificate {
  id: string;
  certificateNumber: string;
  instrumentId: string;
  inspectionId: string;
  verificationDate: string;
  validUntil: string;
  status: CertificateStatus;
  qrToken: string;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface DashboardKPIs {
  totalInstruments: number;
  verifiedInstruments: number;
  pendingApplications: number;
  expiringSoon: number;
  expiredInstruments: number;
  failedInspections: number;
  compliancePercentage: number;
  totalBusinesses: number;
  totalLmos: number;
  totalCertificates: number;
  completedApplications: number;
  todayInspections: number;
  assignedInspections: number;
  overdueInspections: number;
  pendingTests: number;
  todayAppointments: number;
  completedTests: number;
  failedTests: number;
  recentActivity: RecentActivity[];
}

export interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: string;
  status: string;
}

export interface InstrumentType {
  id: string;
  name: string;
  description?: string;
  validityMonths: number;
}

export interface ChecklistTemplate {
  id: string;
  instrumentType?: InstrumentType;
  templateName: string;
  description?: string;
  checklistItems: string;
  version: number;
}
