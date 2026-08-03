import { client } from './client';
import type { LoginResponse } from '../types';

export function login(email: string, password: string) {
  return client.post<LoginResponse>('/auth/login', { email, password });
}
