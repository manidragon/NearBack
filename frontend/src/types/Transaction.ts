// D:\Mani\Code with Zosh\Backup\source code\frontend\src\types\Transaction.ts
import { type Order } from "./orderTypes";
import { type Seller } from "./sellerTypes";
import { type User } from "./userTypes";

export interface Transaction {
  _id: string;
  customer: User;
  order: Order;
  seller: Seller;
  date: string;
  
  // ✅ ADD THESE PAYMENT FIELDS:
  amount: number;                    // Order total selling price
  platformFee: number;               // Platform fee deducted
  netAmount: number;                 // amount - platformFee (seller earnings)
  paymentStatus: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod: 'RAZORPAY' | 'STRIPE' | 'CASH_ON_DELIVERY';
  razorpayPaymentId?: string;        // Razorpay payment ID (if applicable)
  razorpayOrderId?: string;          // Razorpay order ID (if applicable)
  refundAmount?: number;             // Refund amount (if refunded)
  refundReason?: string;             // Reason for refund
  createdAt: string;
  updatedAt: string;
}