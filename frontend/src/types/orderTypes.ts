// D:\Mani\Code with Zosh\Backup\source code\frontend\src\types\orderTypes.ts
import { type User } from './userTypes';
import { type Address } from './addressTypes';

export interface OrderState {
  orders: Order[];
  orderItem: OrderItem | null;
  currentOrder: Order | null;
  paymentOrder: any | null;
  loading: boolean;
  error: string | null;
  orderCanceled: boolean
}

export interface Order {
  _id: string;
  user: User;
  seller: any; // Updated from sellerId: number to match backend
  orderItems: OrderItem[];
  orderDate: string;
  shippingAddress: Address;
  paymentDetails: any;
  totalMrpPrice: number;
  totalSellingPrice: number;
  discount: number;
  orderStatus: OrderStatus;
  fulfillmentType: FulfillmentType;
  totalItem: number;
  deliverDate: string;
  pickupTime?: string | null;
  createdAt?: string;
  updatedAt?: string;
  paymentMethod?: string;
  replacementFor?: string;
  replacementStatus?: ReplacementStatus;
  priceDifference?: number;
  originalOrderItem?: string;
}

// 🔥 CRITICAL FIX: Added all missing order statuses
export type OrderStatus =
  | 'PENDING'
  | 'PLACED'
  | 'CONFIRMED'
  | 'READY_FOR_PICKUP'
  | 'SHIPPED'
  | 'ARRIVING'
  | 'DELIVERED'
  | 'CANCELLED';

export interface OrderItem {
  _id: string;
  product: {
    _id: string;
    title: string;
    seller?: {
      _id: string;
      sellerName?: string;
      businessDetails?: { businessName?: string };
    };
    images?: string[];
    variants?: Array<{
      _id: string;
      color: string;
      specifications?: Record<string, string | number | boolean>;
      images?: string[];
      offers?: Array<{
        _id: string;
        seller: string | { _id: string };
        mrpPrice: number;
        sellingPrice: number;
        stock: number;
      }>;
    }>;
  };
  // ✅ ADD THIS: variantId field for tracking selected variant
  variantId?: string;
  sellerId?: string;
  size: string;
  quantity: number;
  mrpPrice: number;
  sellingPrice: number;
  userId: string;
  createdAt?: string;
  updatedAt?: string;
  returnRequest?: ReturnRequest | null;
  replacementRequest?: ReplacementRequest | null;
}

export type FulfillmentType = 'DELIVERY' | 'SELF_PICKUP';

// ============================================================================
// ✅ RETURN SYSTEM TYPES
// ============================================================================

export type ReturnStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'PICKED_UP'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'ORIGINAL_RETURNED'
  | 'REVIEW_COMPLETED'
  | 'REPLACEMENT_SHIPPED';

export type ReturnReason =
  | 'Wrong size'
  | 'Defective/Damaged'
  | 'Wrong item delivered'
  | 'Not as described'
  | 'Changed mind'
  | 'Better price found'
  | 'Other';

export interface PickupAddress {
  street?: string;
  city?: string;
  district?: string;
  pincode?: string;
}

export interface ReturnRequest {
  _id: string;
  orderItem: string | OrderItem;
  order: string | Order;
  seller: string | {
    _id: string;
    sellerName?: string;
    businessDetails?: { businessName?: string }
  };
  customer: string | User;
  reason: ReturnReason | string;
  description?: string;
  images: string[];
  refundAmount?: number;
  refundMethod: 'WALLET' | 'RAZORPAY' | 'BANK_TRANSFER';
  razorpayRefundId?: string;
  refundStatus?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  status: ReturnStatus;
  pickupAddress?: PickupAddress;
  approvedBy?: string;
  approvedAt?: string;
  pickedUpAt?: string;
  completedAt?: string;
  rejectedReason?: string;
  createdAt: string;
  updatedAt: string;
  isReplacement?: boolean;
  replacementOrder?: string | Order;
  replacementVariant?: {
    variantId: string;
    color: string;
    specifications?: Record<string, string>;
    sellingPrice: number;
    stock: number;
  };
  originalReturnedAt?: string;
  reviewCompletedAt?: string;
  replacementShippedAt?: string;
  reviewNotes?: string;
}

// ============================================================================
// ✅ REPLACEMENT SYSTEM TYPES (Phase 3)
// ============================================================================

export type ReplacementStatus =
  | 'NONE'
  | 'PENDING'
  | 'APPROVED'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ReplacementVariant {
  variantId: string;
  color: string;
  specifications: Record<string, string>;
  sellingPrice: number;
  stock: number;
  images?: string[];
}

export interface ReplacementRequest {
  _id: string;
  originalOrderItem: string | OrderItem;  // Item being replaced
  replacementVariant: ReplacementVariant;  // Variant customer wants
  priceDifference: number;  // Positive = pay more, Negative = get refund
  status: ReplacementStatus;
  replacementOrder?: string | Order;  // Link to new replacement order
  isReplacement: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// ✅ WALLET TYPES (Phase 1)
// ============================================================================

export interface WalletTransaction {
  _id?: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  reason: string;
  referenceId: string;
  referenceModel: string;
  balanceAfter: number;
  notes?: string;
  createdAt: string;
}

export interface Wallet {
  _id?: string;
  user: string;
  balance: number;
  transactions: WalletTransaction[];
  lastTransactionAt?: string;
  createdAt?: string;
  updatedAt?: string;
}