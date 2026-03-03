// src/slices/cartSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { type Cart, type CartItem } from "../../types/cartTypes";
import { api } from "../../Config/Api";
import { type RootState } from "../Store";
import { applyCoupon } from "./CouponSlice";
import { sumCartItemMrpPrice, sumCartItemSellingPrice } from "../../util/cartCalculator";
import { createSelector } from '@reduxjs/toolkit';


// ✅ Define a safe empty cart structure
const emptyCart: Cart = {
  _id: null,
  user: null,
  cartItems: [],
  totalSellingPrice: 0,
  totalMrpPrice: 0,
  totalItem: 0,
  discount: 0,
  couponCode: null,
  couponPrice: 0,
  createdAt: "",
  updatedAt: "",
};

interface CartState {
  cart: Cart; // ✅ Now always a Cart object, never null
  loading: boolean;
  error: string | null;
}

// ✅ Initial state uses emptyCart
const initialState: CartState = {
  cart: emptyCart,
  loading: false,
  error: null,
};

const API_URL = "/api/cart";

export const fetchUserCart = createAsyncThunk<Cart, string>(
  "cart/fetchUserCart",
  async (jwt: string, { rejectWithValue }) => {
    try {
      const response = await api.get(API_URL, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch user cart");
    }
  }
);

interface AddItemRequest {
  productId: string;
  size: string;
  quantity: number;
}

export const addItemToCart = createAsyncThunk<
  Cart,
  { jwt: string; request: AddItemRequest }
>("cart/addItemToCart", async ({ jwt, request }, { rejectWithValue }) => {
  try {
    const response = await api.put(`${API_URL}/add`, request, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || "Failed to add item to cart");
  }
});

export const deleteCartItem = createAsyncThunk<
  { cartItemId: string },
  { jwt: string; cartItemId: string }
>("cart/deleteCartItem", async ({ jwt, cartItemId }, { rejectWithValue }) => {
  try {
    await api.delete(`${API_URL}/item/${cartItemId}`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    return { cartItemId };
  } catch (error: any) {
    return rejectWithValue(
      error.response?.data?.message || "Failed to delete cart item"
    );
  }
});

export const updateCartItem = createAsyncThunk<
  CartItem,
  { jwt: string; cartItemId: string; cartItem: { quantity: number } }
>(
  "cart/updateCartItem",
  async ({ jwt, cartItemId, cartItem }, { rejectWithValue }) => {
    try {
      const response = await api.put(
        `${API_URL}/item/${cartItemId}`,
        cartItem,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update cart item"
      );
    }
  }
);

export const selectCartItemCount = createSelector(
  (state: RootState) => state.cart.cart,
  (cart) => cart?.cartItems?.length ?? 0
);

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    resetCartState: (state) => {
      // ✅ Reset to emptyCart, not null
      state.cart = emptyCart;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserCart.fulfilled, (state, action: PayloadAction<Cart>) => {
        state.cart = action.payload;
        state.loading = false;
      })
      .addCase(fetchUserCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // Optional: keep emptyCart on error instead of leaving stale data
        // state.cart = emptyCart;
      })
      .addCase(addItemToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addItemToCart.fulfilled, (state, action: PayloadAction<Cart>) => {
        console.log('✅ Cart updated:', action.payload);
        console.log('✅ New cart items count:', action.payload.cartItems?.length);
        state.cart = action.payload;
        state.loading = false;
      })
      .addCase(addItemToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCartItem.fulfilled, (state, action) => {
        // ✅ Safe: cart is always defined
        state.cart.cartItems = state.cart.cartItems.filter(
          (item: CartItem) => item._id !== action.payload.cartItemId
        );
        const mrpPrice = sumCartItemMrpPrice(state.cart.cartItems);
        const sellingPrice = sumCartItemSellingPrice(state.cart.cartItems);
        state.cart.totalSellingPrice = sellingPrice;
        state.cart.totalMrpPrice = mrpPrice;
        state.loading = false;
      })
      .addCase(deleteCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        const index = state.cart.cartItems.findIndex(
          (item: CartItem) => item._id === action.meta.arg.cartItemId
        );
        if (index !== -1) {
          state.cart.cartItems[index] = action.payload;
        }
        const mrpPrice = sumCartItemMrpPrice(state.cart.cartItems);
        const sellingPrice = sumCartItemSellingPrice(state.cart.cartItems);
        state.cart.totalSellingPrice = sellingPrice;
        state.cart.totalMrpPrice = mrpPrice;
        state.loading = false;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(applyCoupon.fulfilled, (state, action) => {
        state.cart = action.payload;
        state.loading = false;
      });
  },
});

export default cartSlice.reducer;
export const { resetCartState } = cartSlice.actions;

export const selectCart = (state: RootState) => state.cart.cart;
export const selectCartLoading = (state: RootState) => state.cart.loading;
export const selectCartError = (state: RootState) => state.cart.error;