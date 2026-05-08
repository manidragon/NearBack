// D:\Mani\Code with Zosh\Backup\source code\frontend\src\Redux Toolkit\Admin\CategoryAttributeSlice.ts
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../Config/Api';

// ✅ FIXED: Import types AND values separately (not using 'import type' for functions)
import type {
  CategoryAttribute,
  CategoryAttributeApiResponse,
  BulkCategoryAttributesResponse,
  CategoryHasAttributesResponse,
  CategoryAttributeFormState,
  AttributeDefinition,
} from '../../types/categoryAttributeTypes';

// ✅ FIXED: Import transform functions as values (not types)
import {
  transformApiAttribute,
  transformFormToApiPayload,
} from '../../types/categoryAttributeTypes';
import type { RootState } from '../Store';

const API_BASE = '/api/admin/categories';

export const fetchCategoryAttributes = createAsyncThunk(
  'categoryAttribute/fetchCategoryAttributes',
  async ({ categoryId, includeInactive }: { categoryId: string; includeInactive?: boolean }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/api/admin/categories/${categoryId}/attributes`, {
        params: { includeInactive }
      });
      
      // ✅ FIX: Handle the response structure correctly
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;  // ✅ Return the array inside 'data' field
      }
      
      // Fallback: if response is already an array
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      console.warn('⚠️ [Redux Slice] Unexpected response format:', response.data);
      return [];
      
    } catch (error: any) {
      console.error('❌ [Redux Slice] Fetch attributes error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attributes');
    }
  }
);

// ✅ Async Thunk: Fetch attributes for multiple categories (admin dashboard)
export const fetchAttributesForMultipleCategories = createAsyncThunk<
  Record<string, CategoryAttribute[]>,
  string[],
  { rejectValue: string }
>(
  'categoryAttribute/fetchBulk',
  async (categoryIds, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        throw new Error('Authentication token not found');
      }

      const response = await api.post<BulkCategoryAttributesResponse>(
        `${API_BASE}/attributes/bulk`,
        { categoryIds },
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error((response.data as any).message || 'Failed to fetch bulk attributes');
      }

      return response.data.data as Record<string, CategoryAttribute[]>;
    } catch (error: any) {
      console.error('❌ Bulk fetch error:', error.message);
      return rejectWithValue(error.message || 'Failed to fetch bulk attributes');
    }
  }
);

// ✅ Async Thunk: Create new attribute
export const createCategoryAttribute = createAsyncThunk<
  CategoryAttribute,
  { categoryId: string; attribute: Partial<AttributeDefinition> },
  { rejectValue: string }
>(
  'categoryAttribute/create',
  async ({ categoryId, attribute }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        throw new Error('Authentication token not found');
      }

      // ✅ FIXED: Use transformFormToApiPayload as a value (not type import)
      const payload = transformFormToApiPayload(attribute, categoryId);

      const response = await api.post<CategoryAttributeApiResponse>(
        `${API_BASE}/${categoryId}/attributes`,
        payload,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error((response.data as any).message || 'Failed to create attribute');
      }

      return response.data.data as CategoryAttribute;
    } catch (error: any) {
      console.error('❌ Create attribute error:', error.message);
      return rejectWithValue(error.message || 'Failed to create attribute');
    }
  }
);

// ✅ Async Thunk: Update existing attribute
export const updateCategoryAttribute = createAsyncThunk<
  CategoryAttribute,
  { attributeId: string; updates: Partial<AttributeDefinition> },
  { rejectValue: string }
>(
  'categoryAttribute/update',
  async ({ attributeId, updates }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        throw new Error('Authentication token not found');
      }

      const response = await api.put<CategoryAttributeApiResponse>(
        `${API_BASE}/attributes/${attributeId}`,
        updates,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error((response.data as any).message || 'Failed to update attribute');
      }

      return response.data.data as CategoryAttribute;
    } catch (error: any) {
      console.error('❌ Update attribute error:', error.message);
      return rejectWithValue(error.message || 'Failed to update attribute');
    }
  }
);

// ✅ Async Thunk: Soft delete attribute (set isActive = false)
export const deleteCategoryAttribute = createAsyncThunk<
  { attributeId: string; categoryId: string },
  { attributeId: string },
  { rejectValue: string }
>(
  'categoryAttribute/delete',
  async ({ attributeId }, { rejectWithValue, fulfillWithValue }) => {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        throw new Error('Authentication token not found');
      }

      const response = await api.delete<CategoryAttributeApiResponse>(
        `${API_BASE}/attributes/${attributeId}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      if (!response.data.success) {
        throw new Error((response.data as any).message || 'Failed to delete attribute');
      }

      // ✅ FIXED: Safely access categoryId from response
      const responseData = response.data.data as CategoryAttribute | undefined;
      return fulfillWithValue({
        attributeId,
        categoryId: responseData?.categoryId || ''
      });
    } catch (error: any) {
      console.error('❌ Delete attribute error:', error.message);
      return rejectWithValue(error.message || 'Failed to delete attribute');
    }
  }
);

