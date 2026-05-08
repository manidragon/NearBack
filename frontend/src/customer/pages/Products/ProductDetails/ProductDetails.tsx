// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Products\ProductDetails\ProductDetails.tsx
import StarIcon from '@mui/icons-material/Star';
import { teal } from '@mui/material/colors';
import {
    Box, Button, Divider, Modal, Snackbar, Alert,
    Chip, Typography, FormControl, InputLabel, Select,
    MenuItem, Grid, Paper, CircularProgress, Card, CardContent
} from '@mui/material';
import ShieldIcon from '@mui/icons-material/Shield';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { Wallet, CheckCircle, Store } from '@mui/icons-material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import PaletteIcon from '@mui/icons-material/Palette';
import MemoryIcon from '@mui/icons-material/Memory';
import StoreIcon from '@mui/icons-material/Store';
import SmilarProduct from '../SimilarProduct/SmilarProduct';
import ZoomableImage from './ZoomableImage';
import { useAppDispatch, useAppSelector } from '../../../../Redux Toolkit/Store';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchProductById, getAllProducts } from '../../../../Redux Toolkit/Customer/ProductSlice';
import { addItemToCart, fetchUserCart } from '../../../../Redux Toolkit/Customer/CartSlice';
import ProductReviewCard from '../../Review/ProductReviewCard';
import RatingCard from '../../Review/RatingCard';
import { fetchReviewsByProductId } from '../../../../Redux Toolkit/Customer/ReviewSlice';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Product, ProductVariant } from '../../../../types/productTypes';
import type { Category } from '../../../../types/categoryTypes';
import type { CategoryAttribute } from '../../../../types/categoryAttributeTypes';
import {
    fetchCategoryAttributes,
    selectCategoryAttributes,
    selectCategoryAttributesLoading
} from '../../../../Redux Toolkit/Admin/CategoryAttributeSlice';
import { api } from '../../../../Config/Api';
import { selectLocationFilter } from "../../../../Redux Toolkit/Customer/ProductSlice";

const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: "auto",
    height: "100%",
    boxShadow: 24,
    outline: "none",
};

const PLACEHOLDER_50 = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect width='50' height='50' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='8' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
const PLACEHOLDER_600 = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect width='600' height='600' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23999'%3ENo Image Available%3C/text%3E%3C/svg%3E";

