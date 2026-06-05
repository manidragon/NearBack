// D:\Mani\Code with Zosh\Backup\source code\frontend\src\Redux Toolkit\Customer\ReturnSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../Config/Api";
import {
  type ReturnRequest,
  type ReturnStatus,
  type Wallet,
  type ReturnReason
} from "../../types/orderTypes";

// ============================================================================
//  STATE INTERFACE
// ============================================================================
interface ReturnState {
  returns: ReturnRequest[];
  currentReturn: ReturnRequest | null;
  wallet: Wallet | null;
  loading: boolean;
  error: string | null;
  successMessage: string | null;
}

const initialState: ReturnState = {
  returns: [],
  currentReturn: null,
  wallet: null,
  loading: false,
  error: null,
  successMessage: null,
};

// ============================================================================
//  API CONSTANTS
// ============================================================================
const API_URL = "/api/returns";

// ============================================================================
//  ASYNC THUNKS (API CALLS)
// ============================================================================

// 1. FETCH CUSTOMER RETURNS
export const fetchUserReturns = createAsyncThunk<ReturnRequest[], string>(
  "returns/fetchUserReturns",
  async (jwt, { rejectWithValue }) => {
    try {
      const response = await api.get<ReturnRequest[]>(API_URL, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch returns");
    }
  }
);

// 2. CREATE RETURN REQUEST
export const createReturnRequest = createAsyncThunk<
  ReturnRequest,
  {
    orderItemId: string;
    reason: ReturnReason | string;
    description?: string;
    images?: string[];
    refundMethod?: 'WALLET' | 'RAZORPAY' | 'BANK_TRANSFER';
    jwt: string;
  }
>("returns/createReturn", async (data, { rejectWithValue }) => {
  try {
    const response = await api.post<ReturnRequest>(API_URL, {
      orderItemId: data.orderItemId,
      reason: data.reason,
      description: data.description,
      images: data.images,
      refundMethod: data.refundMethod || 'WALLET',
    }, {
      headers: { Authorization: `Bearer ${data.jwt}` },
    });
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || "Failed to create return");
  }
});

// 2.5 CREATE REPLACEMENT REQUEST (Phase 3)
export const createReplacementRequest = createAsyncThunk<
  ReturnRequest,
  {
    orderItemId: string;
    reason: string;
    description?: string;
    images?: string[];
    replacementVariant: {
      variantId: string;
      color: string;
      specifications?: Record<string, string>;
      sellingPrice: number;
      stock: number;
    };
    refundMethod?: 'WALLET' | 'RAZORPAY';
    jwt: string;
  }
>("returns/createReplacement", async (data, { rejectWithValue }) => {
  try {
    const response = await api.post<ReturnRequest>('/api/returns/replacements', {
      orderItemId: data.orderItemId,
      reason: data.reason,
      description: data.description,
      images: data.images,
      replacementVariant: data.replacementVariant,
      refundMethod: data.refundMethod,
    }, {
      headers: { Authorization: `Bearer ${data.jwt}` },
    });
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.error || "Failed to create replacement");
  }
});

