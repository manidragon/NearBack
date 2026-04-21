// D:\Mani\Code with Zosh\Backup\source code\frontend\src\seller\pages\Products\AddProductForm.tsx
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stepper, Step, StepLabel, Grid, Button, Snackbar, Alert, Box, Typography, CircularProgress, Chip, TextField
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { useProductForm } from './hooks/useProductForm';
import { useCatalogSearch } from './hooks/useCatalogSearch';
import { CatalogSearchStep } from './components/CatalogSearchStep';
import { CategoryStep } from './components/CategoryStep';
import { BasicInfoStep } from './components/BasicInfoStep';
import { VariantsSection } from './components/VariantsSection';
import { ReviewStep } from './components/ReviewStep';
import { createProduct, updateProduct, resetCreateFlag, resetUpdateFlag } from '../../../Redux Toolkit/Seller/sellerProductSlice';
import { fetchCategories } from '../../../Redux Toolkit/Admin/CategorySlice';
import type { ProductFormValues, ProductVariantPayload, ProductCreatePayload, ProductUpdatePayload, ProductVariantForm, ProductSubVariantForm, ProductOfferForm } from './types/productFormTypes';
import type { Category } from '../../../types/categoryTypes';
import { uploadToCloudinary } from '../../../util/uploadToCloudnary';


import type { CategoryAttribute } from './types/productFormTypes';
import { createValidationSchema } from './validation/productValidation';
import { fetchCategoryAttributes, resetCategoryAttributes } from '../../../Redux Toolkit/Admin/CategoryAttributeSlice';