const ProductDetails = () => {
    const [open, setOpen] = useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const dispatch = useAppDispatch();
    const products = useAppSelector(state => state.products);
    const review = useAppSelector(state => state.review);
    const cart = useAppSelector(state => state.cart);
    const attributeState = useAppSelector(selectCategoryAttributes);
    const attributesLoading = useAppSelector(selectCategoryAttributesLoading);
    const categoryState = useAppSelector((state: any) => state.category);

    const navigate = useNavigate();
    const { productId, categoryId } = useParams();

    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedColor, setSelectedColor] = useState<string>('');
    const [selectedVariantId, setSelectedVariantId] = useState<string>('');
    const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

    // ============================================
    // ✅ NEW STATE for Seller Selection (Multi-Seller Catalog)
    // ============================================
    const [sellerOffers, setSellerOffers] = useState<any[]>([]);
    const [selectedSellerOffer, setSelectedSellerOffer] = useState<any>(null);
    const [isCatalogProduct, setIsCatalogProduct] = useState(false);
    const [catalogLoading, setCatalogLoading] = useState(false);

    // ✅ NEW: Get product reference (moved BEFORE useEffects that use it)
    const product = products.product;
    const [selectedSize, setSelectedSize] = useState<string>('');
    const locationFilter = useAppSelector(selectLocationFilter);

    const checkIsInOtherColors = (currentVariant: ProductVariant, currentColor: string): boolean => {
        if (!product?.variants) return false;
        return product.variants.some((v: any) =>
            v.color?.toLowerCase() !== currentColor.toLowerCase() &&
            variantAttributes.every(attr =>
                v.specifications?.[attr.name] === currentVariant.specifications?.[attr.name]
            ) &&
            v.isActive !== false &&
            (v.offers?.some((o: any) => o.isActive !== false && (o.stock ?? 0) > 0) || (v.stock ?? 0) > 0)
        );
    };

    useEffect(() => {
        const fetchSellerOffers = async () => {
            if (!selectedVariantId || !product?._id) {
                setSellerOffers([]);
                setSelectedSellerOffer(null);
                setIsCatalogProduct(false);
                return;
            }

            const isCatalog = !!(product?.catalog && product.catalog._id);
            setIsCatalogProduct(isCatalog);

            try {
                if (isCatalog && product.catalog?._id) {
                    // ✅ Build params with location/district
                    const params: any = {};
                    if (locationFilter?.type === 'current' && locationFilter.coordinates) {
                        params.userLat = locationFilter.coordinates.lat;
                        params.userLng = locationFilter.coordinates.lng;
                        params.radiusKm = locationFilter.radiusKm || 50;
                    } else if (locationFilter?.type === 'district' && locationFilter.district) {
                        params.district = locationFilter.district;  // ✅ Pass district
                    }

                    const response = await api.get(`/api/catalog/${product.catalog._id}/offers`, { params });

                    if (response.data.success && response.data.data.offers?.length > 0) {
                        let offersWithVariant = response.data.data.offers.filter((offer: any) =>
                            offer.variants?.some((v: any) => v._id === selectedVariantId && (v.stock ?? 0) > 0 && v.isActive !== false)
                        );

                        // ✅ If district filter is active, further filter to only show sellers from that district
                        if (locationFilter?.type === 'district' && locationFilter.district) {
                            offersWithVariant = offersWithVariant.filter((offer: any) =>
                                offer.seller?.district === locationFilter.district
                            );
                        }

                        setSellerOffers(offersWithVariant);

                        if (offersWithVariant.length > 0) {
                            let lowestOffer: any = offersWithVariant.reduce((min: any, offer: any) => {
                                const variant = offer.variants.find((v: any) => v._id === selectedVariantId);
                                const minVariant = min.variants.find((v: any) => v._id === selectedVariantId);
                                return (variant?.sellingPrice ?? Infinity) < (minVariant?.sellingPrice ?? Infinity) ? offer : min;
                            });
                            setSelectedSellerOffer(lowestOffer);
                        }
                    }
                } else {
                    // ✅ For independent products: extract offers directly from product.variants
                    const variant = product?.variants?.find((v: any) => v._id === selectedVariantId);

                    if (variant?.offers && variant.offers.length > 0) {
                        let activeOffers = variant.offers.filter((o: any) =>
                            o.isActive !== false && (o.stock ?? 0) > 0
                        );

                        // ✅ Filter by district if district filter is active
                        if (locationFilter?.type === 'district' && locationFilter.district) {
                            activeOffers = activeOffers.filter((o: any) =>
                                o.seller?.district === locationFilter.district
                            );
                        }

                       const formattedOffers = activeOffers.map((offer: any) => {
  const sellerId = typeof offer.seller === 'string' ? offer.seller : offer.seller?._id;

  return {
    _id: offer._id,
    seller: {
      _id: sellerId,
      businessDetails: offer.seller?.businessDetails,
      sellerName: offer.seller?.sellerName,
      district: offer.seller?.district
    },
    variants: [{
      _id: selectedVariantId,
      ...variant,
      sellingPrice: offer.sellingPrice,
      mrpPrice: offer.mrpPrice,
      stock: offer.stock
    }],
    minPrice: offer.sellingPrice,
    maxPrice: offer.sellingPrice,
    distance: offer.distance ?? null  // ✅ PRESERVE distance field
  };
});

                        setSellerOffers(formattedOffers);

                        if (formattedOffers.length > 0) {
                            let lowest: any = formattedOffers.reduce((min: any, curr: any) =>
                                (curr.variants[0]?.sellingPrice ?? Infinity) < (min.variants[0]?.sellingPrice ?? Infinity)
                                    ? curr : min
                            );
                            setSelectedSellerOffer(lowest);
                        }
                    }
                }
            } catch (error) {
                console.error('❌ [Seller Offers] Failed to fetch:', error);
                setSellerOffers([]);
            }
        };

        fetchSellerOffers();
    }, [selectedVariantId, product?._id, product?.catalog?._id, product?.variants, locationFilter]);  // ✅ Add locationFilter dependency

    useEffect(() => {
        let checkCategoriesInterval: ReturnType<typeof setTimeout> | undefined;
        let isMounted = true;

        // ✅ Fetch product ONLY if productId exists and not already loaded
        if (productId) {
            const currentProduct = products.product;
            if (!currentProduct || currentProduct._id !== productId) {
                dispatch(fetchProductById({ productId, locationFilter }));  // ← Pass object with location
            }
            dispatch(fetchReviewsByProductId({ productId }));
        }

        // ✅ Fetch category attributes ONLY if not already loaded
        if (categoryId && attributeState.length === 0 && !attributesLoading) {
            const fetchAttributesIfSlugExists = (cats: Category[]) => {
                const foundCategory = cats.find((cat: Category) => cat._id === categoryId);

                if (foundCategory?.categoryId) {
                    const slug = foundCategory.categoryId;
                    dispatch(fetchCategoryAttributes({
                        categoryId: slug,
                        includeInactive: false
                    }));
                    return true;
                }
                return false;
            };

            const cats = categoryState?.categories || [];
            const handled = fetchAttributesIfSlugExists(cats);

            if (!handled && isMounted) {
                checkCategoriesInterval = setInterval(() => {
                    if (!isMounted) {
                        clearInterval(checkCategoriesInterval);
                        return;
                    }

                    const updatedCats = categoryState?.categories || [];
                    const wasHandled = fetchAttributesIfSlugExists(updatedCats);

                    if (wasHandled && checkCategoriesInterval) {
                        clearInterval(checkCategoriesInterval);
                        checkCategoriesInterval = undefined;
                    }
                }, 500);
            }
        }

        return () => {
            isMounted = false;
            if (checkCategoriesInterval) {
                clearInterval(checkCategoriesInterval);
                checkCategoriesInterval = undefined;
            }
        };
    }, [
        productId,
        categoryId,
        dispatch,
        products.product?._id,  // ✅ Add this to prevent re-fetch
        attributeState.length,
        attributesLoading,
        categoryState?.categories,
        locationFilter
    ]);



    // ✅ UPDATED: Separate attributes by type - more flexible filtering
    const { variantAttributes, highlightAttributes } = useMemo(() => {
        if (!attributeState || attributeState.length === 0) {
            return { variantAttributes: [], highlightAttributes: [] };
        }

        const variantAttrs: CategoryAttribute[] = attributeState.filter(
            (attr: CategoryAttribute) =>
                (attr.isVariantField === true || attr.name.toLowerCase() === 'ram' || attr.name.toLowerCase() === 'storage') &&
                attr.isActive === true
        );

        // ✅ UPDATED: Show highlights if displayInHighlights OR if it's a known highlight field
        const highlightAttrs: CategoryAttribute[] = attributeState.filter(
            (attr: CategoryAttribute) =>
                (attr.displayInHighlights === true ||
                    ['brand', 'networktype', 'esimsupport', 'processorbrand', 'processorseries'].includes(attr.name.toLowerCase())) &&
                attr.isVariantField !== true &&
                attr.isActive === true
        );

        variantAttrs.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        highlightAttrs.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

        return { variantAttributes: variantAttrs, highlightAttributes: highlightAttrs };
    }, [attributeState]);

    // ✅ AFTER (fixed):
    const currentVariant = useMemo(() => {
        if (isCatalogProduct && selectedSellerOffer && selectedVariantId) {
            const variant = selectedSellerOffer.variants?.find((v: any) =>
                v._id === selectedVariantId && v.isActive !== false
            );
            if (!variant) return null;
            const activeOffer = variant.offers?.find((o: any) => o.isActive !== false);

            if (activeOffer) {
                return {
                    // ✅ Keep ALL variant fields intact
                    ...variant,
                    // ✅ ONLY merge offer pricing/stock fields (NOT _id)
                    sellingPrice: activeOffer.sellingPrice,
                    mrpPrice: activeOffer.mrpPrice,
                    stock: activeOffer.stock,
                    sku: activeOffer.sku,
                    // ✅ Store offer metadata separately
                    offerId: activeOffer._id,
                    offerSeller: activeOffer.seller,
                    // ✅ Ensure variant._id is preserved
                    _id: variant._id,
                };
            }
            return variant;
        }

        // For independent products
        if (!product?.variants || !selectedVariantId) return null;
        const variant = product.variants.find(v =>
            v._id === selectedVariantId && v.isActive !== false
        );
        if (!variant) return null;

        const activeOffer = variant.offers?.find((o: any) => o.isActive !== false);

        if (activeOffer) {
            return {
                ...variant,
                sellingPrice: activeOffer.sellingPrice,
                mrpPrice: activeOffer.mrpPrice,
                stock: activeOffer.stock,
                sku: activeOffer.sku,
                offerId: activeOffer._id,
                offerSeller: activeOffer.seller,
                _id: variant._id,  // ✅ Critical: preserve variant._id
            };
        }
        return variant;
    }, [isCatalogProduct, selectedSellerOffer, product?.variants, selectedVariantId]);

    const colorsWithImages = useMemo(() => {
        const sourceProduct = isCatalogProduct && selectedSellerOffer ? selectedSellerOffer : product;
        if (!sourceProduct?.variants || !sourceProduct.variants.length) return [];

        const colorMap = new Map<string, { color: string; images: string[]; variants: any[] }>();

        // ✅ First, collect all variants grouped by color
        sourceProduct.variants
            .filter((v: any) => v.isActive !== false && v.color)
            .forEach((v: any) => {
                if (!colorMap.has(v.color)) {
                    colorMap.set(v.color, {
                        color: v.color,
                        images: [],
                        variants: []
                    });
                }
                colorMap.get(v.color)!.variants.push(v);

                // Collect ALL images from ALL variants of this color
                if (v.images && Array.isArray(v.images)) {
                    v.images.forEach((img: string) => {
                        if (img && img.trim() !== '' && !colorMap.get(v.color)!.images.includes(img)) {
                            colorMap.get(v.color)!.images.push(img);
                        }
                    });
                }
            });

        // ✅ NEW: If district filter is active, filter out colors with no available variants in that district
        let colorsArray = Array.from(colorMap.values());

        if (locationFilter?.type === 'district' && locationFilter.district) {
            const targetDistrict = locationFilter.district;

            colorsArray = colorsArray.filter(colorData => {
                // Check if this color has ANY variant with an offer from a seller in the selected district
                const hasVariantInDistrict = colorData.variants.some(variant => {
                    // Check variant's own offers
                    const hasOwnOffer = variant.offers?.some((offer: any) =>
                        offer.seller?.district === targetDistrict &&
                        offer.isActive !== false &&
                        (offer.stock ?? 0) > 0
                    );

                    // Also check sellerOffers
                    const hasSellerOffer = sellerOffers.some((offer: any) => {
                        const variantInOffer = offer.variants?.find((v: any) => v._id === variant._id);
                        return variantInOffer &&
                            offer.seller?.district === targetDistrict &&
                            (variantInOffer.stock ?? 0) > 0;
                    });

                    return hasOwnOffer || hasSellerOffer;
                });
                return hasVariantInDistrict;
            });
        }

        return colorsArray;
    }, [isCatalogProduct, selectedSellerOffer, product?.variants, sellerOffers, locationFilter]);  // ✅ Add locationFilter dependency

