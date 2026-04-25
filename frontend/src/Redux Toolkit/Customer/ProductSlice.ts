// D:\Mani\Code with Zosh\Backup\source code\frontend\src\Redux Toolkit\Customer\ProductSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { type Product } from "../../types/productTypes";
import { type RootState } from "../Store";
import { api } from "../../Config/Api";

// Define the base URL for the API
const API_URL = "/products";

// Define the initial state type
interface ProductState {
  product: Product | null;
  products: Product[];
  paginatedProducts: any;
  totalPages: number;
  loading: boolean;
  error: string | null;
  searchProduct: Product[]
}

// Define the initial state
const initialState: ProductState = {
  product: null,
  products: [],
  paginatedProducts: null,
  totalPages: 1,
  loading: false,
  error: null,
  searchProduct: []
};

// Create async thunks for API calls
export const fetchProductById = createAsyncThunk<Product, string>(
  "products/fetchProductById",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await api.get<Product>(`${API_URL}/${productId}`);
      console.log("product details ", response.data);
      return response.data;
    } catch (error: any) {
      console.log("error ", error.response);
      return rejectWithValue(error.response.data);
    }
  }
);

export const searchProduct = createAsyncThunk<
  { success: boolean; data: Product[]; count: number; page: number; totalPages: number }, // ✅ Updated return type
  string
>("products/searchProduct", async (query, { rejectWithValue }) => {
  try {
    const response = await api.get(`${API_URL}/search`, {
      params: { search: query }, // ✅ Send as 'search' param
    });
    console.log("search products ", response.data);
    return response.data; // ✅ Returns wrapped response
  } catch (error: any) {
    console.log("error ", error.response);
    return rejectWithValue(error.response.data);
  }
});
export const getAllProducts = createAsyncThunk<
  any,
  {
    category?: string;
    brand?: string;
    color?: string;
    size?: string;
    minPrice?: number;
    maxPrice?: number;
    minDiscount?: number;
    sort?: string;
    stock?: string;
    pageNumber?: number;
  }
>("products/getAllProducts", async (params, { rejectWithValue }) => {
  try {
    const response = await api.get<any>(API_URL, {
      params: {
        ...params,
        pageNumber: params.pageNumber || 0,
      },
    });
    console.log("all products ------ ", response.data);
    return response.data;
  } catch (error: any) {
    console.log("error ", error.response);
    return rejectWithValue(error.response.data);
  }
});

// Create the slice
const productSlice = createSlice({
  name: "products",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchProductById.fulfilled,
        (state, action: PayloadAction<any>) => {  // ✅ Change type to 'any' to handle wrapped response
          console.log('🔍 fetchProductById.fulfilled payload:', action.payload);

          // ✅ Extract product from wrapped response { success: true, data: {...} }
          const productData = action.payload?.data || action.payload;

          state.product = productData;  // ✅ Assign the actual product object
          state.loading = false;

          console.log('✅ Product loaded:', {
            id: productData?._id,
            title: productData?.title,
            variantsCount: productData?.variants?.length
          });
        }
      )
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch product";
      })
      .addCase(searchProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        searchProduct.fulfilled,
        (state, action: PayloadAction<{ success: boolean; data: Product[]; count: number; page: number; totalPages: number }>) => {
          console.log('🔍 searchProduct.fulfilled payload:', action.payload);

          // ✅✅✅ CRITICAL: Extract the products array from wrapped response
          const productsArray = action.payload?.data || action.payload || [];

          state.searchProduct = productsArray;  // ✅ Now stores the actual array
          state.loading = false;
          state.error = null;  // ✅ Clear previous errors

          console.log('✅ Search results loaded:', {
            count: productsArray.length,
            firstProduct: productsArray[0]?.title
          });
        }
      )
      .addCase(searchProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || "Failed to search products";
        state.searchProduct = [];  // ✅ Clear results on error
      })
      .addCase(getAllProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        getAllProducts.fulfilled,
        (state, action: PayloadAction<any>) => {
          console.log('🔍 getAllProducts response:', action.payload);

          let productsArray: Product[] = [];
          let totalPages = 1;

          // ✅ Handle wrapped response { success: true, data: [...] }
          if (action.payload?.data && Array.isArray(action.payload.data)) {
            productsArray = action.payload.data;
            totalPages = 1; // Backend may not send pagination for this endpoint
          }
          // Handle paginated response { content: [...], totalPages: 5 }
          else if (action.payload?.content && Array.isArray(action.payload.content)) {
            productsArray = action.payload.content;
            totalPages = action.payload.totalPages || 1;
          }
          // Handle plain array
          else if (Array.isArray(action.payload)) {
            productsArray = action.payload;
            totalPages = 1;
          }

          state.paginatedProducts = action.payload;
          state.products = productsArray;
          state.totalPages = totalPages;
          state.loading = false;

          console.log('✅ Processed products:', {
            count: productsArray.length,
            totalPages,
            firstProduct: productsArray[0]?.title
          });
        }
      )
      .addCase(getAllProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch products";
      });
  },
});

export default productSlice.reducer;

// Define selector functions
export const selectProduct = (state: RootState) => state.products.product;
export const selectProducts = (state: RootState) => state.products.products;
export const selectPaginatedProducts = (state: RootState) =>
  state.products.paginatedProducts;
export const selectProductLoading = (state: RootState) =>
  state.products.loading;
export const selectProductError = (state: RootState) => state.products.error;