const AddProductForm: React.FC<{
  initialValues?: ProductFormValues;
  mode?: "add" | "edit";
  onSubmit?: (values: ProductFormValues) => void;
  onClose?: () => void;
}> = ({ initialValues, mode = "add", onSubmit, onClose }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const attributeState = useAppSelector((state: any) => state.categoryAttribute);
  const [activeStep, setActiveStep] = useState(0);
  const [snackbarOpen, setOpenSnackbar] = useState(false);
  const isSubmittingRef = useRef(false);
  const [activeColorTab, setActiveColorTab] = useState(0);
  const [expandedSubVariant, setExpandedSubVariant] = useState<number | null>(0);
  const [colorHighlights, setColorHighlights] = useState<Record<number, Record<string, string>>>({});
  const fetchedCategoryRef = useRef<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");
  const isUserSubmittedRef = useRef(false);

  const categoryState = useAppSelector((state: any) => state.category);
  const sellerProduct = useAppSelector((state: any) => state.sellerProduct);

  // ✅ Fetch categories on mount (if not already loaded)
  useEffect(() => {
    if (mode === "add" && (!categoryState.categories || categoryState.categories.length === 0)) {
      dispatch(fetchCategories());
    }
  }, [mode, dispatch, categoryState.categories]);

  const getCurrentSellerFromJWT = () => {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) return null;

      // JWT format: header.payload.signature
      // We need the payload (second part)
      const payload = jwt.split('.')[1];

      // Decode base64url to JSON
      const decoded = JSON.parse(atob(payload));

      // Return seller details (adjust field names based on your JWT payload)
      return {
        _id: decoded._id || decoded.userId || decoded.id || decoded.sellerId,
        sellerName: decoded.sellerName,
        businessDetails: decoded.businessDetails,
        email: decoded.email,
        role: decoded.role
      };
    } catch (e) {
      console.warn('⚠️ Could not decode JWT for current seller:', e);
      return null;
    }
  };

  const currentSeller = getCurrentSellerFromJWT();

  // ✅ Filter categories by level for dropdowns
  const levelOneCategories = useMemo(() =>
    categoryState.categories?.filter((c: Category) => c.level === 1) || [],
    [categoryState.categories]);

  const levelTwoCategories = useMemo(() =>
    categoryState.categories?.filter((c: Category) => c.level === 2) || [],
    [categoryState.categories]);

  const levelThreeCategories = useMemo(() =>
    categoryState.categories?.filter((c: Category) => c.level === 3) || [],
    [categoryState.categories]);

  // ✅ Ref to prevent infinite loop when auto-filling catalog categories
  const hasProcessedCatalogRef = useRef(false);



  // ✅ Custom hook for formik - MUST be before validationSchema
  const formik = useProductForm({
    initialValues,
    mode,
    // ✅ Pass context with catalog mode for Yup validation
    context: {
      isCatalogProduct: initialValues?.catalogMode?.isCatalogProduct ?? false,
      category3: initialValues?.category3 ?? '',
    },
    onSubmit: async (values) => {
      // ✅ Guard: Only process user-initiated submits
      if (!isUserSubmittedRef.current) {
        return;
      }
      isUserSubmittedRef.current = false;

      // ✅ Guard: Only allow submission on final step
      const isFinalStep = mode === "edit" ? activeStep === 1 : activeStep === 2;
      if (!isFinalStep) {
        return;
      }

      // ✅ Guard: Prevent duplicate submissions
      if (isSubmittingRef.current) {
        return;
      }

      // ✅ Guard: Don't submit if already created/updated
      if (sellerProduct.productCreated || sellerProduct.productUpdated) {
        return;
      }

      isSubmittingRef.current = true;

      try {
        // ✅ Transform variants to payload format (string → number for prices/stock)

        // ✅ Get variant attribute names from attributeState
        const variantAttributeNames = (attributeState.attributes || [])
          .filter((attr: CategoryAttribute) => attr?.isVariantField && attr?.isActive)
          .map((attr: CategoryAttribute) => attr?.name?.toLowerCase());

        const variantsPayload: ProductVariantPayload[] = values.variants.flatMap((colorVariant) => {
          return colorVariant.subVariants
            .filter((subVar) => !(subVar as any).toBeDeleted)
            .map(subVar => {
              // ✅ ONLY include offers from current seller WITH valid price/stock
              const offersPayload = subVar.offers
                .filter((offer) => {
                  if (offer.toBeDeleted) return false;
                  if (offer.sellerId !== currentSeller?._id) return false;

                  const mrpPrice = Number(offer.mrpPrice);
                  const sellingPrice = Number(offer.sellingPrice);
                  const stock = Number(offer.stock);

                  return mrpPrice > 0 && sellingPrice > 0 && stock >= 0;
                })
                .map(offer => ({
                  seller: offer.sellerId,
                  mrpPrice: Number(offer.mrpPrice),
                  sellingPrice: Number(offer.sellingPrice),
                  stock: Number(offer.stock),
                  sku: offer.sku?.trim() || undefined,
                  isActive: offer.isActive !== false
                }));

              // ✅ Skip this sub-variant if no valid offers
              if (offersPayload.length === 0) {
                return null;
              }

              // ✅ Build specifications with ALL fields first
              const allSpecs = {
                ...(values.highlights || {}),
                ...(colorVariant.highlights || {}),
                ...(subVar.specifications || {})
              };

              // ✅✅✅ CRITICAL: Filter to ONLY variant-specific fields
              const variantSpecs: Record<string, string> = {};
              Object.entries(allSpecs).forEach(([key, value]) => {
                if (variantAttributeNames.includes(key.toLowerCase())) {
                  variantSpecs[key] = String(value);
                }
              });

              // ✅ Debug: Verify specifications filtering
              console.log('🔍 [Submit] Variant specs filtering:', {
                allSpecsKeys: Object.keys(allSpecs),
                variantAttributeNames,
                filteredSpecsKeys: Object.keys(variantSpecs),
                color: colorVariant.color
              });

              return {
                color: colorVariant.color.trim(),
                specifications: variantSpecs,  // ✅ ONLY variant-specific fields
                images: colorVariant.images,
                offers: offersPayload,
                isActive: subVar.isActive !== false,
                ...(colorVariant.variantOwner && { variantOwner: colorVariant.variantOwner })
              };
            })
            .filter((item): item is NonNullable<typeof item> => item !== null);
        });

        // ✅ Ensure at least one variant has seller's valid offers
        if (variantsPayload.length === 0) {
          throw new Error('Please add at least one variant with valid price and stock');
        }

        console.log('✅ [Submit] Valid variants payload:', {
          count: variantsPayload.length,
          variants: variantsPayload.map(v => ({
            color: v.color,
            specs: v.specifications,
            offersCount: v.offers.length,
            offers: v.offers.map(o => ({
              seller: o.seller,
              mrpPrice: o.mrpPrice,
              sellingPrice: o.sellingPrice,
              stock: o.stock
            }))
          }))
        });


        // ✅ INDEPENDENT PRODUCT: Create or Update
        const isCatalogOffer = mode === "add" && catalogSearch.selectedCatalog?._id;

        // ✅ Build product data
        const productData: ProductCreatePayload = {
          // ✅ For independent products only (catalog offers skip these)
          title: isCatalogOffer ? undefined : values.title.trim(),
          description: isCatalogOffer ? undefined : values.description.trim(),
          category: isCatalogOffer ? undefined : values.category3,

          // ✅ Required for ALL products: variants array with offers
          variants: variantsPayload,

          // ✅ NEW: If this is a catalog offer, include catalogId
          catalogId: isCatalogOffer ? catalogSearch.selectedCatalog?._id : undefined,

          // ✅ Optional metadata (only used for independent products)
          highlights: isCatalogOffer ? undefined : (values.highlights || {}),
          isActive: values.isActive !== false,
        };

        let result;

        if (mode === "edit" && initialValues?._id) {
          // ✅ Update existing product
          result = await dispatch(updateProduct({
            productId: initialValues._id,
            product: productData
          }));

          if (updateProduct.rejected.match(result)) {
            throw new Error(result.payload as string || 'Failed to update product');
          }
          if (result.payload?.success === false) {
            throw new Error(result.payload?.message || 'Failed to update product');
          }

          setSnackbarMessage('Product updated successfully!');
          setSnackbarSeverity("success");
          setOpenSnackbar(true);

        } else {
          // ✅ Create new product
          const jwt = localStorage.getItem("jwt");
          result = await dispatch(createProduct({
            request: productData,
            jwt: jwt || ""
          }));

          if (createProduct.rejected.match(result)) {
            throw new Error(result.payload as string || 'Failed to create product');
          }
          if (result.payload?.success === false) {
            throw new Error(result.payload?.message || 'Failed to create product');
          }

          setSnackbarMessage('Product created successfully!');
          setSnackbarSeverity("success");
          setOpenSnackbar(true);
        }

        // ✅ Redirect after successful independent product operation
        setTimeout(() => {
          navigate('/seller/products');
        }, 1500);

      } catch (error: any) {
        // ✅ Extract error message from Redux thunk or plain error
        let errorMsg = 'Failed to save product';

        if (error?.payload?.errors && Array.isArray(error.payload.errors)) {
          errorMsg = error.payload.errors.join('; ');
        }
        else if (error?.payload?.message) {
          errorMsg = error.payload.message;
        }
        else if (error?.payload && typeof error.payload === 'string') {
          errorMsg = error.payload;
        }
        else if (error?.response?.data?.errors && Array.isArray(error.response.data.errors)) {
          errorMsg = error.response.data.errors.join('; ');
        }
        else if (error?.response?.data?.message) {
          errorMsg = error.response.data.message;
        }
        else if (typeof error === 'string') {
          errorMsg = error;
        }
        else if (error?.message && error.message !== '[object Object]') {
          errorMsg = error.message;
        }

        console.error('🚨 Submit error:', errorMsg);

        // ✅ Show error in snackbar
        setSnackbarMessage(errorMsg);
        setSnackbarSeverity("error");
        setOpenSnackbar(true);

      } finally {
        // ✅ Always reset submitting flag
        isSubmittingRef.current = false;
      }
    },
  });

  const catalogSearch = useCatalogSearch(formik);

  // ✅ FIX: validationSchema AFTER catalogSearch declaration
  const validationSchema = useMemo(() => {
    return createValidationSchema(
      attributeState.attributes || [],
      catalogSearch.isCatalogProduct || false
    );
  }, [
    attributeState.attributes?.length,
    catalogSearch.isCatalogProduct,
  ]);

  // ✅ Step validation - skip title/desc validation for catalog products
  const isStepValid = useCallback((step: number) => {

    const isValidOffer = (offer: any): boolean => {
      // ✅ Must be from current seller
      if (offer?.sellerId !== currentSeller?._id) return false;

      const isValidPrice = (value: any): boolean => {
        const strValue = String(value).trim();
        if (!strValue) return false;
        const numValue = Number(strValue);
        return !isNaN(numValue) && numValue > 0;
      };

      const isValidStock = (value: any): boolean => {
        const strValue = String(value).trim();
        if (strValue === '') return false;
        const numValue = Number(strValue);
        return !isNaN(numValue) && numValue >= 0;
      };

      return isValidPrice(offer?.mrpPrice) &&
        isValidPrice(offer?.sellingPrice) &&
        isValidStock(offer?.stock);
    };

    const isCatalogMode = catalogSearch.isCatalogProduct;

    if (mode === "edit") {
      if (step === 0) {
        // ✅ For edit: require at least ONE variant with seller's valid offer
        return !!(formik.values.variants?.length > 0 &&
          formik.values.variants.some(cv =>
            cv?.color?.trim() &&
            cv?.images?.length > 0 &&
            cv?.subVariants?.some(sv =>
              sv?.offers?.some(offer => isValidOffer(offer))
            )
          ));
      }
      return true;
    }

    if (step === 0) return !!(formik.values.category && formik.values.category2 && formik.values.category3);

    if (step === 1) {
      if (isCatalogMode) {
        // ✅ Catalog mode: require at least ONE variant with seller's valid offer
        return !!(formik.values.variants?.length > 0 &&
          formik.values.variants.some(cv =>
            cv?.color?.trim() &&
            cv?.subVariants?.some(sv =>
              sv?.offers?.some(offer => isValidOffer(offer))
            )
          ));
      }
      // ✅ Independent product: require title, description, and at least one variant with offer
      return !!(formik.values.title?.trim() && formik.values.description?.trim() &&
        formik.values.variants?.length > 0 &&
        formik.values.variants.some(cv =>
          cv?.color?.trim() && cv?.images?.length > 0 &&
          cv?.subVariants?.some(sv =>
            sv?.offers?.some(offer => isValidOffer(offer))
          )
        ));
    }
    return true;
  }, [formik.values, mode, catalogSearch.isCatalogProduct]);
  // ✅ Navigation with catalog mode handling
  const handleNext = async () => {
    console.log('🔍 [handleNext] Called:', { activeStep, mode, isCatalogProduct: catalogSearch.isCatalogProduct });
    // Handle catalog search step
    if (mode === "add" && catalogSearch.showSearch && activeStep === 0) {
      if (catalogSearch.selectedCatalog) {
        // ✅ Catalog already selected - attributes fetched in handleSelectCatalog
        catalogSearch.handleSkipCatalogSearch();
        setActiveStep(1);  // ✅ Go to Step 1
        return;
      }
      if (catalogSearch.results.length > 0 && !catalogSearch.selectedCatalog) {
        const confirmSkip = window.confirm(
          '⚠️ You searched but didn\'t select a catalog. Create independent product instead?'
        );
        if (!confirmSkip) return;
      }
      catalogSearch.handleSkipCatalogSearch();
      return;
    }
    // Existing validation logic
    if (mode === "edit") {
      if (activeStep === 0) {
        const errors = await formik.validateForm();
        const step0Fields = ['variants'];
        const hasErrors = step0Fields.some(field => errors[field as keyof typeof errors]);
        if (!hasErrors && isStepValid(activeStep)) {
          setActiveStep((prev) => prev + 1);
        } else {
          formik.setTouched({
            variants: formik.values.variants.map(() => ({
              color: true,
              images: true,
              highlights: true,
              subVariants: [],
              isActive: false
            }))
          });
        }
      }
    } else {
      // ✅ INDEPENDENT PRODUCT FLOW
      if (activeStep === 0) {
        const errors = await formik.validateForm();
        const step0Fields = ['category', 'category2', 'category3'];
        const hasErrors = step0Fields.some(field => errors[field as keyof typeof errors]);
        if (!hasErrors && isStepValid(activeStep)) {
          // ✅ Fetch attributes for independent products only
          const categoryObj = categoryState.categories?.find(
            (cat: Category) => cat._id === formik.values.category3
          );
          const categoryIdSlug = categoryObj?.categoryId;
          if (categoryIdSlug) {
            console.log('📥 Fetching attributes for slug:', categoryIdSlug);
            // ✅ Fetch and WAIT for completion
            const result = await dispatch(fetchCategoryAttributes({
              categoryId: categoryIdSlug,
              includeInactive: false
            }));
            // ✅ Type-safe check
            if (fetchCategoryAttributes.fulfilled.match(result)) {
              console.log('✅ Attributes fetched:', result.payload.length);
              // ✅ ONLY increment step ONCE after fetch completes
              setActiveStep((prev) => {
                const newStep = prev + 1;
                console.log('📍 Moving to step:', newStep);
                return newStep;
              });
            } else {
              console.error('❌ Fetch failed:', fetchCategoryAttributes.rejected.match(result) ? result.error : 'Unknown');
              alert('Failed to load product attributes. Please try again.');
            }
          } else {
            // ✅ No slug found - just move to next step
            setActiveStep((prev) => prev + 1);
          }
        } else {
          console.warn('⚠️ Validation failed:', errors);
          formik.setTouched({ category: true, category2: true, category3: true });
        }
      }
      // ✅ Step 1 to Step 2
      else if (activeStep === 1) {
        console.log('🔍 [Step 1 Validation] Starting validation...');
        const errors = await formik.validateForm();
        console.log('📋 [Validation Errors]', JSON.stringify(errors, null, 2));
        const isCatalogMode = catalogSearch.isCatalogProduct;
        const step1Fields = isCatalogMode ? ['variants'] : ['title', 'description', 'variants'];
        // ✅ Log variant errors in detail
        if (errors.variants && Array.isArray(errors.variants)) {
          errors.variants.forEach((variantError: any, index: number) => {
            if (variantError) {
              console.error(`❌ [Variant ${index} Errors]`, variantError);
              // ✅ Check each sub-variant
              if (variantError.subVariants && Array.isArray(variantError.subVariants)) {
                variantError.subVariants.forEach((subError: any, subIndex: number) => {
                  if (subError) {
                    console.error(`❌ [Variant ${index}, SubVariant ${subIndex}]`, subError);
                  }
                });
              }
            }
          });
        }
        const hasErrors = step1Fields.some(field => {
          const hasError = errors[field as keyof typeof errors];
          if (hasError) {
            console.log('❌ [Validation Failed] Field:', field, 'Error:', hasError);
          }
          return hasError;
        });
        if (!hasErrors && isStepValid(activeStep)) {
          console.log('✅ [Validation Passed] Moving to Step 2');
          setActiveStep((prev) => prev + 1);
        } else {
          console.warn('⚠️ [Validation Failed] Cannot proceed to Step 2');
          // ✅ Touch all fields to show errors
          formik.setTouched({
            title: !isCatalogMode,
            description: !isCatalogMode,
            variants: formik.values.variants.map((variant, vIdx) => ({
              color: true,
              images: !isCatalogMode,
              highlights: true,
              subVariants: variant.subVariants?.map((_, sIdx) => ({
                specifications: true,
                mrpPrice: true,
                sellingPrice: true,
                stock: true,
                sku: false,
                isActive: false,
                isFromCatalog: false,
                toBeDeleted: false,
                _id: false
              })) || [],
              isActive: false,
              isFromCatalog: false,
              _id: false,
              toBeDeleted: false
            }))
          } as any);  // ✅ Type assertion to bypass strict typing
        }
      }
    }
  };

  const handleBack = useCallback(() => {
    // ✅ Clear attributes when going back to category selection
    if (activeStep === 1) {
      dispatch(resetCategoryAttributes());  // ✅ Add this action to your slice
    }
    setActiveStep((prev) => prev - 1);
  }, [activeStep, dispatch]);

  const steps = mode === "edit"
    ? ["Product Details & Variants", "Review & Submit"]
    : ["Select Category", "Basic Information & Variants", "Review & Submit"];

  // ✅ Variant handlers - ALL wrapped with useCallback
  const handleAddColorVariant = useCallback((templateData?: { color?: string; specifications?: Record<string, any>; images?: string[] }) => {

    const newColorVariant: ProductVariantForm = {
      color: templateData?.color || '',  // ✅ Pre-fill color if provided
      images: templateData?.images || [],  // ✅ Pre-fill images if provided
      highlights: {},
      subVariants: [
        {
          specifications: templateData?.specifications || {},  // ✅ Pre-fill specs if provided
          offers: [
            {
              sellerId: currentSeller?._id || '',
              mrpPrice: '',
              sellingPrice: '',
              stock: '0',
              sku: '',
              isActive: true
            }
          ],
          isActive: true,
          isFromCatalog: false  // ✅ This is a NEW color variant
        }
      ],
      isActive: true,
      isFromCatalog: false
    };

    const newVariants = [...formik.values.variants, newColorVariant];
    formik.setFieldValue('variants', newVariants);
    setActiveColorTab(newVariants.length - 1);

    console.log('✅ [Add Color Variant] Added:', {
      colorIndex: newVariants.length - 1,
      color: templateData?.color || 'Custom',
      isFromCatalog: false,
      sellerId: currentSeller?._id,
      hasTemplateSpecs: !!templateData?.specifications
    });
  }, [formik.values.variants, formik.setFieldValue]);

  const handleRemoveColorVariant = useCallback((index: number) => {
    if (formik.values.variants.length <= 1) {
      formik.setFieldValue('variants', [{ color: '', images: [], highlights: {}, subVariants: [{ specifications: {}, mrpPrice: '', sellingPrice: '', stock: '0', isActive: true }], isActive: true }]);
      setColorHighlights({});
      setActiveColorTab(0);
      return;
    }
    const newVariants = formik.values.variants.filter((_, i) => i !== index);
    formik.setFieldValue('variants', newVariants);
    setColorHighlights(prev => {
      const reIndexed: Record<number, Record<string, string>> = {};
      Object.keys(prev).forEach(key => {
        const numKey = Number(key);
        if (numKey < index) reIndexed[numKey] = prev[numKey];
        else if (numKey > index) reIndexed[numKey - 1] = prev[numKey];
      });
      return reIndexed;
    });
    if (activeColorTab >= newVariants.length) setActiveColorTab(Math.max(0, newVariants.length - 1));
  }, [formik.values.variants, formik.setFieldValue, activeColorTab]);

  const handleColorVariantChange = useCallback(
    (colorIndex: number, field: string, value: string) => {
      const newVariants = [...formik.values.variants];

      newVariants[colorIndex] = {
        ...newVariants[colorIndex],
        [field]: value
      };

      formik.setFieldValue('variants', newVariants);
    },
    [formik.values.variants, formik.setFieldValue]
  );

  const handleAddSubVariant = useCallback((colorIndex: number, templateSpecs?: Record<string, any>) => {
    // ✅ NEW sub-variants start with offers array containing current seller's offer
    const newSubVariant = {
      // ✅ Pre-fill specs from catalog template if provided (for consistency)
      specifications: templateSpecs ? { ...templateSpecs } : {},
      offers: [
        {
          sellerId: currentSeller?._id || '',
          mrpPrice: '',
          sellingPrice: '',
          stock: '0',
          sku: '',
          isActive: true
        }
      ],
      isActive: true,
      isFromCatalog: false  // ✅ This is a NEW variant, not from catalog
    };

    // ✅ Add to variants array
    const newVariants = [...formik.values.variants];
    newVariants[colorIndex].subVariants.push(newSubVariant);
    formik.setFieldValue('variants', newVariants);

    // ✅ Expand the newly added sub-variant for editing
    setExpandedSubVariant(newVariants[colorIndex].subVariants.length - 1);

    console.log('✅ [Add Sub-Variant] Added:', {
      colorIndex,
      hasTemplateSpecs: !!templateSpecs,
      specs: templateSpecs || {},
      sellerId: currentSeller?._id
    });
  }, [formik.values.variants, formik.setFieldValue]);

  const handleRemoveSubVariant = useCallback((colorIndex: number, subVariantIndex: number) => {
    const newVariants = [...formik.values.variants];
    const subVariant = newVariants[colorIndex].subVariants[subVariantIndex];
    if (subVariant._id) {
      newVariants[colorIndex].subVariants[subVariantIndex] = { ...subVariant, toBeDeleted: true };
    } else {
      if (newVariants[colorIndex].subVariants.length <= 1) {
        alert('Each color must have at least one storage variant');
        return;
      }
      newVariants[colorIndex].subVariants.splice(subVariantIndex, 1);
    }
    formik.setFieldValue('variants', newVariants);
  }, [formik.values.variants, formik.setFieldValue]);

  const handleSubVariantChange = useCallback(
    (colorIndex: number, subIndex: number, field: string, value: string | number) => {
      console.log('✏️ [SubVariant Change]', { colorIndex, subIndex, field, value });

      // ✅ Use functional update to always get latest formik state
      formik.setFieldValue('variants', (prevVariants: ProductVariantForm[]) => {
        return prevVariants.map((variant, vIdx) => {
          if (vIdx !== colorIndex) return variant;
          return {
            ...variant,
            subVariants: variant.subVariants.map((subVar, sIdx) => {
              if (sIdx !== subIndex) return subVar;
              return {
                ...subVar,
                [field]: value
              } as ProductSubVariantForm;
            })
          };
        });
      });

      console.log('✅ [SubVariant Updated]', { colorIndex, subIndex, field, value });
    },
    [formik.setFieldValue]  // ✅ Only depend on stable setFieldValue
  );

  const handleAddOffer = useCallback((colorIndex: number, subVariantIndex: number) => {
    const newOffer: ProductOfferForm = {
      sellerId: currentSeller?._id || '',
      mrpPrice: '',
      sellingPrice: '',
      stock: '0',
      sku: '',
      isActive: true
    };
    const newVariants = [...formik.values.variants];
    newVariants[colorIndex].subVariants[subVariantIndex].offers.push(newOffer);
    formik.setFieldValue('variants', newVariants);
  }, [formik.values.variants, formik.setFieldValue]);

  // ✅ Remove offer from sub-variant
  const handleRemoveOffer = useCallback((colorIndex: number, subVariantIndex: number, offerIndex: number) => {
    const newVariants = [...formik.values.variants];
    const offer = newVariants[colorIndex].subVariants[subVariantIndex].offers[offerIndex];

    if (offer._id) {
      // Mark as toBeDeleted instead of removing (for existing offers)
      newVariants[colorIndex].subVariants[subVariantIndex].offers[offerIndex] = {
        ...offer,
        toBeDeleted: true
      };
    } else {
      // Remove new offer that hasn't been saved
      newVariants[colorIndex].subVariants[subVariantIndex].offers.splice(offerIndex, 1);
    }
    formik.setFieldValue('variants', newVariants);
  }, [formik.values.variants, formik.setFieldValue]);

  // ✅ Update offer field value
  const handleOfferChange = useCallback((
    colorIndex: number,
    subVariantIndex: number,
    offerIndex: number,
    field: string,
    value: string | number | boolean
  ) => {
    const newVariants = [...formik.values.variants];

    // ✅ Process value based on field type
    let processedValue: any = value;

    if (field === 'mrpPrice' || field === 'sellingPrice') {
      // Price fields: convert string to number, handle empty
      if (typeof value === 'string') {
        processedValue = value === '' ? '' : parseFloat(value);
        if (isNaN(processedValue)) processedValue = '';
      }
    }
    else if (field === 'stock') {
      // Stock field: convert string to integer, default to 0
      if (typeof value === 'string') {
        processedValue = value === '' ? 0 : parseInt(value, 10);
        if (isNaN(processedValue)) processedValue = 0;
      }
    }
    else if (field === 'isActive') {
      // Boolean field: ensure it's actually boolean
      processedValue = value === true || value === 'true' || value === 1;
    }
    // sku and other string fields: keep as-is

    // ✅ Update the offer
    newVariants[colorIndex].subVariants[subVariantIndex].offers[offerIndex] = {
      ...newVariants[colorIndex].subVariants[subVariantIndex].offers[offerIndex],
      [field]: processedValue
    };

    formik.setFieldValue('variants', newVariants);
  }, [formik.values.variants, formik.setFieldValue]);

  // ✅ FIX: Wrap with useCallback
  const handleSubVariantSpecChange = useCallback((colorIndex: number, subVariantIndex: number, attributeName: string, value: any) => {
    const newVariants = [...formik.values.variants];
    newVariants[colorIndex].subVariants[subVariantIndex] = {
      ...newVariants[colorIndex].subVariants[subVariantIndex],
      specifications: { ...newVariants[colorIndex].subVariants[subVariantIndex].specifications, [attributeName]: value },
    };
    formik.setFieldValue('variants', newVariants);
  }, [formik.values.variants, formik.setFieldValue]);

  // ✅ FIX: Wrap with useCallback
  const handleColorHighlightChange = useCallback((colorIndex: number, attrName: string, value: string) => {
    setColorHighlights(prev => ({
      ...prev,
      [colorIndex]: { ...prev[colorIndex], [attrName]: value }
    }));
  }, []);

  const handleColorVariantImageUpload = useCallback(
    async (colorIndex: number, files: FileList | null) => {
      if (!files || files.length === 0) return;
      console.log('📷 [Image Upload] Color:', colorIndex, 'Files:', files.length);

      setUploadingImage(true);
      try {
        const uploadedUrls: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const url = await uploadToCloudinary(files[i]);
          if (url) uploadedUrls.push(url);
        }

        if (uploadedUrls.length > 0) {
          // ✅ Use functional update for images too
          formik.setFieldValue('variants', (prevVariants: ProductVariantForm[]) => {
            const newVariants = [...prevVariants];
            const existingImages = newVariants[colorIndex]?.images || [];
            newVariants[colorIndex] = {
              ...newVariants[colorIndex],
              images: [...existingImages, ...uploadedUrls]
            };
            return newVariants;
          });
          console.log('✅ [Images Updated]', { colorIndex, urls: uploadedUrls });
        }
      } catch (error) {
        console.error('❌ [Image Upload Failed]', error);
        alert('Failed to upload images');
      } finally {
        setUploadingImage(false);
      }
    },
    [formik.setFieldValue]  // ✅ Stable dependency
  );

  const handleRemoveColorVariantImage = useCallback((colorIndex: number, imageIndex: number) => {
    const newVariants = [...formik.values.variants];
    newVariants[colorIndex].images.splice(imageIndex, 1);
    formik.setFieldValue('variants', newVariants);
  }, [formik.values.variants, formik.setFieldValue]);

  // ✅ Early fetch attributes for catalog products
  useEffect(() => {
    if (
      mode === "add" &&
      catalogSearch.isCatalogProduct &&
      catalogSearch.selectedCatalog?.category &&
      !attributeState.attributes?.length  // Only fetch if not already loaded
    ) {
      const catalogCategory = catalogSearch.selectedCatalog.category;
      const categoryIdSlug = typeof catalogCategory === 'string'
        ? catalogCategory
        : catalogCategory.categoryId || catalogCategory._id;
      if (categoryIdSlug) {
        dispatch(fetchCategoryAttributes({
          categoryId: categoryIdSlug,
          includeInactive: false
        }));
      }
    }
  }, [
    mode,
    catalogSearch.isCatalogProduct,
    catalogSearch.selectedCatalog?.category,
    attributeState.attributes?.length,
    dispatch
  ]);

  // ✅ Clear attributes when going back
  useEffect(() => {
    // Only clear if we're still on Step 0 (category selection)
    if (activeStep === 0) {
      dispatch(resetCategoryAttributes());
    }
  }, [formik.values.category3, activeStep, dispatch]);

  // ✅ Show snackbar messages only (navigation handled in button onClick)
  useEffect(() => {
    // ✅ Success: Show snackbar, reset flag, but DON'T navigate
    if (sellerProduct.productCreated && !sellerProduct.loading) {
      // Snackbar already shown in button onClick, but ensure it's visible
      if (!snackbarOpen) {
        setSnackbarMessage("🎉 Product created successfully!");
        setSnackbarSeverity("success");
        setOpenSnackbar(true);
      }
      // ✅ Navigation is handled ONLY by button click - DO NOT navigate here
    }

    // ✅ Update success: Show snackbar, optionally close dialog
    if (sellerProduct.productUpdated && !sellerProduct.loading) {
      setSnackbarMessage("✅ Product updated successfully!");
      setSnackbarSeverity("success");
      setOpenSnackbar(true);
      dispatch(resetUpdateFlag());
      if (mode === "edit" && onClose) {
        setTimeout(() => onClose(), 1000);
      }
    }

    // ✅ Error: Show snackbar, stay on form
    if (sellerProduct.error && !sellerProduct.loading) {
      let errorMsg = 'Failed to save product';
      if (typeof sellerProduct.error === 'string') {
        errorMsg = sellerProduct.error;
      } else if (sellerProduct.error?.message) {
        errorMsg = sellerProduct.error.message;
      } else if (sellerProduct.error?.data?.message) {
        errorMsg = sellerProduct.error.data.message;
      }
      setSnackbarMessage(errorMsg);
      setSnackbarSeverity("error");
      setOpenSnackbar(true);
      // ✅ Explicitly DO NOT navigate here - keep user on form to fix errors
    }
  }, [
    sellerProduct.productCreated,
    sellerProduct.productUpdated,
    sellerProduct.error,
    sellerProduct.loading,
    snackbarOpen,  // ✅ Add this dependency
    dispatch,
    onClose,
    mode
  ]);


  // ✅✅✅ CRITICAL: Auto-fill categories from catalog (RUNS ONCE)
  useEffect(() => {
    // ✅ Guard 1: Only run in "add" mode with catalog product selected
    if (mode !== "add" || !catalogSearch.isCatalogProduct || !catalogSearch.selectedCatalog) {
      return;
    }

    // ✅ Guard 2: Only run ONCE per catalog selection (prevents infinite loop)
    if (hasProcessedCatalogRef.current) {
      return;
    }

    const catalog = catalogSearch.selectedCatalog;

    // ✅ Handle category as ObjectId, slug string, or nested object
    let level3CategoryId: string | undefined;
    if (typeof catalog.category === 'string') {
      level3CategoryId = catalog.category;
    } else if (catalog.category?._id) {
      level3CategoryId = catalog.category._id;
    } else if (catalog.category?.categoryId) {
      level3CategoryId = catalog.category.categoryId;
    }

    // ✅ Guard 3: Only proceed if we have a valid category ID
    if (!level3CategoryId) {
      console.warn('⚠️ [Auto-fill] No valid category ID found in catalog');
      return;
    }

    // ✅ Guard 4: Wait for categories to be loaded before auto-filling
    if (!categoryState.categories || categoryState.categories.length === 0) {
      console.log('⏳ [Auto-fill] Waiting for categories to load...');
      return;  // Will retry when categories are loaded (due to dependency)
    }

    // ✅ Mark as processed BEFORE setting values (prevents re-entry)
    hasProcessedCatalogRef.current = true;

    // ✅ Find the Level 3 category object
    const level3Category = categoryState.categories.find(
      (c: Category) => c._id === level3CategoryId || c.categoryId === level3CategoryId
    );

    if (!level3Category) {
      console.warn('⚠️ [Auto-fill] Level 3 category not found in loaded categories');
      // Fallback: just set the ID
      formik.setFieldValue('category3', level3CategoryId);
      setActiveStep(1);
      return;
    }

    // ✅ Set Level 3 category
    formik.setFieldValue('category3', level3Category._id);

    // ✅ Find and set Level 2 category (parent of Level 3)
    if (level3Category.parentCategory) {
      const level2CategoryId = typeof level3Category.parentCategory === 'object'
        ? level3Category.parentCategory._id
        : level3Category.parentCategory;

      const level2Category = categoryState.categories.find(
        (c: Category) => c._id === level2CategoryId
      );

      if (level2Category) {
        formik.setFieldValue('category2', level2Category._id);

        // ✅ Find and set Level 1 category (parent of Level 2)
        if (level2Category.parentCategory) {
          const level1CategoryId = typeof level2Category.parentCategory === 'object'
            ? level2Category.parentCategory._id
            : level2Category.parentCategory;

          const level1Category = categoryState.categories.find(
            (c: Category) => c._id === level1CategoryId
          );

          if (level1Category) {
            formik.setFieldValue('category', level1Category._id);
          }
        }
      }
    }

    // ✅ Auto-advance to Basic Info step (skip manual category selection)
    setActiveStep(1);

    return () => {
      // Only reset if we're unmounting or switching catalogs
      if (!catalogSearch.selectedCatalog || catalogSearch.selectedCatalog._id !== catalog._id) {
        hasProcessedCatalogRef.current = false;
      }
    };

    // ✅ STABLE dependencies only - includes categories to re-run when they load
  }, [
    mode,
    catalogSearch.isCatalogProduct,
    catalogSearch.selectedCatalog?._id,
    catalogSearch.selectedCatalog?.category,
    categoryState.categories,  // ✅ Re-run when categories load
    formik.setFieldValue,
    setActiveStep
  ]);

  // ✅ Add this ref at the top of your component (with other useRef declarations)
  const catalogPrefillExecuted = useRef(false);

  return (
    <div className="p-4">
      {mode !== "edit" && (
        <Stepper activeStep={activeStep} className="mb-6" alternativeLabel>
          {steps.map((label, index) => (
            <Step key={index}>
              <StepLabel>
                {label}
                {activeStep === 1 && catalogSearch.isCatalogProduct && (
                  <Chip
                    label="📦 Shared Product"  // ✅ Simpler label
                    size="small"
                    color="info"
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                )}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      )}
      <form onSubmit={formik.handleSubmit}
        noValidate
        onKeyDown={(e: React.KeyboardEvent<HTMLFormElement>) => {
          if (e.key === 'Enter' && activeStep < 2) {
            console.log('⌨️ [BLOCKED] Enter key on Step', activeStep + 1, '- preventing submit');
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }}
      >
        <Grid container spacing={2}>
          {/* Step 0: Catalog Search or Category Selection */}
          {activeStep === 0 && mode !== "edit" && catalogSearch.showSearch ? (
            <CatalogSearchStep
              searchQuery={catalogSearch.searchQuery}
              results={catalogSearch.results}
              isSearching={catalogSearch.isSearching}
              selectedCatalog={catalogSearch.selectedCatalog}
              onSearchQueryChange={catalogSearch.setSearchQuery}
              onSearch={catalogSearch.handleSearchCatalog}
              onSelectCatalog={catalogSearch.handleSelectCatalog}
              onSkip={catalogSearch.handleSkipCatalogSearch}
              onNext={handleNext}
            />
          ) : activeStep === 0 && mode !== "edit" ? (
            <CategoryStep
              formik={formik}
              categories={categoryState.categories || []}
              levelOneCategories={levelOneCategories}
              levelTwoCategories={levelTwoCategories}
              levelThreeCategories={levelThreeCategories}
              isCatalogProduct={catalogSearch.isCatalogProduct}
              selectedCatalog={catalogSearch.selectedCatalog}
            />
          ) : (activeStep === 0 && mode === "edit") || (activeStep === 1 && mode !== "edit") ? (
            <BasicInfoStep
              formik={formik}
              catalogSearch={catalogSearch}
              isCatalogProduct={catalogSearch.isCatalogProduct}
              selectedCatalog={catalogSearch.selectedCatalog}
              categories={categoryState.categories || []}
              levelOneCategories={levelOneCategories}
              levelTwoCategories={levelTwoCategories}
              levelThreeCategories={levelThreeCategories}
            />
          ) : (
            <ReviewStep
              formik={formik}
              categories={categoryState.categories || []}
              isCatalogProduct={catalogSearch.isCatalogProduct}
            />
          )}
          {/* Variants Section - ALWAYS editable for price/stock */}
          {((activeStep === 0 && mode === "edit") || (activeStep === 1 && mode !== "edit")) && (
            <Grid size={{ xs: 12 }}>
              <VariantsSection
                formik={formik}
                variants={formik.values.variants}
                activeColorTab={activeColorTab}
                onAddColor={handleAddColorVariant}
                onRemoveColor={handleRemoveColorVariant}
                onColorTabChange={setActiveColorTab}
                onColorChange={(idx, val) => handleColorVariantChange(idx, 'color', val)}
                onImageUpload={handleColorVariantImageUpload}
                onRemoveImage={handleRemoveColorVariantImage}
                isCatalogProduct={catalogSearch.isCatalogProduct}
                onAddSubVariant={handleAddSubVariant}
                onRemoveSubVariant={handleRemoveSubVariant}
                onSubVariantChange={handleSubVariantChange}
                onSubVariantSpecChange={handleSubVariantSpecChange}
                // ✅ ADD THESE NEW PROPS for offers management:
                onAddOffer={handleAddOffer}
                onRemoveOffer={handleRemoveOffer}
                onOfferChange={handleOfferChange}
                // ✅ Pass current user for offer creation:
                expandedSubVariant={expandedSubVariant}
                onExpandedSubVariantChange={setExpandedSubVariant}
                colorHighlights={colorHighlights}
                onColorHighlightChange={handleColorHighlightChange}
              >
              </VariantsSection>
            </Grid>
          )}
          {/* Navigation Buttons */}
          <Grid size={12} className="flex justify-between mt-6">
            <Button
              type="button"
              disabled={activeStep === 0}
              onClick={handleBack}
              variant="outlined"
            >
              Back
            </Button>
            {activeStep === 2 ? (
              <Button
                type="submit"
                variant="contained"
                disabled={sellerProduct.loading || !isStepValid(activeStep) || isSubmittingRef.current}
                // ✅✅✅ CRITICAL: Mark this as intentional user submit
                onClick={() => {
                  isUserSubmittedRef.current = true;
                  console.log('🎯 User clicked "Add Product" - intentional submit');

                  // ✅ Clear any existing navigation timer
                  if ((window as any).__navTimer) {
                    clearTimeout((window as any).__navTimer);
                    (window as any).__navTimer = null;
                  }

                  const checkAndNavigate = () => {
                    // ✅ ONLY navigate if product was created successfully AND no error
                    if (sellerProduct.productCreated && !sellerProduct.loading && !sellerProduct.error) {
                      console.log('✅ [BUTTON NAVIGATION] Product created - navigating now');

                      // Show success message
                      setSnackbarMessage("🎉 Product created successfully!");
                      setSnackbarSeverity("success");
                      setOpenSnackbar(true);

                      // ✅ Reset flags AFTER navigation is triggered
                      dispatch(resetCreateFlag());

                      // ✅ Navigate with short delay
                      const navTimer = setTimeout(() => {
                        try {
                          console.log('🔄 [NAVIGATION] Executing navigate()');
                          // navigate('/products');

                          // // ✅ Fallback: force reload if navigate doesn't work
                          // setTimeout(() => {
                          //   if (!window.location.pathname.includes('/seller/products')) {
                          //     console.log('⚠️ Navigate didn\'t work, forcing redirect');
                          //     window.location.href = '/seller/products';
                          //   }
                          // }, 300);
                        } catch (navError) {
                          console.error('❌ Navigation failed:', navError);
                          // window.location.href = '/seller/products';
                        }
                      }, 100);

                      return () => clearTimeout(navTimer);
                    }
                  };

                  // ✅ Poll for productCreated status (check every 100ms for up to 3 seconds)
                  let attempts = 0;
                  const maxAttempts = 30; // 30 × 100ms = 3 seconds max wait
                  const pollInterval = setInterval(() => {
                    attempts++;

                    // ✅✅✅ CRITICAL: Check for error FIRST - if error exists, STOP and DON'T navigate
                    if (sellerProduct.error && !sellerProduct.loading) {
                      clearInterval(pollInterval);
                      console.log('❌ [NAVIGATION BLOCKED] Product creation failed with error:', sellerProduct.error);
                      // ✅ Keep user on form to fix errors - DO NOT navigate
                      return;
                    }

                    // ✅ Only navigate on explicit success
                    if (sellerProduct.productCreated && !sellerProduct.loading) {
                      clearInterval(pollInterval);
                      checkAndNavigate();
                      return;
                    }

                    // ✅ Timeout fallback: only force redirect if NO error AND no success
                    if (attempts >= maxAttempts) {
                      clearInterval(pollInterval);

                      if (sellerProduct.error) {
                        console.log('❌ [TIMEOUT] Failed with error - staying on form');
                        return; // ✅ Don't navigate on error
                      }

                      if (!sellerProduct.productCreated) {
                        console.log('⚠️ [TIMEOUT] No response after 3s - forcing redirect');
                        // Only force redirect as last resort when no error but no success either
                        // window.location.href = '/seller/products';
                      }
                    }
                  }, 100);

                  // ✅ Cleanup on component unmount
                  return () => {
                    clearInterval(pollInterval);
                    if ((window as any).__navTimer) {
                      clearTimeout((window as any).__navTimer);
                    }
                  };
                }}
              >
                {sellerProduct.loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : sellerProduct.productCreated ? (
                  "✅ Redirecting..."
                ) : mode === "edit" ? "✅ Update Product" :
                  catalogSearch.isCatalogProduct ? "📦 List Offer" : "🚀 Add Product"}
              </Button>
            ) : (
              <Button
                type="button"
                variant="contained"
                onClick={handleNext}
                disabled={!isStepValid(activeStep)}
              >
                Next
              </Button>
            )}
          </Grid>
          {onClose && activeStep === 0 && mode !== "edit" && (
            <Grid size={12}>
              <Button type="button" onClick={onClose} color="secondary" fullWidth variant="outlined">
                Cancel
              </Button>
            </Grid>
          )}
        </Grid>
      </form>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbarSeverity}  // ✅ Use local state
          onClose={() => setOpenSnackbar(false)}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}  // ✅ Use local state directly
        </Alert>
      </Snackbar>

    </div>
  );
};

export default AddProductForm;