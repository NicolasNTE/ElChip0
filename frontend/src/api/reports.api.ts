import { client } from './client';
import type { PayrollReportResponse } from '../types';

export function getEmployeeAttendanceReport(employeeId: string, startDate: string, endDate: string) {
  return client.get(`/reports/attendance/${employeeId}`, { params: { startDate, endDate } });
}

export function getPayrollReport(startDate: string, endDate: string, companyId?: string) {
  return client.get<PayrollReportResponse>('/reports/payroll', {
    params: { startDate, endDate, companyId },
  });
}

export function downloadPayrollCsv(startDate: string, endDate: string, companyId?: string) {
  return client.get('/reports/payroll/csv', {
    params: { startDate, endDate, companyId },
    responseType: 'blob',
  });
}

export function getPendingJustificationsReport() {
  return client.get('/reports/justifications/pending');
}

export function getCompanyReport(companyId: string, startDate: string, endDate: string) {
  return client.get(`/reports/company/${companyId}`, { params: { startDate, endDate } });
}
