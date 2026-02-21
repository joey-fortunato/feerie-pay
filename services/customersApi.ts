import type {
  ApiCustomer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
} from '../api/types';
import type { PaginatedResponse } from './api';
import { api } from './api';

/** Resposta do PATCH /customers/{id} — pode vir { message, data } ou só o objeto */
interface UpdateCustomerResponse {
  message?: string;
  data?: ApiCustomer;
}

export const customersApi = {
  list: (page = 1, perPage = 10) =>
    api.get<PaginatedResponse<ApiCustomer>>(`/customers?page=${page}&per_page=${perPage}`),

  get: (id: string) =>
    api.get<ApiCustomer>(`/customers/${id}`),

  create: (data: CreateCustomerRequest) =>
    api.post<ApiCustomer>('/customers', data as Record<string, unknown>),

  update: async (id: string, data: UpdateCustomerRequest): Promise<ApiCustomer> => {
    const res = await api.patch<ApiCustomer | UpdateCustomerResponse>(`/customers/${id}`, data as Record<string, unknown>);
    return (res as UpdateCustomerResponse).data ?? (res as ApiCustomer);
  },

  /** DELETE retorna 200 com { message } ou 204 sem corpo */
  delete: (id: string) =>
    api.delete<{ message?: string } | void>(`/customers/${id}`),
};