// 3. FETCH SELLER RETURNS
export const fetchSellerReturns = createAsyncThunk<ReturnRequest[], string>(
  "returns/fetchSellerReturns",
  async (jwt, { rejectWithValue }) => {
    try {
      const response = await api.get<ReturnRequest[]>(`${API_URL}/seller`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Failed to fetch seller returns");
    }
  }
);

// 4. APPROVE RETURN (Seller)
export const approveReturn = createAsyncThunk<ReturnRequest, { returnId: string; jwt: string }>(
  "returns/approveReturn",
  async ({ returnId, jwt }, { rejectWithValue }) => {
    try {
      const response = await api.put<ReturnRequest>(`${API_URL}/${returnId}/approve`, {}, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Failed to approve return");
    }
  }
);

// 5. REJECT RETURN (Seller)
export const rejectReturn = createAsyncThunk<ReturnRequest, { returnId: string; reason: string; jwt: string }>(
  "returns/rejectReturn",
  async ({ returnId, reason, jwt }, { rejectWithValue }) => {
    try {
      const response = await api.put<ReturnRequest>(`${API_URL}/${returnId}/reject`, {
        reason,
      }, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Failed to reject return");
    }
  }
);

// 6. UPDATE RETURN STATUS (Seller: Picked Up -> Completed)
export const updateReturnStatus = createAsyncThunk<ReturnRequest, { returnId: string; status: ReturnStatus; jwt: string }>(
  "returns/updateReturnStatus",
  async ({ returnId, status, jwt }, { rejectWithValue }) => {
    try {
      const response = await api.put<ReturnRequest>(`${API_URL}/${returnId}/status`, {
        status,
      }, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || "Failed to update status");
    }
  }
);

// ============================================================================
//  SLICE DEFINITION
// ============================================================================

const returnSlice = createSlice({
  name: "returns",
  initialState,
  reducers: {
    clearReturnError: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    clearSuccessMessage: (state) => {
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    // --- Fetch User Returns ---
    builder.addCase(fetchUserReturns.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchUserReturns.fulfilled, (state, action: PayloadAction<any>) => {
      const returnsData = Array.isArray(action.payload)
        ? action.payload
        : action.payload?.data || [];
      state.returns = returnsData;
      state.loading = false;
    });
    builder.addCase(fetchUserReturns.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // --- Create Return ---
    builder.addCase(createReturnRequest.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createReturnRequest.fulfilled, (state, action: PayloadAction<ReturnRequest>) => {
      state.returns = [action.payload, ...state.returns];
      state.currentReturn = action.payload;
      state.loading = false;
      state.successMessage = "Return request submitted successfully!";
    });
    builder.addCase(createReturnRequest.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // --- Create Replacement ---
builder.addCase(createReplacementRequest.pending, (state) => {
  state.loading = true;
  state.error = null;
});
builder.addCase(createReplacementRequest.fulfilled, (state, action: PayloadAction<ReturnRequest>) => {
  state.returns = [action.payload, ...state.returns];
  state.currentReturn = action.payload;
  state.loading = false;
  state.successMessage = "Replacement request submitted successfully!";
});
builder.addCase(createReplacementRequest.rejected, (state, action) => {
  state.loading = false;
  state.error = action.payload as string;
});

    // --- Fetch Seller Returns ---
    builder.addCase(fetchSellerReturns.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchSellerReturns.fulfilled, (state, action: PayloadAction<any>) => {
      const returnsData = Array.isArray(action.payload)
        ? action.payload
        : action.payload?.data || [];
      state.returns = returnsData;
      state.loading = false;
    });
    builder.addCase(fetchSellerReturns.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // --- Approve Return ---
    builder.addCase(approveReturn.pending, (state) => { state.loading = true; });
    builder.addCase(approveReturn.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      
      // ✅ FIX: Handle wrapped response { success, message, data }
      const payload = action.payload;
      const updatedReturn = payload?.data || payload;
      
      // Immutable update
      state.returns = state.returns.map(r =>
        r._id === updatedReturn._id ? updatedReturn : r
      );
      
      if (state.currentReturn?._id === updatedReturn._id) {
        state.currentReturn = updatedReturn;
      }
      state.successMessage = "Return approved successfully!";
    });
    builder.addCase(approveReturn.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // --- Reject Return ---
    builder.addCase(rejectReturn.pending, (state) => { state.loading = true; });
    builder.addCase(rejectReturn.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      
      // ✅ FIX: Handle wrapped response
      const payload = action.payload;
      const updatedReturn = payload?.data || payload;
      
      // Immutable update
      state.returns = state.returns.map(r =>
        r._id === updatedReturn._id ? updatedReturn : r
      );
      
      if (state.currentReturn?._id === updatedReturn._id) {
        state.currentReturn = updatedReturn;
      }
      state.successMessage = "Return rejected.";
    });
    builder.addCase(rejectReturn.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // --- Update Status ---
    builder.addCase(updateReturnStatus.pending, (state) => { state.loading = true; });
    builder.addCase(updateReturnStatus.fulfilled, (state, action: PayloadAction<any>) => {
      state.loading = false;
      
      // ✅✅✅ CRITICAL FIX: Handle wrapped API response
      const payload = action.payload;
      const updatedReturn = payload?.data || payload;  // Extract ReturnRequest from { success, message, data }
      
      // Immutable update with map (creates new array reference)
      state.returns = state.returns.map(returnItem =>
        returnItem._id === updatedReturn._id ? { ...updatedReturn } : returnItem
      );
      
      // Update current return if matching
      if (state.currentReturn?._id === updatedReturn._id) {
        state.currentReturn = { ...updatedReturn };
      }
      
      // Safe status extraction
      const status = updatedReturn.status || 'COMPLETED';
      state.successMessage = `Status updated to ${status}`;
    });
    builder.addCase(updateReturnStatus.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { clearReturnError, clearSuccessMessage } = returnSlice.actions;
export default returnSlice.reducer;