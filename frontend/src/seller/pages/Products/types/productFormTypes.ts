// D:\Mani\Code with Zosh\Backup\source code\frontend\src\seller\pages\Products\types\productFormTypes.ts

// ✅ Catalog mode state interface
export interface CatalogModeState {
  isCatalogProduct: boolean;
  catalogId?: string;
  selectedVariants?: any[];
  isOwner: boolean;
}

// ✅ Category attribute interface
export interface CategoryAttribute {
  _id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea' | 'boolean';
  options?: string[];
  required: boolean;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  order: number;
  isVariantField: boolean;
  displayInHighlights: boolean;
  isFilterable: boolean;
  sortOrder: number;
  isActive: boolean;
}

// ✅ OFFER FORM: Frontend uses sellerId (from JWT)
export interface ProductOfferForm {
  _id?: string;
  sellerId: string;
  mrpPrice: string;
  sellingPrice: string;
  stock: string;
  sku?: string;
  isActive: boolean;
  toBeDeleted?: boolean;
}

// ✅ OFFER PAYLOAD: API expects seller (ObjectId string)
export interface ProductOfferPayload {
  _id?: string; 
  seller: string;  // ✅ API field name
  mrpPrice: number;
  sellingPrice: number;
  stock: number;
  sku?: string;
  isActive: boolean;
}

// ✅ SUB-VARIANT FORM: For CREATE/EDIT forms
export interface ProductSubVariantForm {
  _id?: string;
   variantId?: string;
  specifications: Record<string, string | number | boolean>;
  offers: ProductOfferForm[];
  isActive: boolean;
  isFromCatalog?: boolean;
  toBeDeleted?: boolean;
}

// ✅ UPDATE SUB-VARIANT: Extends with optional legacy fields
export interface UpdateProductSubVariantForm extends ProductSubVariantForm {
  mrpPrice?: string | number;
  sellingPrice?: string | number;
  stock?: string | number;
}

// ✅ Color variant form
export interface ProductVariantForm {
  _id?: string;
  color: string;
  images: string[];
  highlights?: Record<string, string>;
  subVariants: ProductSubVariantForm[];
  isActive: boolean;
  isFromCatalog?: boolean;
  variantOwner?: string;
  toBeDeleted?: boolean;
}

// ✅✅✅ FIXED: Update variant form - use Omit to cleanly override subVariants type
export type UpdateProductVariantForm = Omit<ProductVariantForm, 'subVariants'> & {
  subVariants: UpdateProductSubVariantForm[];
};

// ✅ Full product form values
export interface ProductFormValues {
  _id?: string;
  title: string;
  description: string;
  brand?: string;
  images: string[];
  category: string;
  category2: string;
  category3: string;
  highlights: Record<string, string | number | boolean>;
  variants: ProductVariantForm[];
  isActive?: boolean;
  catalogMode?: CatalogModeState;
}

// ✅ UPDATE form values: Use same structure as ProductFormValues (simpler compatibility)
export type UpdateProductFormValues = ProductFormValues;

// ✅ Default initial values
export const defaultInitialValues: ProductFormValues = {
  title: "",
  description: "",
  brand: "",
  images: [],
  category: "",
  category2: "",
  category3: "",
  highlights: {},
  variants: [
    {
      color: "",
      images: [],
      highlights: {},
      subVariants: [
        {
          specifications: {},
          offers: [
            {
              sellerId: "",
              mrpPrice: "",
              sellingPrice: "",
              stock: "0",
              sku: "",
              isActive: true
            }
          ],
          isActive: true
        }
      ],
      isActive: true
    }
  ],
  isActive: true,
  catalogMode: {
    isCatalogProduct: false,
    isOwner: false
  }
};

// ✅ VARIANT PAYLOAD: API format (numbers, not strings)
export interface ProductVariantPayload {
  color: string;
  specifications: Record<string, string | number | boolean>;
  images: string[];
  offers: ProductOfferPayload[];
  isActive?: boolean;
}

// ✅ Payload for creating product
export interface ProductCreatePayload {
  title?: string;
  description?: string;
  category?: string;
   catalogId?: string; 
  variants: ProductVariantPayload[];
  isActive?: boolean;
  highlights?: Record<string, string | number | boolean>;
}

// ✅✅✅ FIXED: ProductUpdatePayload - simple Partial type
export type ProductUpdatePayload = Partial<{
  title: string;
  description: string;
  category: string;
  variants: ProductVariantPayload[];
  isActive: boolean;
  isFeatured: boolean;
}>;

// ✅ Catalog search state
export interface CatalogSearchState {
  searchQuery: string;
  results: any[];
  isSearching: boolean;
  selectedCatalog: any | null;
  showSearch: boolean;
  isCatalogProduct: boolean;
  handleSearchCatalog: () => Promise<void>;
  handleSelectCatalog: (catalog: any, selectedVariants?: any[]) => void;
  handleSkipCatalogSearch: () => void;
  setSearchQuery: (query: string) => void;
}