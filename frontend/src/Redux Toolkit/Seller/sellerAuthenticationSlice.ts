// D:\Mani\Code with Zosh\Backup\source code\frontend\src\Redux Toolkit\Seller\sellerAuthenticationSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit'; 
import { api } from '../../Config/Api';
import { type Seller } from '../../types/sellerTypes';
import axios from 'axios';

// Define extended response type
interface SellerWithJwt extends Seller {
  jwt: string;
}

// Define initial state
interface SellerAuthState {
  otpSent: boolean;
  error: string | null;
  loading: boolean;
  jwt: string | null;
  sellerCreated: string | null;
}

const initialState: SellerAuthState = {
  otpSent: false,
  error: null,
  loading: false,
  jwt: null,
  sellerCreated: null,
};

const API_URL = '/sellers';

// ✅ Send OTP using existing customer endpoint
export const sendSellerLoginOtp = createAsyncThunk(
  'sellerAuth/sendSellerLoginOtp',
  async (email: string, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/sent/login-signup-otp', { email });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Failed to send OTP'
      );
    }
  }
);

// ✅ Verify OTP using seller-specific endpoint
export const verifyLoginOtp = createAsyncThunk(
  'sellerAuth/verifyLoginOtp',
  async (data: { email: string; otp: string; navigate: any }, { rejectWithValue }) => {
    try {
      const response = await api.post('/sellers/verify/login-otp', {
        email: data.email,
        otp: data.otp
      });
      console.log("login seller success - ", response.data);
      localStorage.setItem("jwt", response.data.jwt);
      
      // ✅ Only navigate if login was successful
      if (data.navigate) {
        data.navigate("/seller");
      }
      
      return response.data;
    } catch (error: any) {
      console.log("error", error.response?.data);
      
      // ✅ Handle 403 (forbidden) status for pending accounts
      if (error.response?.status === 403) {
        return rejectWithValue(error.response.data.message || 'Access denied');
      }
      
      return rejectWithValue(
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Failed to verify OTP'
      );
    }
  }
);

// ✅ Create seller with OTP (NO AUTO-LOGIN)
export const createSeller = createAsyncThunk<
  any, // Changed from SellerWithJwt
  { sellerData: any; navigate: any }
>(
  'sellerAuth/createSeller',
  async ({ sellerData, navigate }, { rejectWithValue }) => {
    try {
      const response = await api.post<any>('/sellers', sellerData);
      
      // ✅ NO JWT storage or navigation (admin approval required)
      // localStorage.setItem('jwt', response.data.jwt);
      // if (navigate) navigate('/seller');
      
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        return rejectWithValue(
          error.response.data.error || error.response.data.message || error.message || 'Failed to create seller'
        );
      }
      return rejectWithValue('Failed to create seller');
    }
  }
);

// Create the slice
const sellerAuthSlice = createSlice({
  name: 'sellerAuth',
  initialState,
  reducers: {
    resetSellerAuthState: (state) => {
      state.otpSent = false;
      state.error = null;
      state.loading = false;
      state.jwt = null;
      state.sellerCreated = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Handle send OTP
      .addCase(sendSellerLoginOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendSellerLoginOtp.fulfilled, (state) => {
        state.loading = false;
        state.otpSent = true;
        state.error = null;
      })
      .addCase(sendSellerLoginOtp.rejected, (state, action) => {
        state.loading = false;
        state.otpSent = false;
        state.error = action.payload as string;
      })

      // Handle verify OTP (login)
      .addCase(verifyLoginOtp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyLoginOtp.fulfilled, (state, action) => {
        state.loading = false;
        state.jwt = action.payload.jwt; // ✅ Sets JWT
        state.error = null;
      })
      .addCase(verifyLoginOtp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // ✅ Handle create seller (registration) - NO JWT
      .addCase(createSeller.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSeller.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // ✅ Store success message instead of JWT
        state.sellerCreated = action.payload.message || "Seller registered successfully. Your application is pending admin approval.";
        state.error = null;
      })
      .addCase(createSeller.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to create seller';
      });
  },
});

export const { resetSellerAuthState } = sellerAuthSlice.actions;
export default sellerAuthSlice.reducer;