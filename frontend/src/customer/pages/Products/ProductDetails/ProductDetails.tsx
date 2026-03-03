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
import { Wallet, CheckCircle } from '@mui/icons-material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import PaletteIcon from '@mui/icons-material/Palette';
import MemoryIcon from '@mui/icons-material/Memory';
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

    // ✅ DEBUG: Log JWT and attribute state
    useEffect(() => {
        const jwt = localStorage.getItem('jwt');
        console.log('🔑 [DEBUG] JWT:', jwt ? '✅ Present' : '❌ Missing');
        console.log('📋 [DEBUG] attributeState:', {
            length: attributeState?.length || 0,
            hasAttributes: (attributeState?.length || 0) > 0
        });
    }, [attributeState]);

    // ✅ Fetch data on mount
    useEffect(() => {
        if (productId) {
            dispatch(fetchProductById(productId));
            dispatch(fetchReviewsByProductId({ productId }));
        }

        if (categoryId) {
            dispatch(getAllProducts({ category: categoryId }));

            // Find category slug from Redux state
            const cats = categoryState?.categories || [];
            const category = cats.find((cat: Category) => cat._id === categoryId);

            if (category?.categoryId) {
                const slug = category.categoryId;
                console.log('✅ Category slug:', slug);
                dispatch(fetchCategoryAttributes({
                    categoryId: slug,
                    includeInactive: false
                }));
            } else {
                // Wait for categories to load
                const checkCategories = setInterval(() => {
                    const updatedCats = categoryState?.categories || [];
                    const foundCategory = updatedCats.find((cat: Category) => cat._id === categoryId);

                    if (foundCategory?.categoryId) {
                        clearInterval(checkCategories);
                        const slug = foundCategory.categoryId;
                        dispatch(fetchCategoryAttributes({
                            categoryId: slug,
                            includeInactive: false
                        }));
                    }
                }, 500);

                return () => clearInterval(checkCategories);
            }
        }
    }, [productId, categoryId, dispatch, categoryState?.categories]);

    // ✅ Auto-select first variant
    useEffect(() => {
        const product = products.product;
        if (product?.variants && product.variants.length > 0 && !selectedColor) {
            const firstActiveVariant = product.variants.find(v => v.isActive !== false);
            if (firstActiveVariant) {
                setSelectedColor(firstActiveVariant.color);
                setSelectedVariantId(firstActiveVariant._id || '');
                if (firstActiveVariant.specifications) {
                    setSelectedSpecs(firstActiveVariant.specifications as Record<string, string>);
                }
            }
        }
    }, [products.product?.variants]);

    // ✅ Separate attributes by type
    const { variantAttributes, highlightAttributes } = useMemo(() => {
        if (!attributeState || attributeState.length === 0) {
            console.log('⚠️ No attributes loaded');
            return { variantAttributes: [], highlightAttributes: [] };
        }

        const variantAttrs: CategoryAttribute[] = attributeState.filter(
            (attr: CategoryAttribute) =>
                attr.isVariantField === true &&
                attr.isActive === true
        );

        const highlightAttrs: CategoryAttribute[] = attributeState.filter(
            (attr: CategoryAttribute) =>
                attr.displayInHighlights === true &&
                attr.isVariantField !== true &&
                attr.isActive === true
        );

        variantAttrs.sort((a: CategoryAttribute, b: CategoryAttribute) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
        );

        highlightAttrs.sort((a: CategoryAttribute, b: CategoryAttribute) =>
            (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
        );

        console.log('✅ Attributes separated:', {
            variantCount: variantAttrs.length,
            highlightCount: highlightAttrs.length,
            variantNames: variantAttrs.map(a => a.name),
            highlightNames: highlightAttrs.map(a => a.name)
        });

        return { variantAttributes: variantAttrs, highlightAttributes: highlightAttrs };
    }, [attributeState]);

    const currentVariant = useMemo(() => {
        const product = products.product;
        if (!product?.variants || !selectedVariantId) return null;
        return product.variants.find(v =>
            v._id === selectedVariantId && v.isActive !== false
        ) || null;
    }, [products.product?.variants, selectedVariantId]);

    const colorsWithImages = useMemo(() => {
        const product = products.product;
        if (!product?.variants || !product.variants.length) return [];
        const colorMap = new Map<string, { color: string; images: string[]; variants: ProductVariant[] }>();
        product.variants
            .filter((v: ProductVariant) => v.isActive !== false && v.color)
            .forEach((v: ProductVariant) => {
                if (!colorMap.has(v.color)) {
                    colorMap.set(v.color, {
                        color: v.color,
                        images: (v.images || []).filter((img: string) => img && img.trim() !== ''),
                        variants: []
                    });
                }
                colorMap.get(v.color)!.variants.push(v);
            });
        return Array.from(colorMap.values());
    }, [products.product?.variants]);

    const availableVariantsForColor = useMemo(() => {
        const product = products.product;
        if (!product?.variants || !selectedColor) return [];
        return product.variants.filter((v: ProductVariant) =>
            v.isActive !== false &&
            v.color?.toLowerCase() === selectedColor.toLowerCase()
        );
    }, [products.product?.variants, selectedColor]);

    const displayImages = useMemo(() => {
        const product = products.product;
        if (!product) return [];
        if (currentVariant?.images && currentVariant.images.length > 0) {
            return currentVariant.images.filter((img: string) => img && img.trim() !== '');
        }
        if (selectedColor && product.variants) {
            const colorData = colorsWithImages.find(c => c.color === selectedColor);
            if (colorData?.images && colorData.images.length > 0) {
                return colorData.images;
            }
        }
        return (product.images || []).filter((img: string) => img && img.trim() !== '');
    }, [products.product, currentVariant, selectedColor, colorsWithImages]);

    const handleColorSelect = useCallback((color: string, variantId?: string) => {
        setSelectedColor(color);
        setSelectedSpecs({});
        setSelectedImage(0);
        if (variantId) {
            setSelectedVariantId(variantId);
        }
    }, []);

    const handleVariantSelect = useCallback((variant: ProductVariant) => {
        setSelectedVariantId(variant._id || '');
        if (variant.specifications) {
            setSelectedSpecs(variant.specifications as Record<string, string>);
        }
    }, []);

    const handleSpecSelect = useCallback((attrName: string, value: string) => {
        setSelectedSpecs(prev => ({ ...prev, [attrName]: value }));
        const matchingVariant = availableVariantsForColor.find(v =>
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
            size: "FREE",
            quantity: quantity,
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
    }, [productId, currentVariant, selectedColor, selectedSpecs, quantity, dispatch]);

    const handleSnackbarClose = () => setSnackbarOpen(false);

    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>, fallbackSize: '50' | '600') => {
        const placeholder = fallbackSize === '50' ? PLACEHOLDER_50 : PLACEHOLDER_600;
        (e.target as HTMLImageElement).src = placeholder;
    };

    const product = products.product;

// ✅✅✅ FIXED: Render Flipkart-Style Variant Cards with Price Display
const renderVariantAttributeSelectors = () => {
  // ✅ Add null check for product
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
          
          // Calculate discount
          const discount = variant.mrpPrice && variant.sellingPrice
            ? Math.round(((variant.mrpPrice - variant.sellingPrice) / variant.mrpPrice) * 100)
            : 0;
          
          // ✅ Check if this variant is available in other colors
          const isInOtherColors = product.variants?.some(v => 
            v.color?.toLowerCase() !== selectedColor.toLowerCase() &&
            variantAttributes.every(attr => v.specifications?.[attr.name] === variant.specifications?.[attr.name])
          );
          
          return (
            <Grid key={variant._id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card
                onClick={() => {
                  if (variant.stock > 0 || isInOtherColors) {
                    handleVariantSelect(variant);
                  }
                }}
                sx={{
                  cursor: variant.stock > 0 ? 'pointer' : isInOtherColors ? 'pointer' : 'not-allowed',
                  border: isSelected ? '2px solid #ff9f00' : '1px solid #e0e0e0',
                  '&:hover': variant.stock > 0 ? { borderColor: '#ff9f00', boxShadow: 2 } : {},
                  transition: 'all 0.2s',
                  opacity: variant.stock === 0 && !isInOtherColors ? 0.6 : 1,
                  borderRadius: 2,
                  position: 'relative',
                  bgcolor: isSelected ? '#fff8e1' : 'white'
                }}
              >
                <CardContent sx={{ p: 2 }}>
                  {/* Variant Label */}
                  <Typography variant="body1" fontWeight={isSelected ? 'bold' : 'normal'} sx={{ mb: 1 }}>
                    {combinedLabel}
                  </Typography>
                  
                  {/* Discount & Price */}
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    {discount > 0 && (
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        ↓{discount}%
                      </Typography>
                    )}
                    {variant.mrpPrice && (
                      <Typography variant="body2" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                        ₹{variant.mrpPrice.toLocaleString()}
                      </Typography>
                    )}
                    <Typography variant="h6" fontWeight="bold" color="text.primary">
                      ₹{variant.sellingPrice?.toLocaleString()}
                    </Typography>
                  </Box>
                  
                  {/* Stock Status */}
                  {variant.stock === 0 ? (
                    isInOtherColors ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                        Available in other colours
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="error" sx={{ display: 'block' }}>
                        Out of Stock
                      </Typography>
                    )
                  ) : variant.stock && variant.stock <= 5 ? (
                    <Typography variant="caption" color="error" sx={{ display: 'block', fontWeight: 'bold' }}>
                      {variant.stock} left
                    </Typography>
                  ) : null}
                  
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

    // ✅ Render Product Highlights
    const renderProductHighlights = () => {
        if (highlightAttributes.length === 0 || !currentVariant) return null;

        return (
            <Paper sx={{ p: 3, mt: 3, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.light' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
                    <CheckCircle color="success" fontSize="small" />
                    🔸 Product Highlights
                </Typography>
                <Grid container spacing={2}>
                    {highlightAttributes.map((attr: CategoryAttribute) => {
                        const value = currentVariant.specifications?.[attr.name];
                        if (!value) return null;
                        return (
                            <Grid key={attr.name} size={{ xs: 12, sm: 6 }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                                    <CheckCircle sx={{ color: 'success.main', fontSize: 18, mt: 0.2 }} />
                                    <Box>
                                        <Typography variant="body2" fontWeight="500">{attr.label}:</Typography>
                                        <Typography variant="body2" color="text.secondary">{value}</Typography>
                                    </Box>
                                </Box>
                            </Grid>
                        );
                    })}
                </Grid>
            </Paper>
        );
    };

    return (
        <div className='px-5 lg:px-20 pt-10'>
            {products.loading ? (
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
                        <Typography variant="h6" fontWeight="bold" color="teal.900">
                            {(product.seller as any)?.businessDetails?.businessName || product.seller?.sellerName || 'Seller'}
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" className='mt-1'>{product.title}</Typography>

                        <div className='flex justify-between items-center py-2 border w-[180px] px-3 mt-5'>
                            <div className='flex gap-1 items-center'>
                                <span>4</span>
                                <StarIcon sx={{ color: teal[600], fontSize: "17px" }} />
                            </div>
                            <Divider orientation="vertical" flexItem />
                            <span>{review.reviews?.length || 0} Ratings & Reviews</span>
                        </div>

                        {currentVariant ? (
                            <div className='space-y-2 mt-5'>
                                <div className='price flex items-center gap-3 text-2xl'>
                                    <span className='font-bold text-gray-800'>₹{currentVariant.sellingPrice?.toLocaleString()}</span>
                                    {currentVariant.mrpPrice && currentVariant.mrpPrice > (currentVariant.sellingPrice || 0) && (
                                        <>
                                            <span className='text thin-line-through text-gray-400'>₹{currentVariant.mrpPrice.toLocaleString()}</span>
                                            <span className='text-[#00927c] font-bold text-lg'>{calculateDiscount(currentVariant.mrpPrice, currentVariant.sellingPrice)}% off</span>
                                        </>
                                    )}
                                </div>
                                <p className='text-sm text-gray-600'>Inclusive of all taxes. Free Shipping above ₹1500.</p>
                                {currentVariant.stock !== undefined && (
                                    <Chip
                                        label={currentVariant.stock > 0 ? `In Stock (${currentVariant.stock} available)` : 'Out of Stock'}
                                        color={currentVariant.stock > 0 ? 'success' : 'error'}
                                        sx={{ mt: 1 }}
                                    />
                                )}
                            </div>
                        ) : (
                            <div className='space-y-2 mt-5'>
                                <Typography color="text.secondary">Please select a variant to see price</Typography>
                            </div>
                        )}

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
                                    <Paper sx={{ p: 3, mb: 3, bgcolor: 'grey.50', border: '1px solid', borderColor: 'primary.light' }}>
                                        <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CheckCircle color="success" fontSize="small" />
                                            Selected: {currentVariant.color} {currentVariant.specifications?.storage && `- ${currentVariant.specifications.storage}`} {currentVariant.specifications?.ram && `+ ${currentVariant.specifications.ram}`}
                                        </Typography>

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

                                        {currentVariant.stock !== undefined && (
                                            <Chip label={currentVariant.stock > 0 ? `In Stock (${currentVariant.stock} available)` : 'Out of Stock'} color={currentVariant.stock > 0 ? 'success' : 'error'} sx={{ mb: 2 }} />
                                        )}

                                        <Box sx={{ mt: 2, mb: 3 }}>
                                            <Typography fontWeight="bold" gutterBottom>Quantity:</Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Button disabled={quantity <= 1} onClick={() => setQuantity(q => q - 1)} variant='outlined' size="small"><RemoveIcon /></Button>
                                                <span className='px-4 text-lg font-semibold'>{quantity}</span>
                                                <Button disabled={currentVariant.stock !== undefined && quantity >= currentVariant.stock} onClick={() => setQuantity(q => q + 1)} variant='outlined' size="small"><AddIcon /></Button>
                                            </Box>
                                        </Box>

                                        <Button variant="contained" fullWidth size="large" disabled={currentVariant.stock === 0} onClick={handleAddCart} startIcon={<AddShoppingCartIcon />} sx={{ py: 1.5, fontSize: '1.1rem' }}>
                                            {currentVariant.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
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