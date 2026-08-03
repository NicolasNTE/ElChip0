import { client } from './client';
import type { Employee } from '../types';

export interface EmployeeInput {
  firstName: string;
  lastName: string;
  employeeId: string;
  email?: string;
  phone?: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  companyId: string;
}

export function listEmployees(companyId?: string) {
  return client.get<Employee[]>('/employees', { params: companyId ? { companyId } : undefined });
}

export function getEmployee(id: string) {
  return client.get<Employee>(`/employees/${id}`);
}

export function createEmployee(input: EmployeeInput) {
  return client.post<Employee>('/employees', input);
}

export function updateEmployee(id: string, input: Partial<EmployeeInput>) {
  return client.patch<Employee>(`/employees/${id}`, input);
}

export function removeEmployee(id: string) {
  return client.delete<{ message: string }>(`/employees/${id}`);
}
