export interface Company {
  id: string;
  name: string;
  ruc: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  phone: string | null;
  email: string | null;
  scheduledStartTime: string;
  scheduledEndTime: string;
  companyId: string;
  company?: Company;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AttendanceType = 'entrada' | 'salida';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employee?: Employee;
  timestamp: string;
  recordDate: string;
  type: AttendanceType;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

export type JustificationStatus = 'pendiente' | 'aprobada' | 'rechazada';

export interface JustificationPhoto {
  id: string;
  justificationId: string;
  fileName: string;
  filePath: string;
  mimeType: string | null;
  fileSize: number | null;
  createdAt: string;
}

export interface Justification {
  id: string;
  employeeId: string;
  employee?: Employee;
  justificationDate: string;
  description: string;
  status: JustificationStatus;
  rejectionReason: string | null;
  photos: JustificationPhoto[];
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JustificationStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  approvalRate: string | number;
}

export interface User {
  id: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export interface ImportResultRow {
  employeeId: string;
  timestamp?: string;
  status: 'success' | 'skipped' | 'error';
  message?: string;
}

export interface ImportResult {
  totalRecords: number;
  successCount: number;
  errorCount: number;
  results: ImportResultRow[];
}

export interface PayrollRow {
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    employeeId: string;
  };
  workDays: number;
  attendedDays: number;
  justifiedAbsenceDays: number;
  unjustifiedAbsenceDays: number;
  attendancePercentage: string;
}

export interface PayrollReportResponse {
  period: { startDate: string; endDate: string };
  totalEmployees: number;
  payrollData: PayrollRow[];
}
