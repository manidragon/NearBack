// D:\Mani\Code with Zosh\Backup\source code\frontend\src\Redux Toolkit\Admin\DealSlice.ts

import { createSlice, createAsyncThunk,type PayloadAction } from "@reduxjs/toolkit";
import {type ApiResponse,type Deal,type DealsState } from "../../types/dealTypes";
import { api } from "../../Config/Api";
// Define the initial state
const initialState: DealsState = {
  deals: [],
  loading: false,
  error: null,
  dealCreated:false,
  dealUpdated:false,
};

export const createDeal = createAsyncThunk(
  "deals/createDeal",
  async (deal: any, { rejectWithValue }) => {
    try {
      // ✅ Public route - no auth needed
      const response = await api.post("/api/deals", deal);
      console.log("✅ Deal created:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error creating deal:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || "Failed to create deal");
    }
  }
);

export const getAllDeals = createAsyncThunk(
  "deals/getAllDeals",
  async (_, { rejectWithValue }) => {
    try {
      // ✅ Public route - no auth needed
      const response = await api.get("/api/deals");
      console.log("✅ Deals fetched:", response.data.length);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error fetching deals:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || "Failed to fetch deals");
    }
  }
);

export const deleteDeal = createAsyncThunk<ApiResponse, string>(
  "deals/deleteDeal",
  async (id: string, { rejectWithValue }) => {
    try {
      // ✅ Public route - no auth needed
      const response = await api.delete(`/api/deals/${id}`);
      console.log("✅ Deal deleted:", id);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error deleting deal:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || "Failed to delete deal");
    }
  }
);

export const updateDeal = createAsyncThunk<Deal, { id: string; deal: any }>(
  "deals/updateDeal",
  async ({ id, deal }, { rejectWithValue }) => {
    try {
      // ✅ Public route - no auth needed
      const response = await api.patch(`/api/deals/${id}`, deal);
      console.log("✅ Deal updated:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("❌ Error updating deal:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || "Failed to update deal");
    }
  }
);

// Create the slice
const dealSlice = createSlice({
  name: "deals",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
    .addCase(getAllDeals.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.dealCreated=false;
      state.dealUpdated=false;
    })
    .addCase(getAllDeals.fulfilled, (state, action) => {
      state.loading = false;
      state.deals=action.payload;
    })
    .addCase(getAllDeals.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    })
      .addCase(createDeal.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.dealCreated=false;
      })
      .addCase(createDeal.fulfilled, (state, action: PayloadAction<Deal>) => {
        state.loading = false;
        state.deals.push(action.payload);
        state.dealCreated=true;
      })
      .addCase(createDeal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteDeal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDeal.fulfilled, (state, action) => {
        state.loading = false;
        console.log("action.meta.arg",action.meta.arg)
        
          console.log("action.meta.arg , ",action.meta.arg)
          state.deals = state.deals.filter(
            (deal) => deal._id !== action.meta.arg
          );
        
      })
      .addCase(deleteDeal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateDeal.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.dealUpdated=false;
      })
      .addCase(updateDeal.fulfilled, (state, action: PayloadAction<Deal>) => {
        state.loading = false;
        state.dealUpdated=true;
        const index = state.deals.findIndex((deal) => deal._id === action.payload._id);
        if (index !== -1) {
          state.deals[index] = action.payload;
        }
      })
      .addCase(updateDeal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default dealSlice.reducer;
