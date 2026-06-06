import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { api } from "../../Config/Api";

// ─────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────
export interface SellerReview {
  _id: string;
  reviewText: string;
  rating: number;
  images: string[];
  seller: string;
  user: {
    _id: string;
    fullName: string;
    profilePicture?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface SellerReviewState {
  // keyed by sellerId → reviews array
  reviewsBySeller: Record<string, SellerReview[]>;
  loading: boolean;
  error: string | null;
  reviewCreated: boolean;
}

// ─────────────────────────────────────────
// THUNKS
// ─────────────────────────────────────────

// ✅ FETCH reviews for a specific seller
export const fetchSellerReviews = createAsyncThunk<
  { sellerId: string; reviews: SellerReview[] },
  { sellerId: string }
>(
  "sellerReview/fetchSellerReviews",
  async ({ sellerId }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/seller-review/${sellerId}`);

      console.log("Seller Reviews API:", response.data);
      return { sellerId, reviews: response.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch seller reviews"
      );
    }
  }
);

// ✅ CREATE a seller review
export const createSellerReview = createAsyncThunk<
  { sellerId: string; review: SellerReview },
  {
    sellerId: string;
    reviewText: string;
    rating: number;
    images: string[];
    navigate: any;
  }
>(
  "sellerReview/createSellerReview",
  async (
    { sellerId, reviewText, rating, images, navigate },
    { rejectWithValue }
  ) => {
    try {
      const jwt = localStorage.getItem("jwt") || "";
      const response = await api.post(
        `/api/seller-review`,
        { sellerId, reviewText, rating, images },
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      console.log("✅ Seller review created:", response.data);
      navigate(-1); // ✅ Go back to order details
      return { sellerId, review: response.data };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data || "Failed to create seller review"
      );
    }
  }
);

// ─────────────────────────────────────────
// INITIAL STATE
// ─────────────────────────────────────────
const initialState: SellerReviewState = {
  reviewsBySeller: {},
  loading: false,
  error: null,
  reviewCreated: false,
};

// ─────────────────────────────────────────
// SLICE
// ─────────────────────────────────────────
const sellerReviewSlice = createSlice({
  name: "sellerReview",
  initialState,
  reducers: {
    resetSellerReviewState: (state) => {
      state.reviewsBySeller = {};
      state.loading = false;
      state.error = null;
      state.reviewCreated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchSellerReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerReviews.fulfilled, (state, action) => {
        const { sellerId, reviews } = action.payload;
        state.reviewsBySeller[sellerId] = reviews;
        state.loading = false;
      })
      .addCase(fetchSellerReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // CREATE
      .addCase(createSellerReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.reviewCreated = false;
      })
      .addCase(createSellerReview.fulfilled, (state, action) => {
        const { sellerId, review } = action.payload;
        if (!state.reviewsBySeller[sellerId]) {
          state.reviewsBySeller[sellerId] = [];
        }
        state.reviewsBySeller[sellerId].push(review);
        state.loading = false;
        state.reviewCreated = true;
      })
      .addCase(createSellerReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.reviewCreated = false;
      });
  },
});

export default sellerReviewSlice.reducer;
export const { resetSellerReviewState } = sellerReviewSlice.actions;