import type { LoginResponse, MeResponse } from '../api/types';
import { api } from './api';

export const authApi = {
  /** Obtém o cookie CSRF do Laravel (chamar antes do login quando se usa cookies) */
  ensureCsrfCookie: async () => {
    const env = (import.meta as unknown as { env?: Record<string, string> }).env;
    const base = env?.VITE_API_BASE_URL;
    const url =
      typeof base === 'string' && base.startsWith('http')
        ? base.replace(/\/api\/v1\/?$/, '') + '/sanctum/csrf-cookie'
        : '/sanctum/csrf-cookie';
    await fetch(url, { credentials: 'include' });
  },

  login: (email: string, password: string) =>
    api.post<LoginResponse>('/login', { email, password }, { requiresAuth: false }),

  logout: () =>
    api.post<{ message: string }>('/logout', undefined, {
      requiresAuth: true,
      skipAuthRedirect: true, // Evita loop: 401 em /logout não deve acionar logout novamente
    }),

  me: () =>
    api.get<MeResponse>('/me'),

  forgotPassword: (email: string) =>
    api.post<{ message: string }>('/forgot-password', { email }, { requiresAuth: false }),

  resetPassword: (data: {
    token: string;
    email: string;
    password: string;
    password_confirmation: string;
  }) =>
    api.post<{ message: string }>('/password/reset', data, { requiresAuth: false }),
};