useEffect(() => {
  if (
    colorsWithImages && 
    Array.isArray(colorsWithImages) &&
    colorsWithImages.length > 0 && 
    !selectedColor  // Only if no color is selected
  ) {
    const firstColor = colorsWithImages[0].color;
    if (firstColor) {
      setSelectedColor(firstColor);
      console.log('✅ [ProductDetails] Auto-selected first color:', firstColor);
    }
  }
}, [colorsWithImages, selectedColor]);  


    // ✅ FIXED: Include offers from all sellers for independent products too + DISTRICT FILTER
    const availableVariantsForColor = useMemo(() => {
        if (!selectedColor) return [];

        // Get base variants from product
        const baseVariants = product?.variants || [];

        // Filter by color first
        let colorFiltered = baseVariants.filter((v: any) =>
            v.color?.toLowerCase() === selectedColor.toLowerCase() && v.isActive !== false
        );



        // ✅ NEW: If district filter is active, filter variants that have offers from that district
        if (locationFilter?.type === 'district' && locationFilter.district) {
            colorFiltered = colorFiltered.filter((variant: any) => {
                // Check if this variant has ANY offer from a seller in the selected district
                const hasOfferInDistrict = variant.offers?.some((offer: any) =>
                    offer.seller?.district === locationFilter.district &&
                    offer.isActive !== false &&
                    (offer.stock ?? 0) > 0
                );

                // Also check sellerOffers if available
                const hasSellerOfferInDistrict = sellerOffers.some((offer: any) => {
                    const variantInOffer = offer.variants?.find((v: any) => v._id === variant._id);
                    return variantInOffer &&
                        offer.seller?.district === locationFilter.district &&
                        (variantInOffer.stock ?? 0) > 0;
                });

                return hasOfferInDistrict || hasSellerOfferInDistrict;
            });
        }

        // ✅ For independent products: if sellerOffers exist, merge them
        if (!isCatalogProduct && sellerOffers.length > 0) {
            // Add variants from seller offers that match the color
            const offerVariants = sellerOffers
                .flatMap((offer: any) => offer.variants || [])
                .filter((v: any) =>
                    v.color?.toLowerCase() === selectedColor.toLowerCase() &&
                    v.isActive !== false
                );

            // ✅ If district filter is active, also filter offerVariants
            let filteredOfferVariants = offerVariants;
            if (locationFilter?.type === 'district' && locationFilter.district) {
                filteredOfferVariants = offerVariants.filter((v: any) => {
                    // Find the offer that contains this variant
                    const matchingOffer = sellerOffers.find((offer: any) =>
                        offer.variants?.some((ov: any) => ov._id === v._id) &&
                        offer.seller?.district === locationFilter.district
                    );
                    return !!matchingOffer;
                });
            }

            // Merge and deduplicate by variant._id
            const allVariants = [...colorFiltered, ...filteredOfferVariants];
            const uniqueVariants = allVariants.filter(
                (v, index, self) => index === self.findIndex(t => t._id === v._id)
            );
            return uniqueVariants;
        }

        return colorFiltered;
    }, [selectedColor, isCatalogProduct, sellerOffers, product?.variants, locationFilter]);  // ✅ Add locationFilter dependency

  // ✅ Auto-select first available variant when color is selected (TypeScript-safe)
