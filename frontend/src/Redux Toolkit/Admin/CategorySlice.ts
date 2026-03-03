// D:\Mani\Code with Zosh\Backup\source code\frontend\src\Redux Toolkit\Admin\CategorySlice.ts
import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { api } from "../../Config/Api";
import type { Category } from "../../types/categoryTypes";

interface CategoryState {
  categories: Category[];
  loading: boolean;
  error: string | null;
  success: boolean;
}

const initialState: CategoryState = {
  categories: [],
  loading: false,
  error: null,
  success: false,
};

// ✅ FIX: Enhanced deduplication with safety checks
const deduplicateCategories = (categories: Category[]): Category[] => {
  const seen = new Map<string, Category>();
  return categories.filter(cat => {
    // Skip categories without _id (invalid data)
    if (!cat._id) {
      console.warn('Category missing _id, skipping:', cat);
      return false;
    }
    
    if (seen.has(cat._id)) {
      console.warn(`Duplicate category removed: ${cat._id}, name: ${cat.name || 'N/A'}`);
      return false;
    }
    
    seen.set(cat._id, cat);
    return true;
  });
};

// Fetch all categories with hierarchy
export const fetchCategories = createAsyncThunk(
  "category/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get("/api/categories");
      // ✅ DEDUPLICATE at fetch time
      return deduplicateCategories(data.categories || []);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch categories");
    }
  }
);

// Create category
export const createCategory = createAsyncThunk(
  "category/createCategory",
  async (
    { category, jwt }: { category: Partial<Category>; jwt: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.post("/api/categories", category, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return data.category;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to create category");
    }
  }
);

// Update category
export const updateCategory = createAsyncThunk(
  "category/updateCategory",
  async (
    { id, category, jwt }: { id: string; category: Partial<Category>; jwt: string },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await api.patch(`/api/categories/${id}`, category, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return data.category;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to update category");
    }
  }
);

// Delete category
export const deleteCategory = createAsyncThunk(
  "category/deleteCategory",
  async ({ id, jwt }: { id: string; jwt: string }, { rejectWithValue }) => {
    try {
      await api.delete(`/api/categories/${id}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete category");
    }
  }
);

// Get categories by level
export const getCategoriesByLevel = createAsyncThunk(
  "category/getCategoriesByLevel",
  async (level: number, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/api/categories/level/${level}`);
      // ✅ DEDUPLICATE at fetch time
      return deduplicateCategories(data.categories || []);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch categories");
    }
  }
);

// Get child categories by parent ID
export const getChildCategories = createAsyncThunk(
  "category/getChildCategories",
  async (parentId: string | null, { rejectWithValue }) => {
    try {
      const { data } = await api.get(
        `/api/categories/parent/${parentId || "null"}`
      );
      // ✅ DEDUPLICATE at fetch time
      return deduplicateCategories(data.categories || []);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch child categories");
    }
  }
);

const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {
    resetCategoryState: (state) => {
      state.error = null;
      state.success = false;
    },
    clearCategories: (state) => {
      state.categories = [];
    },
  },
  extraReducers: (builder) => {
    // Fetch categories
    builder.addCase(fetchCategories.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(fetchCategories.fulfilled, (state, action: PayloadAction<Category[]>) => {
      state.loading = false;
      // ✅ CRITICAL: DEDUPLICATE before storing in Redux
      state.categories = deduplicateCategories(action.payload);
      state.success = true;
    });
    builder.addCase(fetchCategories.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Create category
    builder.addCase(createCategory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(createCategory.fulfilled, (state, action: PayloadAction<Category>) => {
      state.loading = false;
      // ✅ PREVENT DUPLICATES on create
      if (!state.categories.some(c => c._id === action.payload._id)) {
        state.categories.push(action.payload);
      }
      // ✅ DEDUPLICATE entire array after adding
      state.categories = deduplicateCategories(state.categories);
      state.success = true;
    });
    builder.addCase(createCategory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Update category
    builder.addCase(updateCategory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(updateCategory.fulfilled, (state, action: PayloadAction<Category>) => {
      state.loading = false;
      const index = state.categories.findIndex(c => c._id === action.payload._id);
      if (index !== -1) {
        state.categories[index] = action.payload;
      }
      // ✅ DEDUPLICATE after update
      state.categories = deduplicateCategories(state.categories);
      state.success = true;
    });
    builder.addCase(updateCategory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });

    // Delete category
    builder.addCase(deleteCategory.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    builder.addCase(deleteCategory.fulfilled, (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.categories = state.categories.filter(c => c._id !== action.payload);
      state.success = true;
    });
    builder.addCase(deleteCategory.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload as string;
    });
  },
});

export const { resetCategoryState, clearCategories } = categorySlice.actions;
export default categorySlice.reducer;