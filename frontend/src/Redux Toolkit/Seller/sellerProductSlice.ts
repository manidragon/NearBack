// D:\Mani\Code with Zosh\Backup\source code\frontend\src\Redux Toolkit\Seller\sellerProductSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../Config/Api';  // ✅ Use existing api instance
import { type Product } from '../../types/productTypes';

const API_URL = '/api/sellers/product';

// ✅✅✅ NEW: Offer payload for multi-seller support
export interface ProductOfferPayload {
  seller: string;
  mrpPrice: number;
  sellingPrice: number;
  stock: number;
  sku?: string;
  isActive: boolean;
}

// ✅✅✅ UPDATED: Variant payload with offers array (not direct price fields)
export interface ProductVariantPayload {
  color: string;
  specifications: Record<string, string | number | boolean>;
  images: string[];
  offers: ProductOfferPayload[];  // ✅ Array of seller offers (NEW)
  isActive?: boolean;
}

// ✅ UPDATED: Support both catalog offers AND independent products
export type ProductCreatePayload = {
  // ✅ Required for independent products (catalog products skip these)
  title?: string;
  description?: string;
  category?: string;  // Level 3 category _id (string)

  // ✅ Required for ALL products: variants array with offers
  variants: ProductVariantPayload[];

  // ✅ NEW: Catalog ID - if present, this is a catalog offer (not independent product)
  catalogId?: string;  // ✅ If set, backend treats this as catalog offer

  // ✅ Optional metadata (only used for independent products)
  brand?: string;
  isActive?: boolean;
};

// ✅ UPDATED: For updates, all fields optional
export type ProductUpdatePayload = Partial<ProductCreatePayload> & {
  _id?: string;
};

