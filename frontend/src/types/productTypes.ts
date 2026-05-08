// D:\Mani\Code with Zosh\Backup\source code\frontend\src\types\productTypes.ts
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

// ✅✅✅ NEW: Product Offer interface (multi-seller support)
export interface ProductOffer {
  _id?: string;
  // ✅ Backend expects "seller" (ObjectId string or populated object)
  seller: string | { 
    _id: string; 
    sellerName?: string; 
    businessDetails?: { businessName?: string };
    [key: string]: any;
  };
  mrpPrice: number;
  sellingPrice: number;
  stock: number;
  sku?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ✅✅✅ UPDATED: Product Variant with offers array (PRIMARY) + legacy fallback
export interface ProductVariant {
  _id?: string;
  color: string;
  specifications: Record<string, string | number | boolean>;
  images: string[];
  
  // ✅ NEW: Multi-seller offers array (PRIMARY structure)
  offers?: ProductOffer[];
  
  // ✅ Legacy direct fields (OPTIONAL - for backward compatibility)
  mrpPrice?: number;
  sellingPrice?: number;
  stock?: number;
  
  sku?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ✅✅✅ UPDATED: Product Variant Form (for frontend - string inputs + offers)
export interface ProductVariantForm {
  _id?: string;
  color: string;
  specifications: Record<string, string | number | boolean>;
  images: string[];
  
  // ✅ NEW: Offers array for form (sellerId string, price/stock as strings)
  offers?: Array<{
    _id?: string;
    sellerId: string;  // ✅ Frontend uses sellerId (from JWT)
    mrpPrice: string;  // String for form input
    sellingPrice: string;
    stock: string;
    sku?: string;
    isActive: boolean;
    toBeDeleted?: boolean;  // UI helper for marking deletion
  }>;
  
  // ✅ Legacy direct fields (OPTIONAL - for backward compatibility)
  mrpPrice?: string;
  sellingPrice?: string;
  stock?: string;
  
  sku?: string;
  isActive?: boolean;
  
  // UI helpers (not sent to backend)
  tempImages?: File[];
  isExpanded?: boolean;
  isFromCatalog?: boolean;
  toBeDeleted?: boolean;
}

// ✅✅✅ UPDATED: Product interface - COMPLETE with offers support
export interface Product {
  // ✅ Required core fields
  _id?: string;
  title: string;
  description: string;
  
  // ✅ Price fields (denormalized for quick access - OPTIONAL if using variants)
  mrpPrice?: number;
  sellingPrice?: number;
  discountPercent?: number;
  
  // ✅ Denormalized price range (for filtering)
  minPrice?: number;
  maxPrice?: number;
  
  // ✅ Images array (required for gallery)
  images: string[];
  
  // ✅ Category reference (flexible type)
  category: CategoryReference;

  catalog?: {
    _id: string;
    title: string;
    lowestPrice?: number;
    totalOffers?: number;
  };
  
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
      [key: string]: any;
    };
    [key: string]: any;
  };
  
  // ✅✅✅ Variants array with offers (PRIMARY structure)
  variants?: ProductVariant[];
  
  // ✅ Aggregated helper fields (for filtering/SEO)
  availableColors?: string[];
  availableSpecs?: Record<string, string[]>;
  
  // ✅ Legacy fields (for backward compatibility with simple products)
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
  
  // ✅ Allow additional fields from API (flexible)
  [key: string]: any;
}

// ✅✅✅ UPDATED: Product Form Values (for AddProductForm.tsx)
export interface ProductFormValues {
  _id?: string;
  title: string;
  description: string;
  
  // ✅ Category hierarchy (for UI dropdowns)
  category: string;        // Level 1 category _id
  category2?: string;      // Level 2 category _id
  category3?: string;      // Level 3 category _id (final)
  
  // ✅✅✅ Variants array with offers (PRIMARY)
  variants: ProductVariantForm[];
  
  // ✅ Highlights for displayInHighlights attributes
  highlights?: Record<string, string | number | boolean>;
  
  // ✅ Legacy fields (OPTIONAL - for backward compatibility)
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
  
  // ✅ Catalog mode state
  catalogMode?: {
    isCatalogProduct: boolean;
    catalogId?: string;
    isOwner: boolean;
  };
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

export interface CatalogProduct extends Omit<Product, 'variants'> {
  variantTemplate?: ProductVariant[];  // ✅ Catalog uses this field name
  createdBy?: {
    _id: string;
    sellerName?: string;
    businessDetails?: { businessName?: string };
  };
  isOwner?: boolean;  // ✅ Backend-provided ownership flag
  lowestPrice?: number;
  highestPrice?: number;
  totalOffers?: number;
}

export interface UpdateProductSubVariantForm {
  _id?: string;
  specifications: Record<string, string | number | boolean>;
  mrpPrice: string;  // String for form input
  sellingPrice: string;
  stock: string;
  sku?: string;
  isActive?: boolean;
  toBeDeleted?: boolean;  // UI helper
}

export interface UpdateProductVariantForm {
  _id?: string;
  color: string;
  images: string[];
  subVariants: UpdateProductSubVariantForm[];
  isActive?: boolean;
}

export interface UpdateProductFormValues extends Omit<ProductFormValues, 'variants'> {
  variants: UpdateProductVariantForm[];
}

export interface CatalogModeState {
  isCatalogProduct: boolean;
  catalogId?: string;
  selectedVariants?: ProductVariant[];
  isOwner: boolean;
}