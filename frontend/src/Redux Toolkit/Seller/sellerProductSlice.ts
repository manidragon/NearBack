// D:\Mani\Code with Zosh\Backup\source code\frontend\src\Redux Toolkit\Seller\sellerProductSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../Config/Api';
import { type Product } from '../../types/productTypes';

const API_URL = '/api/sellers/product';

// ✅ Product Variant Payload Interface
export interface ProductVariantPayload {
  color: string;
  specifications: Record<string, string | number | boolean>;
  mrpPrice: number;
  sellingPrice: number;
  stock: number;
  images: string[];
  sku?: string;
  isActive?: boolean;
}

// ✅ UPDATED: Support both legacy fields AND new variants array
export type ProductCreatePayload = {
  // ✅ Required core fields
  title: string;
  description: string;
  category: string;  // Level 3 category _id (string)
  
  // ✅ NEW: Variants array (primary data for advanced products)
  variants?: ProductVariantPayload[];
  
  // ✅ LEGACY: Optional top-level fields for backward compatibility
  mrpPrice?: number;
  sellingPrice?: number;
  images?: string[];
  color?: string;
  sizes?: string;
  quantity?: number;
  specifications?: Record<string, string | number | boolean>;
  
  // ✅ Optional metadata
  brand?: string;
  isActive?: boolean;
};

// ✅ UPDATED: For updates, all fields optional
export type ProductUpdatePayload = Partial<ProductCreatePayload> & {
  _id?: string;
};

// ✅ Fetch seller's products
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

// ✅ Create product
export const createProduct = createAsyncThunk<Product, { request: ProductCreatePayload; jwt: string }>(
  'sellerProduct/createProduct',
  async ({ request, jwt }, { rejectWithValue }) => {
    try {
      const payload = { ...request };
      
      if (payload.variants?.length && payload.variants.length > 0 && !payload.mrpPrice) {
        payload.mrpPrice = payload.variants[0].mrpPrice;
        payload.sellingPrice = payload.variants[0].sellingPrice;
        payload.images = payload.variants[0].images;
        payload.color = payload.variants[0].color;
      }
      
      const response = await api.post<Product>(API_URL, payload, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      console.log("product created ", response.data);
      return response.data;
    } catch (error: any) {
      console.log("error ", error.response);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ✅ Update product
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
      
      if (payload.variants?.length && payload.variants.length > 0 && !payload.mrpPrice) {
        payload.mrpPrice = payload.variants[0].mrpPrice;
        payload.sellingPrice = payload.variants[0].sellingPrice;
        payload.images = payload.variants[0].images;
        payload.color = payload.variants[0].color;
      }
      
      const response = await api.put<Product>(`${API_URL}/${productId}`, payload, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      console.log("update product ", response.data);
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

// ✅✅✅ Slice definition - ADD reducers section with reset actions
const sellerProductSlice = createSlice({
  name: 'sellerProduct',
  initialState,
  
  // ✅✅✅ ADD THIS: Reducers for resetting flags
  reducers: {
    // ✅ Reset productUpdated flag after handling update success
    resetUpdateFlag: (state) => {
      state.productUpdated = false;
    },
    // ✅ Reset productCreated flag after handling create success
    resetCreateFlag: (state) => {
      state.productCreated = false;
    },
    // ✅ Reset both flags (optional utility)
    resetProductFlags: (state) => {
      state.productCreated = false;
      state.productUpdated = false;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchSellerProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.productCreated = false;
        state.productUpdated = false;  // ✅ Also reset on new fetch
      })
      .addCase(fetchSellerProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.products = action.payload;
        state.loading = false;
        // ✅ Optional: Reset flags after successful fetch
        state.productUpdated = false;
        state.productCreated = false;
      })
      .addCase(fetchSellerProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || action.error.message || 'Failed to fetch products';
      })
      
      // Create product
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
        state.productCreated = true;  // ✅ Set flag to trigger UI feedback
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || action.error.message || 'Failed to create product';
        state.productCreated = false;
      })
      
      // Update product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action: PayloadAction<Product>) => {
        const index = state.products.findIndex(product => product._id === action.payload._id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        state.loading = false;
        state.productUpdated = true;  // ✅ Set flag to trigger UI feedback
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || action.error.message || 'Failed to update product';
      })
      
      // Delete product
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

// ✅✅✅ EXPORT the new reset actions
export const { resetUpdateFlag, resetCreateFlag, resetProductFlags } = sellerProductSlice.actions;

export default sellerProductSlice.reducer;