// ✅ Async Thunk: Reorder attributes (drag-drop)
export const reorderCategoryAttributes = createAsyncThunk<
  CategoryAttribute[],
  { categoryId: string; orderedIds: string[] },
  { rejectValue: string }
>(
  'categoryAttribute/reorder',
  async ({ categoryId, orderedIds }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        throw new Error('Authentication token not found');
      }

      const response = await api.put<CategoryAttributeApiResponse>(
        `${API_BASE}/${categoryId}/attributes/reorder`,
        { orderedIds },
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      if (!response.data.success || !Array.isArray(response.data.data)) {
        throw new Error((response.data as any).message || 'Failed to reorder attributes');
      }

      return response.data.data as CategoryAttribute[];
    } catch (error: any) {
      console.error('❌ Reorder attributes error:', error.message);
      return rejectWithValue(error.message || 'Failed to reorder attributes');
    }
  }
);

// ✅ Async Thunk: Bulk create attributes (for seeding)
export const bulkCreateCategoryAttributes = createAsyncThunk<
  CategoryAttribute[],
  { categoryId: string; attributes: Partial<AttributeDefinition>[] },
  { rejectValue: string }
>(
  'categoryAttribute/bulkCreate',
  async ({ categoryId, attributes }, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        throw new Error('Authentication token not found');
      }

      // ✅ FIXED: Use transformFormToApiPayload as a value
      const payloads = attributes.map(attr => transformFormToApiPayload(attr, categoryId));

      const response = await api.post<CategoryAttributeApiResponse>(
        `${API_BASE}/${categoryId}/attributes/bulk`,
        { attributes: payloads },
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      if (!response.data.success || !Array.isArray(response.data.data)) {
        throw new Error((response.data as any).message || 'Failed to bulk create attributes');
      }

      return response.data.data as CategoryAttribute[];
    } catch (error: any) {
      console.error('❌ Bulk create error:', error.message);
      return rejectWithValue(error.message || 'Failed to bulk create attributes');
    }
  }
);

// ✅ Async Thunk: Check if category has attributes
export const checkCategoryHasAttributes = createAsyncThunk<
  { categoryId: string; hasAttributes: boolean },
  string,
  { rejectValue: string }
>(
  'categoryAttribute/checkHasAttributes',
  async (categoryId, { rejectWithValue }) => {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) {
        throw new Error('Authentication token not found');
      }

      const response = await api.get<CategoryHasAttributesResponse>(
        `${API_BASE}/attributes/check/${categoryId}`,
        {
          headers: { Authorization: `Bearer ${jwt}` },
        }
      );

      if (!response.data.success || !response.data.data) {
        throw new Error((response.data as any).message || 'Failed to check attributes');
      }

      return response.data.data as { categoryId: string; hasAttributes: boolean };
    } catch (error: any) {
      console.error('❌ Check attributes error:', error.message);
      return rejectWithValue(error.message || 'Failed to check attributes');
    }
  }
);

