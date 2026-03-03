// src/slices/userSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { type User, type UserState } from "../../types/userTypes";
import type { Address } from "../../types/addressTypes";
import { api } from "../../Config/Api";
import { type RootState } from "../Store";

const initialState: UserState = {
  user: null,
  loading: false,
  error: null,
  profileUpdated: false,
};

// Define the base URL for the API
const API_URL = "/api/users";

// ✅ FETCH USER PROFILE (includes addresses)
export const fetchUserProfile = createAsyncThunk<
  User,
  { jwt: string; navigate: any }
>(
  "user/fetchUserProfile",
  async (
    { jwt, navigate }: { jwt: string; navigate: any },
    { rejectWithValue }
  ) => {
    try {
      const response = await api.get(`${API_URL}/profile`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      console.log(" user profile ", response.data);
      if (response.data.role === "ROLE_ADMIN") {
        navigate("/admin");
      }
      return response.data;
    } catch (error: any) {
      console.log("error ", error.response);
      return rejectWithValue("Failed to fetch user profile");
    }
  }
);

// ✅ FETCH ADDRESSES (separate endpoint)
export const fetchUserAddresses = createAsyncThunk<Address[]>(
  "user/fetchUserAddresses",
  async (_, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) throw new Error('No token');
      
      const response = await api.get('/api/addresses', {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch addresses');
    }
  }
);

// ✅ ADD ADDRESS
export const addAddress = createAsyncThunk<Address, Omit<Address, '_id'>>(
  "user/addAddress",
  async (addressData, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) throw new Error('No token');
      
      const response = await api.post('/api/addresses', addressData, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add address');
    }
  }
);

// ✅ UPDATE ADDRESS
export const updateAddress = createAsyncThunk<Address, { id: string; data: Partial<Address> }>(
  "user/updateAddress",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) throw new Error('No token');
      
      const response = await api.put(`/api/addresses/${id}`, data, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update address');
    }
  }
);

// ✅ DELETE ADDRESS
export const deleteAddress = createAsyncThunk<string, string>(
  "user/deleteAddress",
  async (addressId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) throw new Error('No token');
      
      await api.delete(`/api/addresses/${addressId}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return addressId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete address');
    }
  }
);

// ✅ UPDATE USER PROFILE
export const updateUserProfile = createAsyncThunk<
  User,
  { fullName?: string; mobile?: string; jwt: string }
>(
  "user/updateUserProfile",
  async ({ fullName, mobile, jwt }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.put(`${API_URL}/profile`, 
        { fullName, mobile },
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      
      // ✅ Re-fetch user profile after update to ensure state is fresh
      await dispatch(fetchUserProfile({ jwt, navigate: () => {} }));
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

// ✅ UPDATE PROFILE PICTURE
export const updateProfilePicture = createAsyncThunk<
  User,
  { imageUrl: string; jwt: string }
>(
  "user/updateProfilePicture",
  async ({ imageUrl, jwt }, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.put(`${API_URL}/profile/picture`,
        { imageUrl },
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );
      
      // ✅ Re-fetch user profile after update to ensure state is fresh
      await dispatch(fetchUserProfile({ jwt, navigate: () => {} }));
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile picture');
    }
  }
);

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    resetUserState: (state) => {
      state.user = null;
      state.loading = false;
      state.error = null;
      state.profileUpdated = false;
    },
    // ✅ Add reducer to update addresses in user object
    setUserAddresses: (state, action: PayloadAction<Address[]>) => {
      if (state.user) {
        state.user.addresses = action.payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // ✅ Fetch User Profile
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchUserProfile.fulfilled,
        (state, action: PayloadAction<User>) => {
          state.user = action.payload;
          state.loading = false;
        }
      )
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ✅ Fetch Addresses
      .addCase(fetchUserAddresses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserAddresses.fulfilled, (state, action: PayloadAction<Address[]>) => {
        state.loading = false;
        // Update user's addresses array
        if (state.user) {
          state.user.addresses = action.payload;
        }
      })
      .addCase(fetchUserAddresses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ✅ Add Address
      .addCase(addAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addAddress.fulfilled, (state, action: PayloadAction<Address>) => {
        state.loading = false;
        // Add to user's addresses array
        if (state.user && state.user.addresses) {
          state.user.addresses.push(action.payload);
        } else if (state.user) {
          state.user.addresses = [action.payload];
        }
      })
      .addCase(addAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ✅ Update Address
      .addCase(updateAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAddress.fulfilled, (state, action: PayloadAction<Address>) => {
        state.loading = false;
        // Update in user's addresses array
        if (state.user && state.user.addresses) {
          const index = state.user.addresses.findIndex(a => a._id === action.payload._id);
          if (index !== -1) {
            state.user.addresses[index] = action.payload;
          }
        }
      })
      .addCase(updateAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ✅ Delete Address
      .addCase(deleteAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteAddress.fulfilled, (state, action: PayloadAction<string>) => {
        state.loading = false;
        // Remove from user's addresses array
        if (state.user && state.user.addresses) {
          state.user.addresses = state.user.addresses.filter(a => a._id !== action.payload);
        }
      })
      .addCase(deleteAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ✅ UPDATE USER PROFILE
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.profileUpdated = false;
      })
      .addCase(updateUserProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.loading = false;
        state.profileUpdated = true;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.profileUpdated = false;
      })

      // ✅ UPDATE PROFILE PICTURE
      .addCase(updateProfilePicture.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.profileUpdated = false;
      })
      .addCase(updateProfilePicture.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload;
        state.loading = false;
        state.profileUpdated = true;
        state.error = null;
      })
      .addCase(updateProfilePicture.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.profileUpdated = false;
      });
  },
});

export const { resetUserState, setUserAddresses } = userSlice.actions;

export default userSlice.reducer;

// ✅ SELECTORS
export const selectUser = (state: RootState) => state.user.user;
export const selectUserLoading = (state: RootState) => state.user.loading;
export const selectUserError = (state: RootState) => state.user.error;
export const selectUserAddresses = (state: RootState) => state.user.user?.addresses || [];
export const selectUserProfileUpdated = (state: RootState) => state.user.profileUpdated;