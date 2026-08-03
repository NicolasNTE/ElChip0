import { client } from './client';
import type { Company } from '../types';

export interface CompanyInput {
  name: string;
  ruc?: string;
  address?: string;
}

export function listCompanies() {
  return client.get<Company[]>('/companies');
}

export function getCompany(id: string) {
  return client.get<Company>(`/companies/${id}`);
}

export function createCompany(input: CompanyInput) {
  return client.post<Company>('/companies', input);
}

export function updateCompany(id: string, input: Partial<CompanyInput>) {
  return client.patch<Company>(`/companies/${id}`, input);
}

export function removeCompany(id: string) {
  return client.delete<{ message: string }>(`/companies/${id}`);
}
