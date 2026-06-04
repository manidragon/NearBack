// D:\Mani\Code with Zosh\Backup\source code\frontend\src\Redux Toolkit\Seller\transactionSlice.ts
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { type Transaction } from '../../types/Transaction';
import { api } from '../../Config/Api';

interface TransactionState {
  transactions: Transaction[];
  transaction: Transaction | null;
  loading: boolean;
  error: string | null;
}

// Initial state
const initialState: TransactionState = {
  transactions: [],
  transaction: null,
  loading: false,
  error: null,
};

// Thunks
export const fetchTransactionsBySeller = createAsyncThunk<
  Transaction[],
  string,
  { rejectValue: string }
>('transactions/fetchTransactionsBySeller', async (jwt, { rejectWithValue }) => {
  try {
    const response = await api.get('/api/transactions/seller', {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    console.log("fetchTransactionsBySeller", response.data)
    return response.data;
  } catch (error: any) {
    console.log("error transaction", error)
    if (error.response) {
      return rejectWithValue(error.response.data.message);
    }
    return rejectWithValue('Failed to fetch transactions');
  }
});

export const fetchAllTransactions = createAsyncThunk<
  Transaction[],
  void,
  { rejectValue: string }
>('transactions/fetchAllTransactions', async (_, { rejectWithValue }) => {
  try {
    const response = await api.get<Transaction[]>('/api/transactions');
    return response.data;
  } catch (error: any) {
    if (error.response) {
      return rejectWithValue(error.response.data.message);
    }
    return rejectWithValue('Failed to fetch all transactions');
  }
});



// Slice
const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactionsBySeller.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionsBySeller.fulfilled, (state, action) => {
        state.loading = false;

        // ✅ Type assertion to handle both response formats
        const payload = action.payload as any;

        // Handle both: Transaction[] OR { transactions: Transaction[], summary: {...} }
        const transactions = Array.isArray(payload)
          ? payload
          : payload?.transactions || [];

        state.transactions = transactions;
      })
      .addCase(fetchTransactionsBySeller.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchAllTransactions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllTransactions.fulfilled, (state, action) => {
        state.loading = false;
        state.transactions = action.payload;
      })
      .addCase(fetchAllTransactions.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default transactionSlice.reducer;