// ✅ Fetch seller's products (independent products only)
export const fetchSellerProducts = createAsyncThunk<Product[], string>(
  'sellerProduct/fetchSellerProducts',
  async (jwt, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URL, {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      console.log("seller products ", response.data);

      let products: Product[] = [];

      if (Array.isArray(response.data)) {
        products = response.data;
      } else if (response.data?.products && Array.isArray(response.data.products)) {
        products = response.data.products;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        products = response.data.data;
      }

      return products;

    } catch (error: any) {
      console.log("error ", error.response);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ✅✅✅ FIXED: Fetch seller's catalog offers (products linked to catalogs)
export const fetchSellerCatalogOffers = createAsyncThunk<Product[], string>(
  'sellerProduct/fetchCatalogOffers',
  async (jwt, { rejectWithValue }) => {
    try {
      // ✅ Use API_URL constant to match backend mount point (/api/sellers/product)
      const response = await api.get(`${API_URL}/catalog-offers`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwt}`
        }
      });

      // ✅ Handle different response structures
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data?.products && Array.isArray(response.data.products)) {
        return response.data.products;
      }
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }

      return [];
    } catch (error: any) {
      console.error('❌ [Redux] fetchSellerCatalogOffers error:', error);
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch catalog offers');
    }
  }
);

// ✅ Create product - Handles both catalog offers AND independent products
export const createProduct = createAsyncThunk<Product, { request: ProductCreatePayload; jwt: string }>(
  'sellerProduct/createProduct',
  async ({ request, jwt }, { rejectWithValue }) => {
    try {
      const payload = { ...request };

      // ✅ If this is a catalog offer (catalogId present), only send variants
      if (payload.catalogId) {
        // ✅ Catalog offer: only send variants with offers array
        const offerPayload = {
          variants: payload.variants
        };

        // ✅✅✅ FIX: Use singular '/offer' endpoint (not '/offers')
        const response = await api.post<Product>(
          `/api/catalog/${payload.catalogId}/offer`,  // ✅ Fixed: singular 'offer'
          offerPayload,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );
        console.log("catalog offer created ", response.data);
        return response.data;
      }

      // ✅ Independent product: send full product data with offers array
      const response = await api.post<Product>(API_URL, payload, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      console.log("independent product created ", response.data);
      return response.data;

    } catch (error: any) {
      console.log("error ", error.response);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ✅ Update product - Handles both catalog offers AND independent products
export const updateProduct = createAsyncThunk<
  Product,
  { productId: string; product: ProductUpdatePayload }
>(
  'sellerProduct/updateProduct',
  async ({ productId, product }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("jwt");
      if (!jwt) {
        throw new Error('No authentication token found');
      }

      const payload = { ...product };

      // ✅ If updating a catalog-linked product, only allow variant updates
      if (payload.catalogId) {
        // ✅ Catalog offer update: only send variants with offers array
        const offerPayload = {
          variants: payload.variants
        };

        // ✅✅✅ FIX: Use singular '/offer' endpoint with offer ID
        const response = await api.put<Product>(
          `/api/catalog/${payload.catalogId}/offer/${productId}`,  // ✅ Fixed: singular 'offer'
          offerPayload,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );
        console.log("catalog offer updated ", response.data);
        return response.data;
      }

      // ✅ Independent product update: send full product data with offers array
      const response = await api.put<Product>(`${API_URL}/${productId}`, payload, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      console.log("independent product updated ", response.data);
      return response.data;

    } catch (error: any) {
      console.log("update product error ", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ✅ Delete product
export const deleteProduct = createAsyncThunk<void, string>(
  'sellerProduct/deleteProduct',
  async (productId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("jwt");
      if (!jwt) {
        throw new Error('No authentication token found');
      }

      await api.delete(`${API_URL}/${productId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ✅ State interface
interface SellerProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  productCreated: boolean;
  productUpdated: boolean;
}

const initialState: SellerProductState = {
  products: [],
  loading: false,
  error: null,
  productCreated: false,
  productUpdated: false,
};

// ✅✅✅ Slice definition
const sellerProductSlice = createSlice({
  name: 'sellerProduct',
  initialState,

  // ✅ Reducers for resetting flags
  reducers: {
    resetUpdateFlag: (state) => {
      state.productUpdated = false;
    },
    resetCreateFlag: (state) => {
      state.productCreated = false;
    },
    resetProductFlags: (state) => {
      state.productCreated = false;
      state.productUpdated = false;
    },
  },

  extraReducers: (builder) => {
    builder
      // ✅ 1. Fetch independent products (MERGE)
      .addCase(fetchSellerProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.productCreated = false;
        state.productUpdated = false;
      })
      .addCase(fetchSellerProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        // ✅ Merge: Add independent products to existing products without duplicates
        const existingIds = new Set(state.products.map(p => p._id));
        const newProducts = action.payload.filter(p => !existingIds.has(p._id));

        state.products = [...state.products, ...newProducts];
        state.loading = false;
        state.productUpdated = false;
        state.productCreated = false;
      })
      .addCase(fetchSellerProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || action.error.message || 'Failed to fetch products';
      })

      // ✅ 2. Fetch catalog offers (MERGE) - NOTE: Correct action type here!
      .addCase(fetchSellerCatalogOffers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerCatalogOffers.fulfilled, (state, action: PayloadAction<Product[]>) => {

        // ✅ Merge: Add catalog offers to existing products without duplicates
        const existingIds = new Set(state.products.map(p => p._id));
        const newOffers = action.payload.filter(p => !existingIds.has(p._id));

        state.products = [...state.products, ...newOffers];
        state.loading = false;

      })
      .addCase(fetchSellerCatalogOffers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || action.error.message || 'Failed to fetch catalog offers';
      })

      // ✅ 3. Create product
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.productCreated = false;
      })
      .addCase(createProduct.fulfilled, (state, action: PayloadAction<Product>) => {
        const existingIndex = state.products.findIndex(p => p._id === action.payload._id);
        if (existingIndex === -1) {
          state.products.push(action.payload);
        } else {
          state.products[existingIndex] = action.payload;
        }
        state.loading = false;
        state.productCreated = true;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || action.error.message || 'Failed to create product';
        state.productCreated = false;
      })

      // ✅ 4. Update product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action: PayloadAction<Product>) => {
  const index = state.products.findIndex(product => product._id === action.payload._id);
  if (index !== -1) {
    // ✅ Merge updated product into existing array (preserves other fields)
    state.products[index] = { ...state.products[index], ...action.payload };
  } else {
    // ✅ If not found (e.g., catalog offer), add it
    state.products.push(action.payload);
  }
  state.loading = false;
  state.productUpdated = true;
})
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || action.error.message || 'Failed to update product';
      })

      // ✅ 5. Delete product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.products = state.products.filter(product => product._id !== action.meta.arg);
        state.loading = false;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || action.error.message || 'Failed to delete product';
      });
  },
});

// ✅ Export actions
export const { resetUpdateFlag, resetCreateFlag, resetProductFlags } = sellerProductSlice.actions;

export default sellerProductSlice.reducer;