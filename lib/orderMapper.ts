/**
 * Mapeamento entre ApiOrder (API) e Transaction (UI)
 */
import type { ApiOrder } from '../api/types';
import type { Transaction } from '../types';
import { TransactionStatus } from '../types';

const STATUS_MAP: Record<ApiOrder['status'], TransactionStatus> = {
  pending: TransactionStatus.PENDING,
  paid: TransactionStatus.PAID,
  failed: TransactionStatus.FAILED,
  cancelled: TransactionStatus.CANCELLED,
  refunded: TransactionStatus.REFUNDED,
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
}

/** Converte ApiOrder para o formato Transaction usado na UI */
export function apiOrderToTransaction(api: ApiOrder): OrderDisplay {
  const subtotal = parseFloat(api.subtotal) || 0;
  const discountAmount = parseFloat(api.discount_amount) || 0;
  const total = parseFloat(api.total) || 0;
  return {
    id: api.id,
    customerName: api.customer?.name ?? '—',
    customerEmail: api.customer?.email ?? '—',
    amount: total,
    date: formatDate(api.created_at),
    status: STATUS_MAP[api.status] ?? TransactionStatus.PENDING,
    method: 'e-kwanza',
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
  };
}
