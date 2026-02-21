import type { ApiProduct } from '../api/types';
import type { PaginatedResponse } from './api';
import { api } from './api';

export const productsApi = {
  list: (page = 1, perPage = 10) =>
    api.get<PaginatedResponse<ApiProduct>>(`/products?page=${page}&per_page=${perPage}`),

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

  /** Faz download do ficheiro do produto (ebook/arquivo). Requer autenticação. */
  download: async (productId: string, productName?: string): Promise<void> => {
    const env = (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env;
    const base = typeof env?.VITE_API_BASE_URL === 'string' && env.VITE_API_BASE_URL.startsWith('http')
      ? env.VITE_API_BASE_URL.replace(/\/$/, '')
      : '';
    const url = base
      ? `${base}/api/v1/products/${productId}/download`
      : `/api/v1/products/${productId}/download`;
    const response = await fetch(url, {
      credentials: 'include',
    });
    if (!response.ok) throw new Error('Não foi possível fazer o download.');
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = productName || 'download';
    link.click();
    URL.revokeObjectURL(link.href);
  },
};
