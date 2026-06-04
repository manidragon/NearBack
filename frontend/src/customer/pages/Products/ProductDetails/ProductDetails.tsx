// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Products\ProductDetails\ProductDetails.tsx
import StarIcon from '@mui/icons-material/Star';
import { teal } from '@mui/material/colors';
import {
  Box, Button, Divider, Modal, Snackbar, Alert,
  Chip, Typography, Grid, Paper, CircularProgress, Card,
  CardContent, Drawer, Avatar, IconButton,
} from '@mui/material';
import CloseIcon from "@mui/icons-material/Close";
import ShieldIcon from '@mui/icons-material/Shield';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { Wallet, CheckCircle } from '@mui/icons-material';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import PaletteIcon from '@mui/icons-material/Palette';
import MemoryIcon from '@mui/icons-material/Memory';
import StoreIcon from '@mui/icons-material/Store';
import SmilarProduct from '../SimilarProduct/SmilarProduct';
import ZoomableImage from './ZoomableImage';
import { useAppDispatch, useAppSelector } from '../../../../Redux Toolkit/Store';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { fetchProductById } from '../../../../Redux Toolkit/Customer/ProductSlice';
import { addItemToCart, fetchUserCart } from '../../../../Redux Toolkit/Customer/CartSlice';
import ProductReviewCard from '../../Review/ProductReviewCard';
import { fetchReviewsByProductId } from '../../../../Redux Toolkit/Customer/ReviewSlice';
import { fetchSellerReviews } from '../../../../Redux Toolkit/Customer/SellerReviewSlice';

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from 'react';
import type { ProductVariant } from '../../../../types/productTypes';
import type { Category } from '../../../../types/categoryTypes';
import type { CategoryAttribute } from '../../../../types/categoryAttributeTypes';
import {
  fetchCategoryAttributes,
  selectCategoryAttributes,
  selectCategoryAttributesLoading,
} from '../../../../Redux Toolkit/Admin/CategoryAttributeSlice';
import { api } from '../../../../Config/Api';
import { selectLocationFilter } from '../../../../Redux Toolkit/Customer/ProductSlice';

// ─── Constants ────────────────────────────────────────────────────────────────

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 'auto',
  height: '100%',
  boxShadow: 24,
  outline: 'none',
};

const PLACEHOLDER_50 =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50'%3E%3Crect width='50' height='50' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='8' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";
const PLACEHOLDER_600 =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Crect width='600' height='600' fill='%23f5f5f5'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='18' fill='%23999'%3ENo Image Available%3C/text%3E%3C/svg%3E";

// ─── Component ────────────────────────────────────────────────────────────────

