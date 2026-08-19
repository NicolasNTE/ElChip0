import { client } from './client';
import type { Justification, JustificationStatistics, JustificationStatus } from '../types';

export interface CreateJustificationInput {
  employeeId: string;
  justificationDate: string;
  description: string;
  photos: File[];
}

export function listJustifications(status?: JustificationStatus) {
  return client.get<Justification[]>('/justifications', { params: status ? { status } : undefined });
}

export function getJustificationStatistics() {
  return client.get<JustificationStatistics>('/justifications/statistics');
}

export function getJustificationsByEmployee(employeeId: string) {
  return client.get<Justification[]>(`/justifications/employee/${employeeId}`);
}

export function getJustification(id: string) {
  return client.get<Justification>(`/justifications/${id}`);
}

export function createJustification(input: CreateJustificationInput) {
  const form = new FormData();
  form.append('employeeId', input.employeeId);
  form.append('justificationDate', input.justificationDate);
  form.append('description', input.description);
  input.photos.forEach((file) => form.append('photos', file));
  return client.post<Justification>('/justifications', form);
}

export function approveJustification(id: string, reviewedBy: string) {
  return client.post<Justification>(`/justifications/${id}/approve`, { reviewedBy });
}

export function rejectJustification(id: string, rejectionReason: string, reviewedBy: string) {
  return client.post<Justification>(`/justifications/${id}/reject`, { rejectionReason, reviewedBy });
}

export function removeJustification(id: string) {
  return client.delete<{ message: string }>(`/justifications/${id}`);
}

export function addJustificationPhotos(id: string, photos: File[]) {
  const form = new FormData();
  photos.forEach((file) => form.append('photos', file));
  return client.post<Justification>(`/justifications/${id}/photos`, form);
}

export function removeJustificationPhoto(justificationId: string, photoId: string) {
  return client.delete<{ message: string }>(`/justifications/${justificationId}/photos/${photoId}`);
}
