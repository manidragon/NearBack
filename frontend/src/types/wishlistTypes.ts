// D:\Mani\Code with Zosh\Backup\source code\frontend\src\types\wishlistTypes.ts
import {type Product } from "./productTypes";
import {type User } from "./userTypes";

export interface Wishlist {
  _id: string;
  user: User;
  products: Product[];
}

export interface WishlistState {
  wishlist: Wishlist | null;
  loading: boolean;
  error: string | null;
}

// Payload interfaces for async thunks
export interface AddProductToWishlistPayload {
  wishlistId: string;
  productId: string;
}
