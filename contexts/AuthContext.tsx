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

/** Helpers de permissão por role (doc API 2.2) */
interface PermissionHelpers {
  canEditProducts: boolean;
  canViewOrders: boolean;
  canManageTeam: boolean;
  canManageCustomers: boolean;
  canViewCustomers: boolean;
  canViewProducts: boolean;
}

interface AuthContextValue extends AuthState, PermissionHelpers {
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
          // 401: mensagens da API — "Email não encontrado ou inválido.", "Password incorreta."
          if (err.status === 401) {
            return {
              success: false,
              error: err.message,
              errors: err.errors,
            };
          }
          // 422: validação — "O email é obrigatório.", etc.
          if (err.status === 422) {
            return {
              success: false,
              error: err.message,
              errors: err.errors,
            };
          }
          // 429: rate limit — "Muitas tentativas. Aguarde antes de tentar novamente."
          if (err.status === 429) {
            return { success: false, error: err.message };
          }
          return { success: false, error: err.message };
        }
        return { success: false, error: 'Erro de conexão. Tente novamente.' };
      }
    },
    []
  );

  const role = state.user?.role;
  const permissionHelpers: PermissionHelpers = {
    canEditProducts: role === 'admin' || role === 'editor',
    canViewOrders: role === 'admin',
    canManageTeam: role === 'admin',
    canManageCustomers: role === 'admin',
    canViewCustomers: role === 'admin' || role === 'editor' || role === 'viewer',
    canViewProducts: role === 'admin' || role === 'editor' || role === 'viewer',
  };

  const value: AuthContextValue = {
    ...state,
    ...permissionHelpers,
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
