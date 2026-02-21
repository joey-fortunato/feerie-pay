/**
 * Mapeamento entre ApiCustomer (API) e Client (UI)
 */
import type { ApiCustomer } from '../api/types';
import type { Client } from '../types';

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

/** Converte ApiCustomer para o formato Client usado na UI */
export function apiCustomerToClient(api: ApiCustomer): Client {
  const totalSpent = typeof api.total_spent === 'string'
    ? parseFloat(api.total_spent) || 0
    : (api.total_spent ?? 0);
  const productsCount = api.orders_count ?? 0;
  const status = (api.status === 'active' || api.status === 'inactive' || api.status === 'blocked')
    ? api.status
    : 'active';

  return {
    id: api.id,
    name: api.name,
    email: api.email,
    phone: api.phone ?? '',
    status,
    totalSpent,
    lastPurchase: productsCount > 0 ? '—' : '-',
    joinDate: api.created_at ? formatDate(api.created_at) : '—',
    productsCount,
  };
}
