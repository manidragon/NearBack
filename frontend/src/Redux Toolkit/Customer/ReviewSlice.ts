import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from "@reduxjs/toolkit";
import {
  type ApiResponse,
  type CreateReviewRequest,
  type Review,
  type ReviewState,
} from "../../types/reviewTypes";
import { api } from "../../Config/Api";

const API_URL = "/api/reviews";

// ✅ FETCH REVIEWS BY PRODUCT ID
export const fetchReviewsByProductId = createAsyncThunk<Review[], any>(
  "review/fetchReviewsByProductId",
  async ({ productId }, { rejectWithValue }) => {
    try {
      const response = await api.get(`${API_URL}/product/${productId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("jwt")}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.log("error - ", error.response?.data);
      return rejectWithValue(
        error.response?.data || "Failed to fetch reviews"
      );
    }
  }
);

// ✅ CREATE REVIEW — navigates BACK to order details page after success
export const createReview = createAsyncThunk<Review, any>(
  "review/createReview",
  async ({ productId, review, jwt, navigate }, { rejectWithValue }) => {
    try {
      const response = await api.post(
        `${API_URL}/product/${productId}`,
        review,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      console.log("review created: ", response.data);

      // ✅ Go BACK to OrderDetails so the review appears immediately
      navigate(-1);

      return response.data;
    } catch (error: any) {
      console.log("create review error: ", error);
      return rejectWithValue(
        error.response?.data || "Failed to create review"
      );
    }
  }
);

// ✅ UPDATE REVIEW
export const updateReview = createAsyncThunk<
  Review,
  { reviewId: number; review: CreateReviewRequest; jwt: string },
  { rejectValue: string }
>(
  "review/updateReview",
  async ({ reviewId, review, jwt }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`${API_URL}/${reviewId}`, review, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("updated review: ", response.data);
      return response.data;
    } catch (error: any) {
      console.log("error ", error);
      return rejectWithValue(
        error.response?.data || "Failed to update review"
      );
    }
  }
);

// ✅ DELETE REVIEW
export const deleteReview = createAsyncThunk<ApiResponse, any>(
  "review/deleteReview",
  async ({ reviewId, jwt }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`${API_URL}/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      return response.data;
    } catch (error: any) {
      console.log("error ", error);
      return rejectWithValue(
        error.response?.data || "Failed to delete review"
      );
    }
  }
);

// ✅ INITIAL STATE
const initialState: ReviewState = {
  reviews: [],
  loading: false,
  error: null,
  reviewCreated: false,
  reviewUpdated: false,
  reviewDeleted: false,
};

// ✅ SLICE
const reviewSlice = createSlice({
  name: "review",
  initialState,
  reducers: {
    resetReviewState: (state) => {
      state.reviews = [];
      state.loading = false;
      state.error = null;
      state.reviewCreated = false;
      state.reviewUpdated = false;
      state.reviewDeleted = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH REVIEWS
      .addCase(fetchReviewsByProductId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchReviewsByProductId.fulfilled,
        (state, action: PayloadAction<Review[]>) => {
          // ✅ Replace reviews array with fresh data from backend
          state.reviews = action.payload;
          state.loading = false;
        }
      )
      .addCase(fetchReviewsByProductId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // CREATE REVIEW
      .addCase(createReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.reviewCreated = false;
      })
      .addCase(
        createReview.fulfilled,
        (state, action: PayloadAction<Review>) => {
          // ✅ Push the newly created review into the array immediately
          // so it shows up in OrderDetails without waiting for a refetch
          state.reviews.push(action.payload);
          state.loading = false;
          state.reviewCreated = true;
        }
      )
      .addCase(createReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.reviewCreated = false;
      })

      // UPDATE REVIEW
      .addCase(updateReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.reviewUpdated = false;
      })
      .addCase(
        updateReview.fulfilled,
        (state, action: PayloadAction<Review>) => {
          const index = state.reviews.findIndex(
            (r) => r._id === action.payload._id
          );
          if (index !== -1) {
            state.reviews[index] = action.payload;
          }
          state.loading = false;
          state.reviewUpdated = true;
        }
      )
      .addCase(updateReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.reviewUpdated = false;
      })

      // DELETE REVIEW
      .addCase(deleteReview.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.reviewDeleted = false;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.reviews = state.reviews.filter(
          (r) => r._id !== action.meta.arg.reviewId
        );
        state.loading = false;
        state.reviewDeleted = true;
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.reviewDeleted = false; 
      });
  },
});

export default reviewSlice.reducer;
export const { resetReviewState } = reviewSlice.actions;