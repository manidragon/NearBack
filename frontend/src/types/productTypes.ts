// D:\Mani\Code with Zosh\Backup\source code\frontend\src\types\productTypes.ts
import { type Seller } from "./sellerTypes";

// ✅ Category reference type (flexible for API responses)
export type CategoryReference = 
  | string  // Category _id (for create/update operations)
  | {       // Full category object (for display/fetch operations)
      _id: string;
      name: string;
      categoryId: string;
      level: number;
      order?: number;
      parentCategory?: string | null;
    };

// ✅ Product Variant interface (for embedded variants array)
export interface ProductVariant {
  _id?: string;
  color: string;
  specifications: Record<string, string | number | boolean>;
  mrpPrice: number;
  sellingPrice: number;
  stock: number;
  images: string[];
  sku?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ✅ Product Variant Form interface (for frontend forms - string inputs)
export interface ProductVariantForm {
  _id?: string;
  color: string;
  specifications: Record<string, string | number | boolean>;
  mrpPrice: string;        // String for form input
  sellingPrice: string;    // String for form input
  stock: string;           // String for form input
  images: string[];
  sku?: string;
  isActive?: boolean;
  
  // UI helpers (not sent to backend)
  tempImages?: File[];
  isExpanded?: boolean;
}

// ✅ Product interface - COMPLETE with all fields for ProductDetails.tsx
export interface Product {
  // ✅ Required core fields
  _id?: string;
  title: string;
  description: string;
  
  // ✅ Price fields (required for legacy products without variants)
  mrpPrice: number;
  sellingPrice: number;
  discountPercent?: number;
  
  // ✅ Images array (required for gallery)
  images: string[];
  
  // ✅ Category reference (flexible type)
  category: CategoryReference;
  
  // ✅ Seller with optional businessDetails
  seller?: {
    _id: string;
    sellerName: string;
    email?: string;
    mobile?: string;
    businessDetails?: {
      businessName?: string;
      businessAddress?: string;
      gstNumber?: string;
      [key: string]: any;  // Allow additional fields
    };
    [key: string]: any;  // Allow additional seller fields
  };
  
  // ✅ Variants array (optional - for advanced products)
  variants?: ProductVariant[];
  
  // ✅ Aggregated helper fields (for filtering/SEO)
  availableColors?: string[];
  availableSpecs?: Record<string, string[]>;
  minPrice?: number;
  maxPrice?: number;
  
  // ✅ Product attributes (legacy - for simple products)
  color?: string;
  sizes?: string;
  quantity?: number;
  specifications?: Record<string, string | number | boolean>;
  
  // ✅ Metadata & SEO
  slug?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  
  // ✅ Ratings & Reviews (aggregated)
  averageRating?: number;
  totalReviews?: number;
  numRatings?: number;
  
  // ✅ Timestamps
  createdAt?: string;
  updatedAt?: string;
}

// ✅ Product Form Values interface (for AddProductForm.tsx)
export interface ProductFormValues {
  _id?: string;
  title: string;
  description: string;
  
  // ✅ Category hierarchy (for UI dropdowns)
  category: string;        // Level 1 category _id
  category2?: string;      // Level 2 category _id
  category3?: string;      // Level 3 category _id (final)
  
  
  
  // ✅ Variants array (primary data for advanced products)
  variants: ProductVariantForm[];
  
  // ✅ Legacy fields (for backward compatibility with simple products)
  mrpPrice?: string;
  sellingPrice?: string;
  images?: string[];
  color?: string;
  sizes?: string;
  quantity?: string;
  specifications?: Record<string, string | number | boolean>;
  
  // ✅ Metadata
  isActive?: boolean;
  isFeatured?: boolean;
}

// ✅ Cart Item interface (for cart operations)
export interface CartItem {
  _id?: string;
  product: Product | string;  // Can be full product or just _id
  variant?: ProductVariant | string;  // Optional variant reference
  quantity: number;
  size?: string;
  color?: string;
  specifications?: Record<string, string | number | boolean>;
  price: number;  // Price at time of adding to cart
  seller?: { _id: string; sellerName: string };
  createdAt?: string;
  updatedAt?: string;
}

// ✅ Order Item interface (extends cart item with more details)
export interface OrderItem extends CartItem {
  orderId?: string;
  delivered?: boolean;
  deliveredDate?: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  tracking?: {
    carrier?: string;
    trackingNumber?: string;
    status?: string;
    updatedAt?: string;
  };
}