const ProductDetails = () => {
  // ── Modal (image zoom) ──
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // ── Redux ──
  const dispatch = useAppDispatch();
  const products = useAppSelector((state) => state.products);
  const review = useAppSelector((state) => state.review);
  const attributeState = useAppSelector(selectCategoryAttributes);
  const attributesLoading = useAppSelector(selectCategoryAttributesLoading);
  const categoryState = useAppSelector((state: any) => state.category);
  const sellerReviewState = useAppSelector((state) => state.sellerReview);
  const locationFilter = useAppSelector(selectLocationFilter);

  const navigate = useNavigate();
  const { productId, categoryId } = useParams();

  // ✅ Read sellerId from URL query param (set when navigating from seller profile)
  const [searchParams] = useSearchParams();
  const sellerIdFromProfile = searchParams.get('sellerId');

  // ── Product / variant state ──
  const product = products.product;
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedVariantId, setSelectedVariantId] = useState<string>('');
  const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string>>({});
  const [selectedSize, setSelectedSize] = useState<string>('');

  // ── Seller offers ──
  const [sellerOffers, setSellerOffers] = useState<any[]>([]);
  const [selectedSellerOffer, setSelectedSellerOffer] = useState<any>(null);
  const [isCatalogProduct, setIsCatalogProduct] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);

  // ── Snackbar ──
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // ── Seller Review Drawer ──
  const [openSellerDrawer, setOpenSellerDrawer] = useState(false);
  const [selectedSellerReviews, setSelectedSellerReviews] = useState<any[]>([]);
  const [selectedSellerName, setSelectedSellerName] = useState('');

  // ── Review scroll ──
  const reviewScrollRef = useRef<HTMLDivElement | null>(null);
  const [showLeftBtn, setShowLeftBtn] = useState(false);
  const [showRightBtn, setShowRightBtn] = useState(true);

  // ── Track whether seller-profile variant has been auto-selected ──
  // This prevents re-selecting on every re-render once user has manually changed selection
  const sellerProfileVariantSelectedRef = useRef(false);

  const scrollReviews = (dir: 'left' | 'right') => {
    if (!reviewScrollRef.current) return;
    const amount = 300;
    reviewScrollRef.current.scrollBy({
      left: dir === 'right' ? amount : -amount,
      behavior: 'smooth',
    });
    setTimeout(() => {
      const el = reviewScrollRef.current;
      if (!el) return;
      setShowLeftBtn(el.scrollLeft > 0);
      setShowRightBtn(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
    }, 300);
  };

  const handleNavigateToSeller = useCallback(
    (offer: any, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      const sid =
        typeof offer?.seller === 'string' ? offer.seller : offer?.seller?._id;
      if (sid) navigate(`/seller/${sid}`);
    },
    [navigate]
  );

  const handleOpenReviewDrawer = useCallback(
    (offer: any, sellerReviews: any[], sellerName: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedSellerReviews(sellerReviews);
      setSelectedSellerName(sellerName);
      setOpenSellerDrawer(true);
    },
    []
  );

  // ─── Helpers ────────────────────────────────────────────────────────────────

  const checkIsInOtherColors = (
    currentVariant: ProductVariant,
    currentColor: string
  ): boolean => {
    if (!product?.variants) return false;
    return product.variants.some(
      (v: any) =>
        v.color?.toLowerCase() !== currentColor.toLowerCase() &&
        variantAttributes.every(
          (attr) =>
            v.specifications?.[attr.name] ===
            currentVariant.specifications?.[attr.name]
        ) &&
        v.isActive !== false &&
        (v.offers?.some(
          (o: any) => o.isActive !== false && (o.stock ?? 0) > 0
        ) ||
          (v.stock ?? 0) > 0)
    );
  };

  const calculateDiscount = (mrp: number, selling: number): number => {
    if (!mrp || !selling || mrp <= selling) return 0;
    return Math.round(((mrp - selling) / mrp) * 100);
  };

  const formatDistance = (distance?: number | null): string => {
    if (distance === null || distance === undefined || isNaN(distance)) return '';
    if (distance < 1) return '<1 km';
    return `${distance.toFixed(1)} km`;
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement>,
    fallbackSize: '50' | '600'
  ) => {
    const placeholder = fallbackSize === '50' ? PLACEHOLDER_50 : PLACEHOLDER_600;
    (e.target as HTMLImageElement).src = placeholder;
  };

  // ─── Effects ────────────────────────────────────────────────────────────────

  useEffect(() => {
    sellerOffers.forEach((offer: any) => {
      const sellerId =
        typeof offer?.seller === 'string' ? offer.seller : offer?.seller?._id;
      if (sellerId && !sellerReviewState.reviewsBySeller[sellerId]) {
        dispatch(fetchSellerReviews({ sellerId }));
      }
    });
  }, [sellerOffers, dispatch]);

  useEffect(() => {
    const fetchSellerOffersData = async () => {
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
          const params: any = {};
          if (locationFilter?.type === 'current' && locationFilter.coordinates) {
            params.userLat = locationFilter.coordinates.lat;
            params.userLng = locationFilter.coordinates.lng;
            params.radiusKm = locationFilter.radiusKm || 50;
          } else if (locationFilter?.type === 'district' && locationFilter.district) {
            params.district = locationFilter.district;
          }

          const response = await api.get(
            `/api/catalog/${product.catalog._id}/offers`,
            { params }
          );

          if (response.data.success && response.data.data.offers?.length > 0) {
            let offersWithVariant = response.data.data.offers.filter(
              (offer: any) =>
                offer.variants?.some(
                  (v: any) =>
                    v._id === selectedVariantId &&
                    (v.stock ?? 0) > 0 &&
                    v.isActive !== false
                )
            );

            if (locationFilter?.type === 'district' && locationFilter.district) {
              offersWithVariant = offersWithVariant.filter(
                (offer: any) => offer.seller?.district === locationFilter.district
              );
            }

            // ✅ If coming from seller profile, filter to only that seller's offer
            if (sellerIdFromProfile) {
              offersWithVariant = offersWithVariant.filter(
                (offer: any) =>
                  String(offer.seller?._id || offer.seller) === String(sellerIdFromProfile)
              );
            }

            setSellerOffers(offersWithVariant);

            if (offersWithVariant.length > 0) {
              // ✅ If from seller profile, auto-select that seller's offer
              if (sellerIdFromProfile) {
                setSelectedSellerOffer(offersWithVariant[0]);
              } else {
                const lowestOffer = offersWithVariant.reduce(
                  (min: any, offer: any) => {
                    const variant = offer.variants.find(
                      (v: any) => v._id === selectedVariantId
                    );
                    const minVariant = min.variants.find(
                      (v: any) => v._id === selectedVariantId
                    );
                    return (variant?.sellingPrice ?? Infinity) <
                      (minVariant?.sellingPrice ?? Infinity)
                      ? offer
                      : min;
                  }
                );
                setSelectedSellerOffer(lowestOffer);
              }
            }
          }
        } else {
          const variant = product?.variants?.find(
            (v: any) => v._id === selectedVariantId
          );

          if (variant?.offers && variant.offers.length > 0) {
            let activeOffers = variant.offers.filter(
              (o: any) => o.isActive !== false && (o.stock ?? 0) > 0
            );

            if (locationFilter?.type === 'district' && locationFilter.district) {
              activeOffers = activeOffers.filter(
                (o: any) => o.seller?.district === locationFilter.district
              );
            }

            // ✅ If coming from seller profile, filter to only that seller's offer
            if (sellerIdFromProfile) {
              activeOffers = activeOffers.filter(
                (o: any) =>
                  String(o.seller?._id || o.seller) === String(sellerIdFromProfile)
              );
            }

            const formattedOffers = activeOffers.map((offer: any) => {
              const sellerId =
                typeof offer.seller === 'string'
                  ? offer.seller
                  : offer.seller?._id;
              return {
                _id: offer._id,
                seller: {
                  _id: sellerId,
                  businessDetails: offer.seller?.businessDetails,
                  sellerName: offer.seller?.sellerName,
                  district: offer.seller?.district,
                },
                variants: [
                  {
                    _id: selectedVariantId,
                    ...variant,
                    sellingPrice: offer.sellingPrice,
                    mrpPrice: offer.mrpPrice,
                    stock: offer.stock,
                  },
                ],
                minPrice: offer.sellingPrice,
                maxPrice: offer.sellingPrice,
                distance: offer.distance ?? null,
              };
            });

            setSellerOffers(formattedOffers);

            if (formattedOffers.length > 0) {
              // ✅ If from seller profile, auto-select that seller's offer
              if (sellerIdFromProfile) {
                setSelectedSellerOffer(formattedOffers[0]);
              } else {
                const lowest = formattedOffers.reduce((min: any, curr: any) =>
                  (curr.variants[0]?.sellingPrice ?? Infinity) <
                    (min.variants[0]?.sellingPrice ?? Infinity)
                    ? curr
                    : min
                );
                setSelectedSellerOffer(lowest);
              }
            }
          }
        }
      } catch (error) {
        console.error('❌ [Seller Offers] Failed to fetch:', error);
        setSellerOffers([]);
      }
    };

    fetchSellerOffersData();
  }, [
    selectedVariantId,
    product?._id,
    product?.catalog?._id,
    product?.variants,
    locationFilter,
    sellerIdFromProfile,
  ]);

  useEffect(() => {
    let checkCategoriesInterval: ReturnType<typeof setTimeout> | undefined;
    let isMounted = true;

    if (productId) {
      const currentProduct = products.product;
      if (!currentProduct || currentProduct._id !== productId) {
        dispatch(fetchProductById({ productId, locationFilter }));
      }
      dispatch(fetchReviewsByProductId({ productId }));
    }

    if (categoryId && attributeState.length === 0 && !attributesLoading) {
      const fetchAttributesIfSlugExists = (cats: Category[]) => {
        const foundCategory = cats.find((cat: Category) => cat._id === categoryId);
        if (foundCategory?.categoryId) {
          dispatch(
            fetchCategoryAttributes({
              categoryId: foundCategory.categoryId,
              includeInactive: false,
            })
          );
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
          if (fetchAttributesIfSlugExists(updatedCats) && checkCategoriesInterval) {
            clearInterval(checkCategoriesInterval);
            checkCategoriesInterval = undefined;
          }
        }, 500);
      }
    }

    return () => {
      isMounted = false;
      if (checkCategoriesInterval) clearInterval(checkCategoriesInterval);
    };
  }, [
    productId,
    categoryId,
    dispatch,
    products.product?._id,
    attributeState.length,
    attributesLoading,
    categoryState?.categories,
    locationFilter,
  ]);

  // ─── Memos ───────────────────────────────────────────────────────────────────

  const { variantAttributes, highlightAttributes } = useMemo(() => {
    if (!attributeState || attributeState.length === 0)
      return { variantAttributes: [], highlightAttributes: [] };

    const variantAttrs: CategoryAttribute[] = attributeState.filter(
      (attr: CategoryAttribute) =>
        (attr.isVariantField === true ||
          attr.name.toLowerCase() === 'ram' ||
          attr.name.toLowerCase() === 'storage') &&
        attr.isActive === true
    );

    const highlightAttrs: CategoryAttribute[] = attributeState.filter(
      (attr: CategoryAttribute) =>
        (attr.displayInHighlights === true ||
          [
            'brand',
            'networktype',
            'esimsupport',
            'processorbrand',
            'processorseries',
          ].includes(attr.name.toLowerCase())) &&
        attr.isVariantField !== true &&
        attr.isActive === true
    );

    variantAttrs.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    highlightAttrs.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

    return { variantAttributes: variantAttrs, highlightAttributes: highlightAttrs };
  }, [attributeState]);

  const currentVariant = useMemo(() => {
    if (isCatalogProduct && selectedSellerOffer && selectedVariantId) {
      const variant = selectedSellerOffer.variants?.find(
        (v: any) => v._id === selectedVariantId && v.isActive !== false
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
          _id: variant._id,
        };
      }
      return variant;
    }

    if (!product?.variants || !selectedVariantId) return null;
    const variant = product.variants.find(
      (v) => v._id === selectedVariantId && v.isActive !== false
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
        _id: variant._id,
      };
    }
    return variant;
  }, [isCatalogProduct, selectedSellerOffer, product?.variants, selectedVariantId]);

  const colorsWithImages = useMemo(() => {
    const sourceProduct =
      isCatalogProduct && selectedSellerOffer ? selectedSellerOffer : product;
    if (!sourceProduct?.variants || !sourceProduct.variants.length) return [];

    const colorMap = new Map<
      string,
      { color: string; images: string[]; variants: any[] }
    >();

    sourceProduct.variants
      .filter((v: any) => v.isActive !== false && v.color)
      .forEach((v: any) => {
        if (!colorMap.has(v.color)) {
          colorMap.set(v.color, { color: v.color, images: [], variants: [] });
        }
        colorMap.get(v.color)!.variants.push(v);
        if (v.images && Array.isArray(v.images)) {
          v.images.forEach((img: string) => {
            if (img && img.trim() !== '' && !colorMap.get(v.color)!.images.includes(img)) {
              colorMap.get(v.color)!.images.push(img);
            }
          });
        }
      });

    let colorsArray = Array.from(colorMap.values());

    // ✅ If coming from seller profile, only show colors that seller has in stock
    if (sellerIdFromProfile) {
      colorsArray = colorsArray.filter((colorData) =>
        colorData.variants.some((variant: any) =>
          variant.offers?.some(
            (o: any) =>
              String(o.seller?._id || o.seller) === String(sellerIdFromProfile) &&
              o.isActive !== false &&
              (o.stock ?? 0) > 0
          )
        )
      );
    } else if (locationFilter?.type === 'district' && locationFilter.district) {
      const targetDistrict = locationFilter.district;
      colorsArray = colorsArray.filter((colorData) =>
        colorData.variants.some((variant) => {
          const hasOwnOffer = variant.offers?.some(
            (offer: any) =>
              offer.seller?.district === targetDistrict &&
              offer.isActive !== false &&
              (offer.stock ?? 0) > 0
          );
          const hasSellerOffer = sellerOffers.some((offer: any) => {
            const variantInOffer = offer.variants?.find(
              (v: any) => v._id === variant._id
            );
            return (
              variantInOffer &&
              offer.seller?.district === targetDistrict &&
              (variantInOffer.stock ?? 0) > 0
            );
          });
          return hasOwnOffer || hasSellerOffer;
        })
      );
    }

    return colorsArray;
  }, [
    isCatalogProduct,
    selectedSellerOffer,
    product?.variants,
    sellerOffers,
    locationFilter,
    sellerIdFromProfile,
  ]);

  // ✅ FIX: Reset the ref whenever the product changes so a fresh auto-select can run
  useEffect(() => {
    sellerProfileVariantSelectedRef.current = false;
    setSelectedColor('');
    setSelectedVariantId('');
    setSelectedSpecs({});
    setSelectedSize('');
    setSelectedImage(0);
  }, [product?._id]);

  // ✅ FIX: Auto-select first color whenever colorsWithImages populates and no color is chosen yet
  useEffect(() => {
    if (
      colorsWithImages &&
      Array.isArray(colorsWithImages) &&
      colorsWithImages.length > 0 &&
      !selectedColor
    ) {
      const firstColor = colorsWithImages[0].color;
      if (firstColor) setSelectedColor(firstColor);
    }
  }, [colorsWithImages, selectedColor]);

  const availableVariantsForColor = useMemo(() => {
    if (!selectedColor) return [];

    const baseVariants = product?.variants || [];
    let colorFiltered = baseVariants.filter(
      (v: any) =>
        v.color?.toLowerCase() === selectedColor.toLowerCase() &&
        v.isActive !== false
    );

    // ✅ If coming from seller profile, only show variants that seller has in stock
    if (sellerIdFromProfile) {
      colorFiltered = colorFiltered.filter((variant: any) =>
        variant.offers?.some(
          (o: any) =>
            String(o.seller?._id || o.seller) === String(sellerIdFromProfile) &&
            o.isActive !== false &&
            (o.stock ?? 0) > 0
        )
      );
    } else if (locationFilter?.type === 'district' && locationFilter.district) {
      colorFiltered = colorFiltered.filter((variant: any) => {
        const hasOfferInDistrict = variant.offers?.some(
          (offer: any) =>
            offer.seller?.district === locationFilter.district &&
            offer.isActive !== false &&
            (offer.stock ?? 0) > 0
        );
        const hasSellerOfferInDistrict = sellerOffers.some((offer: any) => {
          const variantInOffer = offer.variants?.find(
            (v: any) => v._id === variant._id
          );
          return (
            variantInOffer &&
            offer.seller?.district === locationFilter.district &&
            (variantInOffer.stock ?? 0) > 0
          );
        });
        return hasOfferInDistrict || hasSellerOfferInDistrict;
      });
    }

    if (!isCatalogProduct && sellerOffers.length > 0 && !sellerIdFromProfile) {
      const offerVariants = sellerOffers
        .flatMap((offer: any) => offer.variants || [])
        .filter(
          (v: any) =>
            v.color?.toLowerCase() === selectedColor.toLowerCase() &&
            v.isActive !== false
        );

      let filteredOfferVariants = offerVariants;
      if (locationFilter?.type === 'district' && locationFilter.district) {
        filteredOfferVariants = offerVariants.filter((v: any) => {
          const matchingOffer = sellerOffers.find(
            (offer: any) =>
              offer.variants?.some((ov: any) => ov._id === v._id) &&
              offer.seller?.district === locationFilter.district
          );
          return !!matchingOffer;
        });
      }

      const allVariants = [...colorFiltered, ...filteredOfferVariants];
      return allVariants.filter(
        (v, index, self) => index === self.findIndex((t) => t._id === v._id)
      );
    }

    return colorFiltered;
  }, [
    selectedColor,
    isCatalogProduct,
    sellerOffers,
    product?.variants,
    locationFilter,
    sellerIdFromProfile,
  ]);

  // ✅ FIX: Main variant auto-selection effect
  // When coming from seller profile: always select first available variant once
  //   availableVariantsForColor is ready (don't gate on !selectedVariantId so
  //   it reliably fires even on re-renders before offers load).
  // Normal flow: keep the existing !selectedVariantId guard.
  useEffect(() => {
    const variants = product?.variants;
    if (
      !variants ||
      !Array.isArray(variants) ||
      variants.length === 0 ||
      !selectedColor ||
      availableVariantsForColor.length === 0
    ) {
      return;
    }

    if (sellerIdFromProfile) {
      // ── Seller-profile path ──────────────────────────────────────────────────
      // We want to auto-select the first variant that this specific seller has
      // in stock. We run this whenever availableVariantsForColor changes AND
      // we haven't already locked in a selection for this product+seller combo.
      if (sellerProfileVariantSelectedRef.current) return;

      const firstAvailable = availableVariantsForColor.find((v: any) =>
        v.isActive !== false &&
        v.offers?.some(
          (o: any) =>
            String(o.seller?._id || o.seller) === String(sellerIdFromProfile) &&
            o.isActive !== false &&
            (o.stock ?? 0) > 0
        )
      );

      if (firstAvailable) {
        sellerProfileVariantSelectedRef.current = true; // lock so user can change freely after
        setSelectedVariantId(firstAvailable._id || '');
        if (firstAvailable.specifications) {
          setSelectedSpecs(firstAvailable.specifications as Record<string, string>);
          const variantLabels = variantAttributes
            .map((attr) => firstAvailable.specifications?.[attr.name])
            .filter(Boolean);
          const combinedLabel =
            variantLabels.length > 0
              ? variantLabels.join(' + ')
              : `${firstAvailable.specifications?.storage || ''} + ${firstAvailable.specifications?.ram || ''}`.trim() ||
              'Default';
          setSelectedSize(combinedLabel);
        }
        setSelectedImage(0);
      }
    } else {
      // ── Normal path (no seller filter) ──────────────────────────────────────
      // Only auto-select when no variant is chosen yet (preserve manual selection)
      if (selectedVariantId) return;

      const firstAvailable = availableVariantsForColor.find(
        (v: any) =>
          v.isActive !== false &&
          v.offers?.some(
            (o: any) => o.isActive !== false && (o.stock ?? 0) > 0
          )
      );

      if (firstAvailable) {
        setSelectedVariantId(firstAvailable._id || '');
        if (firstAvailable.specifications) {
          setSelectedSpecs(firstAvailable.specifications as Record<string, string>);
          const variantLabels = variantAttributes
            .map((attr) => firstAvailable.specifications?.[attr.name])
            .filter(Boolean);
          const combinedLabel =
            variantLabels.length > 0
              ? variantLabels.join(' + ')
              : `${firstAvailable.specifications?.storage || ''} + ${firstAvailable.specifications?.ram || ''}`.trim() ||
              'Default';
          setSelectedSize(combinedLabel);
        }
        setSelectedImage(0);
      }
    }
  }, [
    product?.variants,
    selectedColor,
    availableVariantsForColor,
    variantAttributes,
    sellerIdFromProfile,
    selectedVariantId,
  ]);

  const displayImages = useMemo(() => {
    const sourceProduct =
      isCatalogProduct && selectedSellerOffer
        ? selectedSellerOffer
        : product;

    if (!sourceProduct) return [];

    // ✅ FIRST PRIORITY: show currently selected variant images
    if (
      currentVariant?.images &&
      currentVariant.images.length > 0 &&
      selectedVariantId
    ) {
      return currentVariant.images.filter(
        (img: string) => img && img.trim() !== ""
      );
    }

    // ✅ SECOND PRIORITY: show seller-specific variant images
    if (selectedColor && sourceProduct.variants) {
      const matchingVariant = availableVariantsForColor.find(
        (v: any) => v._id === selectedVariantId
      );

      if (matchingVariant?.images && matchingVariant.images.length > 0) {
        return matchingVariant.images.filter(
          (img: string) => img && img.trim() !== ""
        );
      }

      const colorData = colorsWithImages.find(
        (c) => c.color === selectedColor
      );

      if (colorData?.images && colorData.images.length > 0) {
        return colorData.images.filter(
          (img: string) => img && img.trim() !== ""
        );
      }
    }

    // ✅ LAST FALLBACK: product images
    return (sourceProduct.images || []).filter(
      (img: string) => img && img.trim() !== ""
    );

  }, [
    isCatalogProduct,
    selectedSellerOffer,
    product,
    currentVariant,
    selectedColor,
    selectedVariantId,
    colorsWithImages,
    availableVariantsForColor,
  ]);

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleColorSelect = useCallback(
    (color: string, variantId?: string) => {
      setSelectedColor(color);
      setSelectedSpecs({});
      setSelectedVariantId('');
      setSelectedSize('');
      setSelectedImage(0);
      // ✅ FIX: Allow re-auto-selection when user manually switches color
      // (only relevant for seller-profile path)
      sellerProfileVariantSelectedRef.current = false;
      if (variantId) setSelectedVariantId(variantId);
    },
    []
  );

  const handleVariantSelect = useCallback(
    (variant: ProductVariant) => {
      setSelectedVariantId(variant._id || '');
      if (variant.specifications) {
        setSelectedSpecs(variant.specifications as Record<string, string>);
        const variantLabels = variantAttributes
          .map((attr) => variant.specifications?.[attr.name])
          .filter(Boolean);
        const combinedLabel =
          variantLabels.length > 0
            ? variantLabels.join(' + ')
            : `${variant.specifications?.storage || ''} + ${variant.specifications?.ram || ''}`.trim() ||
            'Default';
        setSelectedSize(combinedLabel);
      }
      setSelectedSellerOffer(null);
      // ✅ FIX: Once user manually picks a variant, lock the ref so auto-select
      // doesn't override their choice on the next render cycle
      sellerProfileVariantSelectedRef.current = true;
    },
    [variantAttributes]
  );

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

    const sellerId =
      selectedSellerOffer?.seller?._id ||
      selectedSellerOffer?.seller ||
      currentVariant.offerSeller?._id ||
      currentVariant.offerSeller ||
      (isCatalogProduct ? undefined : product?.seller?._id);

    const cartRequest = {
      productId,
      quantity,
      variantId: currentVariant._id,
      sellerId,
      size: selectedSize || currentVariant.color || 'Default',
      color: selectedColor,
      specifications:
        Object.keys(selectedSpecs).length > 0 ? selectedSpecs : undefined,
      ...(currentVariant.offerId && { offerId: currentVariant.offerId }),
    };

    dispatch(addItemToCart({ jwt, request: cartRequest })).then((result) => {
      if (addItemToCart.fulfilled.match(result)) {
        dispatch(fetchUserCart(jwt));
        setSnackbarMessage('Item added to cart successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        setSnackbarMessage(
          (result.payload as string) || 'Failed to add item to cart'
        );
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    });
  }, [
    productId,
    currentVariant,
    selectedColor,
    selectedSpecs,
    selectedSize,
    quantity,
    isCatalogProduct,
    selectedSellerOffer,
    product?.seller?._id,
    dispatch,
  ]);

  const handleSnackbarClose = () => setSnackbarOpen(false);

  // ─── Render helpers ──────────────────────────────────────────────────────────

  const renderVariantAttributeSelectors = () => {
    if (!product || variantAttributes.length === 0 || !selectedColor) return null;

    return (
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <MemoryIcon fontSize="small" color="primary" />
          Variant:{' '}
          {currentVariant
            ? `${currentVariant.specifications?.[variantAttributes[0]?.name]} + ${currentVariant.specifications?.[variantAttributes[1]?.name]}`
            : 'Select variant'}
        </Typography>

        <Grid container spacing={2}>
          {availableVariantsForColor.map((variant: ProductVariant) => {
            const isSelected = selectedVariantId === variant._id;
            const variantLabels = variantAttributes
              .map((attr) => variant.specifications?.[attr.name])
              .filter(Boolean);
            const combinedLabel = variantLabels.join(' + ');
            const isInOtherColors = checkIsInOtherColors(variant, selectedColor);
            const hasActiveOffer = variant.offers?.some(
              (o: any) => o.isActive !== false && (o.stock ?? 0) > 0
            );

            return (
              <Grid key={variant._id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  onClick={() => {
                    if (hasActiveOffer || isInOtherColors)
                      handleVariantSelect(variant);
                  }}
                  sx={{
                    cursor:
                      hasActiveOffer || isInOtherColors
                        ? 'pointer'
                        : 'not-allowed',
                    border: isSelected
                      ? '2px solid #ff9f00'
                      : '1px solid #e0e0e0',
                    '&:hover': hasActiveOffer
                      ? { borderColor: '#ff9f00', boxShadow: 2 }
                      : {},
                    transition: 'all 0.2s',
                    opacity: !hasActiveOffer && !isInOtherColors ? 0.6 : 1,
                    borderRadius: 2,
                    position: 'relative',
                    bgcolor: isSelected ? '#fff8e1' : 'white',
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Typography
                      variant="body1"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                    >
                      {combinedLabel}
                    </Typography>
                    {!hasActiveOffer && (
                      <Typography
                        variant="caption"
                        color={isInOtherColors ? 'text.secondary' : 'error'}
                        sx={{ display: 'block', mt: 1 }}
                      >
                        {isInOtherColors
                          ? 'Available in other colours'
                          : 'Out of Stock'}
                      </Typography>
                    )}
                    {isSelected && (
                      <CheckCircle
                        sx={{
                          color: '#ff9f00',
                          fontSize: 20,
                          position: 'absolute',
                          top: 8,
                          right: 8,
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

  const renderProductHighlights = () => {
    if (!product || highlightAttributes.length === 0 || !currentVariant) return null;
    const productHighlights = product.highlights || {};
    const highlightValues = { ...productHighlights, ...currentVariant.specifications };

    return (
      <Paper
        sx={{
          p: 3,
          mt: 3,
          bgcolor: 'success.50',
          border: '1px solid',
          borderColor: 'success.light',
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}
        >
          <CheckCircle color="success" fontSize="small" />
          🔸 Product Highlights
        </Typography>
        <Grid container spacing={2}>
          {highlightAttributes.map((attr: CategoryAttribute) => {
            const value =
              highlightValues[attr.name] ||
              highlightValues[attr.name?.toLowerCase()] ||
              currentVariant.specifications?.[attr.name] ||
              currentVariant.specifications?.[attr.name?.toLowerCase()];
            if (!value) return null;
            return (
              <Grid key={attr.name} size={{ xs: 12, sm: 6 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <CheckCircle sx={{ color: 'success.main', fontSize: 18, mt: 0.2 }} />
                  <Box>
                    <Typography variant="body2" fontWeight="500">
                      {attr.label}:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {typeof value === 'boolean'
                        ? value
                          ? 'Yes'
                          : 'No'
                        : String(value)}
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

  const renderSellerOffers = () => {
    if (!isCatalogProduct || sellerOffers.length === 0 || !selectedVariantId)
      return null;

    return (
      <Paper
        sx={{
          p: 3,
          mt: 3,
          bgcolor: 'warning.50',
          border: '1px solid',
          borderColor: 'warning.light',
        }}
      >
        <Typography
          variant="h6"
          fontWeight="bold"
          gutterBottom
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <StoreIcon color="warning" />
          🏪 Select Seller ({sellerOffers.length} offers)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Compare prices and choose the best offer from different sellers
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {sellerOffers.map((offer) => {
            const variant = offer.variants.find(
              (v: any) => v._id === selectedVariantId
            );
            if (!variant) return null;
            const isSelected = selectedSellerOffer?._id === offer._id;
            const sellerName =
              offer.seller?.businessDetails?.businessName ||
              offer.seller?.sellerName ||
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
                  transition: 'all 0.2s',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 2,
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 200 }}>
                    <Typography
                      variant="subtitle1"
                      fontWeight="bold"
                      color="primary"
                      sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                      onClick={(e) => handleNavigateToSeller(offer, e)}
                    >
                      {sellerName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ✓{' '}
                      {variant.stock > 0
                        ? `${variant.stock} in stock`
                        : 'Out of stock'}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: 1,
                        justifyContent: 'flex-end',
                      }}
                    >
                      {variant.mrpPrice && variant.mrpPrice > variant.sellingPrice && (
                        <Typography
                          variant="body2"
                          sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                        >
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

  // ─── JSX ─────────────────────────────────────────────────────────────────────

  return (
    <div className="px-5 lg:px-20 pt-10">
      {products.loading || catalogLoading ? (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : !product ? (
        <Alert severity="error">Product not found</Alert>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* ── IMAGE GALLERY ── */}
          <section className="flex flex-col lg:flex-row gap-5">
            <div className="w-full lg:w-[15%] flex flex-wrap lg:flex-col gap-3">
              {displayImages.length > 0 ? (
                displayImages.map((item: string, index: number) => (
                  <img
                    key={`${item}-${index}`}
                    onClick={() => setSelectedImage(index)}
                    className="lg:w-full w-[50px] cursor-pointer rounded-md object-cover border-2 hover:border-blue-500"
                    src={item}
                    alt={`${product.title} - ${index + 1}`}
                    style={{
                      borderColor: selectedImage === index ? '#1976d2' : 'transparent',
                    }}
                    onError={(e) => handleImageError(e, '50')}
                    loading="lazy"
                  />
                ))
              ) : (
                <img
                  src={PLACEHOLDER_50}
                  alt="No image"
                  className="lg:w-full w-[50px] rounded-md object-cover"
                />
              )}
            </div>
            <div className="w-full lg:w-[85%]">
              {displayImages.length > 0 && displayImages[selectedImage] ? (
                <img
                  onClick={handleOpen}
                  className="w-full rounded-md cursor-zoom-out object-cover"
                  src={displayImages[selectedImage]}
                  alt={product.title}
                  onError={(e) => handleImageError(e, '600')}
                  loading="lazy"
                />
              ) : (
                <img
                  src={PLACEHOLDER_600}
                  alt="No image"
                  className="w-full rounded-md object-cover"
                />
              )}
            </div>
            <Modal open={open} onClose={handleClose}>
              <Box sx={style}>
                {displayImages.length > 0 && displayImages[selectedImage] ? (
                  <ZoomableImage
                    src={displayImages[selectedImage]}
                    alt={product.title}
                  />
                ) : (
                  <Box
                    sx={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'grey.100',
                    }}
                  >
                    <Typography color="text.secondary">
                      No image available
                    </Typography>
                  </Box>
                )}
              </Box>
            </Modal>
          </section>

          {/* ── PRODUCT INFO ── */}
          <section>
            <Typography variant="h4" fontWeight="bold" className="mt-1">
              {product.title}
            </Typography>

            {/* OVERALL PRODUCT RATING */}
            {(() => {
              const totalReviews = review.reviews?.length || 0;
              const totalStars =
                review.reviews?.reduce(
                  (sum: number, item: any) => sum + (item.rating || 0),
                  0
                ) || 0;
              const averageRating =
                totalReviews > 0 ? (totalStars / totalReviews).toFixed(1) : '0';
              return (
                <div
                  onClick={() => navigate(`/reviews/${productId}`)}
                  className="flex justify-between items-center py-2 border w-[220px] px-3 mt-5 rounded-md cursor-pointer hover:bg-gray-100"
                >
                  <div className="flex gap-1 items-center">
                    <span className="font-semibold">{averageRating}</span>
                    <StarIcon sx={{ color: teal[600], fontSize: "17px" }} />
                  </div>

                  <Divider orientation="vertical" flexItem />

                  <span>{totalReviews} Ratings & Reviews</span>
                </div>
              );
            })()}

            {product.variants && product.variants.length > 0 && (
              <Box sx={{ mt: 4 }}>

                {/* COLOR SELECTOR */}
                {colorsWithImages.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography
                      variant="subtitle1"
                      gutterBottom
                      sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}
                    >
                      <PaletteIcon fontSize="small" color="primary" />
                      <strong>Select Color</strong>
                    </Typography>
                    <Grid container spacing={2}>
                      {colorsWithImages.map((colorData) => {
                        const firstVariant = sellerIdFromProfile
                          ? colorData.variants.find((variant: any) =>
                            variant.offers?.some(
                              (o: any) =>
                                String(o.seller?._id || o.seller) ===
                                String(sellerIdFromProfile) &&
                                o.isActive !== false &&
                                (o.stock ?? 0) > 0
                            )
                          )
                          : colorData.variants[0];
                        const isSelected = selectedColor === colorData.color;
                        return (
                          <Grid key={colorData.color} size={{ xs: 6, sm: 3 }}>
                            <Card
                              onClick={() =>
                                handleColorSelect(
                                  colorData.color,
                                  firstVariant?._id
                                )
                              }
                              sx={{
                                cursor: 'pointer',
                                border: isSelected
                                  ? '2px solid #1976d2'
                                  : '1px solid #e0e0e0',
                                '&:hover': { borderColor: '#1976d2' },
                                transition: 'all 0.2s',
                              }}
                            >
                              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                                {colorData.images[0] ? (
                                  <img
                                    src={colorData.images[0]}
                                    alt={colorData.color}
                                    style={{
                                      width: '100%',
                                      height: 80,
                                      objectFit: 'cover',
                                      borderRadius: 8,
                                      marginBottom: 8,
                                    }}
                                    onError={(e) => handleImageError(e, '50')}
                                  />
                                ) : (
                                  <Box
                                    sx={{
                                      width: '100%',
                                      height: 80,
                                      bgcolor: 'grey.200',
                                      borderRadius: 1,
                                      mb: 1,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      No Image
                                    </Typography>
                                  </Box>
                                )}
                                <Typography
                                  variant="body2"
                                  fontWeight={isSelected ? 'bold' : 'normal'}
                                >
                                  {colorData.color}
                                </Typography>
                                {isSelected && (
                                  <CheckCircle
                                    sx={{
                                      color: '#1976d2',
                                      fontSize: 16,
                                      mt: 0.5,
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
                )}

                {renderVariantAttributeSelectors()}

                {currentVariant && (
                  <Paper
                    sx={{
                      p: 3,
                      mb: 3,
                      bgcolor: '#fff8e1',
                      border: '2px dashed',
                      borderColor: 'orange.main',
                    }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight="bold"
                      gutterBottom
                      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                    >
                      <CheckCircle color="success" fontSize="small" />
                      Selected: {currentVariant.color} -{' '}
                      {currentVariant.specifications?.storage} +{' '}
                      {currentVariant.specifications?.ram}
                    </Typography>

                    {/* ── SELLER OFFERS TABLE ── */}
                    {sellerOffers.length > 0 ? (
                      <Box sx={{ mt: 2, mb: 2 }}>
                        <Typography
                          variant="subtitle2"
                          fontWeight="bold"
                          gutterBottom
                          color="text.secondary"
                          sx={{ mb: 2 }}
                        >
                          🏪 Select Seller ({sellerOffers.length} offers available):
                        </Typography>

                        {/* TABLE HEADER */}
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns:
                              locationFilter?.type === 'current'
                                ? '2fr 1fr 1fr 80px 100px'
                                : '2fr 1fr 1fr 100px',
                            gap: 2,
                            p: 2,
                            bgcolor: 'grey.100',
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="body2">Seller</Typography>
                          {locationFilter?.type === 'current' && (
                            <Typography
                              variant="body2"
                              sx={{ textAlign: 'center' }}
                            >
                              Distance
                            </Typography>
                          )}
                          <Typography variant="body2">MRP</Typography>
                          <Typography variant="body2">Selling Price</Typography>
                          <Typography variant="body2">Action</Typography>
                        </Box>

                        {/* TABLE ROWS */}
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1,
                            mt: 1,
                          }}
                        >
                          {sellerOffers.map((offer) => {
                            const variant = offer.variants.find(
                              (v: any) => v._id === selectedVariantId
                            );
                            if (!variant) return null;

                            const isSelected =
                              selectedSellerOffer?._id === offer._id;

                            const sellerName =
                              offer.seller?.businessDetails?.businessName ||
                              offer.seller?.sellerName ||
                              'Seller';

                            const discount =
                              variant.mrpPrice &&
                                variant.mrpPrice > variant.sellingPrice
                                ? Math.round(
                                  ((variant.mrpPrice - variant.sellingPrice) /
                                    variant.mrpPrice) *
                                  100
                                )
                                : 0;

                            const currentSellerId =
                              typeof offer?.seller === 'string'
                                ? offer.seller
                                : offer?.seller?._id;

                            const sellerReviews = currentSellerId
                              ? sellerReviewState.reviewsBySeller[
                              currentSellerId
                              ] || []
                              : [];

                            const sellerReviewCount = sellerReviews.length;
                            const sellerAvgRating =
                              sellerReviewCount > 0
                                ? (
                                  sellerReviews.reduce(
                                    (sum: number, r: any) =>
                                      sum + Number(r.rating || 0),
                                    0
                                  ) / sellerReviewCount
                                ).toFixed(1)
                                : null;

                            return (
                              <Box
                                key={offer._id}
                                onClick={() => setSelectedSellerOffer(offer)}
                                sx={{
                                  display: 'grid',
                                  gridTemplateColumns:
                                    locationFilter?.type === 'current'
                                      ? '2fr 1fr 1fr 80px 100px'
                                      : '2fr 1fr 1fr 100px',
                                  gap: 2,
                                  p: 2,
                                  border: isSelected
                                    ? '2px solid #ff9f00'
                                    : '1px solid #e0e0e0',
                                  borderRadius: 1,
                                  cursor: 'pointer',
                                  bgcolor: isSelected ? '#fff3e0' : 'white',
                                  '&:hover': {
                                    borderColor: '#ff9f00',
                                    boxShadow: 1,
                                  },
                                  transition: 'all 0.2s',
                                  alignItems: 'center',
                                }}
                              >
                                {/* SELLER NAME + RATING BADGE */}
                                <Box>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1,
                                      flexWrap: 'wrap',
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      fontWeight="bold"
                                      color="primary"
                                      sx={{
                                        cursor: 'pointer',
                                        '&:hover': { textDecoration: 'underline' },
                                      }}
                                      onClick={(e) =>
                                        handleNavigateToSeller(offer, e)
                                      }
                                    >
                                      {sellerName}
                                    </Typography>

                                    {sellerAvgRating && (
                                      <Box
                                        onClick={(e) =>
                                          handleOpenReviewDrawer(
                                            offer,
                                            sellerReviews,
                                            sellerName,
                                            e
                                          )
                                        }
                                        sx={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: 0.5,
                                          bgcolor: '#f0fdf4',
                                          border: '1px solid #bbf7d0',
                                          px: 1,
                                          py: 0.2,
                                          borderRadius: '12px',
                                          cursor: 'pointer',
                                          '&:hover': { bgcolor: '#dcfce7' },
                                        }}
                                      >
                                        <Typography
                                          fontWeight="bold"
                                          sx={{ color: 'green' }}
                                        >
                                          {sellerAvgRating}★
                                        </Typography>
                                        <Typography>
                                          ({sellerReviewCount})
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>

                                  {discount > 0 && (
                                    <Typography
                                      variant="caption"
                                      color="success.main"
                                      fontWeight="bold"
                                    >
                                      ↓{discount}% off
                                    </Typography>
                                  )}
                                </Box>

                                {/* DISTANCE */}
                                {locationFilter?.type === 'current' && (
                                  <Box sx={{ textAlign: 'center' }}>
                                    {offer.distance !== null &&
                                      offer.distance !== undefined &&
                                      !isNaN(offer.distance) ? (
                                      <Typography
                                        variant="body2"
                                        color="text.secondary"
                                      >
                                        {formatDistance(offer.distance)}
                                      </Typography>
                                    ) : (
                                      <Typography
                                        variant="body2"
                                        color="text.disabled"
                                      >
                                        -
                                      </Typography>
                                    )}
                                  </Box>
                                )}

                                {/* MRP */}
                                <Typography
                                  variant="body2"
                                  sx={{
                                    textDecoration: 'line-through',
                                    color: 'text.secondary',
                                  }}
                                >
                                  ₹{variant.mrpPrice?.toLocaleString() || 'N/A'}
                                </Typography>

                                {/* SELLING PRICE */}
                                <Typography
                                  variant="body1"
                                  fontWeight="bold"
                                  color="primary"
                                >
                                  ₹{variant.sellingPrice?.toLocaleString() || 'N/A'}
                                </Typography>

                                {/* SELECT BUTTON */}
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
                      <Box
                        sx={{
                          p: 2,
                          mb: 2,
                          bgcolor: 'primary.50',
                          borderRadius: 1,
                          border: '1px dashed',
                          borderColor: 'primary.main',
                        }}
                      >
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mb: 0.5 }}
                        >
                          Price for selected variant:
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'baseline',
                            gap: 2,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Typography
                            variant="h5"
                            fontWeight="bold"
                            color="primary.main"
                          >
                            ₹{currentVariant.sellingPrice?.toLocaleString()}
                          </Typography>
                          {currentVariant.mrpPrice &&
                            currentVariant.mrpPrice >
                            (currentVariant.sellingPrice || 0) && (
                              <>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    textDecoration: 'line-through',
                                    color: 'text.secondary',
                                  }}
                                >
                                  ₹{currentVariant.mrpPrice.toLocaleString()}
                                </Typography>
                                <Chip
                                  label={`${calculateDiscount(currentVariant.mrpPrice, currentVariant.sellingPrice)}% OFF`}
                                  size="small"
                                  color="success"
                                  sx={{ fontWeight: 'bold' }}
                                />
                              </>
                            )}
                        </Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          Inclusive of all taxes. Free Shipping above ₹1500.
                        </Typography>
                      </Box>
                    )}

                    {/* QUANTITY */}
                    <Box sx={{ mt: 2, mb: 3 }}>
                      <Typography fontWeight="bold" gutterBottom>
                        Quantity:
                      </Typography>
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
                      >
                        <Button
                          disabled={quantity <= 1}
                          onClick={() => setQuantity((q) => q - 1)}
                          variant="outlined"
                          size="small"
                        >
                          <RemoveIcon />
                        </Button>
                        <span className="px-4 text-lg font-semibold">
                          {quantity}
                        </span>
                        <Button
                          disabled={
                            currentVariant.stock !== undefined &&
                            quantity >= currentVariant.stock
                          }
                          onClick={() => setQuantity((q) => q + 1)}
                          variant="outlined"
                          size="small"
                        >
                          <AddIcon />
                        </Button>
                      </Box>
                    </Box>

                    {/* ADD TO CART */}
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      disabled={
                        currentVariant.stock === 0 ||
                        (sellerOffers.length > 0 && !selectedSellerOffer)
                      }
                      onClick={handleAddCart}
                      startIcon={<AddShoppingCartIcon />}
                      sx={{
                        py: 1.5,
                        fontSize: '1.1rem',
                        bgcolor: 'orange.600',
                        '&:hover': { bgcolor: 'orange.700' },
                      }}
                    >
                      {currentVariant.stock === 0
                        ? 'Out of Stock'
                        : sellerOffers.length > 0 && !selectedSellerOffer
                          ? 'Select a Seller'
                          : 'Add to Cart'}
                    </Button>
                  </Paper>
                )}
              </Box>
            )}

            {/* TRUST BADGES */}
            <div className="mt-7 space-y-3">
              <div className="flex items-center gap-4">
                <ShieldIcon sx={{ color: teal[400] }} />
                <Typography>Authentic & Quality Assured</Typography>
              </div>
              <div className="flex items-center gap-4">
                <WorkspacePremiumIcon sx={{ color: teal[400] }} />
                <Typography>100% money back guarantee</Typography>
              </div>
              <div className="flex items-center gap-4">
                <LocalShippingIcon sx={{ color: teal[400] }} />
                <Typography>Free Shipping & Returns</Typography>
              </div>
              <div className="flex items-center gap-4">
                <Wallet sx={{ color: teal[400] }} />
                <Typography>Pay on delivery might be available</Typography>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="mt-5">
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Description
              </Typography>
              <Typography>{product.description}</Typography>
            </div>

            {renderProductHighlights()}
            {renderSellerOffers()}

            {/* REVIEWS SECTION */}
            <div className="ratings w-full mt-10">
              <Typography variant="h6" fontWeight="bold" className="pb-4">
                Review & Ratings
              </Typography>
              <div className="space-y-5">
                {(review.reviews || [])
                  .slice()
                  .sort(
                    (a: any, b: any) =>
                      new Date(b.createdAt).getTime() -
                      new Date(a.createdAt).getTime()
                  )
                  .slice(0, 2)
                  .map((item: any, index: number) => (
                    <div key={index} className="space-y-5">
                      <ProductReviewCard item={item} />
                      <Divider />
                    </div>
                  ))}
                {review.reviews?.length > 0 && (
                  <Button onClick={() => navigate(`/reviews/${productId}`)}>
                    View All {review.reviews?.length || 0} Reviews
                  </Button>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      <section className="mt-20">
        <Typography variant="h6" fontWeight="bold">
          Similar Products
        </Typography>
        <div className="pt-5">
          <SmilarProduct />
        </div>
      </section>

      {/* SELLER REVIEW DRAWER */}
      <Drawer
        anchor="right"
        open={openSellerDrawer}
        onClose={() => setOpenSellerDrawer(false)}
      >
        <Box sx={{ width: 580, p: 3, bgcolor: '#f8f8f8', height: '100%' }}>

          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography fontWeight="bold" fontSize={20}>
              Ratings and reviews
            </Typography>
            <IconButton onClick={() => setOpenSellerDrawer(false)}>
              <CloseIcon />
            </IconButton>
          </Box>

          {(() => {
            const avg =
              selectedSellerReviews.length
                ? selectedSellerReviews.reduce(
                  (sum, r) => sum + r.rating,
                  0
                ) / selectedSellerReviews.length
                : 0;

            let text = 'Poor';
            if (avg >= 4) text = 'Very Good';
            else if (avg >= 3) text = 'Good';
            else if (avg >= 2) text = 'Average';

            return (
              <>
                <Box display="flex" alignItems="center" gap={1} mt={2}>
                  <Typography
                    fontSize={28}
                    fontWeight="700"
                    lineHeight={1}
                    display="flex"
                    alignItems="center"
                    gap={0.5}
                  >
                    {avg.toFixed(1)}
                    <StarIcon sx={{ color: '#0a8f08', fontSize: 28 }} />
                  </Typography>
                  <Chip
                    label={text}
                    sx={{
                      bgcolor: '#dff5ec',
                      color: 'green',
                      fontWeight: 'bold',
                    }}
                  />
                </Box>
                <Typography color="#777" fontSize={14} mt={1}>
                  based on {selectedSellerReviews.length} ratings by verified
                  buyers
                </Typography>
              </>
            );
          })()}

          <Box
            display="grid"
            gridTemplateColumns="2fr 1fr 1fr"
            gap={1}
            mt={3}
          >
            {selectedSellerReviews
              .flatMap((r) => r.images || [])
              .slice(0, 5)
              .map((img, i) => (
                <img
                  key={i}
                  src={img}
                  style={{
                    width: '100%',
                    height: i === 0 ? 220 : 105,
                    objectFit: 'cover',
                    borderRadius: 12,
                  }}
                />
              ))}
          </Box>

          <Typography mt={4} mb={2} fontWeight="500" fontSize={16}>
            Features customers loved
          </Typography>

          <Box
            ref={reviewScrollRef}
            sx={{
              display: 'flex',
              overflowX: 'auto',
              gap: 2,
              pb: 2,
              scrollBehavior: 'smooth',
              position: 'relative',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            {[...selectedSellerReviews].reverse().map((rev: any, i: number) => (
              <Card
                key={i}
                sx={{
                  minWidth: 350,
                  maxWidth: 350,
                  borderRadius: '16px',
                  bgcolor: '#f5f5f5',
                  border: '1px solid #eee',
                  boxShadow: 'none',
                  position: 'relative',
                  flexShrink: 0,
                  overflow: 'visible',
                }}
              >
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={`${rev.rating} ★`}
                        size="small"
                        sx={{
                          bgcolor: '#0a8f08',
                          color: 'white',
                          fontWeight: 'bold',
                          height: 24,
                        }}
                      />
                      <Typography fontWeight="700" fontSize={16}>
                        {rev.rating >= 5
                          ? 'Awesome'
                          : rev.rating >= 4
                            ? 'Very Good'
                            : rev.rating >= 3
                              ? 'Good'
                              : 'Poor'}
                      </Typography>
                    </Box>
                    <Typography fontSize={13} color="#777">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Typography mt={2} fontSize={16}>
                    {rev.reviewText}
                  </Typography>

                  <Box mt={6}>
                    <Typography fontWeight="500" fontSize={15}>
                      {rev.user?.fullName}
                    </Typography>
                    <Typography fontSize={14} color="#777">
                      Verified Buyer
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>

          {showLeftBtn && (
            <IconButton
              onClick={() => scrollReviews('left')}
              sx={{
                position: 'absolute',
                left: 15,
                top: '70%',
                transform: 'translateY(-50%)',
                width: 52,
                height: 52,
                bgcolor: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,.15)',
                zIndex: 20,
                '&:hover': { bgcolor: '#fff' },
              }}
            >
              ‹
            </IconButton>
          )}
          {showRightBtn && (
            <IconButton
              onClick={() => scrollReviews('right')}
              sx={{
                position: 'absolute',
                right: 15,
                top: '70%',
                transform: 'translateY(-50%)',
                width: 52,
                height: 52,
                bgcolor: '#fff',
                boxShadow: '0 2px 8px rgba(0,0,0,.15)',
                zIndex: 20,
                '&:hover': { bgcolor: '#fff' },
              }}
            >
              ›
            </IconButton>
          )}
        </Box>
      </Drawer>

      {/* SNACKBAR */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default ProductDetails;