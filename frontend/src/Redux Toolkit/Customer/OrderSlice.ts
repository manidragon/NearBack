// src/slices/orderSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { type RootState } from "../Store";
import { type Order, type OrderItem, type OrderState } from "../../types/orderTypes";
import { type Address } from "../../types/addressTypes";
import { api } from "../../Config/Api";
import { type ApiResponse } from "../../types/authTypes";

const initialState: OrderState = {
  orders: [],
  orderItem: null,
  currentOrder: null,
  paymentOrder: null,
  loading: false,
  error: null,
  orderCanceled: false,
};

const API_URL = "/api/orders";

// Fetch user order history
export const fetchUserOrderHistory = createAsyncThunk<Order[], string>(
  "orders/fetchUserOrderHistory",
  async (jwt, { rejectWithValue }) => {
    try {
      const response = await api.get<Order[]>(`${API_URL}/user`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      console.log("order history fetched ", response.data);
      return response.data;
    } catch (error: any) {
      console.log("error ", error.response);
      return rejectWithValue(
        error.response?.data?.error || error.message || "Failed to fetch order history"
      );
    }
  }
);

// Fetch order by ID
export const fetchOrderById = createAsyncThunk<
  Order,
  { orderId: string; jwt: string }
>("orders/fetchOrderById", async ({ orderId, jwt }, { rejectWithValue }) => {
  try {
    const response = await api.get(`${API_URL}/${orderId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    console.log("order fetched -", response.data);
    return response.data;
  } catch (error: any) {
    console.log("error fech ordeeer", error.response);
    return rejectWithValue(error.response?.data?.error || "Failed to fetch order");
  }
});

// Create a new order
export const createOrder = createAsyncThunk<
  // ✅ Return type: union of possible responses
  { payment_link_url?: string } | { 
    type: 'RAZORPAY_ORDER'; 
    razorpayOrder: any; 
    paymentOrderId: string;
    fulfillmentType: string;
    pickupTime?: string | null;
  } | { success: boolean; orders: string[] },
  // ✅ Input type: ADD finalAmount? here 👇
  {
    address?: Address;
    fulfillmentType: 'DELIVERY' | 'SELF_PICKUP';
    pickupTime?: string;
    jwt: string;
    paymentGateway: string;
    finalAmount?: number;  // ✅ ADD THIS LINE - allows frontend to send calculated total
  }
>(
  "order/createOrder",
  async (
    { 
      address, 
      fulfillmentType, 
      pickupTime, 
      jwt, 
      paymentGateway,
      finalAmount  // ✅ Extract finalAmount from params
    }, 
    { rejectWithValue }
  ) => {
    try {
      const response = await api.post(
        `/api/orders?paymentMethod=${paymentGateway}`,
        {
          shippingAddress: address,
          fulfillmentType,
          pickupTime,
          finalAmount  // ✅ Send finalAmount to backend (includes shipping, fees, discount)
        },
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );

      // ✅ Handle both response formats:
      
      // Format 1: Razorpay Modal (NEW)
      if (response.data.type === 'RAZORPAY_ORDER') {
        return {
          type: 'RAZORPAY_ORDER',
          razorpayOrder: response.data.razorpayOrder,
          paymentOrderId: response.data.paymentOrderId,
          fulfillmentType: response.data.fulfillmentType,
          pickupTime: response.data.pickupTime
        };
      }
      
      // Format 2: Payment Link (OLD - fallback)
      if (response.data.payment_link_url) {
        return { payment_link_url: response.data.payment_link_url };
      }
      
      // Format 3: COD - orders created immediately
      if (response.data.success && response.data.orders) {
        return response.data;
      }
      
      // Default: return full response
      return response.data;
      
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to create order"
      );
    }
  }
);

export const fetchOrderItemById = createAsyncThunk<
  OrderItem,
  { orderItemId: string; jwt: string }
>(
  "orders/fetchOrderItemById",
  async ({ orderItemId, jwt }, { rejectWithValue }) => {
    try {
      const response = await api.get(
        `${API_URL}/item/${orderItemId}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      console.log("order item fetched -- ", response.data);
      return response.data;
    } catch (error: any) {
      console.log("error ", error.response);
      return rejectWithValue(error.response?.data?.error || "Failed to fetch order item");
    }
  }
);

// payment success handler
export const paymentSuccess = createAsyncThunk<
  ApiResponse,
  { paymentId: string; jwt: string; paymentLinkId: string },
  { rejectValue: string }
>(
  "orders/paymentSuccess",
  async ({ paymentId, jwt, paymentLinkId }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/payment/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
        params: { paymentLinkId },
      });
      console.log("payment success ", response.data);
      return response.data;
    } catch (error: any) {
      console.log("error ", error.response);
      if (error.response) {
        return rejectWithValue(error.response.data.message || "Payment verification failed");
      }
      return rejectWithValue("Failed to process payment");
    }
  }
);

