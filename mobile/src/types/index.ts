export type Role = 'BUSINESS' | 'LMO' | 'GATC' | 'DISTRICT_OFFICER' | 'STATE_OFFICER' | 'SUPER_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  jurisdiction?: string;
  businessId?: string;
  businessName?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface Establishment {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string;
  state: string;
}

export interface Business {
  businessId: string;
  businessName: string;
  registrationNumber: string;
  gstNumber: string;
  address: string;
  city: string;
  state: string;
  establishments: Establishment[];
}

export type InstrumentStatus = 'REGISTERED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'EXPIRED' | 'REJECTED';

export interface Instrument {
  id: string;
  instrumentId: string;
  instrumentType?: { id: string; name: string };
  manufacturer: string;
  model: string;
  serialNumber: string;
  capacityRange?: string;
  yearOfManufacture?: number;
  usage?: string;
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
  instrument?: Instrument;
  type: ApplicationType;
  status: ApplicationStatus;
  submittedAt?: string;
  createdAt?: string;
}

export interface ApplicationStatusHistory {
  id: string;
  applicationId: string;
  status: ApplicationStatus;
  actor: string;
  timestamp: string;
}

export type CertificateStatus = 'VALID' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED';

export interface Certificate {
  id: string;
  certificateNumber: string;
  instrumentId: string;
  instrument?: Instrument;
  inspectionId: string;
  verificationDate: string;
  validUntil: string;
  status: CertificateStatus;
  qrToken: string;
  issuedBy?: string;
}

export interface Appointment {
  id: string;
  applicationId: string;
  application?: Application;
  assignment?: Assignment;
  assignmentId: string;
  scheduledAt: string;
  location?: string;
  status: string;
  createdAt?: string;
}

export interface Inspection {
  id: string;
  appointment?: Appointment;
  inspector?: User;
  result: string;
  remarks?: string;
  measurements: Measurement[];
  evidenceUrls: string[];
  latitude?: number;
  longitude?: number;
  startedAt?: string;
  completedAt?: string;
  previousInspectionId?: string;
}

export interface Measurement {
  id?: string;
  parameter: string;
  observedValue: string;
  tolerance?: string;
  withinTolerance?: boolean;
  remarks?: string;
}

export interface Assignment {
  id: string;
  application?: Application;
  assignee?: User;
  method: string;
  score?: number;
  reason?: string;
  previousAssigneeId?: string;
  assignedAt: string;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  entityType?: string;
  entityId?: string;
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
