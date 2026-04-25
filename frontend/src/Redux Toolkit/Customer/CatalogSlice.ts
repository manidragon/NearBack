// D:\Mani\Code with Zosh\Backup\source code\frontend\src\Redux Toolkit\Customer\CatalogSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import type { ProductVariantPayload, ProductOfferPayload } from '../../seller/pages/Products/types/productFormTypes';

// ✅ API base URL - adjust based on your config
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ✅✅✅ UPDATED: Catalog offer interface for multi-seller support
export interface CatalogOffer {
  _id: string;
  seller: {
    _id: string;
    sellerName: string;
    businessDetails?: {
      businessName?: string;
    };
  };
  // ✅ NEW: variants now have offers array (not direct price fields)
  variants: {
    _id?: string;
    color: string;
    specifications: Record<string, string | number | boolean>;
    images: string[];
    offers: {
      sellerId: string;
      mrpPrice: number;
      sellingPrice: number;
      stock: number;
      sku?: string;
      isActive: boolean;
      variantOwner?: string;
    }[];
    isActive?: boolean;
  }[];
  minPrice: number;
  maxPrice: number;
}

// ✅ Product catalog interface
export interface ProductCatalog {
  _id: string;
  title: string;
  description: string;
  brand?: string;
  images: string[];
  category: any;
  specifications: Record<string, string>;
  // ✅ UPDATED: variantTemplate now uses offers array structure
  variantTemplate: {
    color: string;
    specifications: Record<string, string | number | boolean>;
    images: string[];
    mrpPrice?: number;  // Template default (seller can override)
    sellingPrice?: number;  // Template default (seller can override)
    stock?: number;  // Template default (seller can override)
    sku?: string;
  }[];
  lowestPrice: number;
  totalOffers: number;
  offers: CatalogOffer[];
  // ✅ NEW: For catalog search results - backend-provided ownership flag
  isOwner?: boolean;
}

// ✅ Catalog state interface
interface CatalogState {
  catalog: ProductCatalog | null;
  searchResults: ProductCatalog[];
  loading: boolean;
  error: string | null;
  selectedSellerOffer: CatalogOffer | null;
  // ✅ NEW: For catalog offer listing state
  listingOffer: boolean;
  listingError: string | null;
}

// ✅ Initial state
const initialState: CatalogState = {
  catalog: null,
  searchResults: [],
  loading: false,
  error: null,
  selectedSellerOffer: null,
  listingOffer: false,
  listingError: null
};

// ✅ Search catalog
export const searchCatalog = createAsyncThunk<ProductCatalog[], string>(
  'catalog/search',
  async (query, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem('jwt');
      const response = await axios.get(`${API_BASE_URL}/api/catalog/search`, {
        params: { q: query, limit: 10 },
        headers: {
          'Content-Type': 'application/json',
          ...(jwt && { 'Authorization': `Bearer ${jwt}` })
        }
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Search failed');
    }
  }
);

// ✅ Get catalog by ID
export const getCatalogById = createAsyncThunk<ProductCatalog, string>(
  'catalog/getById',
  async (catalogId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem('jwt');
      const response = await axios.get(`${API_BASE_URL}/api/catalog/${catalogId}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(jwt && { 'Authorization': `Bearer ${jwt}` })
        }
      });
      return response.data.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch catalog');
    }
  }
);

// ✅✅✅ UPDATED: List offer on catalog - handles new offers[] structure
export const listOfferOnCatalog = createAsyncThunk(
  'catalog/listOffer',
  async ({ catalogId, offerData, jwt }: {
    catalogId: string;
    offerData: { variants: ProductVariantPayload[] };
    jwt: string
  }, { rejectWithValue }) => {
    try {
      // ✅ FIX: Use singular "/offer" to match backend route
      const response = await axios.post(
        `${API_BASE_URL}/api/catalog/${catalogId}/offer`,  // ✅ Changed: /offers → /offer
        offerData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          }
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ✅ NEW: Update existing catalog offer (for editing price/stock)
export const updateCatalogOffer = createAsyncThunk(
  'catalog/updateOffer',
  async ({
    catalogId,
    offerId,
    offerData,
    jwt
  }: {
    catalogId: string;
    offerId: string;
    offerData: { variants: ProductVariantPayload[] };
    jwt: string
  }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/catalog/${catalogId}/offers/${offerId}`,
        offerData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          }
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ✅ NEW: Remove seller's offer from catalog
export const removeCatalogOffer = createAsyncThunk<void, { catalogId: string; offerId: string; jwt: string }>(
  'catalog/removeOffer',
  async ({ catalogId, offerId, jwt }, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${API_BASE_URL}/api/catalog/${catalogId}/offers/${offerId}`,
        {
          headers: {
            'Authorization': `Bearer ${jwt}`
          }
        }
      );
    } catch (error: any) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ✅ Create catalog slice
const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setSelectedSellerOffer: (state, action: PayloadAction<CatalogOffer | null>) => {
      state.selectedSellerOffer = action.payload;
    },
    clearCatalog: (state) => {
      state.catalog = null;
      state.error = null;
      state.selectedSellerOffer = null;
    },
    // ✅ NEW: Reset listing state after success/error
    resetListingState: (state) => {
      state.listingOffer = false;
      state.listingError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // ✅ Search catalog
      .addCase(searchCatalog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchCatalog.fulfilled, (state, action) => {
        state.loading = false;
        state.searchResults = action.payload;
      })
      .addCase(searchCatalog.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ✅ Get catalog by ID
      .addCase(getCatalogById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCatalogById.fulfilled, (state, action) => {
        state.loading = false;
        state.catalog = action.payload;
      })
      .addCase(getCatalogById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ✅ List offer on catalog
      .addCase(listOfferOnCatalog.pending, (state) => {
        state.listingOffer = true;
        state.listingError = null;
      })
      .addCase(listOfferOnCatalog.fulfilled, (state, action) => {
        state.listingOffer = false;
        // ✅ Optionally: refresh catalog to include new offer
        // This would typically trigger a re-fetch of the catalog
      })
      .addCase(listOfferOnCatalog.rejected, (state, action) => {
        state.listingOffer = false;
        state.listingError = action.payload as string;
      })

      // ✅ Update catalog offer
      .addCase(updateCatalogOffer.pending, (state) => {
        state.listingOffer = true;
        state.listingError = null;
      })
      .addCase(updateCatalogOffer.fulfilled, (state) => {
        state.listingOffer = false;
      })
      .addCase(updateCatalogOffer.rejected, (state, action) => {
        state.listingOffer = false;
        state.listingError = action.payload as string;
      })

      // ✅ Remove catalog offer
      .addCase(removeCatalogOffer.pending, (state) => {
        state.loading = true;
      })
      .addCase(removeCatalogOffer.fulfilled, (state) => {
        state.loading = false;
        // Optionally remove the offer from local state
      })
      .addCase(removeCatalogOffer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

// ✅ Export actions and reducer
export const { setSelectedSellerOffer, clearCatalog, resetListingState } = catalogSlice.actions;
export default catalogSlice.reducer;