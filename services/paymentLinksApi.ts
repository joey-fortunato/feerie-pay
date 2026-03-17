import type { ApiPayment } from '../api/types';
import { api } from './api';

export interface ApiPaymentLink {
  id: string;
  code?: string;
  title: string;
  amount: number;
  /** URL pública pronta para partilhar (pode vir como `url` ou `public_url` da API) */
  url?: string | null;
  public_url?: string | null;
  slug?: string | null;
  active: boolean;
  /** Métricas opcionais, se o backend expuser */
  views?: number;
  sales?: number;
  created_at?: string;
  payment_id?: string | null;
  order_id?: string | null;
  payment?: ApiPayment | null;
}

export const paymentLinksApi = {
  /** Criar link de pagamento a partir de um título/valor simples */
  create: async (payload: { title: string; amount: number }): Promise<ApiPaymentLink> => {
    type CreatePaymentLinkResponse =
      | ApiPaymentLink
      | { data?: ApiPaymentLink }
      | { link?: ApiPaymentLink }
      | { payment_link?: ApiPaymentLink };

    const res = await api.post<CreatePaymentLinkResponse & { public_url?: string }>(
      '/payment-links',
      payload as Record<string, unknown>
    );
    const raw = res as any;

    let link: ApiPaymentLink;
    if ((raw as { data?: ApiPaymentLink }).data) {
      link = (raw as { data: ApiPaymentLink }).data;
    } else if ((raw as { link?: ApiPaymentLink }).link) {
      link = (raw as { link: ApiPaymentLink }).link;
    } else if ((raw as { payment_link?: ApiPaymentLink }).payment_link) {
      link = (raw as { payment_link: ApiPaymentLink }).payment_link;
    } else {
      link = raw as ApiPaymentLink;
    }

    const publicUrl: string | undefined =
      (raw.public_url as string | undefined) ??
      ((link as any).public_url as string | undefined);

    if (!link.url && publicUrl) {
      link.url = publicUrl;
    }

    return link;
  },

  /** Listar links de pagamento (admin) */
  list: (page = 1, perPage = 20) =>
    api.get<{ data: ApiPaymentLink[]; meta?: Record<string, unknown> }>(
      `/payment-links?page=${page}&per_page=${perPage}`
    ),

  /** Obter um link de pagamento pelo código curto (uso público) */
  getByCode: (code: string) =>
    api.get<ApiPaymentLink>(`/payment-links/${encodeURIComponent(code)}`, {
      requiresAuth: false,
    }),

  /** Apagar um link de pagamento */
  delete: (id: string) =>
    api.delete<{ message?: string } | void>(`/payment-links/${id}`),

  /** Atualizar um link de pagamento existente */
  update: (id: string, payload: Partial<Pick<ApiPaymentLink, 'title' | 'amount' | 'active'>>) =>
    api.put<ApiPaymentLink>(`/payment-links/${id}`, payload as Record<string, unknown>),
};

