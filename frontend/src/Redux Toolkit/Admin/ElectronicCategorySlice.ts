// D:\Mani\Code with Zosh\Backup\source code\frontend\src\Redux Toolkit\Admin\ElectronicCategorySlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '../../Config/Api';
import type { ElectronicCategory } from '../../types/electronicCategoryTypes';

type UpdateElectronicCategoryArgs = {
  id: string;
  data: Partial<ElectronicCategory>;
};

// Async Thunks
export const fetchElectronicCategories = createAsyncThunk<ElectronicCategory[]>(
  'electronicCategories/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      // ✅ FIXED: Changed from '/electronics' to '/api/admin/electronics'
      const response = await api.get('/api/admin/electronics');
      console.log('✅ [Frontend] Categories fetched:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('❌ [Frontend] Error fetching categories:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

export const createElectronicCategory = createAsyncThunk<ElectronicCategory, ElectronicCategory>(
  'electronicCategories/create',
  async (data, { rejectWithValue }) => {
    try {
      // ✅ FIXED: Changed from '/electronics' to '/api/admin/electronics'
      const response = await api.post('/api/admin/electronics', data);
      console.log('✅ [Frontend] Category created:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [Frontend] Error creating category:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to create category');
    }
  }
);

export const updateElectronicCategory = createAsyncThunk<ElectronicCategory, UpdateElectronicCategoryArgs>(
  'electronicCategories/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      // ✅ FIXED: Changed from '/electronics/${id}' to '/api/admin/electronics/${id}'
      const response = await api.patch(`/api/admin/electronics/${id}`, data);
      console.log('✅ [Frontend] Category updated:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [Frontend] Error updating category:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to update category');
    }
  }
);

export const deleteElectronicCategory = createAsyncThunk<string, string>(
  'electronicCategories/delete',
  async (id, { rejectWithValue }) => {
    try {
      // ✅ FIXED: Changed from '/electronics/${id}' to '/api/admin/electronics/${id}'
      await api.delete(`/api/admin/electronics/${id}`);
      console.log('✅ [Frontend] Category deleted:', id);
      return id;
    } catch (error: any) {
      console.error('❌ [Frontend] Error deleting category:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to delete category');
    }
  }
);

export const restoreElectronicCategory = createAsyncThunk<string, string>(
  'electronicCategories/restore',
  async (id, { rejectWithValue }) => {
    try {
      // ✅ FIXED: Changed from '/electronics/${id}/restore' to '/api/admin/electronics/${id}/restore'
      await api.patch(`/api/admin/electronics/${id}/restore`);
      console.log('✅ [Frontend] Category restored:', id);
      return id;
    } catch (error: any) {
      console.error('❌ [Frontend] Error restoring category:', error.response?.data || error.message);
      return rejectWithValue(error.response?.data?.message || 'Failed to restore category');
    }
  }
);

// Slice State Interface
interface ElectronicCategoryState {
  categories: ElectronicCategory[];
  loading: boolean;
  error: string | null;
  operationSuccess: boolean;
}

const initialState: ElectronicCategoryState = {
  categories: [],
  loading: false,
  error: null,
  operationSuccess: false,
};

// Create Slice
const electronicCategorySlice = createSlice({
  name: 'electronicCategories',
  initialState,
  reducers: {
    resetOperationSuccess: (state) => {
      state.operationSuccess = false;
    },
  },
  extraReducers: (builder) => {
    // Fetch all
    builder.addCase(fetchElectronicCategories.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchElectronicCategories.fulfilled, (state, action) => {
      state.loading = false;
      state.categories = action.payload;
    });
    builder.addCase(fetchElectronicCategories.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create
    builder.addCase(createElectronicCategory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createElectronicCategory.fulfilled, (state, action) => {
      state.loading = false;
      state.categories.unshift(action.payload);
      state.operationSuccess = true;
    });
    builder.addCase(createElectronicCategory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update
    builder.addCase(updateElectronicCategory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateElectronicCategory.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.categories.findIndex(cat => cat._id === action.payload._id);
      if (index !== -1) {
        state.categories[index] = action.payload;
      }
      state.operationSuccess = true;
    });
    builder.addCase(updateElectronicCategory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete
    builder.addCase(deleteElectronicCategory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteElectronicCategory.fulfilled, (state, action) => {
      state.loading = false;
      state.categories = state.categories.filter(cat => cat._id !== action.payload);
      state.operationSuccess = true;
    });
    builder.addCase(deleteElectronicCategory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Restore
    builder.addCase(restoreElectronicCategory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(restoreElectronicCategory.fulfilled, (state, action) => {
      state.loading = false;
      const index = state.categories.findIndex(cat => cat._id === action.payload);
      if (index !== -1) {
        state.categories[index] = { ...state.categories[index], isActive: true };
      }
      state.operationSuccess = true;
    });
    builder.addCase(restoreElectronicCategory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { resetOperationSuccess } = electronicCategorySlice.actions;
export default electronicCategorySlice.reducer;