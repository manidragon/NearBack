// D:\Mani\Code with Zosh\Backup\source code\frontend\src\seller\pages\Products\components\ReviewStep.tsx
import React from 'react';
import { Grid, Paper, Typography, Box, Alert, Chip, Divider } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import StoreIcon from '@mui/icons-material/Store';
import type { FormikProps } from 'formik';
import type { ProductFormValues, ProductVariantForm, ProductSubVariantForm } from '../types/productFormTypes';
import type { Category } from '../../../../types/categoryTypes';

// ✅ UPDATED: Props interface to include categories from parent
interface ReviewStepProps {
  formik: FormikProps<ProductFormValues>;
  categories?: Category[];
  isCatalogProduct?: boolean;
  isOwner?: boolean;
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  formik,
  categories = [],
  isCatalogProduct = false,
  isOwner = false,
}) => {

  const getCategoryName = (categoryId: string | undefined): string => {
    if (!categoryId) return 'N/A';
    const cat = categories.find((c: Category) => c._id === categoryId);
    return cat?.name || categoryId;
  };

  const getOfferSummary = (subVar: ProductSubVariantForm) => {
    const firstOffer = subVar.offers?.[0];
    return {
      mrpPrice: firstOffer?.mrpPrice || '-',
      sellingPrice: firstOffer?.sellingPrice || '-',
      stock: firstOffer?.stock || '0',
      sku: firstOffer?.sku || '-'
    };
  };

  // ✅ Helper: Build category path string
  const categoryPath = React.useMemo(() => {
    const level1 = getCategoryName(formik.values.category);
    const level2 = getCategoryName(formik.values.category2);
    const level3 = getCategoryName(formik.values.category3);

    if (level1 === 'N/A' && level2 === 'N/A' && level3 === 'N/A') {
      return 'No category selected';
    }

    const parts = [level1, level2, level3].filter(p => p !== 'N/A');
    return parts.join(' → ');
  }, [formik.values.category, formik.values.category2, formik.values.category3, categories]);

  // ✅ Helper: Format price with currency
  const formatPrice = (value: string | number | undefined): string => {
    if (!value) return 'N/A';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 'N/A' : `₹${num.toLocaleString()}`;
  };

  return (
    <Grid container spacing={2}>
      {/* Header */}
      <Grid size={{ xs: 12 }}>
        <Paper
          sx={{
            p: 3,
            bgcolor: isCatalogProduct
              ? (isOwner ? 'success.50' : 'warning.50')
              : 'green.50',
            border: '1px solid',
            borderColor: isCatalogProduct
              ? (isOwner ? 'success.light' : 'warning.light')
              : 'green.200'
          }}
        >
          <Typography variant="h6" fontWeight="bold" sx={{
            color: isCatalogProduct
              ? (isOwner ? 'success.dark' : 'warning.dark')
              : 'green.800',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            {isCatalogProduct ? (isOwner ? '👑' : '📦') : '✅'}
            {isCatalogProduct
              ? isOwner
                ? 'Review & Submit Catalog Product'
                : 'Review & Submit Catalog Offer'
              : 'Review & Submit'}
          </Typography>
          <Typography variant="body2" sx={{
            color: isCatalogProduct
              ? (isOwner ? 'success.600' : 'warning.600')
              : 'green.600',
            mt: 1
          }}>
            {isCatalogProduct
              ? isOwner
                ? "Review your catalog product details before submitting. Changes will affect all sellers."
                : "Review your offer details. Shared product info is managed by the catalog owner."
              : "Review your product details before submitting"}
          </Typography>
        </Paper>
      </Grid>

      {/* Catalog Badge */}
      {isCatalogProduct && (
        <Grid size={{ xs: 12 }}>
          <Chip
            label={isOwner ? "👑 Catalog Owner" : "📦 Shared Catalog Offer"}
            color={isOwner ? "success" : "warning"}
            icon={isOwner ? undefined : <StoreIcon />}
            sx={{ mb: 2 }}
          />
        </Grid>
      )}

      {/* Product Summary */}
      <Grid size={{ xs: 12 }}>
        <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            📦 Product Summary
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="body2" color="text.secondary">Title:</Typography>
              <Typography variant="body1" fontWeight="500">
                {formik.values.title?.trim() || 'N/A'}
              </Typography>
              {isCatalogProduct && !isOwner && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  ℹ️ Inherited from catalog (read-only)
                </Typography>
              )}
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Typography variant="body2" color="text.secondary">Description:</Typography>
              <Typography variant="body1" sx={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                maxHeight: '100px',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {formik.values.description?.trim() || 'N/A'}
              </Typography>
              {isCatalogProduct && !isOwner && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  ℹ️ Inherited from catalog (read-only)
                </Typography>
              )}
            </Grid>
          </Grid>
        </Paper>
      </Grid>

      {/* Category Summary */}
      <Grid size={{ xs: 12 }}>
        <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            📁 Category Path
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={getCategoryName(formik.values.category)}
              size="small"
              variant="outlined"
            />
            <Typography color="text.secondary">→</Typography>
            <Chip
              label={getCategoryName(formik.values.category2)}
              size="small"
              variant="outlined"
            />
            <Typography color="text.secondary">→</Typography>
            <Chip
              label={getCategoryName(formik.values.category3)}
              size="small"
              color="primary"
              variant="filled"
            />
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {getCategoryName(formik.values.category)} →
            {getCategoryName(formik.values.category2)} →
            <strong> {getCategoryName(formik.values.category3)}</strong>
          </Typography>
        </Paper>
      </Grid>

      {/* Color Variants Summary */}
      <Grid size={{ xs: 12 }}>
        <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              🎨 {isCatalogProduct ? 'Your Offer Details' : 'Color Variants'} ({formik.values.variants.length})
            </Typography>
            {isCatalogProduct && !isOwner && (
              <Chip
                label="Price/Stock Editable"
                size="small"
                color="success"
                variant="outlined"
              />
            )}
          </Box>

          {formik.values.variants.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              No variants added yet
            </Typography>
          ) : (
            formik.values.variants.map((colorVariant: ProductVariantForm, colorIndex: number) => (
              <Box
                key={colorIndex}
                sx={{
                  mb: 2,
                  p: 2,
                  bgcolor: 'white',
                  borderRadius: 1,
                  border: '1px solid #e0e0e0',
                  '&:last-child': { mb: 0 }
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="body2" fontWeight="bold" color="primary">
                    🎨 Color: {colorVariant.color?.trim() || 'N/A'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {colorVariant.subVariants.length} variant(s) | {colorVariant.images.length} image(s)
                  </Typography>
                </Box>

                <Divider sx={{ my: 1 }} />

                {colorVariant.subVariants.map((subVar: ProductSubVariantForm, subIndex: number) => {
                  // Build spec summary from variant attributes
                  const specEntries = Object.entries(subVar.specifications || {})
                    .filter(([_, v]) => v)
                    .map(([k, v]) => `${k}: ${v}`);

                  return (
                    <Box
                      key={subIndex}
                      sx={{
                        ml: 2,
                        mt: subIndex > 0 ? 1 : 0,
                        p: 1.5,
                        bgcolor: 'grey.50',
                        borderRadius: 1,
                        borderLeft: '3px solid',
                        borderColor: 'primary.main'
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                        <Box>
                          <Typography variant="body2" fontWeight="500">
                            {specEntries.length > 0 ? specEntries.join(' | ') : 'Base variant'}
                          </Typography>
                          {/* ✅ Use getOfferSummary helper to access offers[0].sku */}
                          <Typography variant="caption" color="text.secondary">
                            SKU: {getOfferSummary(subVar).sku !== '-' ? getOfferSummary(subVar).sku : 'Auto-generated'}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right' }}>
                          {/* ✅ Use getOfferSummary helper to access offers[0] */}
                          <Typography variant="body2" fontWeight="bold" color="primary">
                            {formatPrice(getOfferSummary(subVar).sellingPrice)}
                          </Typography>

                          {/* ✅ Compare MRP vs Selling Price from offers[0] */}
                          {getOfferSummary(subVar).mrpPrice !== '-' &&
                            getOfferSummary(subVar).mrpPrice !== getOfferSummary(subVar).sellingPrice && (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textDecoration: 'line-through' }}>
                                {formatPrice(getOfferSummary(subVar).mrpPrice)}
                              </Typography>
                            )}

                          {/* ✅ Display stock from offers[0] */}
                          <Chip
                            label={`Stock: ${getOfferSummary(subVar).stock}`}
                            size="small"
                            color={Number(getOfferSummary(subVar).stock) > 0 ? 'success' : 'error'}
                            sx={{ mt: 0.5 }}
                          />
                        </Box>
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            ))
          )}
        </Paper>
      </Grid>

      {/* Info Alert */}
      <Grid size={{ xs: 12 }}>
        <Alert
          severity={isCatalogProduct && !isOwner ? "warning" : "info"}
          icon={<CheckCircleIcon />}
          sx={{ '& .MuiAlert-icon': { alignItems: 'flex-start', mt: 0.5 } }}
        >
          <Typography variant="body2">
            {isCatalogProduct && !isOwner
              ? "⚠️ You are listing an offer on a shared catalog product. Other sellers may also offer this product. Customers will choose based on price and seller rating."
              : "✅ All category-specific specifications (RAM, Storage, etc.) are configured per sub-variant. Product Highlights (Processor, Warranty) are shared across all variants of the same color."}
          </Typography>
          {isCatalogProduct && isOwner && (
            <Typography variant="caption" color="warning.dark" sx={{ display: 'block', mt: 1 }}>
              👑 As catalog owner, you can edit shared product details (title, description, images) that all sellers will see.
            </Typography>
          )}
        </Alert>
      </Grid>
    </Grid>
  );
};