// ✅ Initial state
const initialState: CategoryAttributeFormState = {
  attributes: [],
  loading: false,
  error: null,
  selectedCategoryId: null,
};

// ✅ Slice definition
const categoryAttributeSlice = createSlice({
  name: 'categoryAttribute',
  initialState,
  reducers: {

    resetCategoryAttributes: (state) => {
      state.attributes = [];
      state.loading = false;
      state.error = null;
    },
    // ✅ Clear attributes for a category (when switching categories)
    clearCategoryAttributes: (state, action: PayloadAction<string>) => {
      if (state.selectedCategoryId === action.payload) {
        state.attributes = [];
        state.error = null;
      }
    },

    // ✅ Set selected category (for UI state)
    setSelectedCategoryId: (state, action: PayloadAction<string | null>) => {
      state.selectedCategoryId = action.payload;
    },

    // ✅ Reset error
    clearError: (state) => {
      state.error = null;
    },

    // ✅ Optimistic update: update attribute in state before API response
    optimisticUpdate: (state, action: PayloadAction<CategoryAttribute>) => {
      const index = state.attributes.findIndex(a => a._id === action.payload._id);
      if (index !== -1) {
        state.attributes[index] = action.payload;
      }
    },

    // ✅ Optimistic delete: remove attribute from state before API response
    optimisticDelete: (state, action: PayloadAction<string>) => {
      state.attributes = state.attributes.filter(a => a._id !== action.payload);
    },
  },

  extraReducers: (builder) => {
    // ✅ fetchCategoryAttributes
    builder
      .addCase(fetchCategoryAttributes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
  fetchCategoryAttributes.fulfilled,
  (state, action: PayloadAction<CategoryAttribute[]>) => {
    state.loading = false;
    state.attributes = action.payload;  // ✅ Store in state.attributes
    if (action.payload.length > 0) {
      state.selectedCategoryId = action.payload[0].categoryId;
    }
  }
)
      .addCase(fetchCategoryAttributes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;

        // ✅ Log helpful debug info
        console.error('❌ [Redux] Attributes fetch failed:', {
          error: action.payload,
          message: typeof action.payload === 'string' ? action.payload : 'Unknown error'
        });
      });

    // ✅ fetchAttributesForMultipleCategories
    builder
      .addCase(fetchAttributesForMultipleCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        fetchAttributesForMultipleCategories.fulfilled,
        (state, action: PayloadAction<Record<string, CategoryAttribute[]>>) => {
          state.loading = false;
          // Note: This thunk returns a map, not a flat array
          // Admin dashboard can use this directly
        }
      )
      .addCase(fetchAttributesForMultipleCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message || 'Failed to fetch bulk attributes';
      });

    // ✅ createCategoryAttribute
    builder
      .addCase(createCategoryAttribute.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        createCategoryAttribute.fulfilled,
        (state, action: PayloadAction<CategoryAttribute>) => {
          state.loading = false;
          // ✅ Add new attribute to list (maintain sort order)
          state.attributes.push(action.payload);
          state.attributes.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
        }
      )
      .addCase(createCategoryAttribute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message || 'Failed to create attribute';
      });

    // ✅ updateCategoryAttribute
    builder
      .addCase(updateCategoryAttribute.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        updateCategoryAttribute.fulfilled,
        (state, action: PayloadAction<CategoryAttribute>) => {
          state.loading = false;

          // ✅ Ensure _id is string for comparison (MongoDB ObjectId → string)
          const updatedId = String(action.payload._id);

          // ✅ Find and update the attribute
          const index = state.attributes.findIndex(
            a => String(a._id) === updatedId
          );

          if (index !== -1) {
            // ✅ Merge update instead of full replace (preserves any extra fields)
            state.attributes[index] = {
              ...state.attributes[index],
              ...action.payload,
              _id: updatedId // Ensure consistent type
            };

            // ✅ Re-sort if order changed
            state.attributes.sort((a, b) =>
              (a.order ?? 0) - (b.order ?? 0) ||
              (a.name || '').localeCompare(b.name || '')
            );

            console.log('✅ Redux state updated for attribute:', updatedId);
          } else {
            // ✅ Fallback: add if not found (edge case)
            console.warn('⚠️ Attribute not found in state, adding:', updatedId);
            state.attributes.push({
              ...action.payload,
              _id: updatedId
            });
          }
        }
      )
      .addCase(updateCategoryAttribute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message || 'Failed to update attribute';
      });

    // ✅ deleteCategoryAttribute
    builder
      .addCase(deleteCategoryAttribute.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        deleteCategoryAttribute.fulfilled,
        (state, action: PayloadAction<{ attributeId: string; categoryId: string }>) => {
          state.loading = false;
          // ✅ Remove deleted attribute from list
          state.attributes = state.attributes.filter(
            a => a._id !== action.payload.attributeId
          );
        }
      )
      .addCase(deleteCategoryAttribute.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message || 'Failed to delete attribute';
      });

    // ✅ reorderCategoryAttributes
    builder
      .addCase(reorderCategoryAttributes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        reorderCategoryAttributes.fulfilled,
        (state, action: PayloadAction<CategoryAttribute[]>) => {
          state.loading = false;
          // ✅ Replace entire list with reordered attributes
          state.attributes = action.payload;
        }
      )
      .addCase(reorderCategoryAttributes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message || 'Failed to reorder attributes';
      });

    // ✅ bulkCreateCategoryAttributes
    builder
      .addCase(bulkCreateCategoryAttributes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(
        bulkCreateCategoryAttributes.fulfilled,
        (state, action: PayloadAction<CategoryAttribute[]>) => {
          state.loading = false;
          // ✅ Add all created attributes (avoid duplicates)
          const existingIds = new Set(state.attributes.map(a => a._id));
          const newAttributes = action.payload.filter(a => !existingIds.has(a._id));
          state.attributes.push(...newAttributes);
          state.attributes.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
        }
      )
      .addCase(bulkCreateCategoryAttributes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message || 'Failed to bulk create attributes';
      });

    // ✅ checkCategoryHasAttributes
    builder
      .addCase(checkCategoryHasAttributes.pending, (state) => {
        // Note: This is a lightweight check, don't set loading for UX
        state.error = null;
      })
      .addCase(
        checkCategoryHasAttributes.fulfilled,
        (state, action: PayloadAction<{ categoryId: string; hasAttributes: boolean }>) => {
          // Note: This thunk returns metadata, not attributes list
          // Admin UI can use this to show "Manage Attributes" button conditionally
        }
      )
      .addCase(checkCategoryHasAttributes.rejected, (state, action) => {
        state.error = action.payload || action.error.message || 'Failed to check attributes';
      });
  },
});

