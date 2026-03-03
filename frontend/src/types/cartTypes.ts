import {type Product } from "./productTypes";
import {type User } from "./userTypes";

export interface CartItem {
    _id: string;
    cart?: Cart;
    product: Product;
    size: string;
    quantity: number;
    mrpPrice: number;
    sellingPrice: number;
    user_id: number;
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