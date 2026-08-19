import { createContext, useContext, useState, type ReactNode } from 'react';
import { authStore } from '../api/authStore';
import { login as loginRequest } from '../api/auth.api';
import type { User } from '../types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => authStore.getUser());

  const login = async (email: string, password: string) => {
    const response = await loginRequest(email, password);
    authStore.set(response.data.access_token, response.data.user);
    setUser(response.data.user);
  };

  const logout = () => {
    authStore.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
