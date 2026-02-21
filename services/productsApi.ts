import type { ApiProduct } from '../api/types';
import type { PaginatedResponse } from './api';
import { api } from './api';

export const productsApi = {
  list: (page = 1) =>
    api.get<PaginatedResponse<ApiProduct>>(`/products?page=${page}`),

  get: (id: string) =>
    api.get<ApiProduct>(`/products/${id}`),

  create: (formData: FormData) =>
    api.post<ApiProduct>('/products', formData),

  update: (id: string, formData: FormData) => {
    formData.append('_method', 'PATCH');
    return api.post<ApiProduct>(`/products/${id}`, formData);
  },

  delete: (id: string) =>
    api.delete<void>(`/products/${id}`),

  /** Path para download do ficheiro (requer token; usar com fetch ou link + header) */
  getDownloadUrl: (id: string) => `/api/v1/products/${id}/download`,
};
