/**
 * Tipos da API Laravel — Feerie Pay
 * Alinhados com a documentação API-INTEGRACAO-FRONTEND.md
 */

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  message: string;
  token?: string;  // Com cookie httpOnly, o backend pode omitir (token vai no cookie)
  token_type?: string;
  expires_in?: number;
  user: ApiUser;
}

export interface MeResponse {
  user: ApiUser;
}

export type CustomerStatus = 'active' | 'inactive' | 'blocked';

export interface ApiCustomer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status?: CustomerStatus;
  orders_count?: number;
  total_spent?: string | number;
  created_at?: string;
  updated_at?: string;
  orders?: Array<{ id: string; customer_id: string; product_id: string; subtotal: string; total: string; status: string }>;
}

export interface CreateCustomerRequest {
  name: string;
  email: string;
  phone: string;
  status?: CustomerStatus;
}

export interface UpdateCustomerRequest {
  name?: string;
  email?: string;
  phone?: string | null;
  status?: CustomerStatus;
}

export interface ApiProductSummary {
  id: string;
  name: string;
  price: string;
  type: 'ebook' | 'course' | 'file' | 'service';
}

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export interface ApiOrder {
  id: string;
  customer_id: string;
  product_id: string;
  subtotal: string;
  discount_amount: string;
  total: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  paid_at?: string | null;
  customer?: ApiCustomer;
  product?: ApiProductSummary;
  payments?: ApiPayment[];
}

/** gateway: gpo (MCX), ref (EMIS), ekwanza_ticket (QR E-Kwanza) — doc API 3.3 */
export type PaymentGateway = 'gpo' | 'ref' | 'ekwanza_ticket';

export interface ApiPayment {
  id: string;
  order_id: string | null;
  gateway: PaymentGateway | string;
  merchant_transaction_id?: string;
  gateway_transaction_id?: string | null;
  gateway_code?: string | null;
  gateway_reference?: string | null;
  status: string;
  amount: string;
  currency?: string;
  description?: string | null;
  raw_response?: Record<string, unknown> | null;
  paid_at?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CreateOrderRequest {
  name: string;
  email: string;
  phone: string;
  product_id: string;
  coupon_code?: string;
  payment_method: 'gpo' | 'ref' | 'ekwanza_ticket';
  phone_number?: string;
  mobile_number?: string;
}

export interface CreateOrderResponse {
  order: ApiOrder;
  payment: ApiPayment;
  gateway_response?: Record<string, unknown>;
}

export interface ApiProduct {
  id: string;
  name: string;
  description: string | null;
  price: string;
  type: 'ebook' | 'course' | 'file' | 'service';
  file_path: string | null;
  cover_image_path: string | null;
  cover_image_url: string | null;
  external_link: string | null;
  instructions: string | null;
  status: string | null;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: UserRole;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
}
