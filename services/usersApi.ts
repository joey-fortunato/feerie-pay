import type { ApiUser, CreateUserRequest, UpdateUserRequest } from '../api/types';
import type { PaginatedResponse } from './api';
import { api } from './api';

/** Resposta do PATCH /users/{id} — pode vir { message, data } ou só o objeto */
interface UpdateUserResponse {
  message?: string;
  data?: ApiUser;
}

export const usersApi = {
  /** Listar usuários (admin) */
  list: (page = 1, perPage = 10) =>
    api.get<PaginatedResponse<ApiUser>>(`/users?page=${page}&per_page=${perPage}`),

  /** Obter um usuário específico */
  get: (id: string) =>
    api.get<ApiUser>(`/users/${id}`),

  /** Criar usuário (normaliza resposta) */
  create: async (data: CreateUserRequest): Promise<ApiUser> => {
    type CreateUserResponse = ApiUser | { message?: string; data?: ApiUser; user?: ApiUser };
    const res = await api.post<CreateUserResponse>('/users', data as Record<string, unknown>);
    if ((res as { data?: ApiUser }).data) return (res as { data: ApiUser }).data;
    if ((res as { user?: ApiUser }).user) return (res as { user: ApiUser }).user;
    return res as ApiUser;
  },

  /** Atualizar usuário (normaliza resposta) */
  update: async (id: string, data: UpdateUserRequest): Promise<ApiUser> => {
    const res = await api.patch<ApiUser | UpdateUserResponse>(`/users/${id}`, data as Record<string, unknown>);
    return (res as UpdateUserResponse).data ?? (res as ApiUser);
  },

  /** Apagar usuário */
  delete: (id: string) =>
    api.delete<{ message?: string } | void>(`/users/${id}`),
};
