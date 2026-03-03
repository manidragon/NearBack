// src/redux/slices/sellerOrderSlice.ts

import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { type Order, type OrderStatus } from '../../types/orderTypes'; 
import { type ApiResponse } from '../../types/authTypes';
import { api } from '../../Config/Api';

interface SellerOrderState {
  orders: Order[];
  loading: boolean;
  error: string | null;
}

const initialState: SellerOrderState = {
  orders: [],
  loading: false,
  error: null,
};

// Thunks for async actions
export const fetchSellerOrders = createAsyncThunk<Order[], string>(
  'sellerOrders/fetchSellerOrders',
  async (jwt, { rejectWithValue }) => {
    try {
      const response = await api.get('/api/seller/orders', {
        headers: { Authorization: `Bearer ${jwt}` },
      });

      console.log("fetch seller orders",response.data)
      return response.data;
    } catch (error: any) {
      console.log("error",error.response)
      return rejectWithValue(error.response.data);
    }
  }
);

// ✅ FIX: Changed orderId type from number to string
export const updateOrderStatus = createAsyncThunk<Order, 
{ jwt: string, 
  orderId: string, // 👈 Changed from number to string
  orderStatus: OrderStatus 
}>(
  'sellerOrders/updateOrderStatus',
  async ({ jwt, orderId, orderStatus }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/api/seller/orders/${orderId}/status/${orderStatus}`, 
        {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwt')}` },
      });
      console.log("order status updated",response.data)
      return response.data;
    } catch (error: any) {
      console.log("error updating order status ---- ",error)
      return rejectWithValue(error.response.data);
    }
  }
);

// ✅ FIX: Changed orderId type from number to string
export const deleteOrder = createAsyncThunk<ApiResponse, { jwt: string, orderId: string }>(
  'sellerOrders/deleteOrder',
  async ({ jwt, orderId }, { rejectWithValue }) => {
    try {
      const response = await api.delete(`/api/seller/orders/${orderId}/delete`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data);
    }
  }
);

const sellerOrderSlice = createSlice({
  name: 'sellerOrders',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSellerOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSellerOrders.fulfilled, (state, action: PayloadAction<Order[]>) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchSellerOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateOrderStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action: PayloadAction<Order>) => {
        state.loading = false;
        const index = state.orders.findIndex(order => order._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOrder.fulfilled, (state, action) => {
        state.loading = false;
        // ✅ FIX: Compare orderId as string
        state.orders = state.orders.filter(order => order._id !== action.meta.arg.orderId.toString());
      })
      .addCase(deleteOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default sellerOrderSlice.reducer;