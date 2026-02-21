import type {
  CreateOrderRequest,
  CreateOrderResponse,
  ApiOrder,
} from '../api/types';
import type { PaginatedResponse } from './api';
import { api } from './api';

export const ordersApi = {
  /** Criar encomenda (público — sem auth) */
  create: (data: CreateOrderRequest) =>
    api.post<CreateOrderResponse>('/orders', data, { requiresAuth: false }),

  /** Listar encomendas (admin) */
  list: (page = 1) =>
    api.get<PaginatedResponse<ApiOrder>>(`/orders?page=${page}`),
};
