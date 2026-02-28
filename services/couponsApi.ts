/**
 * API de cupons — Feerie Pay
 * GET /coupons (admin) e GET /coupons/validate (público, para preview no checkout)
 */

import type { PaginatedResponse } from './api';
import { api } from './api';

export interface ApiCoupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: string;
  usage_limit: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** Resposta de validação de cupom (endpoint opcional GET /coupons/validate) */
export interface CouponValidateResponse {
  valid: boolean;
  discount_amount?: number;
  type?: 'percentage' | 'fixed';
  value?: number;
  message?: string;
}

export const couponsApi = {
  /** Lista cupons (admin) — GET /coupons */
  list: (page = 1, perPage = 15) =>
    api.get<PaginatedResponse<ApiCoupon>>(`/coupons?page=${page}&per_page=${perPage}`),

  /** Detalhe de um cupom — GET /coupons/{id} */
  get: (id: string) =>
    api.get<{ data: ApiCoupon } | ApiCoupon>(`/coupons/${id}`),

  /** Cria cupom — POST /coupons */
  create: (data: {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    usage_limit?: number | null;
    expires_at?: string | null;
    is_active?: boolean;
  }) =>
    api.post<{ data: ApiCoupon } | ApiCoupon>('/coupons', data),

  /** Atualiza cupom — PATCH /coupons/{id} */
  update: (id: string, data: Partial<{
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    usage_limit: number | null;
    expires_at: string | null;
    is_active: boolean;
  }>) =>
    api.patch<{ data: ApiCoupon } | ApiCoupon>(`/coupons/${id}`, data),

  /** Apaga cupom — DELETE /coupons/{id} */
  delete: (id: string) =>
    api.delete<void>(`/coupons/${id}`),

  /** Valida cupom para preview no checkout (público).
   * Endpoint opcional: GET /coupons/validate?code=X&amount=Y
   * Se não existir (404), retorna null — frontend envia o código na mesma e backend valida. */
  validate: async (code: string, amount: number): Promise<CouponValidateResponse | null> => {
    try {
      const res = await api.get<CouponValidateResponse | { data: CouponValidateResponse }>(
        `/coupons/validate?code=${encodeURIComponent(code.trim())}&amount=${amount}`,
        { requiresAuth: false }
      );
      const payload = (res as { data?: CouponValidateResponse }).data ?? res;
      return payload as CouponValidateResponse;
    } catch {
      return null;
    }
  },
};
