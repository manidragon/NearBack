// D:\Mani\Code with Zosh\Backup\source code\frontend\src\seller\pages\Products\hooks\useCatalogSearch.ts
import { useState, useCallback, useRef } from 'react';
import type { FormikHelpers } from 'formik';
import type { ProductFormValues, ProductOfferForm } from '../types/productFormTypes';
import type { ProductVariant, CatalogProduct } from '../../../../types/productTypes';
// ✅ Use admin CategoryAttribute type (single source of truth)
import type { CategoryAttribute } from '../../../../types/categoryAttributeTypes';
import { useDispatch } from 'react-redux';
// ✅ Import typed dispatch
import { useAppSelector, type AppDispatch } from '../../../../Redux Toolkit/Store';
import { fetchCategoryAttributes, selectCategoryAttributes } from '../../../../Redux Toolkit/Admin/CategoryAttributeSlice';

const getCurrentSellerFromJWT = (): { _id: string } | null => {
  try {
    const jwt = localStorage.getItem('jwt');
    if (!jwt) return null;

    // JWT format: header.payload.signature
    const payload = jwt.split('.')[1];
    const decoded = JSON.parse(atob(payload));

    return {
      _id: decoded._id || decoded.userId || decoded.id || decoded.sellerId
    };
  } catch (e) {
    console.warn('⚠️ Could not decode JWT:', e);
    return null;
  }
};

interface UseCatalogSearchReturn {
  searchQuery: string;
  results: CatalogProduct[];  // ✅ Was: any[]
  isSearching: boolean;
  selectedCatalog: CatalogProduct | null;  // ✅ Was: any | null
  showSearch: boolean;
  isCatalogProduct: boolean;
  handleSearchCatalog: () => Promise<void>;
  handleSelectCatalog: (catalog: CatalogProduct, selectedVariants?: ProductVariant[]) => void;  // ✅ Typed params
  handleSkipCatalogSearch: () => void;
  setSearchQuery: (query: string) => void;
}

