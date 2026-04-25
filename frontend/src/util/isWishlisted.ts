// D:\Mani\Code with Zosh\Backup\source code\frontend\src\util\isWishlisted.ts
import type{ Product } from "../types/productTypes";
import type{ Wishlist } from "../types/wishlistTypes";

export function isWishlisted(wishlist: Wishlist, product: Product) {
  return wishlist?.products?.some((p) => p._id === product._id);
  
}