useEffect(() => {
  // ✅ Explicit type guard for product.variants
  const variants = product?.variants;
  
  if (
    variants && 
    Array.isArray(variants) && 
    variants.length > 0 && 
    selectedColor && 
    !selectedVariantId && 
    availableVariantsForColor.length > 0
  ) {
    // Find the first variant that has active offers with stock
    const firstAvailable = availableVariantsForColor.find((v: any) => 
      v.isActive !== false && 
      v.offers?.some((o: any) => o.isActive !== false && (o.stock ?? 0) > 0)
    );
    
    if (firstAvailable) {
      setSelectedVariantId(firstAvailable._id || '');
      
      if (firstAvailable.specifications) {
        setSelectedSpecs(firstAvailable.specifications as Record<string, string>);
        
        // Set size label
        const variantLabels = variantAttributes
          .map(attr => firstAvailable.specifications?.[attr.name])
          .filter(Boolean);
        const combinedLabel = variantLabels.length > 0 
          ? variantLabels.join(' + ') 
          : `${firstAvailable.specifications?.storage || ''} + ${firstAvailable.specifications?.ram || ''}`.trim() || 'Default';
        setSelectedSize(combinedLabel);
      }
      
      setSelectedImage(0);
      
    }
  }
}, [product?.variants, selectedColor, selectedVariantId, availableVariantsForColor, variantAttributes]);

    const availableSellersForVariant = useMemo(() => {
        if (!selectedVariantId || !isCatalogProduct) return [];

        return sellerOffers.filter((offer: any) =>
            offer.variants?.some((v: any) => v._id === selectedVariantId && v.stock > 0 && v.isActive !== false)
        );
    }, [selectedVariantId, isCatalogProduct, sellerOffers]);

    const displayImages = useMemo(() => {
        const sourceProduct = isCatalogProduct && selectedSellerOffer ? selectedSellerOffer : product;
        if (!sourceProduct) return [];

        // ✅ If a specific variant is selected, show ONLY that variant's images
        if (currentVariant?.images && currentVariant.images.length > 0 && selectedVariantId) {
            return currentVariant.images.filter((img: string) => img && img.trim() !== '');
        }

        // ✅ If only color is selected (no specific variant), show ALL unique images for that color
        if (selectedColor && sourceProduct.variants) {
            const colorData = colorsWithImages.find(c => c.color === selectedColor);
            if (colorData?.images && colorData.images.length > 0) {
                return colorData.images;
            }
        }

        // Fallback to product-level images
        return (sourceProduct.images || []).filter((img: string) => img && img.trim() !== '');
    }, [isCatalogProduct, selectedSellerOffer, product, currentVariant, selectedColor, selectedVariantId, colorsWithImages]);

    const handleColorSelect = useCallback((color: string, variantId?: string) => {
        setSelectedColor(color);
        setSelectedSpecs({});
        setSelectedVariantId('');  // ✅ Clear variant when color changes
        setSelectedSize('');  // ✅ Clear size when color changes
        setSelectedImage(0);

        // ✅ If variantId is provided, select it immediately
        if (variantId) {
            setSelectedVariantId(variantId);
        }
        // ✅ Otherwise, the useEffect above will auto-select the first available variant
    }, []);

    const handleVariantSelect = useCallback((variant: ProductVariant) => {
        setSelectedVariantId(variant._id || '');

        if (variant.specifications) {
            setSelectedSpecs(variant.specifications as Record<string, string>);

            // ✅ Set size as combination of key specs (e.g., "3GB+64GB")
            const variantAttrs = variantAttributes;
            const variantLabels = variantAttrs
                .map(attr => variant.specifications?.[attr.name])
                .filter(Boolean);
            const combinedLabel = variantLabels.length > 0
                ? variantLabels.join(' + ')
                : `${variant.specifications?.storage || ''} + ${variant.specifications?.ram || ''}`.trim() || 'Default';
            setSelectedSize(combinedLabel);
        }

        setSelectedSellerOffer(null);

    }, [variantAttributes]);  // ✅ Add dependency

    const handleSpecSelect = useCallback((attrName: string, value: string) => {
        setSelectedSpecs(prev => ({ ...prev, [attrName]: value }));

        const matchingVariant = availableVariantsForColor.find((v: ProductVariant) =>
            Object.entries({ ...selectedSpecs, [attrName]: value }).every(
                ([key, val]) => v.specifications?.[key] === val
            )
        );

        if (matchingVariant) {
            setSelectedVariantId(matchingVariant._id || '');
        }
    }, [availableVariantsForColor, selectedSpecs]);

    const calculateDiscount = (mrp: number, selling: number): number => {
        if (!mrp || !selling || mrp <= selling) return 0;
        return Math.round(((mrp - selling) / mrp) * 100);
    };

    // ✅ ADD: Format distance for display
    const formatDistance = (distance?: number | null): string => {
        if (distance === null || distance === undefined || isNaN(distance)) return '';
        if (distance < 1) return '<1 km';
        return `${distance.toFixed(1)} km`;
    };

    // ✅ FIXED handleAddCart:
    const handleAddCart = useCallback(() => {
        const jwt = localStorage.getItem('jwt');
        if (!jwt) {
            setSnackbarMessage('Please login to add items to cart');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }
        if (!productId || !currentVariant) {
            setSnackbarMessage('Please select a variant');
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }
        if (currentVariant.stock !== undefined && currentVariant.stock < quantity) {
            setSnackbarMessage(`Only ${currentVariant.stock} items in stock`);
            setSnackbarSeverity('error');
            setSnackbarOpen(true);
            return;
        }

        // ✅ Determine sellerId: from selected offer OR current variant's offer
        const sellerId =
            selectedSellerOffer?.seller?._id ||
            selectedSellerOffer?.seller ||
            currentVariant.offerSeller?._id ||
            currentVariant.offerSeller ||
            (isCatalogProduct ? undefined : product?.seller?._id);

        const cartRequest = {
            productId: productId,
            quantity: quantity,
            // ✅ CRITICAL: currentVariant._id is now the VARIANT id (not offer id)
            variantId: currentVariant._id,
            // ✅ Include sellerId for multi-seller support (both catalog & independent)
            sellerId: sellerId,
            // ✅ Include size (required by CartItem schema)
            size: selectedSize || currentVariant.color || 'Default',
            // ✅ Include color & specs for variant matching fallback
            color: selectedColor,
            specifications: Object.keys(selectedSpecs).length > 0 ? selectedSpecs : undefined,
            // ✅ Optional: include offerId for precise offer tracking
            ...(currentVariant.offerId && { offerId: currentVariant.offerId }),
        };

        console.log('🛒 Adding to cart:', cartRequest); // Debug log

        dispatch(addItemToCart({ jwt, request: cartRequest })).then((result) => {
            if (addItemToCart.fulfilled.match(result)) {
                dispatch(fetchUserCart(jwt));
                setSnackbarMessage('Item added to cart successfully!');
                setSnackbarSeverity('success');
                setSnackbarOpen(true);
            } else {
                setSnackbarMessage(result.payload as string || 'Failed to add item to cart');
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
            }
        });
    }, [
        productId,
        currentVariant,
        selectedColor,
        selectedSpecs,
        selectedSize,  // ✅ Added dependency
        quantity,
        isCatalogProduct,
        selectedSellerOffer,
        product?.seller?._id,  // ✅ Added dependency
        dispatch
    ]);

    const handleSnackbarClose = () => setSnackbarOpen(false);

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, fallbackSize: '50' | '600') => {
        const placeholder = fallbackSize === '50' ? PLACEHOLDER_50 : PLACEHOLDER_600;
        (e.target as HTMLImageElement).src = placeholder;
    };

    // ✅✅✅ FIXED: Render Flipkart-Style Variant Cards with Price Display
    const renderVariantAttributeSelectors = () => {
        if (!product || variantAttributes.length === 0 || !selectedColor) return null;

        return (
            <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MemoryIcon fontSize="small" color="primary" />
                    Variant: {currentVariant ? `${currentVariant.specifications?.[variantAttributes[0]?.name]} + ${currentVariant.specifications?.[variantAttributes[1]?.name]}` : 'Select variant'}
                </Typography>

                <Grid container spacing={2}>
                    {availableVariantsForColor.map((variant: ProductVariant) => {
                        const isSelected = selectedVariantId === variant._id;

                        // Build variant label from all variant attributes
                        const variantLabels = variantAttributes
                            .map(attr => variant.specifications?.[attr.name])
                            .filter(Boolean);
                        const combinedLabel = variantLabels.join(' + ');

                        // ✅ Check if this variant is available in other colors
                        const isInOtherColors = checkIsInOtherColors(variant, selectedColor);

                        // ✅ Check if variant has any active offers with stock
                        const hasActiveOffer = variant.offers?.some((o: any) =>
                            o.isActive !== false && (o.stock ?? 0) > 0
                        );

                        return (
                            <Grid key={variant._id} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Card
                                    onClick={() => {
                                        // ✅ Allow selection if has active offer OR available in other colors
                                        if (hasActiveOffer || isInOtherColors) {
                                            handleVariantSelect(variant);
                                        }
                                    }}
                                    sx={{
                                        cursor: (hasActiveOffer || isInOtherColors) ? 'pointer' : 'not-allowed',
                                        border: isSelected ? '2px solid #ff9f00' : '1px solid #e0e0e0',
                                        '&:hover': hasActiveOffer ? { borderColor: '#ff9f00', boxShadow: 2 } : {},
                                        transition: 'all 0.2s',
                                        opacity: (!hasActiveOffer && !isInOtherColors) ? 0.6 : 1,
                                        borderRadius: 2,
                                        position: 'relative',
                                        bgcolor: isSelected ? '#fff8e1' : 'white'
                                    }}
                                >
                                    <CardContent sx={{ p: 2 }}>
                                        {/* Variant Label ONLY */}
                                        <Typography variant="body1" fontWeight={isSelected ? 'bold' : 'normal'}>
                                            {combinedLabel}
                                        </Typography>

                                        {/* Availability Status ONLY */}
                                        {!hasActiveOffer && (
                                            <Typography variant="caption" color={isInOtherColors ? 'text.secondary' : 'error'} sx={{ display: 'block', mt: 1 }}>
                                                {isInOtherColors ? 'Available in other colours' : 'Out of Stock'}
                                            </Typography>
                                        )}

                                        {/* Selected Indicator */}
                                        {isSelected && (
                                            <CheckCircle
                                                sx={{
                                                    color: '#ff9f00',
                                                    fontSize: 20,
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8
                                                }}
                                            />
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            </Box>
        );
    };

    // ✅ UPDATED: Render Product Highlights - with null checks
    const renderProductHighlights = () => {
        // ✅ Guard: Return null if product or currentVariant is missing
        if (!product || highlightAttributes.length === 0 || !currentVariant) return null;

        // ✅ Safe access to product.highlights with fallback
        const productHighlights = product.highlights || {};

        // ✅ Get highlight values from product-level highlights OR variant specs
        const highlightValues = {
            ...productHighlights,  // Product-level highlights
            ...currentVariant.specifications  // Fallback to variant specs
        };

        return (
            <Paper sx={{ p: 3, mt: 3, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.light' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                    <CheckCircle color="success" fontSize="small" />
                    🔸 Product Highlights
                </Typography>
                <Grid container spacing={2}>
                    {highlightAttributes.map((attr: CategoryAttribute) => {
                        // ✅ Try multiple ways to get the value with null-safe access
                        const value =
                            highlightValues[attr.name] ||  // Direct match
                            highlightValues[attr.name?.toLowerCase()] ||  // Lowercase match
                            currentVariant.specifications?.[attr.name] ||  // Fallback to variant specs
                            currentVariant.specifications?.[attr.name?.toLowerCase()];  // Lowercase fallback

                        if (!value) return null;

                        return (
                            <Grid key={attr.name} size={{ xs: 12, sm: 6 }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                    <CheckCircle sx={{ color: 'success.main', fontSize: 18, mt: 0.2 }} />
                                    <Box>
                                        <Typography variant="body2" fontWeight="500">{attr.label}:</Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)}
                                        </Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>
            </Paper>
        );
    };

    // ✅ Render Seller Offers Selection (Multi-Seller Catalog)
    const renderSellerOffers = () => {
        if (!isCatalogProduct || sellerOffers.length === 0 || !selectedVariantId) return null;

        return (
            <Paper sx={{ p: 3, mt: 3, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.light' }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <StoreIcon color="warning" />
                    🏪 Select Seller ({sellerOffers.length} offers)
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Compare prices and choose the best offer from different sellers
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {sellerOffers.map((offer) => {
                        const variant = offer.variants.find((v: any) => v._id === selectedVariantId);
                        if (!variant) return null;

                        const isSelected = selectedSellerOffer?._id === offer._id;
                        const sellerName =
                            offer.seller?.businessDetails?.businessName ||  // Priority 1: Business name (populated)
                            offer.seller?.sellerName ||                     // Priority 2: Seller name (populated)
                            (typeof offer.seller === 'string' ? 'Loading...' : 'Seller');

                        return (
                            <Box
                                key={offer._id}
                                onClick={() => setSelectedSellerOffer(offer)}
                                sx={{
                                    p: 2,
                                    border: isSelected ? '2px solid #ff9f00' : '1px solid #e0e0e0',
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    bgcolor: isSelected ? '#fff8e1' : 'white',
                                    '&:hover': { borderColor: '#ff9f00', boxShadow: 1 },
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                                    {/* Seller Info */}
                                    <Box sx={{ flex: 1, minWidth: 200 }}>
                                        <Typography variant="subtitle1" fontWeight="bold">
                                            {sellerName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            ✓ {variant.stock > 0 ? `${variant.stock} in stock` : 'Out of stock'}
                                        </Typography>
                                    </Box>

                                    {/* Price Info */}
                                    <Box sx={{ textAlign: 'right' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, justifyContent: 'flex-end' }}>
                                            {variant.mrpPrice && variant.mrpPrice > variant.sellingPrice && (
                                                <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                                                    ₹{variant.mrpPrice.toLocaleString()}
                                                </Typography>
                                            )}
                                            <Typography variant="h6" fontWeight="bold" color="primary">
                                                ₹{variant.sellingPrice.toLocaleString()}
                                            </Typography>
                                        </Box>
                                        {variant.mrpPrice && variant.mrpPrice > variant.sellingPrice && (
                                            <Chip
                                                label={`${Math.round(((variant.mrpPrice - variant.sellingPrice) / variant.mrpPrice) * 100)}% off`}
                                                size="small"
                                                color="success"
                                                sx={{ mt: 0.5 }}
                                            />
                                        )}
                                        {isSelected && (
                                            <Chip label="Selected" size="small" color="success" sx={{ mt: 1 }} />
                                        )}
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Paper>
        );
    };

    return (
        <div className='px-5 lg:px-20 pt-10'>
            {products.loading || catalogLoading ? (
                <Box sx={{ textAlign: 'center', py: 10 }}><CircularProgress /></Box>
            ) : !product ? (
                <Alert severity="error">Product not found</Alert>
            ) : (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-10'>
                    {/* Image Gallery */}
                    <section className='flex flex-col lg:flex-row gap-5'>
                        <div className='w-full lg:w-[15%] flex flex-wrap lg:flex-col gap-3'>
                            {displayImages.length > 0 ? (
                                displayImages.map((item: string, index: number) => (
                                    <img
                                        key={`${item}-${index}`}
                                        onClick={() => setSelectedImage(index)}
                                        className='lg:w-full w-[50px] cursor-pointer rounded-md object-cover border-2 hover:border-blue-500'
                                        src={item}
                                        alt={`${product.title} - ${index + 1}`}
                                        style={{ borderColor: selectedImage === index ? '#1976d2' : 'transparent' }}
                                        onError={(e) => handleImageError(e, '50')}
                                        loading="lazy"
                                    />
                                ))
                            ) : (
                                <img src={PLACEHOLDER_50} alt="No image" className='lg:w-full w-[50px] rounded-md object-cover' />
                            )}
                        </div>
                        <div className='w-full lg:w-[85%]'>
                            {displayImages.length > 0 && displayImages[selectedImage] ? (
                                <img
                                    onClick={handleOpen}
                                    className='w-full rounded-md cursor-zoom-out object-cover'
                                    src={displayImages[selectedImage]}
                                    alt={product.title}
                                    onError={(e) => handleImageError(e, '600')}
                                    loading="lazy"
                                />
                            ) : (
                                <img src={PLACEHOLDER_600} alt="No image" className='w-full rounded-md object-cover' />
                            )}
                        </div>
                        <Modal open={open} onClose={handleClose}>
                            <Box sx={style}>
                                {displayImages.length > 0 && displayImages[selectedImage] ? (
                                    <ZoomableImage src={displayImages[selectedImage]} alt={product.title} />
                                ) : (
                                    <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'grey.100' }}>
                                        <Typography color="text.secondary">No image available</Typography>
                                    </Box>
                                )}
                            </Box>
                        </Modal>
                    </section>

                    {/* Product Info */}
                    <section>

                        <Typography variant="h4" fontWeight="bold" className='mt-1'>{product.title}</Typography>

                        <div className='flex justify-between items-center py-2 border w-[180px] px-3 mt-5'>
                            <div className='flex gap-1 items-center'>
                                <span>4</span>
                                <StarIcon sx={{ color: teal[600], fontSize: "17px" }} />
                            </div>
                            <Divider orientation="vertical" flexItem />
                            <span>{review.reviews?.length || 0} Ratings & Reviews</span>
                        </div>

                        {product.variants && product.variants.length > 0 && (
                            <Box sx={{ mt: 4 }}>
                                {colorsWithImages.length > 0 && (
                                    <Box sx={{ mb: 4 }}>
                                        <Typography variant="subtitle1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                            <PaletteIcon fontSize="small" color="primary" />
                                            <strong>Select Color</strong>
                                        </Typography>
                                        <Grid container spacing={2}>
                                            {colorsWithImages.map((colorData) => {
                                                const firstVariant = colorData.variants[0];
                                                const isSelected = selectedColor === colorData.color;
                                                return (
                                                    <Grid key={colorData.color} size={{ xs: 6, sm: 3 }}>
                                                        <Card
                                                            onClick={() => handleColorSelect(colorData.color, firstVariant?._id)}
                                                            sx={{
                                                                cursor: 'pointer',
                                                                border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                                                '&:hover': { borderColor: '#1976d2' },
                                                                transition: 'all 0.2s'
                                                            }}
                                                        >
                                                            <CardContent sx={{ p: 2, textAlign: 'center' }}>
                                                                {colorData.images[0] ? (
                                                                    <img src={colorData.images[0]} alt={colorData.color} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} onError={(e) => handleImageError(e, '50')} />
                                                                ) : (
                                                                    <Box sx={{ width: '100%', height: 80, bgcolor: 'grey.200', borderRadius: 1, mb: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                        <Typography variant="caption" color="text.secondary">No Image</Typography>
                                                                    </Box>
                                                                )}
                                                                <Typography variant="body2" fontWeight={isSelected ? 'bold' : 'normal'}>{colorData.color}</Typography>
                                                                {isSelected && <CheckCircle sx={{ color: '#1976d2', fontSize: 16, mt: 0.5 }} />}
                                                            </CardContent>
                                                        </Card>
                                                    </Grid>
                                                );
                                            })}
                                        </Grid>
                                    </Box>
                                )}

                                {renderVariantAttributeSelectors()}

                                {currentVariant && (
                                    <Paper sx={{ p: 3, mb: 3, bgcolor: '#fff8e1', border: '2px dashed', borderColor: 'orange.main' }}>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CheckCircle color="success" fontSize="small" />
                                            Selected: {currentVariant.color} - {currentVariant.specifications?.storage} + {currentVariant.specifications?.ram}
                                        </Typography>

                                        {/* ✅ Display Seller Offers in Table Format */}
                                        {sellerOffers.length > 0 ? (
  <Box sx={{ mt: 2, mb: 2 }}>
    <Typography variant="subtitle2" fontWeight="bold" gutterBottom color="text.secondary" sx={{ mb: 2 }}>
      🏪 Select Seller ({sellerOffers.length} offers available):
    </Typography>

    {/* Table Header */}
    <Box sx={{
      display: 'grid',
      // ✅ Conditionally include distance column width
      gridTemplateColumns: locationFilter?.type === 'current' 
        ? '2fr 1fr 1fr 80px 100px'  // ✅ With distance column
        : '2fr 1fr 1fr 100px',       // ✅ Without distance column
      gap: 2,
      p: 2,
      bgcolor: 'grey.100',
      borderRadius: 1,
      fontWeight: 'bold',
      fontSize: '0.875rem'
    }}>
      <Typography variant="body2">Seller</Typography>
      {/* ✅ Only show Distance header if current location is active */}
      {locationFilter?.type === 'current' && (
        <Typography variant="body2" sx={{ textAlign: 'center' }}>Distance</Typography>
      )}
      <Typography variant="body2">MRP</Typography>
      <Typography variant="body2">Selling Price</Typography>
      <Typography variant="body2">Action</Typography>
    </Box>

    {/* Table Rows */}
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
      {sellerOffers.map((offer) => {
        const variant = offer.variants.find((v: any) => v._id === selectedVariantId);
        if (!variant) return null;

        const isSelected = selectedSellerOffer?._id === offer._id;

        // ✅ Extract seller name with proper fallback chain
        const sellerName =
          offer.seller?.businessDetails?.businessName ||  // Priority 1: Business name
          offer.seller?.sellerName ||                     // Priority 2: Seller name
          'Seller';                                       // Fallback

        const discount = variant.mrpPrice && variant.mrpPrice > variant.sellingPrice
          ? Math.round(((variant.mrpPrice - variant.sellingPrice) / variant.mrpPrice) * 100)
          : 0;

        return (
          <Box
            key={offer._id}
            onClick={() => setSelectedSellerOffer(offer)}
            sx={{
              display: 'grid',
              // ✅ Match header grid layout
              gridTemplateColumns: locationFilter?.type === 'current' 
                ? '2fr 1fr 1fr 80px 100px'  // ✅ With distance column
                : '2fr 1fr 1fr 100px',       // ✅ Without distance column
              gap: 2,
              p: 2,
              border: isSelected ? '2px solid #ff9f00' : '1px solid #e0e0e0',
              borderRadius: 1,
              cursor: 'pointer',
              bgcolor: isSelected ? '#fff3e0' : 'white',
              '&:hover': { borderColor: '#ff9f00', boxShadow: 1 },
              transition: 'all 0.2s',
              alignItems: 'center'
            }}
          >
            {/* Seller Name */}
            <Box>
              <Typography variant="body2" fontWeight="bold" color="text.primary">
                {sellerName}
              </Typography>
              {discount > 0 && (
                <Typography variant="caption" color="success.main" fontWeight="bold">
                  ↓{discount}% off
                </Typography>
              )}
            </Box>

            {/* ✅ Only show Distance if current location is active */}
            {locationFilter?.type === 'current' && (
              <Box sx={{ textAlign: 'center' }}>
                {offer.distance !== null && offer.distance !== undefined && !isNaN(offer.distance) ? (
                  <Typography variant="body2" color="text.secondary">
                    {formatDistance(offer.distance)}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.disabled">-</Typography>
                )}
              </Box>
            )}

            {/* MRP */}
            <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
              ₹{variant.mrpPrice?.toLocaleString() || 'N/A'}
            </Typography>

            {/* Selling Price */}
            <Typography variant="body1" fontWeight="bold" color="primary">
              ₹{variant.sellingPrice?.toLocaleString() || 'N/A'}
            </Typography>

            {/* Select Button */}
            <Button
              size="small"
              variant={isSelected ? 'contained' : 'outlined'}
              color="primary"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedSellerOffer(offer);
              }}
              sx={{ fontSize: '0.75rem', py: 0.5 }}
            >
              {isSelected ? '✓ Selected' : 'Select'}
            </Button>
          </Box>
        );
      })}
    </Box>
  </Box>
) : (
  /* Show regular price info when no seller offers */
  <Box sx={{ p: 2, mb: 2, bgcolor: 'primary.50', borderRadius: 1, border: '1px dashed', borderColor: 'primary.main' }}>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Price for selected variant:</Typography>
    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, flexWrap: 'wrap' }}>
      <Typography variant="h5" fontWeight="bold" color="primary.main">₹{currentVariant.sellingPrice?.toLocaleString()}</Typography>
      {currentVariant.mrpPrice && currentVariant.mrpPrice > (currentVariant.sellingPrice || 0) && (
        <>
          <Typography variant="body1" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>₹{currentVariant.mrpPrice.toLocaleString()}</Typography>
          <Chip label={`${calculateDiscount(currentVariant.mrpPrice, currentVariant.sellingPrice)}% OFF`} size="small" color="success" sx={{ fontWeight: 'bold' }} />
        </>
      )}
    </Box>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Inclusive of all taxes. Free Shipping above ₹1500.</Typography>
  </Box>
)}

                                        {/* ✅ REMOVED: Stock chip that was here */}

                                        <Box sx={{ mt: 2, mb: 3 }}>
                                            <Typography fontWeight="bold" gutterBottom>Quantity:</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Button disabled={quantity <= 1} onClick={() => setQuantity(q => q - 1)} variant='outlined' size="small"><RemoveIcon /></Button>
                                                <span className='px-4 text-lg font-semibold'>{quantity}</span>
                                                <Button disabled={currentVariant.stock !== undefined && quantity >= currentVariant.stock} onClick={() => setQuantity(q => q + 1)} variant='outlined' size="small"><AddIcon /></Button>
                                            </Box>
                                        </Box>

                                        <Button
                                            variant="contained"
                                            fullWidth
                                            size="large"
                                            disabled={currentVariant.stock === 0 || (sellerOffers.length > 0 && !selectedSellerOffer)}
                                            onClick={handleAddCart}
                                            startIcon={<AddShoppingCartIcon />}
                                            sx={{
                                                py: 1.5,
                                                fontSize: '1.1rem',
                                                bgcolor: 'orange.600',
                                                '&:hover': { bgcolor: 'orange.700' }
                                            }}
                                        >
                                            {currentVariant.stock === 0 ? 'Out of Stock' : sellerOffers.length > 0 && !selectedSellerOffer ? 'Select a Seller' : 'Add to Cart'}
                                        </Button>
                                    </Paper>
                                )}
                            </Box>
                        )}

                        <div className='mt-7 space-y-3'>
                            <div className='flex items-center gap-4'><ShieldIcon sx={{ color: teal[400] }} /><Typography>Authentic & Quality Assured</Typography></div>
                            <div className='flex items-center gap-4'><WorkspacePremiumIcon sx={{ color: teal[400] }} /><Typography>100% money back guarantee</Typography></div>
                            <div className='flex items-center gap-4'><LocalShippingIcon sx={{ color: teal[400] }} /><Typography>Free Shipping & Returns</Typography></div>
                            <div className='flex items-center gap-4'><Wallet sx={{ color: teal[400] }} /><Typography>Pay on delivery might be available</Typography></div>
                        </div>

                        <div className='mt-5'>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>Description</Typography>
                            <Typography>{product.description}</Typography>
                        </div>

                        {renderProductHighlights()}

                        {/* ✅ NEW: Render Seller Offers Section (Multi-Seller Catalog) */}
                        {renderSellerOffers()}

                        <div className="ratings w-full mt-10">
                            <Typography variant="h6" fontWeight="bold" className="pb-4">Review & Ratings</Typography>
                            <RatingCard totalReview={review.reviews?.length || 0} />
                            <div className='mt-10 space-y-5'>
                                {review.reviews?.map((item: any, index: number) => (
                                    <div key={index} className='space-y-5'>
                                        <ProductReviewCard item={item} />
                                        <Divider />
                                    </div>
                                ))}
                                <Button onClick={() => navigate(`/reviews/${productId}`)}>View All {review.reviews?.length || 0} Reviews</Button>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            <section className='mt-20'>
                <Typography variant="h6" fontWeight="bold">Similar Products</Typography>
                <div className='pt-5'><SmilarProduct /></div>
            </section>

            <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>{snackbarMessage}</Alert>
            </Snackbar>
        </div>
    );
};

export default ProductDetails;