export const useCatalogSearch = (
  formik: FormikHelpers<ProductFormValues>
): UseCatalogSearchReturn => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<CatalogProduct[]>([]);  // ✅ Typed
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogProduct | null>(null);  // ✅ Typed
  const [showSearch, setShowSearch] = useState(true);
  const [isCatalogProduct, setIsCatalogProduct] = useState(false);

  // ✅ Get attributes from Redux store
  const attributeState = useAppSelector(selectCategoryAttributes);

  // ✅ Cast dispatch to AppDispatch for thunk support
  const dispatch = useDispatch() as AppDispatch;

  const handleSearchCatalog = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setResults([]);

    try {
      const jwt = localStorage.getItem('jwt');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

      const response = await fetch(
        `${API_BASE_URL}/api/catalog/search?q=${encodeURIComponent(searchQuery)}&limit=10`,
        {
          headers: {
            'Content-Type': 'application/json',
            ...(jwt && { 'Authorization': `Bearer ${jwt}` })
          }
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ [DEBUG] Response error:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setResults(data.data as CatalogProduct[]);  // ✅ Type assertion
      } else {
        console.warn('⚠️ [DEBUG] Unexpected response format:', data);
        setResults([]);
      }
    } catch (error) {
      console.error('❌ [DEBUG] Catalog search failed:', error);
      alert('Failed to search catalog: ' + (error as Error).message);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSelectCatalog = useCallback(async (catalog: CatalogProduct, selectedVariants?: ProductVariant[]) => {
    const isOwner = catalog.isOwner === true;
    const catalogCategory = catalog.category;
    const categoryIdSlug = typeof catalogCategory === 'string'
      ? catalogCategory
      : catalogCategory?.categoryId || catalogCategory?._id;

    // ✅ Fetch attributes and USE THE RESULT DIRECTLY
    let loadedAttributes: CategoryAttribute[] = [];

    if (categoryIdSlug) {
      try {
        const result = await dispatch(fetchCategoryAttributes({
          categoryId: categoryIdSlug,
          includeInactive: false
        }));

        if (fetchCategoryAttributes.fulfilled.match(result)) {
          // ✅ Use payload directly - NOT attributeState selector
          loadedAttributes = result.payload;
        }
      } catch (error) {
        console.error('❌ [handleSelectCatalog] Failed to fetch attributes:', error);
      }
    }

    // ✅✅✅ CRITICAL: Define BOTH variant and highlight attribute names BEFORE using them
    const variantAttributeNames = loadedAttributes
      .filter((attr: CategoryAttribute) => attr?.isVariantField === true && attr?.isActive === true)
      .map((attr: CategoryAttribute) => attr?.name?.toLowerCase());

    const highlightAttributeNames = loadedAttributes
      .filter((attr: CategoryAttribute) => attr?.displayInHighlights === true && attr?.isVariantField === false && attr?.isActive === true)
      .map((attr: CategoryAttribute) => attr?.name?.toLowerCase());

    // ✅ Update state
    setSelectedCatalog(catalog);
    setIsCatalogProduct(true);
    setShowSearch(false);

    // ✅ Pre-fill form basics
    formik.setFieldValue('title', catalog.title);
    formik.setFieldValue('description', catalog.description);
    formik.setFieldValue('images', catalog.images || []);
    formik.setFieldValue('brand', catalog.brand);

    if (catalogCategory && typeof catalogCategory === 'object') {
      formik.setFieldValue('category', catalogCategory.parentCategory || '');
      formik.setFieldValue('category2', catalogCategory._id);
      formik.setFieldValue('category3', catalogCategory._id);
    } else if (typeof catalogCategory === 'string') {
      formik.setFieldValue('category3', catalogCategory);
    }

    // ✅ Transform variants using loadedAttributes
    const variantsToUse = selectedVariants?.length ? selectedVariants : (catalog.variantTemplate || []);

    if (variantsToUse.length > 0) {
      // ✅✅✅ Extract product-level highlights from catalog.highlights (NOT variant specs)
      const productHighlights: Record<string, string> = {};

      // ✅ Source 1: catalog.highlights (product-level field) - PRIMARY SOURCE
      if (catalog.highlights && typeof catalog.highlights === 'object') {

        Object.entries(catalog.highlights).forEach(([key, value]) => {
          const keyLower = key.toLowerCase();
          const stringValue = String(value).trim();

          // ✅ Only include if it's a highlight attribute (not a variant field)
          if (highlightAttributeNames.includes(keyLower)) {
            productHighlights[key] = stringValue;
          }
        });
      }

      // ✅ Source 2: Fallback to first variant's specs (backward compatibility)
      if (!Object.keys(productHighlights).length && variantsToUse[0]?.specifications) {
        Object.entries(variantsToUse[0].specifications).forEach(([key, value]) => {
          const keyLower = key.toLowerCase();
          const stringValue = String(value).trim();

          if (highlightAttributeNames.includes(keyLower) && !productHighlights[key]) {
            productHighlights[key] = stringValue;
            console.warn('⚠️ [handleSelectCatalog] No highlights extracted from any source');
            console.log('  Available highlight attributes:', highlightAttributeNames);
            console.log('  Catalog highlights:', catalog.highlights);
            console.log('  First variant specs:', variantsToUse[0]?.specifications);
          }
        });
      }

      // ✅ Set product-level highlights in formik
      if (Object.keys(productHighlights).length > 0) {
        formik.setFieldValue('highlights', productHighlights);
      } else {
        console.warn('⚠️ [handleSelectCatalog] No highlights extracted from any source');
        console.log('  Available highlight attributes:', highlightAttributeNames);
        console.log('  Catalog highlights:', catalog.highlights);
        console.log('  First variant specs:', variantsToUse[0]?.specifications);
      }

      // ✅ Build variants array (only variant-specific specs)
      const variants = variantsToUse.map((template: any, idx: number) => {
        const variantSpecs: Record<string, string> = {};

        if (template.specifications && typeof template.specifications === 'object') {
          Object.entries(template.specifications).forEach(([key, value]: [string, any]) => {
            const stringValue = String(value).trim();
            const keyLower = key.toLowerCase();
            const isVariantField = variantAttributeNames.includes(keyLower);

            if (isVariantField) {
              variantSpecs[key] = stringValue;
            }
          });
        }

        const offersArray: ProductOfferForm[] = [{
          sellerId: getCurrentSellerFromJWT()?._id || '',
          mrpPrice: '',
          sellingPrice: '',
          stock: '0',
          sku: '',
          isActive: true
        }];

        return {
          color: template.color || '',
          images: (template.images || []).map((img: string) => img?.trim()),
          highlights: {},
          subVariants: [{
            specifications: variantSpecs,
            offers: offersArray,
            mrpPrice: '',
            sellingPrice: '',
            stock: '0',
            isActive: true,
            _id: template._id,
            isFromCatalog: true
          }],
          isActive: true,
          isFromCatalog: true,
          variantOwner: template.variantOwner
        };
      });

      formik.setFieldValue('variants', variants);
    }

  }, [formik, dispatch]); // ✅ REMOVED attributeState dependency - not needed anymore
  // ✅ UPDATED: handleSkipCatalogSearch resets catalog mode
  const handleSkipCatalogSearch = useCallback(() => {
    setShowSearch(false);
    setSelectedCatalog(null);
    setIsCatalogProduct(false);

    // ✅ Clear form fields for independent product creation
    formik.setFieldValue('title', '');
    formik.setFieldValue('description', '');
    formik.setFieldValue('images', []);
    formik.setFieldValue('variants', []);
  }, [formik]);

  return {
    searchQuery,
    results,
    isSearching,
    selectedCatalog,
    showSearch,
    isCatalogProduct,
    handleSearchCatalog,
    handleSelectCatalog,
    handleSkipCatalogSearch,
    setSearchQuery,
  };
};