// D:\Mani\Code with Zosh\Backup\source code\frontend\src\types\cartTypes.ts
import {type Product } from "./productTypes";
import {type User } from "./userTypes";

export interface CartItem {
  _id: string;
  cart: string;
  product: {
    _id: string;
    title: string;
    description?: string;
    seller?: {
      _id: string;
      sellerName?: string;
      businessDetails?: {
        businessName?: string;
      };
    };
    // ✅ Make images optional (not always at root level)
    images?: string[];
    // ✅ Include variants for variant-specific data
    variants?: Array<{
      _id: string;
      color: string;
      specifications?: Record<string, string>;
      images?: string[];
      offers?: Array<{
        _id: string;
        seller: string | { _id: string; businessDetails?: { businessName?: string } };
        mrpPrice: number;
        sellingPrice: number;
        stock: number;
        isActive: boolean;
      }>;
      isActive: boolean;
    }>;
  };
  variantId?: string;  // ✅ Track which variant
  sellerId?: string;   // ✅ Track which seller's offer
  offerId?: string;    // ✅ Track specific offer
  size: string;
  quantity: number;
  mrpPrice: number;
  sellingPrice: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
  sellerName?: string; 
}


export interface Cart {
    _id: string | null;
  user: User | null;
  cartItems: CartItem[];
  totalSellingPrice: number;
  totalMrpPrice: number;
  totalItem: number;
  discount: number;
  couponCode: string | null;
  couponPrice: number;
  createdAt: string;
  updatedAt: string;
}