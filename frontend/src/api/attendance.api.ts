import { client } from './client';
import type { AttendanceRecord, ImportResult } from '../types';

export function importExcel(file: File) {
  const form = new FormData();
  form.append('file', file);
  return client.post<ImportResult>('/attendance/import', form);
}

export function getAttendanceByEmployee(employeeId: string, startDate?: string, endDate?: string) {
  return client.get<AttendanceRecord[]>(`/attendance/employee/${employeeId}`, {
    params: { startDate, endDate },
  });
}

export function getAttendanceByCompany(companyId: string, startDate: string, endDate: string) {
  return client.get<AttendanceRecord[]>(`/attendance/company/${companyId}`, {
    params: { startDate, endDate },
  });
}

export function getAttendanceByDateRange(startDate: string, endDate: string) {
  return client.get<AttendanceRecord[]>('/attendance', {
    params: { startDate, endDate },
  });
}
