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
  cart: Cart; // ✅ Always a Cart object, never null
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

// ============================================================================
// ✅ ASYNC THUNKS
// ============================================================================

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
  variantId?: string;
  sellerId?: string;
  offerId?: string;
  color?: string;
  specifications?: Record<string, string>;
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

// ✅ FIX: Update return type to handle both CartItem and { updatedCartItem: CartItem }
export const updateCartItem = createAsyncThunk<
  CartItem | { updatedCartItem: CartItem },
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
      
      // ✅ Handle both response formats:
      // Format 1: { success: true, updatedCartItem: {...} }
      // Format 2: Just the CartItem object
      return response.data.updatedCartItem || response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to update cart item"
      );
    }
  }
);

// ============================================================================
// ✅ SELECTORS
// ============================================================================

export const selectCartItemCount = createSelector(
  (state: RootState) => state.cart.cart,
  (cart) => cart?.cartItems?.length ?? 0
);

export const selectCartTotalItems = createSelector(
  (state: RootState) => state.cart.cart,
  (cart) => cart?.totalItem ?? 0
);

export const selectCartTotalPrice = createSelector(
  (state: RootState) => state.cart.cart,
  (cart) => cart?.totalSellingPrice ?? 0
);

// ============================================================================
// ✅ SLICE
// ============================================================================

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    resetCartState: (state) => {
      state.cart = emptyCart;
      state.loading = false;
      state.error = null;
    },
    // ✅ Optional: Clear cart after successful order
    clearCartAfterOrder: (state) => {
      state.cart = {
        ...emptyCart,
        _id: state.cart._id, // Keep cart ID if needed
        user: state.cart.user,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      // ======================================================================
      // FETCH CART
      // ======================================================================
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
      })

      // ======================================================================
      // ADD ITEM TO CART
      // ======================================================================
      .addCase(addItemToCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addItemToCart.fulfilled, (state, action: PayloadAction<Cart>) => {
        // ✅ Replace entire cart with fresh data from server
        state.cart = action.payload;
        state.loading = false;
      })
      .addCase(addItemToCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ======================================================================
      // DELETE CART ITEM
      // ======================================================================
      .addCase(deleteCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCartItem.fulfilled, (state, action: PayloadAction<{ cartItemId: string }>) => {
        // ✅ Filter out deleted item
        state.cart.cartItems = state.cart.cartItems.filter(
          (item: CartItem) => item._id !== action.payload.cartItemId
        );
        
        // ✅ Recalculate totals using helper functions
        state.cart.totalMrpPrice = sumCartItemMrpPrice(state.cart.cartItems);
        state.cart.totalSellingPrice = sumCartItemSellingPrice(state.cart.cartItems);
        state.cart.totalItem = state.cart.cartItems.reduce(
          (sum, item) => sum + (item.quantity || 0), 0
        );
        state.cart.discount = state.cart.totalMrpPrice > 0
          ? Math.round(((state.cart.totalMrpPrice - state.cart.totalSellingPrice) / state.cart.totalMrpPrice) * 100)
          : 0;
        
        state.loading = false;
      })
      .addCase(deleteCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ======================================================================
      // ✅ UPDATE CART ITEM - CRITICAL FIX
      // ======================================================================
      .addCase(updateCartItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItem.fulfilled, (state, action) => {
        // ✅ Extract updated item from response (handle both formats)
        const updatedItem: CartItem = 
          'updatedCartItem' in action.payload 
            ? action.payload.updatedCartItem 
            : action.payload;
        
        // ✅ Find and update the item in cart
        const index = state.cart.cartItems.findIndex(
          (item: CartItem) => item._id === action.meta.arg.cartItemId
        );
        
        if (index !== -1 && updatedItem) {
          // ✅ Replace with fully populated updated item
          state.cart.cartItems[index] = {
            ...state.cart.cartItems[index],
            ...updatedItem,
            // Ensure critical fields are preserved
            _id: updatedItem._id || state.cart.cartItems[index]._id,
            quantity: updatedItem.quantity ?? state.cart.cartItems[index].quantity,
            mrpPrice: updatedItem.mrpPrice ?? state.cart.cartItems[index].mrpPrice,
            sellingPrice: updatedItem.sellingPrice ?? state.cart.cartItems[index].sellingPrice,
          };
        }
        
        // ✅ Recalculate ALL cart totals
        state.cart.totalMrpPrice = sumCartItemMrpPrice(state.cart.cartItems);
        state.cart.totalSellingPrice = sumCartItemSellingPrice(state.cart.cartItems);
        state.cart.totalItem = state.cart.cartItems.reduce(
          (sum, item) => sum + (item.quantity || 0), 0
        );
        state.cart.discount = state.cart.totalMrpPrice > 0
          ? Math.round(((state.cart.totalMrpPrice - state.cart.totalSellingPrice) / state.cart.totalMrpPrice) * 100)
          : 0;
        
        state.loading = false;
      })
      .addCase(updateCartItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ======================================================================
      // APPLY COUPON (handled by CouponSlice, but updates cart)
      // ======================================================================
      .addCase(applyCoupon.fulfilled, (state, action: PayloadAction<Cart>) => {
        state.cart = action.payload;
        state.loading = false;
      });
  },
});

// ============================================================================
// ✅ EXPORTS
// ============================================================================

export default cartSlice.reducer;
export const { resetCartState, clearCartAfterOrder } = cartSlice.actions;

export const selectCart = (state: RootState) => state.cart.cart;
export const selectCartLoading = (state: RootState) => state.cart.loading;
export const selectCartError = (state: RootState) => state.cart.error;
export const selectCartItems = (state: RootState) => state.cart.cart.cartItems;
export const selectCartCoupon = (state: RootState) => state.cart.cart.couponCode;