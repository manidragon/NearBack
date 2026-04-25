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
import { api } from '../../../../Config/Api'; // ✅ ADD THIS IMPORT

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

    // ============================================
    // ✅ NEW: Fetch All Seller Offers for the Selected Variant
    // ============================================
    // ✅ UPDATED: Fetch seller offers for BOTH catalog and independent products
    useEffect(() => {
        console.log('🔍 [Seller Offers Check]', {
            selectedVariantId,
            productId: product?._id,
            hasCatalog: !!product?.catalog?._id,
            totalVariants: product?.variants?.length,
            selectedVariant: product?.variants?.find(v => v._id === selectedVariantId)
        });

        const fetchSellerOffers = async () => {
            // Only fetch if we have a selected variant AND product
            if (!selectedVariantId || !product?._id) {
                setSellerOffers([]);
                setSelectedSellerOffer(null);
                setIsCatalogProduct(false);
                return;
            }

            // ✅ Safe check: is this a catalog-linked product?
            const isCatalog = !!(product?.catalog && product.catalog._id);
            setIsCatalogProduct(isCatalog);

            try {
                if (isCatalog && product.catalog?._id) {
                    // Fetch from catalog endpoint
                    const response = await api.get(`/api/catalog/${product.catalog._id}/offers`);

                    if (response.data.success && response.data.data.offers?.length > 0) {
                        const offersWithVariant = response.data.data.offers.filter((offer: any) =>
                            offer.variants?.some((v: any) => v._id === selectedVariantId && (v.stock ?? 0) > 0 && v.isActive !== false)
                        );

                        setSellerOffers(offersWithVariant);

                        // ✅ Declare lowestOffer BEFORE using it in console.log
                        let lowestOffer: any = null;
                        if (offersWithVariant.length > 0) {
                            lowestOffer = offersWithVariant.reduce((min: any, offer: any) => {
                                const variant = offer.variants.find((v: any) => v._id === selectedVariantId);
                                const minVariant = min.variants.find((v: any) => v._id === selectedVariantId);
                                return (variant?.sellingPrice ?? Infinity) < (minVariant?.sellingPrice ?? Infinity) ? offer : min;
                            });
                            setSelectedSellerOffer(lowestOffer);
                        }

                        // ✅ Targeted debug log (now lowestOffer is defined)
                        console.log('✅ [Seller Offers] Catalog offers loaded:', {
                            count: offersWithVariant.length,
                            selected: lowestOffer?.seller?.businessDetails?.businessName || lowestOffer?.seller?.sellerName
                        });
                    }
                } else {
                    // ✅ For independent products: extract offers directly from product.variants
                    const variant = product?.variants?.find((v: any) => v._id === selectedVariantId);

                    if (variant?.offers && variant.offers.length > 0) {
                        const activeOffers = variant.offers.filter((o: any) =>
                            o.isActive !== false && (o.stock ?? 0) > 0
                        );

                        const formattedOffers = activeOffers.map((offer: any) => {
                            const sellerId = typeof offer.seller === 'string' ? offer.seller : offer.seller?._id;

                            return {
                                _id: offer._id,
                                seller: {
                                    _id: sellerId,
                                    // ✅ Backend now populates these; if not, they'll be undefined (fallback to 'Seller')
                                    businessDetails: offer.seller?.businessDetails,
                                    sellerName: offer.seller?.sellerName
                                },
                                variants: [{
                                    _id: selectedVariantId,
                                    ...variant,
                                    sellingPrice: offer.sellingPrice,
                                    mrpPrice: offer.mrpPrice,
                                    stock: offer.stock
                                }],
                                minPrice: offer.sellingPrice,
                                maxPrice: offer.sellingPrice
                            };
                        });

                        setSellerOffers(formattedOffers);

                        let lowest: any = null;
                        if (formattedOffers.length > 0) {
                            lowest = formattedOffers.reduce((min: any, curr: any) =>
                                (curr.variants[0]?.sellingPrice ?? Infinity) < (min.variants[0]?.sellingPrice ?? Infinity)
                                    ? curr : min
                            );
                            setSelectedSellerOffer(lowest);
                        }

                        console.log('✅ [Seller Offers] Independent product offers loaded:', {
                            count: formattedOffers.length,
                            sellers: formattedOffers.map(o => o.seller.businessDetails?.businessName || o.seller.sellerName)
                        });
                    } else {
                        console.log('⚠️ [Seller Offers] No offers found for variant:', selectedVariantId);
                    }
                }
            } catch (error) {
                console.error('❌ [Seller Offers] Failed to fetch:', error);
                setSellerOffers([]);
            }
        };

        fetchSellerOffers();
    }, [selectedVariantId, product?._id, product?.catalog?._id, product?.variants]);

    useEffect(() => {
        let checkCategoriesInterval: ReturnType<typeof setTimeout> | undefined;
        let isMounted = true;

        // ✅ Fetch product ONLY if productId exists and not already loaded
        if (productId) {
            const currentProduct = products.product;
            if (!currentProduct || currentProduct._id !== productId) {
                dispatch(fetchProductById(productId));
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
        categoryState?.categories
    ]);

    // ✅ Auto-select first variant
    useEffect(() => {
        if (product?.variants && product.variants.length > 0 && !selectedColor) {
            const firstActiveVariant = product.variants.find(v => v.isActive !== false);

            if (firstActiveVariant) {
                // Set the color
                setSelectedColor(firstActiveVariant.color);

                // Set the variant ID
                setSelectedVariantId(firstActiveVariant._id || '');

                // Set the specifications
                if (firstActiveVariant.specifications) {
                    setSelectedSpecs(firstActiveVariant.specifications as Record<string, string>);
                }

                // Reset image to first
                setSelectedImage(0);
            }
        }
    }, [product?.variants, selectedColor]);

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

    // ✅ UPDATED: Get current variant with offer data merged
    const currentVariant = useMemo(() => {
        if (isCatalogProduct && selectedSellerOffer && selectedVariantId) {
            // For catalog products, use selected seller's variant
            const variant = selectedSellerOffer.variants?.find((v: any) =>
                v._id === selectedVariantId && v.isActive !== false
            );
            if (!variant) return null;

            // Merge offer data into variant for display
            const activeOffer = variant.offers?.find((o: any) => o.isActive !== false);
            return activeOffer ? { ...variant, ...activeOffer } : variant;
        }

        // For independent products, use product's variants
        if (!product?.variants || !selectedVariantId) return null;
        const variant = product.variants.find(v =>
            v._id === selectedVariantId && v.isActive !== false
        );
        if (!variant) return null;

        // ✅ Merge first active offer data into variant for display
        const activeOffer = variant.offers?.find((o: any) => o.isActive !== false);
        return activeOffer ? { ...variant, ...activeOffer } : variant;
    }, [isCatalogProduct, selectedSellerOffer, product?.variants, selectedVariantId]);

    const colorsWithImages = useMemo(() => {
        const sourceProduct = isCatalogProduct && selectedSellerOffer ? selectedSellerOffer : product;
        if (!sourceProduct?.variants || !sourceProduct.variants.length) return [];

        const colorMap = new Map<string, { color: string; images: string[]; variants: any[] }>();

        sourceProduct.variants
            .filter((v: any) => v.isActive !== false && v.color)
            .forEach((v: any) => {
                if (!colorMap.has(v.color)) {
                    colorMap.set(v.color, {
                        color: v.color,
                        images: [],  // Start with empty array
                        variants: []
                    });
                }
                colorMap.get(v.color)!.variants.push(v);

                // ✅ Collect ALL images from ALL variants of this color
                if (v.images && Array.isArray(v.images)) {
                    v.images.forEach((img: string) => {
                        if (img && img.trim() !== '' && !colorMap.get(v.color)!.images.includes(img)) {
                            colorMap.get(v.color)!.images.push(img);
                        }
                    });
                }
            });

        return Array.from(colorMap.values());
    }, [isCatalogProduct, selectedSellerOffer, product?.variants]);

    const availableVariantsForColor = useMemo(() => {
        if (!selectedColor) return [];

        // ✅ Get all variants from all sellers that match the color
        const allVariants = isCatalogProduct && sellerOffers.length > 0
            ? sellerOffers.flatMap(offer => offer.variants || [])
            : product?.variants || [];

        // ✅ Filter by color and active status
        return allVariants.filter((v: any) =>
            v.color?.toLowerCase() === selectedColor.toLowerCase() && v.isActive !== false
        );
    }, [selectedColor, isCatalogProduct, sellerOffers, product?.variants]);

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
        setSelectedImage(0);
        if (variantId) {
            setSelectedVariantId(variantId);
        }
    }, []);

    const handleVariantSelect = useCallback((variant: ProductVariant) => {
        console.log('🔍 [Variant Select] Selected:', {
            variantId: variant._id,
            color: variant.color,
            specs: variant.specifications,
            stock: variant.stock
        });

        setSelectedVariantId(variant._id || '');
        if (variant.specifications) {
            setSelectedSpecs(variant.specifications as Record<string, string>);
        }

        // ✅ Reset selected seller when variant changes
        setSelectedSellerOffer(null);
    }, []);

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

        const cartRequest = {
            productId: productId,
            quantity: quantity,
            variantId: currentVariant._id,
            // ✅ Add sellerId for catalog products
            sellerId: isCatalogProduct ? selectedSellerOffer?._id : undefined,
            ...(currentVariant._id && { variantId: currentVariant._id }),
            ...(selectedColor && { color: selectedColor }),
            ...(Object.keys(selectedSpecs).length > 0 && { specifications: selectedSpecs }),
        };

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
    }, [productId, currentVariant, selectedColor, selectedSpecs, quantity, isCatalogProduct, selectedSellerOffer, dispatch]);

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
                                                    gridTemplateColumns: '2fr 1fr 1fr 100px',
                                                    gap: 2,
                                                    p: 2,
                                                    bgcolor: 'grey.100',
                                                    borderRadius: 1,
                                                    fontWeight: 'bold',
                                                    fontSize: '0.875rem'
                                                }}>
                                                    <Typography variant="body2">Seller</Typography>
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
                                                                    gridTemplateColumns: '2fr 1fr 1fr 100px',
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