import type { ApiUser, CreateUserRequest, UpdateUserRequest } from '../api/types';
import { api } from './api';

export const usersApi = {
  create: (data: CreateUserRequest) =>
    api.post<{ message: string }>('/users', data),

  update: (id: string, data: UpdateUserRequest) =>
    api.patch<{ message: string; data: ApiUser }>(`/users/${id}`, data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/users/${id}`),
};
