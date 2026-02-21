import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { ApiUser } from '../api/types';
import { setApiOnUnauthorized } from '../services/api';
import { authApi } from '../services/authApi';

interface AuthState {
  user: ApiUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; errors?: Record<string, string[]> }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Autenticação baseada em cookie httpOnly + Secure.
 * O token NUNCA é armazenado em JavaScript — fica apenas no cookie.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    isAdmin: false,
  });

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore network errors on logout
    }
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isAdmin: false,
    });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { user } = await authApi.me();
      setState((s) => ({
        ...s,
        user,
        isAdmin: user.role === 'admin',
      }));
    } catch {
      await logout();
    }
  }, [logout]);

  useEffect(() => {
    setApiOnUnauthorized(logout);
    return () => setApiOnUnauthorized(null);
  }, [logout]);

  // Ao montar: verificar se há sessão válida (cookie enviado automaticamente)
  useEffect(() => {
    authApi
      .me()
      .then(({ user }) => {
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          isAdmin: user.role === 'admin',
        });
      })
      .catch(() => {
        setState((s) => ({ ...s, isLoading: false }));
      });
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        await authApi.ensureCsrfCookie();
        const data = await authApi.login(email, password);
        const { user } = data;
        setState({
          user,
          isAuthenticated: true,
          isLoading: false,
          isAdmin: user.role === 'admin',
        });
        return { success: true };
      } catch (err: unknown) {
        const { ApiError } = await import('../services/api');
        if (err instanceof ApiError) {
          if (err.status === 401) {
            return { success: false, error: 'Credenciais inválidas.' };
          }
          if (err.status === 422 && err.errors) {
            return { success: false, errors: err.errors };
          }
          return { success: false, error: err.message };
        }
        return { success: false, error: 'Erro de conexão. Tente novamente.' };
      }
    },
    []
  );

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
