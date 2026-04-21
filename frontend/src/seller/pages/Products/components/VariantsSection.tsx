// D:\Mani\Code with Zosh\Backup\source code\frontend\src\seller\pages\Products\components\VariantsSection.tsx
import React, { useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, Tabs, Tab, Paper, Grid, TextField,
  Chip, IconButton, Tooltip, Alert, FormControl, FormHelperText,
  InputLabel, Select, MenuItem, FormControlLabel, Checkbox,
  Switch,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import AddCircle from "@mui/icons-material/AddCircle";
import RemoveCircle from "@mui/icons-material/RemoveCircle";
import Lock from "@mui/icons-material/Lock";
import Info from "@mui/icons-material/Info";
import CheckCircle from "@mui/icons-material/CheckCircle";
import type { FormikProps } from 'formik';
import type { ProductVariantForm, CategoryAttribute, ProductSubVariantForm, ProductOfferForm } from '../types/productFormTypes';
import type { ProductFormValues } from '../types/productFormTypes';
import { useAppSelector } from '../../../../Redux Toolkit/Store';
import PaletteIcon from '@mui/icons-material/Palette';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';


const getFormikError = (formik: any, path: string): string | undefined => {
  try {
    const keys = path.split('.');
    let current: any = formik.errors;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return undefined;
      }
    }

    return typeof current === 'string' ? current : undefined;
  } catch {
    return undefined;
  }
};

// ✅ Helper: Safely check if field is touched
const isFormikTouched = (formik: any, path: string): boolean => {
  try {
    const keys = path.split('.');
    let current: any = formik.touched;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return false;
      }
    }

    return current === true;
  } catch {
    return false;
  }
};

const getCurrentSellerFromJWT = () => {
  try {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) return null;
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    return {
      _id: payload._id || payload.userId || payload.id || payload.sellerId,
      sellerName: payload.sellerName,
      businessDetails: payload.businessDetails,
      email: payload.email
    };
  } catch (e) {
    console.warn('⚠️ Could not decode JWT for current seller');
    return null;
  }
};

// ✅ UPDATED: Props interface
interface VariantsSectionProps {
  variants: ProductVariantForm[];
  activeColorTab: number;
  onAddColor: (templateData?: { color?: string; specifications?: Record<string, any>; images?: string[] }) => void;
  onRemoveColor: (index: number) => void;
  onColorTabChange: (index: number) => void;
  onColorChange: (index: number, value: string) => void;
  onImageUpload: (index: number, files: FileList | null) => void;
  onRemoveImage: (colorIndex: number, imageIndex: number) => void;
  onAddSubVariant?: (colorIndex: number, templateSpecs?: Record<string, any>) => void;
  onRemoveSubVariant?: (colorIndex: number, subVariantIndex: number) => void;
  onSubVariantChange?: (colorIndex: number, subVariantIndex: number, field: string, value: string | number) => void;
  onSubVariantSpecChange?: (colorIndex: number, subVariantIndex: number, attributeName: string, value: string | number | boolean) => void;
  expandedSubVariant?: number | null;
  onExpandedSubVariantChange?: (index: number | null) => void;
  colorHighlights?: Record<number, Record<string, string>>;
  onColorHighlightChange?: (colorIndex: number, attrName: string, value: string) => void;
  isCatalogProduct?: boolean;
  isOwner?: boolean;
  catalogSearch?: {
    selectedCatalog?: {
      variantTemplate?: any[];
      images?: string[];
    };
  };
  formik: FormikProps<ProductFormValues>;
  children?: React.ReactNode;
  onAddOffer?: (colorIndex: number, subVariantIndex: number) => void;
  onRemoveOffer?: (colorIndex: number, subVariantIndex: number, offerIndex: number) => void;
  onOfferChange?: (colorIndex: number, subVariantIndex: number, offerIndex: number, field: string, value: string | number | boolean) => void;

}

