
export enum TransactionStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  CONTESTED = 'CONTESTED',
}

export interface Transaction {
  id: string;
  customerName: string;
  customerEmail: string;
  amount: number;
  date: string;
  status: TransactionStatus;
  method: 'e-kwanza' | 'card' | 'multicaixa_express';
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  type: 'unique' | 'subscription';
  category: 'book' | 'course' | 'service' | 'digital';
  sales: number;
  createdAt: string;
  status: 'active' | 'draft';
  description?: string;
  external_link?: string | null;
  instructions?: string | null;
  file_path?: string | null;
}

export interface PaymentLink {
  id: string;
  title: string;
  amount: number;
  url: string;
  active: boolean;
  views: number;
  sales: number;
  createdAt: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'blocked';
  totalSpent: number;
  lastPurchase: string;
  joinDate: string;
  productsCount: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  usedCount: number;
  maxUses: number | null; // null means infinite
  status: 'active' | 'expired' | 'paused';
  expiryDate: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending';
  addedAt: string;
  avatar?: string;
}

export interface ChartData {
  name: string;
  value: number;
}

// --- É-KWANZA INTEGRATION TYPES (v2.5) ---

export enum EKwanzaStatus {
  PENDING = 0,
  PROCESSED = 1,
  EXPIRED = 2,
  CANCELLED = 3
}

export interface EKwanzaTicketRequest {
  amount: number;
  referenceCode: string; // Internal ID (e.g., ORD-123)
  mobileNumber: string;
}

export interface EKwanzaTicketResponse {
  Code: string;      // The generated reference code for the user to pay
  QRCode: string;    // Base64 Image
  Range: null;
  Status: number;
  ExpirationDate: string;
}

export interface EKwanzaStatusResponse {
  Amount: string;
  Code: string;
  CreationDate: string;
  ExpirationDate: string;
  Status: EKwanzaStatus;
}

export type ViewState = 'dashboard' | 'transactions' | 'products' | 'payment_links' | 'clients' | 'coupons' | 'reports' | 'team' | 'checkout_preview' | 'profile';