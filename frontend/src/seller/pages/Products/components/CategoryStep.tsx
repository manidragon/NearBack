// D:\Mani\Code with Zosh\Backup\source code\frontend\src\seller\pages\Products\components\CategoryStep.tsx
import React, { useEffect, useMemo } from 'react';
import { Grid, Paper, Typography, FormControl, InputLabel, Select, MenuItem, FormHelperText, Alert, CircularProgress, Box, Button, Chip } from '@mui/material';
import type { FormikProps } from 'formik';
import type { ProductFormValues } from '../types/productFormTypes';
import type { Category } from '../../../../types/categoryTypes';
import { useAppDispatch, useAppSelector } from '../../../../Redux Toolkit/Store';
import { getCategoriesByLevel } from '../../../../Redux Toolkit/Admin/CategorySlice';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockIcon from '@mui/icons-material/Lock';

interface CategoryStepProps {
  formik: FormikProps<ProductFormValues>;
  categories?: Category[];
  levelOneCategories?: Category[];
  levelTwoCategories?: Category[];
  levelThreeCategories?: Category[];
  attributesLoading?: boolean;
  isCatalogProduct?: boolean;
  selectedCatalog?: any | null;
}

export const CategoryStep: React.FC<CategoryStepProps> = ({
  formik,
  categories = [],
  levelOneCategories = [],
  levelTwoCategories = [],
  levelThreeCategories = [],
  attributesLoading = false,
  isCatalogProduct = false,
  selectedCatalog = null,
}) => {
  const dispatch = useAppDispatch();
  const categoryState = useAppSelector((state: any) => state.category);
  
  // ✅ Load categories from Redux if not passed as props
  useEffect(() => {
    if (categoryState.categories?.length === 0) {
      dispatch(getCategoriesByLevel(1));
      dispatch(getCategoriesByLevel(2));
      dispatch(getCategoriesByLevel(3));
    }
  }, [dispatch, categoryState.categories?.length]);

  // ✅ Merge passed props with Redux state
  const allCategories = useMemo(() => 
    categoryState.categories?.length > 0 ? categoryState.categories : categories,
  [categoryState.categories, categories]);

  // ✅ Filter categories by level
  const allLevelOne = useMemo(() => 
    allCategories.filter((c: Category) => c.level === 1), 
  [allCategories]);
  
  const allLevelTwo = useMemo(() => 
    allCategories.filter((c: Category) => c.level === 2), 
  [allCategories]);
  
  const allLevelThree = useMemo(() => 
    allCategories.filter((c: Category) => c.level === 3), 
  [allCategories]);

  // ✅✅✅ CRITICAL FIX: Filter Level 2 by selected Level 1 parent
const filteredLevelTwo = useMemo(() => {
  if (!formik.values.category) return [];
  return allLevelTwo.filter((cat: Category) => {
    const parent = cat.parentCategory;
    
    // Handle parentCategory as string (direct _id)
    if (typeof parent === 'string') {
      return parent === formik.values.category;
    }
    
    // Handle parentCategory as object with _id
    if (parent && typeof parent === 'object' && '_id' in parent) {
      return (parent as any)._id === formik.values.category;
    }
    
    return false;
  });
}, [allLevelTwo, formik.values.category]);

// ✅✅✅ SAFE: Filter Level 3 by selected Level 2 parent
const filteredLevelThree = useMemo(() => {
  if (!formik.values.category2) return [];
  return allLevelThree.filter((cat: Category) => {
    const parent = cat.parentCategory;
    
    // Handle parentCategory as string (direct _id)
    if (typeof parent === 'string') {
      return parent === formik.values.category2;
    }
    
    // Handle parentCategory as object with _id
    if (parent && typeof parent === 'object' && '_id' in parent) {
      return (parent as any)._id === formik.values.category2;
    }
    
    return false;
  });
}, [allLevelThree, formik.values.category2]);

  // ✅ Check if this is a catalog product with pre-filled categories
  const isCatalogWithCategories = isCatalogProduct && selectedCatalog?.category;

  // ✅ Get category name helper
  const getCategoryName = (categoryId: string | undefined): string => {
    if (!categoryId) return '';
    const cat = allCategories.find((c: Category) => c._id === categoryId);
    return cat?.name || '';
  };

  // ✅ If catalog product with categories, show read-only summary
  if (isCatalogWithCategories) {
    return (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Alert severity="success" variant="outlined" icon={<CheckCircleIcon />}>
            <Typography variant="body1" fontWeight="500">
              ✅ Catalog Product: "{selectedCatalog.title}"
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Category is inherited from catalog. Click "Continue" to proceed.
            </Typography>
          </Alert>
        </Grid>
        
        {/* Show inherited category path */}
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, bgcolor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}>
            <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
              📁 Inherited Category Path
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={getCategoryName(formik.values.category) || 'Loading...'} size="small" variant="outlined" />
              <Typography>→</Typography>
              <Chip label={getCategoryName(formik.values.category2) || 'Loading...'} size="small" variant="outlined" />
              <Typography>→</Typography>
              <Chip label={getCategoryName(formik.values.category3) || 'Loading...'} size="small" color="primary" icon={<LockIcon fontSize="small" />} />
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              ℹ️ Categories cannot be changed for catalog products
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    );
  }

  // ✅ If catalog is selected but categories not yet loaded, show loading
  if (isCatalogProduct && selectedCatalog && !formik.values.category3) {
    return (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
            <CircularProgress size={24} />
            <Typography>Loading category information from catalog...</Typography>
          </Box>
        </Grid>
      </Grid>
    );
  }

  // ✅ Normal category selection flow (for independent products)
  return (
    <Grid container spacing={2}>
      {/* Catalog Search Banner */}
      <Grid size={{ xs: 12 }}>
        <Alert severity="info" variant="outlined" sx={{ mb: 2 }}>
          <Typography variant="body2">
            💡 Selling a product that already exists?
            <strong> Search the catalog first</strong>
          </Typography>
        </Alert>
      </Grid>

      {/* Category Header */}
      <Grid size={{ xs: 12 }}>
        <Paper className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Typography variant="h6" className="font-semibold text-blue-800">
            📁 Select Product Category
          </Typography>
          <Typography variant="body2" className="text-blue-600 mt-1">
            Choose the most specific category for your product (Level 3)
          </Typography>
        </Paper>
      </Grid>

      {/* Category Dropdowns - Now properly filtered by parent */}
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <FormControl fullWidth error={Boolean(formik.errors.category)} required>
          <InputLabel id="category-label">Main Category *</InputLabel>
          <Select
            labelId="category-label"
            id="category"
            name="category"
            value={formik.values.category || ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            label="Main Category *"
          >
            <MenuItem value=""><em>Select Main Category</em></MenuItem>
            {allLevelOne.map((cat: Category) => (
              <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
            ))}
          </Select>
          {formik.touched.category && formik.errors.category && (
            <FormHelperText error>{String(formik.errors.category)}</FormHelperText>
          )}
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <FormControl fullWidth error={Boolean(formik.errors.category2)} required disabled={!formik.values.category}>
          <InputLabel id="category2-label">Sub-Category *</InputLabel>
          <Select
            labelId="category2-label"
            id="category2"
            name="category2"
            value={formik.values.category2 || ''}
            onChange={(e) => {
              formik.handleChange(e);
              // ✅ Reset Level 3 when Level 2 changes
              formik.setFieldValue('category3', '');
            }}
            onBlur={formik.handleBlur}
            label="Sub-Category *"
          >
            <MenuItem value=""><em>Select Sub-Category</em></MenuItem>
            {/* ✅ Use filteredLevelTwo instead of allLevelTwo */}
            {filteredLevelTwo.map((cat: Category) => (
              <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
            ))}
          </Select>
          {formik.touched.category2 && formik.errors.category2 && (
            <FormHelperText error>{String(formik.errors.category2)}</FormHelperText>
          )}
          {!formik.values.category && (
            <FormHelperText>Select a Main Category first</FormHelperText>
          )}
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <FormControl fullWidth error={Boolean(formik.errors.category3)} required disabled={!formik.values.category2}>
          <InputLabel id="category3-label">Product Type *</InputLabel>
          <Select
            labelId="category3-label"
            id="category3"
            name="category3"
            value={formik.values.category3 || ''}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            label="Product Type *"
          >
            <MenuItem value=""><em>Select Product Type</em></MenuItem>
            {/* ✅ Use filteredLevelThree instead of allLevelThree */}
            {filteredLevelThree.map((cat: Category) => (
              <MenuItem key={cat._id} value={cat._id}>{cat.name}</MenuItem>
            ))}
          </Select>
          {formik.touched.category3 && formik.errors.category3 && (
            <FormHelperText error>{String(formik.errors.category3)}</FormHelperText>
          )}
          {!formik.values.category2 && (
            <FormHelperText>Select a Sub-Category first</FormHelperText>
          )}
        </FormControl>
      </Grid>

      {/* Selected Category Path Display */}
      {formik.values.category3 && (
        <Grid size={{ xs: 12 }}>
          <Paper className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <Typography variant="body2" className="text-green-700">
              ✅ Selected Path:{' '}
              {getCategoryName(formik.values.category)} →{' '}
              {getCategoryName(formik.values.category2)} →{' '}
              <strong>{getCategoryName(formik.values.category3)}</strong>
            </Typography>
          </Paper>
        </Grid>
      )}

      {/* Loading State for Attributes */}
      {formik.values.category3 && attributesLoading && (
        <Grid size={{ xs: 12 }}>
          <Box className="flex items-center gap-2 text-amber-600">
            <CircularProgress size={20} />
            <Typography variant="body2">Loading product specifications...</Typography>
          </Box>
        </Grid>
      )}
    </Grid>
  );
};