// ✅ FIX: Move renderAttributeField OUTSIDE component to prevent re-creation on every render
const renderAttributeField = (
  attr: CategoryAttribute,
  value: any,
  onChange: (val: string | number | boolean) => void,
  disabled: boolean = false
) => {
  const label = `${attr.label}${attr.required ? ' *' : ''}`;

  switch (attr.type) {
    case 'select':
      return (
        <FormControl fullWidth required={attr.required}>
          <InputLabel>
            {label}
            {disabled && <Lock fontSize="small" sx={{ ml: 0.5, color: 'text.disabled' }} />}
          </InputLabel>
          <Select
            value={value == null || value === '' ? '' : String(value)}
            label={label}
            onChange={(e: SelectChangeEvent<unknown>) => {
              const newValue = e.target.value;
              if (newValue !== undefined && newValue !== null) {
                onChange(newValue as string);
              }
            }}
            disabled={disabled}
            title={disabled ? "Inherited from catalog - cannot be changed" : ""}
            displayEmpty
            error={value != null && attr.options && !attr.options.includes(String(value))}
          >
            <MenuItem value="" disabled>
              <em>Select {attr.label}</em>
            </MenuItem>
            {attr.options?.map((opt: string) => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </Select>
          {value != null && attr.options && !attr.options.includes(String(value)) && (
            <FormHelperText error>Invalid value selected</FormHelperText>
          )}
        </FormControl>
      );
    case 'boolean':
      return (
        <FormControlLabel
          control={
            <Checkbox
              checked={!!value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
              disabled={disabled}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {label}
              {disabled && <Lock fontSize="small" sx={{ color: 'text.disabled' }} />}
            </Box>
          }
        />
      );
    case 'textarea':
      return (
        <TextField
          fullWidth
          multiline
          rows={2}
          label={label}
          value={value ?? ''}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
          required={attr.required}
          placeholder={attr.placeholder}
          disabled={disabled}
        />
      );
    default:
      return (
        <TextField
          fullWidth
          label={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {label}
              {disabled && <Lock fontSize="small" sx={{ color: 'text.disabled' }} />}
            </Box>
          }
          type={attr.type === 'number' ? 'number' : 'text'}
          value={value == null ? '' : value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const newValue = attr.type === 'number'
              ? (e.target.value === '' ? '' : Number(e.target.value))
              : e.target.value;
            onChange(newValue);
          }}
          required={attr.required}
          placeholder={attr.placeholder}
          disabled={disabled}
          inputProps={attr.type === 'number' ? { min: attr.min, max: attr.max, step: attr.step } : {}}
        />
      );
  }
};

// ✅ FIX: Wrap component with React.memo to prevent unnecessary re-renders
export const VariantsSection: React.FC<VariantsSectionProps> = React.memo(({
  variants,
  activeColorTab,
  onAddColor,
  onRemoveColor,
  onColorTabChange,
  onColorChange,
  onImageUpload,
  onRemoveImage,
  onAddSubVariant = () => { },
  onRemoveSubVariant = () => { },
  onSubVariantChange = () => { },
  onSubVariantSpecChange = () => { },
  expandedSubVariant = null,
  onExpandedSubVariantChange = () => { },
  colorHighlights = {},
  onColorHighlightChange = () => { },
  onAddOffer = () => { },
  onRemoveOffer = () => { },
  onOfferChange = () => { },
  isCatalogProduct = false,
  isOwner = false,
  catalogSearch,
  formik,
  children,
}) => {
  // ✅ Get category attributes from Redux
  const attributeState = useAppSelector((state: any) => state.categoryAttribute);
  const currentColorVariant = variants[activeColorTab];
  const editPermissionsLogged = useRef(false);
  const variantAttributesLogged = useRef(false);
  const variantOwnershipLogged = useRef(false);
  const isColorFromCatalog = currentColorVariant?.isFromCatalog === true;
  const currentSellerId = getCurrentSellerFromJWT()?._id;
  const isVariantOwner = currentColorVariant?.variantOwner === currentSellerId;

  const canEditStructure = !isCatalogProduct ||
    isOwner ||
    isVariantOwner ||
    !isColorFromCatalog;
  const canEditImages = !isCatalogProduct ||
    isOwner ||
    isVariantOwner ||
    !currentColorVariant?.isFromCatalog;

  if (!variantOwnershipLogged.current && currentColorVariant) {
    console.log('🔍 [Variant Ownership Check]', {
      currentSellerId,
      variantOwner: currentColorVariant?.variantOwner,
      isVariantOwner,
      colorName: currentColorVariant?.color
    });
    variantOwnershipLogged.current = true;  // ✅ Mark as logged
  }

  if (!editPermissionsLogged.current && currentColorVariant) {
    console.log('🔍 [Edit Permissions]', {
      isCatalogProduct,
      isOwner,
      isVariantOwner,
      isColorFromCatalog,
      canEditStructure,
      canEditImages,
      colorVariantId: currentColorVariant?._id,
      colorName: currentColorVariant?.color
    });
    editPermissionsLogged.current = true;  // ✅ Mark as logged
  }

  // ✅ Filter variant attributes (admin-configured fields where isVariantField: true)
  const variantAttributes = useMemo(() => {
    const attrs = (attributeState.attributes || [])
      .filter((attr: CategoryAttribute) => attr.isVariantField && attr.isActive)
      .sort((a: CategoryAttribute, b: CategoryAttribute) => a.sortOrder - b.sortOrder);

    // ✅ Debug log
    if (!variantAttributesLogged.current && attrs.length > 0) {
      console.log('🔍 [VariantsSection] Variant Attributes:', {
        totalAttributes: attributeState.attributes?.length || 0,
        variantAttributesCount: attrs.length,
        variantAttributeNames: attrs.map((a: CategoryAttribute) => a.name),
        activeColorTab,
        subVariantsCount: variants[activeColorTab]?.subVariants?.length
      });
      variantAttributesLogged.current = true;  // ✅ Mark as logged
    }

    return attrs;
  }, [attributeState.attributes, activeColorTab, variants]);

  // ✅ Helper: Get inherited images for catalog products
  const inheritedImages = isCatalogProduct && !isOwner && variants[activeColorTab]?.images
    ? variants[activeColorTab].images
    : [];

  return (
    <Box sx={{ mt: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">🎨 Color Variants with Storage Options</Typography>
          {isCatalogProduct && (
            <Chip
              label={isOwner ? "👑 Catalog Owner" : "🔒 Shared Catalog"}
              size="small"
              color={isOwner ? "success" : "info"}
              variant="outlined"
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {isCatalogProduct && (
            <Tooltip title="Add a new color variant with fully editable specifications">
              <Button
                startIcon={<AddCircle />}
                onClick={(e) => {
                  e.preventDefault();  // ✅ Prevent default button behavior
                  e.stopPropagation(); // ✅ Stop event bubbling

                  // ✅ If catalog product, suggest using first variant as template
                  if (catalogSearch?.selectedCatalog?.variantTemplate) {
                    const firstVariant = catalogSearch.selectedCatalog.variantTemplate[0];
                    const templateData = {
                      color: '',  // Leave blank for seller to fill new color name
                      specifications: firstVariant?.specifications || {},
                      images: catalogSearch.selectedCatalog?.images || []  // ✅ Safe access
                    };
                    onAddColor(templateData);
                  } else {
                    onAddColor(undefined);
                  }
                }}
                variant="outlined"
                size="small"
                sx={{ fontSize: '0.75rem' }}
              >
                Add Color Variant
              </Button>
            </Tooltip>
          )}
          {!isCatalogProduct && canEditStructure && (
            <Button
              startIcon={<AddCircle />}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddColor(undefined);
              }}
              variant="outlined"
              size="small"
            >
              Add Color
            </Button>
          )}
        </Box>
      </Box>

      {/* Info banner for catalog non-owners */}
      {isCatalogProduct && !isOwner && (
        <Alert severity="info" variant="outlined" sx={{ mb: 2 }} icon={<Info />}>
          <Typography variant="body2">
            <strong>Shared Catalog Product:</strong> Catalog variants (marked with 🔒) are read-only.
            You can set your <strong>price and stock</strong> for catalog variants, or add <strong>NEW color variants</strong> (marked with ✅)
            which you fully own and can edit.
          </Typography>
        </Alert>
      )}

      {/* ✅ NEW: Info banner for NEW color variants */}
      {isCatalogProduct && !isOwner && currentColorVariant && !currentColorVariant.isFromCatalog && (
        <Alert severity="success" variant="outlined" sx={{ mb: 2 }} icon={<CheckCircle />}>
          <Typography variant="body2">
            <strong>🆕 New Color Variant:</strong> You're adding a new color. You can upload your own images, set specifications,
            and add your price/stock offers.
          </Typography>
        </Alert>
      )}

      {variants.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'amber.50' }}>
          <Typography>
            {isCatalogProduct
              ? "No variants selected from catalog. Please go back and select variants."
              : "No color variants added yet."}
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Color Tabs */}
          <Tabs
            value={activeColorTab}
            onChange={(event, newValue) => {
              console.log('🔄 [Color Tab Change] New value:', newValue);
              onColorTabChange(newValue);  // ✅ This should call setActiveColorTab
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ mb: 2 }}
          >
            {variants.map((colorVariant, colorIndex) => (
              <Tab
                key={colorIndex}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PaletteIcon fontSize="small" />
                    <Typography variant="body2">
                      {colorVariant.color || `Color ${colorIndex + 1}`}
                    </Typography>
                    {isCatalogProduct && !colorVariant.isFromCatalog && (
                      <Chip label="YOUR COLOR" size="small" color="success" variant="outlined" />
                    )}
                    {isCatalogProduct && colorVariant.isFromCatalog && (
                      <Lock fontSize="small" sx={{ fontSize: 14, color: 'text.secondary' }} />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      ({colorVariant.subVariants.length})
                    </Typography>
                  </Box>
                }

                iconPosition="end"
              />
            ))}
          </Tabs>

          {variants[activeColorTab] && (
            <Paper sx={{ p: 3 }}>
              {/* Color Field */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        Color *
                        {isCatalogProduct && !isOwner && isColorFromCatalog && (
                          <Tooltip title="Inherited from catalog - contact owner to change">
                            <Lock fontSize="small" sx={{ color: 'text.disabled' }} />
                          </Tooltip>
                        )}
                      </Box>
                    }
                    value={variants[activeColorTab]?.color || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      onColorChange(activeColorTab, e.target.value);
                    }}
                    onBlur={() => {
                      formik.setFieldTouched(`variants.${activeColorTab}.color`, true);
                    }}
                    required
                    disabled={isCatalogProduct && !isOwner && isColorFromCatalog}
                    error={
                      !!(
                        (formik.touched.variants as ProductVariantForm[] | undefined)?.[activeColorTab]?.color &&
                        (formik.errors.variants as Partial<Record<keyof ProductVariantForm, string>>[] | undefined)?.[activeColorTab]?.color
                      )
                    }
                    helperText={
                      (formik.touched.variants as ProductVariantForm[] | undefined)?.[activeColorTab]?.color &&
                        (formik.errors.variants as Partial<Record<keyof ProductVariantForm, string>>[] | undefined)?.[activeColorTab]?.color
                        ? (formik.errors.variants as Partial<Record<keyof ProductVariantForm, string>>[] | undefined)?.[activeColorTab]?.color
                        : isCatalogProduct && !isOwner && isColorFromCatalog
                          ? "This color is managed by the catalog owner"
                          : "Enter your custom color name"
                    }
                    InputProps={
                      isCatalogProduct && !isOwner && isColorFromCatalog
                        ? {
                          endAdornment: <Chip label="Read-Only" size="small" color="info" variant="outlined" />,
                        }
                        : undefined
                    }
                    autoFocus={!isColorFromCatalog && !variants[activeColorTab]?.color}
                  />
                </Grid>
              </Grid>

              {/* Image Upload Section */}
              {canEditImages && (
                <Grid size={{ xs: 12 }} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2">
                      Images for {variants[activeColorTab].color || 'this color'} *
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Upload at least 1 image (max 5)
                    </Typography>
                  </Box>
                  <Box sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    bgcolor: 'grey.50',
                    cursor: 'pointer',
                    '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' }
                  }}>
                    <Typography color="text.secondary">📁 Click to upload images or drag & drop</Typography>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => onImageUpload(activeColorTab, e.target.files)}
                      style={{ display: 'none' }}
                      id={`image-upload-${activeColorTab}`}
                    />
                    <label htmlFor={`image-upload-${activeColorTab}`}>
                      <Button component="span" variant="outlined" size="small" sx={{ mt: 1 }}>
                        Browse Files
                      </Button>
                    </label>
                  </Box>
                  {variants[activeColorTab].images?.length > 0 && (
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                      {variants[activeColorTab].images.map((img, idx) => {
                        const imageUrl = img?.startsWith('http://')
                          ? img.replace('http://', 'https://')
                          : img;
                        const imageKey = `${imageUrl}-${idx}`;
                        return (
                          <Box key={imageKey} sx={{ position: 'relative' }}>
                            <img
                              src={imageUrl || ''}
                              alt={`Preview ${idx + 1}`}
                              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                                e.currentTarget.style.display = 'none';
                              }}
                              style={{
                                width: 80,
                                height: 80,
                                objectFit: 'cover',
                                borderRadius: 8,
                                border: '2px solid #e0e0e0',
                                display: 'block'
                              }}
                            />
                            <IconButton
                              size="small"
                              onClick={() => onRemoveImage(activeColorTab, idx)}
                              sx={{
                                position: 'absolute',
                                top: -8,
                                right: -8,
                                bgcolor: 'white',
                                border: '1px solid #e0e0e0',
                                '&:hover': { bgcolor: 'error.light', color: 'white' },
                                zIndex: 1
                              }}
                            >
                              <RemoveCircle fontSize="small" />
                            </IconButton>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                  {variants[activeColorTab].images?.length === 0 && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      ℹ️ No images uploaded yet
                    </Typography>
                  )}
                </Grid>
              )}

              {/* Inherited Images for Catalog Non-Owners */}
              {isCatalogProduct && !isOwner && inheritedImages.length > 0 && (
                <Grid size={{ xs: 12 }} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary">🖼️ Inherited Images (Read-Only)</Typography>
                    <Tooltip title="These images are managed by the catalog owner">
                      <Lock fontSize="small" sx={{ color: 'text.disabled' }} />
                    </Tooltip>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {inheritedImages.map((img, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          position: 'relative',
                          opacity: 0.85,
                          '&::after': {
                            content: '""',
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            bgcolor: 'rgba(255,255,255,0.7)',
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }
                        }}
                      >
                        <img
                          src={img}
                          alt={`Inherited ${idx + 1}`}
                          style={{
                            width: 80,
                            height: 80,
                            objectFit: 'cover',
                            borderRadius: 8,
                            border: '1px solid #e0e0e0'
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            position: 'absolute',
                            zIndex: 1,
                            bgcolor: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            px: 0.5,
                            borderRadius: 1
                          }}
                        >
                          🔒
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    ℹ️ To update these images, contact the catalog owner or admin.
                  </Typography>
                </Grid>
              )}

              {variantAttributes.length > 0 && variants[activeColorTab]?.subVariants?.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      🔧 Variant Specifications (Admin-Configured)
                    </Typography>
                    <Chip label={`${variantAttributes.length} Fields`} size="small" color="info" variant="outlined" />
                  </Box>

                  {/* ✅ Render sub-variants for ACTIVE color tab ONLY */}
                  {variants[activeColorTab].subVariants.map((subVar, subIndex) => {
                    const isFromCatalog = subVar.isFromCatalog === true;
                    const isReadOnly = !isVariantOwner && isFromCatalog;
                    const catalogTemplateSpecs = catalogSearch?.selectedCatalog?.variantTemplate?.[subIndex]?.specifications;

                    {/* ✅✅✅ ADD THIS DEBUG BLOCK HERE (using correct variable name: subVar) */ }
                    {
                      (() => {
                        console.log('🔍 [VariantsSection] SubVariant Render Debug:', {
                          color: formik.values.variants[activeColorTab]?.color,
                          subIndex,
                          subVariantId: subVar._id,
                          specifications: subVar.specifications,
                          specsType: typeof subVar.specifications,
                          specsIsMap: subVar.specifications instanceof Map,
                          specsKeys: subVar.specifications ? Object.keys(subVar.specifications) : [],
                          hasRam: subVar.specifications?.ram,
                          hasStorage: subVar.specifications?.storage,
                          // ✅ FIXED: Add type annotation (a: CategoryAttribute)
                          variantAttributes: variantAttributes.map((a: CategoryAttribute) => ({
                            name: a.name,
                            isVariantField: a.isVariantField,
                            label: a.label
                          })),
                          isReadOnly,
                          isFromCatalog: subVar.isFromCatalog
                        });
                        return null;
                      })()
                    }

                    return (
                      <Paper
                        key={subVar._id || `sub-${activeColorTab}-${subIndex}`}
                        sx={{
                          p: 3,
                          mb: 2,
                          bgcolor: isFromCatalog ? 'grey.50' : 'success.50',
                          border: '1px solid',
                          borderColor: isFromCatalog ? 'grey.300' : 'success.300'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold" color="primary">
                              Storage Variant {subIndex + 1}
                            </Typography>
                            {isFromCatalog ? (
                              <Chip label="From Catalog" size="small" color="info" variant="outlined" />
                            ) : (
                              <Chip label="New Variant" size="small" color="success" variant="outlined" />
                            )}
                          </Box>
                          {variants[activeColorTab].subVariants.length > 1 && !isReadOnly && (
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => onRemoveSubVariant?.(activeColorTab, subIndex)}
                              startIcon={<RemoveCircle fontSize="small" />}
                            >
                              Remove
                            </Button>
                          )}
                        </Box>

                        {/* ✅ Variant Attributes (RAM, Storage, etc. from admin config) */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          {variantAttributes.map((attr: CategoryAttribute) => {
                            const catalogSpecValue = catalogTemplateSpecs?.[attr.name];
                            const formValue = subVar.specifications?.[attr.name];

                            // ✅ FIX: Ensure value is always a string for proper select matching
                            let value = '';
                            if (formValue !== undefined && formValue !== null) {
                              value = String(formValue);
                            } else if (catalogSpecValue !== undefined && catalogSpecValue !== null) {
                              value = String(catalogSpecValue);
                            }

                            return (
                              <Grid key={attr._id || attr.name} size={{ xs: 12, sm: 6 }}>
                                {renderAttributeField(
                                  attr,
                                  value,  // ✅ Always pass string value
                                  (newValue: any) => {
                                    if (!isReadOnly) {
                                      onSubVariantSpecChange?.(activeColorTab, subIndex, attr.name, newValue);
                                    }
                                  },
                                  isReadOnly
                                )}
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                                  Type: {attr.type} | Required: {attr.required ? 'Yes' : 'No'}
                                  {isReadOnly && ' 🔒 Read-Only (from catalog)'}
                                  {!isReadOnly && ' ✏️ Editable'}
                                </Typography>
                              </Grid>
                            );
                          })}
                        </Grid>

                        {/* ✅ Seller Offers Section - FIXED */}
                        <Box sx={{ mt: 2, p: 2, bgcolor: 'blue.50', borderRadius: 1, border: '1px dashed blue.200' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="subtitle2" fontWeight="bold" color="primary">
                              🏪 Seller Offers for this Variant
                            </Typography>
                            <Chip
                              label={`${subVar.offers?.filter(o => !o.toBeDeleted)?.length || 0} offer(s)`}
                              size="small"
                              color="info"
                              variant="outlined"
                            />
                          </Box>

                          {/* ✅ List existing offers */}
                          {(() => {
                            const currentSeller = getCurrentSellerFromJWT();
                            const activeOffers = subVar.offers?.filter(o => !o.toBeDeleted) || [];

                            if (activeOffers.length === 0) {
                              return (
                                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', py: 1 }}>
                                  No offers added yet. Click "Add Your Offer" below.
                                </Typography>
                              );
                            }

                            return activeOffers.map((offer: ProductOfferForm, offerIndex: number) => {
                              const isCurrentSellerOffer = offer.sellerId === (currentSeller?._id || '');
                              const isReadOnly = isCatalogProduct && !isOwner && !isVariantOwner && subVar.isFromCatalog === true;

                              return (
                                <Paper
                                  key={offer._id || `offer-${subIndex}-${offerIndex}-${offer.sellerId}`}
                                  sx={{
                                    p: 2,
                                    mb: 1,
                                    bgcolor: isCurrentSellerOffer ? 'success.50' : 'grey.50',
                                    border: '1px solid',
                                    borderColor: isCurrentSellerOffer ? 'success.300' : 'grey.300'
                                  }}
                                >
                                  {/* ✅ Offer Header */}
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography variant="body2" fontWeight="bold">
                                      {isCurrentSellerOffer ? '🟢 Your Offer' : '🔵 Other Seller'}
                                    </Typography>
                                    {(isCurrentSellerOffer || isOwner) && !isReadOnly && (
                                      <Button
                                        size="small"
                                        color="error"
                                        variant="outlined"
                                        onClick={() => onRemoveOffer?.(activeColorTab, subIndex, offerIndex)}
                                        startIcon={<RemoveCircle fontSize="small" />}
                                      >
                                        Remove
                                      </Button>
                                    )}
                                  </Box>

                                  {/* ✅ Read-only display (always show) */}
                                  <Grid container spacing={2}>
                                    <Grid size={{ xs: 6, sm: 3 }}>
                                      <Typography variant="caption" color="text.secondary">MRP Price (₹):</Typography>
                                      <Typography variant="body2" fontWeight="500">
                                        {offer.mrpPrice ? `₹${offer.mrpPrice}` : '-'}
                                      </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6, sm: 3 }}>
                                      <Typography variant="caption" color="text.secondary">Selling Price (₹):</Typography>
                                      <Typography variant="body2" fontWeight="bold" color="primary">
                                        {offer.sellingPrice ? `₹${offer.sellingPrice}` : '-'}
                                      </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6, sm: 3 }}>
                                      <Typography variant="caption" color="text.secondary">Stock:</Typography>
                                      <Typography variant="body2">{offer.stock ?? '0'}</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 6, sm: 3 }}>
                                      <Typography variant="caption" color="text.secondary">SKU:</Typography>
                                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                        {offer.sku || '-'}
                                      </Typography>
                                    </Grid>
                                  </Grid>

                                  {/* ✅✅✅ Editable fields for YOUR offer - ALWAYS EDITABLE for price/stock */}
                                  {isCurrentSellerOffer && (
                                    <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed grey' }}>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                                        ✏️ Edit Your Offer:
                                      </Typography>
                                      <Grid container spacing={2}>
                                        {/* MRP Price - ALWAYS EDITABLE */}
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                          <TextField
                                            size="small"
                                            type="number"
                                            label="MRP Price (₹) *"
                                            value={String(offer.mrpPrice ?? '')}
                                            onChange={(e) => {
                                              onOfferChange?.(activeColorTab, subIndex, offerIndex, 'mrpPrice', e.target.value);
                                            }}
                                            inputProps={{ min: 0, step: "0.01" }}
                                            fullWidth
                                            required
                                            // ✅ NEVER disable price fields - seller must be able to edit their offer
                                            disabled={false}
                                            error={Boolean(getFormikError(formik, `variants.${activeColorTab}.subVariants.${subIndex}.offers.${offerIndex}.mrpPrice`))}
                                            helperText={getFormikError(formik, `variants.${activeColorTab}.subVariants.${subIndex}.offers.${offerIndex}.mrpPrice`) || ''}
                                          />
                                        </Grid>

                                        {/* Selling Price - ALWAYS EDITABLE */}
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                          <TextField
                                            size="small"
                                            type="number"
                                            label="Selling Price (₹) *"
                                            value={String(offer.sellingPrice ?? '')}
                                            onChange={(e) => {
                                              onOfferChange?.(activeColorTab, subIndex, offerIndex, 'sellingPrice', e.target.value);
                                            }}
                                            inputProps={{ min: 0, step: "0.01" }}
                                            fullWidth
                                            required
                                            disabled={false}
                                            error={Boolean(getFormikError(formik, `variants.${activeColorTab}.subVariants.${subIndex}.offers.${offerIndex}.sellingPrice`))}
                                            helperText={getFormikError(formik, `variants.${activeColorTab}.subVariants.${subIndex}.offers.${offerIndex}.sellingPrice`) || ''}
                                          />
                                        </Grid>

                                        {/* Stock - ALWAYS EDITABLE */}
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                          <TextField
                                            size="small"
                                            type="number"
                                            label="Stock Quantity"
                                            value={String(offer.stock ?? '0')}
                                            onChange={(e) => {
                                              onOfferChange?.(activeColorTab, subIndex, offerIndex, 'stock', e.target.value);
                                            }}
                                            inputProps={{ min: 0 }}
                                            fullWidth
                                            disabled={false}
                                          />
                                        </Grid>

                                        {/* SKU - ALWAYS EDITABLE */}
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                          <TextField
                                            size="small"
                                            label="SKU (Optional)"
                                            value={String(offer.sku ?? '')}
                                            onChange={(e) => {
                                              onOfferChange?.(activeColorTab, subIndex, offerIndex, 'sku', e.target.value);
                                            }}
                                            fullWidth
                                            placeholder="Auto-generated if empty"
                                            disabled={false}
                                          />
                                        </Grid>

                                        {/* ✅ REMOVED: Active toggle button - not needed */}
                                      </Grid>
                                    </Box>
                                  )}
                                </Paper>
                              );
                            });
                          })()}

                          {/* ✅ Add Your Offer Button */}
                          {(() => {
                            const currentSeller = getCurrentSellerFromJWT();
                            const hasSellerOffer = subVar.offers?.some(
                              (offer) => !offer.toBeDeleted && offer.sellerId === (currentSeller?._id || '')
                            );

                            return !hasSellerOffer && !isReadOnly ? (
                              <Button
                                type="button"
                                size="small"
                                variant="outlined"
                                startIcon={<AddCircle fontSize="small" />}
                                onClick={() => onAddOffer?.(activeColorTab, subIndex)}
                                sx={{ mt: 1 }}
                              >
                                + Add Your Offer
                              </Button>
                            ) : null;
                          })()}

                          {/* Info text */}
                          {isCatalogProduct && !isOwner && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
                              ℹ️ You can add your price/stock offer for this variant. Other details are managed by the catalog owner.
                            </Typography>
                          )}
                        </Box>
                      </Paper>
                    );
                  })}
                  {/* ✅ Add Storage Variant Button */}
                  <Box sx={{ mt: 2 }}>
                    <Button
                      type="button"
                      startIcon={<AddCircle />}
                      onClick={() => {
                        // ✅ If catalog product, pre-fill specs from template for consistency
                        if (isCatalogProduct && catalogSearch?.selectedCatalog?.variantTemplate) {
                          // Get the last variant from template as base for new variant
                          const lastTemplate = catalogSearch.selectedCatalog.variantTemplate.slice(-1)[0];
                          onAddSubVariant?.(activeColorTab, lastTemplate?.specifications || {});
                        } else {
                          onAddSubVariant?.(activeColorTab);
                        }
                      }}
                      variant="outlined"
                      size="small"
                    >
                      {isCatalogProduct ? '+ Add New Variant' : '+ Add Storage Variant'}
                    </Button>
                    {isCatalogProduct && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        💡 Add a new variant that doesn't exist in the catalog (e.g., 4GB RAM)
                      </Typography>
                    )}
                  </Box>
                </Box>
              )}

              {/* Helper text for catalog products */}
              {isCatalogProduct && (
                <Alert severity="success" variant="standard" sx={{ mt: 2 }} icon={<CheckCircle />}>
                  <Typography variant="body2">
                    <strong>Tip:</strong> Competitive pricing and good stock availability
                    will help your offer appear higher in search results!
                  </Typography>
                </Alert>
              )}
            </Paper>
          )}
        </>
      )}

      {/* ✅ Render children if provided (for extensibility) */}
      {children}
    </Box>
  );
}, (prevProps, nextProps) => {
  // ✅ Custom comparison: Only compare ACTUAL PROPS (not internal state)
  return (
    prevProps.variants === nextProps.variants &&
    prevProps.activeColorTab === nextProps.activeColorTab &&
    prevProps.isCatalogProduct === nextProps.isCatalogProduct &&
    prevProps.isOwner === nextProps.isOwner &&
    prevProps.formik === nextProps.formik
  );
});

export default VariantsSection;