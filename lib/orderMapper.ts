/**
 * Mapeamento entre ApiOrder/ApiPayment (API) e formatos de UI
 */
import type { ApiOrder, ApiPayment } from '../api/types';
import type { Transaction } from '../types';
import { TransactionStatus } from '../types';

const STATUS_MAP: Record<ApiOrder['status'], TransactionStatus> = {
  pending: TransactionStatus.PENDING,
  paid: TransactionStatus.PAID,
  failed: TransactionStatus.FAILED,
  cancelled: TransactionStatus.CANCELLED,
  refunded: TransactionStatus.REFUNDED,
};

const PAYMENT_STATUS_MAP: Record<string, TransactionStatus> = {
  pending: TransactionStatus.PENDING,
  paid: TransactionStatus.PAID,
  failed: TransactionStatus.FAILED,
};

const GATEWAY_TO_METHOD: Record<string, 'e-kwanza' | 'card' | 'multicaixa_express'> = {
  ekwanza: 'e-kwanza',
  appypay: 'multicaixa_express',
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-AO', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-AO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  } catch {
    return iso;
  }
}

/** ID curto para exibição (ex: últimos 8 caracteres do ULID) */
export function shortId(id: string): string {
  return id.length > 8 ? id.slice(-8).toUpperCase() : id;
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  ebook: 'E-book',
  course: 'Curso',
  file: 'Arquivo',
  service: 'Serviço',
};

export interface OrderDisplay extends Transaction {
  productName?: string;
  productPrice?: number;
  productType?: string;
  customerPhone?: string;
  customerId?: string;
  productId?: string;
  subtotal?: number;
  discountAmount?: number;
  createdAt?: string;
  updatedAt?: string;
  paidAt?: string | null;
  payments?: Array<{ id: string; gateway: string; amount: string; status: string; createdAt: string }>;
}

/** Converte ApiOrder para OrderDisplay (página Pedidos). Usa payment gateway para method quando disponível. */
export function apiOrderToOrderDisplay(api: ApiOrder): OrderDisplay {
  const subtotal = parseFloat(api.subtotal) || 0;
  const discountAmount = parseFloat(api.discount_amount) || 0;
  const total = parseFloat(api.total) || 0;
  const lastPayment = api.payments && api.payments.length > 0 ? api.payments[api.payments.length - 1] : null;
  const method = lastPayment ? (GATEWAY_TO_METHOD[lastPayment.gateway] ?? 'e-kwanza') : 'e-kwanza';

  return {
    id: api.id,
    customerName: api.customer?.name ?? '—',
    customerEmail: api.customer?.email ?? '—',
    amount: total,
    date: formatDate(api.created_at),
    status: STATUS_MAP[api.status] ?? TransactionStatus.PENDING,
    method,
    productName: api.product?.name,
    productPrice: api.product ? parseFloat(api.product.price) : undefined,
    productType: api.product?.type ? PRODUCT_TYPE_LABELS[api.product.type] ?? api.product.type : undefined,
    customerPhone: api.customer?.phone ?? undefined,
    customerId: api.customer_id,
    productId: api.product_id,
    subtotal,
    discountAmount,
    createdAt: api.created_at,
    updatedAt: api.updated_at,
    paidAt: api.paid_at ?? undefined,
    payments: api.payments?.map((p) => ({ id: p.id, gateway: p.gateway, amount: p.amount, status: p.status, createdAt: p.created_at })),
  };
}

/** @deprecated Use apiOrderToOrderDisplay */
export const apiOrderToTransaction = apiOrderToOrderDisplay;

export interface PaymentDisplay {
  id: string;
  orderId: string;
  gateway: string;
  amount: number;
  status: TransactionStatus;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  productName?: string;
  orderStatus: string;
}

/** Converte ApiPayment + ApiOrder para PaymentDisplay (página Transações). */
export function apiPaymentToDisplay(payment: ApiPayment, order: ApiOrder): PaymentDisplay {
  return {
    id: payment.id,
    orderId: order.id,
    gateway: payment.gateway,
    amount: parseFloat(payment.amount) || 0,
    status: PAYMENT_STATUS_MAP[payment.status] ?? TransactionStatus.PENDING,
    createdAt: payment.created_at,
    customerName: order.customer?.name ?? '—',
    customerEmail: order.customer?.email ?? '—',
    productName: order.product?.name,
    orderStatus: order.status,
  };
}

/** Achatado de orders: extrai payments para a lista da página Transações. */
export function flattenPaymentsFromOrders(orders: ApiOrder[]): PaymentDisplay[] {
  const result: PaymentDisplay[] = [];
  for (const order of orders) {
    const payments = order.payments ?? [];
    for (const p of payments) {
      result.push(apiPaymentToDisplay(p, order));
    }
  }
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return result;
}