// ✅ Export actions
export const {
  clearCategoryAttributes,
  setSelectedCategoryId,
  clearError,
  optimisticUpdate,
  optimisticDelete,
} = categoryAttributeSlice.actions;

export const selectCategoryAttributes = (state: RootState): CategoryAttribute[] => {
  const attrs = state.categoryAttribute?.attributes || [];
  return attrs;
};

export const selectCategoryAttributesLoading = (state: RootState): boolean => {
  return state.categoryAttribute?.loading || false;
};

export const selectCategoryAttributesError = (state: RootState): string | null => {
  return state.categoryAttribute?.error || null;
};

export const selectSelectedCategoryId = (state: RootState): string | undefined | null => {
  return state.categoryAttribute?.selectedCategoryId;
};

export const selectActiveAttributes = (state: RootState): CategoryAttribute[] => {
  return (state.categoryAttribute?.attributes || []).filter((attr: CategoryAttribute) => attr?.isActive);
};

export const selectAttributeById = (attributeId: string) => (state: RootState): CategoryAttribute | undefined => {
  return (state.categoryAttribute?.attributes || []).find((attr: CategoryAttribute) => attr?._id === attributeId);
};

export const { resetCategoryAttributes } = categoryAttributeSlice.actions;

// ✅ Export reducer
export default categoryAttributeSlice.reducer;