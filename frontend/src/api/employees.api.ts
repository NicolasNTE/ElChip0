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

// Optional fields with format validators (e.g. @IsEmail) reject '' on the backend,
// so blank inputs must be sent as omitted/undefined rather than empty strings.
function cleanOptionalStrings<T extends { email?: string; phone?: string }>(input: T): T {
  return {
    ...input,
    email: input.email || undefined,
    phone: input.phone || undefined,
  };
}

export function createEmployee(input: EmployeeInput) {
  return client.post<Employee>('/employees', cleanOptionalStrings(input));
}

export function updateEmployee(id: string, input: Partial<EmployeeInput>) {
  return client.patch<Employee>(`/employees/${id}`, cleanOptionalStrings(input));
}

export function removeEmployee(id: string) {
  return client.delete<{ message: string }>(`/employees/${id}`);
}
