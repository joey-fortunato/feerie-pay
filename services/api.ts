/**
 * Cliente API centralizado — Feerie Pay
 * Integração com Laravel API v1
 * Autenticação: cookie httpOnly + Secure (o token nunca é exposto ao JavaScript)
 */

/** Base URL da API. Em dev com proxy: use path relativo /api/v1 */
const env = (import.meta as unknown as { env?: Record<string, string> }).env;
const raw = env?.VITE_API_BASE_URL;
const API_BASE =
  typeof raw === 'string' && raw.startsWith('http') ? raw : '/api/v1';

/** Erro estruturado da API */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Opções de requisição */
export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  body?: Record<string, unknown> | FormData;
  /** Requer auth (default: true). Com cookie httpOnly, o browser envia automaticamente */
  requiresAuth?: boolean;
  /** Ignora logout automático em 401 */
  skipAuthRedirect?: boolean;
}

/** Resposta paginada da API Laravel */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    current_page: number;
    per_page: number;
    total: number;
    last_page?: number;
  };
}

/** Callback global para logout (injectado pelo AuthContext) */
let onUnauthorized: (() => void) | null = null;
export function setApiOnUnauthorized(callback: () => void) {
  onUnauthorized = callback;
}

/**
 * Executa requisição à API.
 * Usa credentials: 'include' para enviar o cookie httpOnly automaticamente.
 */
export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const {
    body,
    skipAuthRedirect = false,
    headers: customHeaders = {},
    method = 'GET',
    ...rest
  } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // Body: JSON ou FormData
  let finalBody: BodyInit | undefined;
  if (body) {
    if (body instanceof FormData) {
      finalBody = body;
      delete headers['Content-Type'];
    } else {
      headers['Content-Type'] = 'application/json';
      finalBody = JSON.stringify(body);
    }
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers,
    body: finalBody,
    credentials: 'include', // Envia o cookie httpOnly automaticamente
    ...rest,
  });

  // 401: token inválido ou credenciais incorretas (login)
  if (response.status === 401) {
    const data = await response.json().catch(() => ({}));
    const payload = data as { message?: string; errors?: Record<string, string[]> };
    const message = payload.message || 'Não autenticado.';
    // Só acionar logout em rotas que exigiam auth (não no login)
    if (!skipAuthRedirect && onUnauthorized && options.requiresAuth !== false) {
      onUnauthorized();
    }
    throw new ApiError(message, 401, undefined, payload.errors);
  }

  // 403: sem permissão
  if (response.status === 403) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      (data as { message?: string }).message || 'Não autorizado.',
      403
    );
  }

  // 404
  if (response.status === 404) {
    const data = await response.json().catch(() => ({}));
    throw new ApiError(
      (data as { message?: string }).message || 'Recurso não encontrado.',
      404
    );
  }

  // 422: validação
  if (response.status === 422) {
    const data = await response.json().catch(() => ({}));
    const payload = data as { message?: string; errors?: Record<string, string[]> };
    throw new ApiError(
      payload.message || 'Os dados enviados são inválidos.',
      422,
      'VALIDATION',
      payload.errors
    );
  }

  // Outros erros 4xx/5xx
  if (!response.ok) {
    const text = await response.text();
    let message = `Erro ${response.status}`;
    try {
      const parsed = JSON.parse(text) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {
      if (text) message = text;
    }
    throw new ApiError(message, response.status);
  }

  // 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

/** Helpers por método */
export const api = {
  get: <T>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, body?: Record<string, unknown> | FormData, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'POST', body }),
  put: <T>(endpoint: string, body?: Record<string, unknown> | FormData, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'PUT', body }),
  patch: <T>(endpoint: string, body?: Record<string, unknown> | FormData, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'PATCH', body }),
  delete: <T>(endpoint: string, options?: ApiRequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