export const cancelOrder = createAsyncThunk<Order, string, { rejectValue: string }>(
  "orders/cancelOrder",
  async (orderId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem("jwt");
      if (!jwt) {
        return rejectWithValue("Authentication required");
      }

      const response = await api.put<Order>(
        `${API_URL}/${orderId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response?.data?.error) {
        return rejectWithValue(error.response.data.error);
      }
      return rejectWithValue("Failed to cancel order. Please try again.");
    }
  }
);

// ✅ NEW: Schedule pickup time thunk
export const schedulePickupTime = createAsyncThunk<Order,
  { orderId: string; pickupTime: string; jwt: string }
>(
  "orders/schedulePickupTime",
  async ({ orderId, pickupTime, jwt }, { rejectWithValue }) => {
    try {
      const response = await api.put<Order>(
        `${API_URL}/${orderId}/pickup-time`,
        { pickupTime },
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      console.log("Pickup time scheduled", response.data);
      return response.data;
    } catch (error: any) {
      console.log("error scheduling pickup time", error.response);
      return rejectWithValue(error.response?.data?.message || "Failed to schedule pickup time");
    }
  }
);

const orderSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    resetOrderState: (state) => {
      state.orders = [];
      state.orderItem = null;
      state.currentOrder = null;
      state.paymentOrder = null;
      state.loading = false;
      state.error = null;
      state.orderCanceled = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user order history
      .addCase(fetchUserOrderHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.orderCanceled = false;
      })
      .addCase(
        fetchUserOrderHistory.fulfilled,
        (state, action: PayloadAction<Order[]>) => {
          state.orders = action.payload;
          state.loading = false;
        }
      )
      .addCase(fetchUserOrderHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch order by ID
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchOrderById.fulfilled,
        (state, action: PayloadAction<Order>) => {
          state.currentOrder = action.payload;
          state.loading = false;
        }
      )
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Create a new order
      .addCase(createOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.paymentOrder = action.payload;
        state.loading = false;
      })
      .addCase(createOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Fetch Order Item by ID
      .addCase(fetchOrderItemById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderItemById.fulfilled, (state, action) => {
        state.loading = false;
        state.orderItem = action.payload;
      })
      .addCase(fetchOrderItemById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // payment success handler
      .addCase(paymentSuccess.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(paymentSuccess.fulfilled, (state, action) => {
        state.loading = false;
        state.orderCanceled = false;
        console.log("Payment successful:", action.payload);
      })
      .addCase(paymentSuccess.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(cancelOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.orderCanceled = false;
      })
      .addCase(cancelOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = state.orders.map((order) =>
          order._id === action.payload._id ? action.payload : order
        );
        state.orderCanceled = true;
        state.currentOrder = action.payload;
      })
      .addCase(cancelOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // ✅ Schedule pickup time cases
      .addCase(schedulePickupTime.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(schedulePickupTime.fulfilled, (state, action: PayloadAction<Order>) => {
        state.loading = false;
        const index = state.orders.findIndex(order => order._id === action.payload._id);
        if (index !== -1) {
          state.orders[index] = action.payload;
        }
        state.currentOrder = action.payload;
      })
      .addCase(schedulePickupTime.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default orderSlice.reducer;

// 🔥 EXPORT NEW ACTION
export const { resetOrderState } = orderSlice.actions;

export const selectOrders = (state: RootState) => state.orders.orders;
export const selectCurrentOrder = (state: RootState) =>
  state.orders.currentOrder;
export const selectPaymentOrder = (state: RootState) =>
  state.orders.paymentOrder;
export const selectOrdersLoading = (state: RootState) => state.orders.loading;
export const selectOrdersError = (state: RootState) => state.orders.error;