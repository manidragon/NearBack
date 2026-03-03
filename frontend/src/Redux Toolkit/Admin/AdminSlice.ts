// D:\Mani\Code with Zosh\Backup\source code\frontend\src\Redux Toolkit\Admin\AdminSlice.ts
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { type HomeCategory } from '../../types/homeDataTypes';
import { api } from '../../Config/Api';

const API_URL = '/home';

// ✅ UPDATE: Simplified update - only image and description
export const updateHomeCategory = createAsyncThunk<HomeCategory, { id: string; data: { image: string; description: string } }>(
  'homeCategory/updateHomeCategory',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`${API_URL}/home-category/${id}`, data);
      console.log("category updated ", response);
      return response.data;
    } catch (error: any) {
      console.log("error ", error);
      if (error.response && error.response.data) {
        return rejectWithValue(error.response.data);
      } else {
        return rejectWithValue('An error occurred while updating the category.');
      }
    }
  }
);

// ✅ NEW: Create new banner item
export const createHomeCategory = createAsyncThunk<HomeCategory, { image: string; description: string; section: string }>(
  'homeCategory/createHomeCategory',
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.post(`${API_URL}/home-category`, data);
      console.log("category created ", response);
      return response.data;
    } catch (error: any) {
      console.log("error ", error);
      return rejectWithValue(error.response?.data?.message || 'Failed to create category');
    }
  }
);

// ✅ NEW: Delete banner item
export const deleteHomeCategory = createAsyncThunk<string, string>(
  'homeCategory/deleteHomeCategory',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`${API_URL}/home-category/${id}`);
      console.log("category deleted");
      return id;
    } catch (error: any) {
      console.log("error ", error);
      return rejectWithValue(error.response?.data?.message || 'Failed to delete category');
    }
  }
);

export const fetchHomeCategories = createAsyncThunk<HomeCategory[]>(
  'homeCategory/fetchHomeCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(`${API_URL}/home-category`);
      console.log(" categories ", response.data);
      return response.data;
    } catch (error: any) {
      console.log("error ", error.response);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch categories');
    }
  }
);

interface HomeCategoryState {
  categories: HomeCategory[];
  loading: boolean;
  error: string | null;
  categoryUpdated: boolean;
}

const initialState: HomeCategoryState = {
  categories: [],
  loading: false,
  error: null,
  categoryUpdated: false,
};

const homeCategorySlice = createSlice({
  name: 'homeCategory',
  initialState,
  reducers: {
    resetCategoryUpdated: (state) => {
      state.categoryUpdated = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(updateHomeCategory.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.categoryUpdated = false;
    });
    builder.addCase(updateHomeCategory.fulfilled, (state, action) => {
      state.loading = false;
      state.categoryUpdated = true;
      const index = state.categories.findIndex((category) => category._id === action.payload._id);
      if (index !== -1) {
        state.categories[index] = action.payload;
      }
    });
    builder.addCase(updateHomeCategory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ✅ Handle create
    builder.addCase(createHomeCategory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createHomeCategory.fulfilled, (state, action) => {
      state.loading = false;
      state.categories.push(action.payload);
      state.categoryUpdated = true;
    });
    builder.addCase(createHomeCategory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // ✅ Handle delete
    builder.addCase(deleteHomeCategory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteHomeCategory.fulfilled, (state, action) => {
      state.loading = false;
      state.categories = state.categories.filter(cat => cat._id !== action.payload);
      state.categoryUpdated = true;
    });
    builder.addCase(deleteHomeCategory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Handle fetch
    builder.addCase(fetchHomeCategories.pending, (state) => {
      state.loading = true;
      state.error = null;
      state.categoryUpdated = false;
    })
    .addCase(fetchHomeCategories.fulfilled, (state, action) => {
      state.loading = false;
      state.categories = action.payload;
    })
    .addCase(fetchHomeCategories.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { resetCategoryUpdated } = homeCategorySlice.actions;
export default homeCategorySlice.reducer;