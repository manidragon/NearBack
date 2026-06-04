// D:\Mani\Code with Zosh\Backup\source code\frontend\src\Redux Toolkit\Seller\ReplacementSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../Config/Api";

// ✅ UPDATED: Includes all new replacement workflow statuses
export interface Replacement {
  _id: string;
  orderItem: any;
  customer: any;
  replacementVariant: {
    color: string;
    specifications: Record<string, string>;
    sellingPrice: number;
    stock?: number;
  };
  reason: string;
  description?: string;
  images?: string[];
  status:
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'ORIGINAL_RETURNED'      // ✅ NEW
  | 'REVIEW_COMPLETED'       // ✅ NEW
  | 'REPLACEMENT_SHIPPED'    // ✅ NEW
  | 'COMPLETED'
  | 'CANCELLED';
  replacementOrder?: any;
  trackingNumber?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface ReplacementState {
  replacements: Replacement[];
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: ReplacementState = {
  replacements: [],
  loading: false,
  error: null,
  successMessage: null,
};

// ============================================================================
// ✅ ASYNC THUNKS
// ============================================================================

// Fetch seller replacements
export const fetchSellerReplacements = createAsyncThunk<
  any,
  string,
  { rejectValue: string }
>("replacements/fetchSellerReplacements", async (jwt, { rejectWithValue }) => {
  try {
    const response = await api.get<any>('/api/returns/replacements/seller', {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return response.data; // Returns { success, count, data: [...] }
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || "Failed to fetch replacements");
  }
});

// Approve replacement
export const approveReplacement = createAsyncThunk<
  any,
  { returnId: string; jwt: string },
  { rejectValue: string }
>("replacements/approveReplacement", async ({ returnId, jwt }, { rejectWithValue }) => {
  try {
    const response = await api.put<any>(
      `/api/returns/replacements/${returnId}/approve`,
      {},
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || "Failed to approve replacement");
  }
});

// ✅ NEW: Reject replacement
export const rejectReplacement = createAsyncThunk<
  any,
  { returnId: string; reason: string; jwt: string },
  { rejectValue: string }
>("replacements/rejectReplacement", async ({ returnId, reason, jwt }, { rejectWithValue }) => {
  try {
    const response = await api.put<any>(
      `/api/returns/replacements/${returnId}/reject`,
      { reason },
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || "Failed to reject replacement");
  }
});

// ✅ NEW: Mark original item as returned (Step 3)
export const markOriginalReturned = createAsyncThunk<
  any,
  { returnId: string; jwt: string },
  { rejectValue: string }
>("replacements/markOriginalReturned", async ({ returnId, jwt }, { rejectWithValue }) => {
  try {
    const response = await api.put<any>(
      `/api/returns/replacements/${returnId}/mark-original-returned`,
      {},
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || "Failed to mark original as returned");
  }
});

// ✅ NEW: Complete review of original item (Step 4)
export const completeReview = createAsyncThunk<
  any,
  { returnId: string; reviewNotes?: string; jwt: string },
  { rejectValue: string }
>("replacements/completeReview", async ({ returnId, reviewNotes, jwt }, { rejectWithValue }) => {
  try {
    const response = await api.put<any>(
      `/api/returns/replacements/${returnId}/complete-review`,
      { reviewNotes },
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || "Failed to complete review");
  }
});

// Ship replacement (Step 5)
export const shipReplacement = createAsyncThunk<
  any,
  { returnId: string; trackingNumber: string; jwt: string },
  { rejectValue: string }
>("replacements/shipReplacement", async ({ returnId, trackingNumber, jwt }, { rejectWithValue }) => {
  try {
    const response = await api.put<any>(
      `/api/returns/replacements/${returnId}/ship`,
      { trackingNumber },
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || "Failed to ship replacement");
  }
});

// Mark replacement as completed
export const markReplacementCompleted = createAsyncThunk<
  any,
  { returnId: string; jwt: string },
  { rejectValue: string }
>("replacements/markReplacementCompleted", async ({ returnId, jwt }, { rejectWithValue }) => {
  try {
    const response = await api.put<any>(
      `/api/returns/replacements/${returnId}/mark-completed`,
      {},
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || "Failed to mark as completed");
  }
});

// ============================================================================
// ✅ SLICE DEFINITION
// ============================================================================

const replacementSlice = createSlice({
  name: "replacements",
  initialState,
  reducers: {
    clearReplacementError: (state) => {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    // --- Fetch Replacements ---
    builder.addCase(fetchSellerReplacements.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSellerReplacements.fulfilled, (state, action) => {
      state.loading = false;
      const payload = action.payload;
      // Extract array from wrapped response: { success, count, data }
      state.replacements = payload?.data || payload || [];
    });
    builder.addCase(fetchSellerReplacements.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // --- Approve Replacement ---
    builder.addCase(approveReplacement.pending, (state) => { state.loading = true; });
    builder.addCase(approveReplacement.fulfilled, (state, action) => {
      state.loading = false;
      const updated = action.payload?.data || action.payload;
      if (updated?._id) {
        state.replacements = state.replacements.map(r => r._id === updated._id ? updated : r);
      }
      state.successMessage = "Replacement approved successfully";
    });
    builder.addCase(approveReplacement.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // --- Reject Replacement ---
    builder.addCase(rejectReplacement.pending, (state) => { state.loading = true; });
    builder.addCase(rejectReplacement.fulfilled, (state, action) => {
      state.loading = false;
      const updated = action.payload?.data || action.payload;
      if (updated?._id) {
        state.replacements = state.replacements.map(r => r._id === updated._id ? updated : r);
      }
      state.successMessage = "Replacement rejected";
    });
    builder.addCase(rejectReplacement.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // --- Mark Original Returned ---
    builder.addCase(markOriginalReturned.pending, (state) => { state.loading = true; });
    builder.addCase(markOriginalReturned.fulfilled, (state, action) => {
      state.loading = false;
      const updated = action.payload?.data || action.payload;
      if (updated?._id) {
        state.replacements = state.replacements.map(r => r._id === updated._id ? updated : r);
      }
      state.successMessage = "Original item marked as returned";
    });
    builder.addCase(markOriginalReturned.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // --- Complete Review ---
    builder.addCase(completeReview.pending, (state) => { state.loading = true; });
    builder.addCase(completeReview.fulfilled, (state, action) => {
      state.loading = false;
      const updated = action.payload?.data || action.payload;
      if (updated?._id) {
        state.replacements = state.replacements.map(r => r._id === updated._id ? updated : r);
      }
      state.successMessage = "Review completed";
    });
    builder.addCase(completeReview.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // --- Ship Replacement ---
    builder.addCase(shipReplacement.pending, (state) => { state.loading = true; });
    builder.addCase(shipReplacement.fulfilled, (state, action) => {
      state.loading = false;
      const updated = action.payload?.data || action.payload;
      if (updated?._id) {
        state.replacements = state.replacements.map(r => r._id === updated._id ? updated : r);
      }
      state.successMessage = "Replacement marked as shipped";
    });
    builder.addCase(shipReplacement.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Mark replacement completed
    builder.addCase(markReplacementCompleted.pending, (state) => { state.loading = true; });
    builder.addCase(markReplacementCompleted.fulfilled, (state, action) => {
      state.loading = false;
      const updated = action.payload?.data || action.payload;
      if (updated?._id) {
        state.replacements = state.replacements.map(r => r._id === updated._id ? updated : r);
      }
      state.successMessage = "Replacement marked as completed";
    });
    builder.addCase(markReplacementCompleted.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearReplacementError } = replacementSlice.actions;
export default replacementSlice.reducer;