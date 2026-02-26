/**
 * API de pagamentos — GET /payments/{id} para polling
 * Documentação: API-INTEGRACAO-FRONTEND.md secção 3.3
 */
import type { ApiPayment } from '../api/types';
import { api } from './api';

export interface GetPaymentResponse {
  payment: ApiPayment;
}

export const paymentsApi = {
  /** Consulta status do pagamento (público — útil para polling) */
  get: (paymentId: string) =>
    api.get<GetPaymentResponse>(`/payments/${paymentId}`, { requiresAuth: false }),
};
