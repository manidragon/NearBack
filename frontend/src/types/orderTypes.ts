import { type Product } from './productTypes';
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
    totalSellingPrice: number; // Made required (backend always provides this)
    discount: number; // Made required (backend always provides this)
    orderStatus: OrderStatus;
    fulfillmentType: FulfillmentType; // 👈 Added fulfillmentType property
    totalItem: number;
    deliverDate: string;
    pickupTime?: string | null;
    createdAt?: string;
    updatedAt?: string;
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
    product: Product;
    size: string;
    quantity: number;
    mrpPrice: number;
    sellingPrice: number; 
    userId: string; // Changed from number to string (MongoDB ObjectId)
}

export type FulfillmentType = 'DELIVERY' | 'SELF_PICKUP';