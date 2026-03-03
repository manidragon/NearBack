// D:\Mani\Code with Zosh\Backup\source code\frontend\src\Redux Toolkit\Customer\WishlistSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { type Wishlist, type WishlistState } from "../../types/wishlistTypes";
import { api } from "../../Config/Api";

const initialState: WishlistState = {
  wishlist: null,
  loading: false,
  error: null,
};

// ✅ Keep original name: getWishlistByUserId
export const getWishlistByUserId = createAsyncThunk(
  "wishlist/getWishlistByUserId",
  async (jwt: string, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/wishlist`, {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      });
      console.log("wishlist fetch ", response.data);
      return response.data;
    } catch (error: any) {
      console.log("error ", error);
      return rejectWithValue(
        error.response?.data?.message || "Failed to fetch wishlist"
      );
    }
  }
);

// ✅ FIXED: Changed productId from number to string (MongoDB _id is string)
export const addProductToWishlist = createAsyncThunk(
  "wishlist/addProductToWishlist",
  async (
    { productId }: { productId: string },  // ✅ Changed from number to string
    { rejectWithValue }
  ) => {
    try {
      const jwt = localStorage.getItem("jwt");
      if (!jwt) {
        throw new Error("No authentication token found");
      }
      
      const response = await api.post(
        `/api/wishlist/add-product/${productId}`,  // ✅ productId is now string
        {},
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      console.log(" add product ", response.data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to add product to wishlist"
      );
    }
  }
);

// ✅ FIXED: Added removeProductFromWishlist thunk (common feature)
export const removeProductFromWishlist = createAsyncThunk(
  "wishlist/removeProductFromWishlist",
  async (
    { productId }: { productId: string },  // ✅ String ID
    { rejectWithValue }
  ) => {
    try {
      const jwt = localStorage.getItem("jwt");
      if (!jwt) {
        throw new Error("No authentication token found");
      }
      
      const response = await api.delete(
        `/api/wishlist/remove-product/${productId}`,
        {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        }
      );
      console.log(" remove product ", response.data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to remove product from wishlist"
      );
    }
  }
);

// Slice
const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    resetWishlistState: (state) => {
      state.wishlist = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // getWishlistByUserId
    builder.addCase(getWishlistByUserId.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      getWishlistByUserId.fulfilled,
      (state, action: PayloadAction<Wishlist>) => {
        state.wishlist = action.payload;
        state.loading = false;
      }
    );
    builder.addCase(
      getWishlistByUserId.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload as string || "Failed to fetch wishlist";
      }
    );

    // addProductToWishlist
    builder.addCase(addProductToWishlist.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      addProductToWishlist.fulfilled,
      (state, action: PayloadAction<Wishlist>) => {
        state.wishlist = action.payload;
        state.loading = false;
      }
    );
    builder.addCase(
      addProductToWishlist.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload as string || "Failed to add product to wishlist";
      }
    );
    
    // ✅ removeProductFromWishlist cases
    builder.addCase(removeProductFromWishlist.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(
      removeProductFromWishlist.fulfilled,
      (state, action: PayloadAction<Wishlist>) => {
        state.wishlist = action.payload;
        state.loading = false;
      }
    );
    builder.addCase(
      removeProductFromWishlist.rejected,
      (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload as string || "Failed to remove product from wishlist";
      }
    );
  },
});

export const { resetWishlistState } = wishlistSlice.actions;

export default wishlistSlice.reducer;