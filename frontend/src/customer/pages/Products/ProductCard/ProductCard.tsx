// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Products/ProductCard/ProductCard.tsx
import "./ProductCard.css";
import React, { useState, useEffect, useMemo } from "react";
import FavoriteIcon from "@mui/icons-material/Favorite";
import LocationOnIcon from "@mui/icons-material/LocationOn"; // ✅ ADD: For distance badge
import { teal } from "@mui/material/colors";
import { Box, Button, Modal, IconButton, Typography } from "@mui/material"; // ✅ ADD: Typography
import { useNavigate } from "react-router-dom";
import type { Product } from "../../../../types/productTypes";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../../Redux Toolkit/Store";
import { addProductToWishlist, removeProductFromWishlist } from "../../../../Redux Toolkit/Customer/WishlistSlice";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { isWishlisted } from "../../../../util/isWishlisted";
import ModeCommentIcon from "@mui/icons-material/ModeComment";
import ChatBot from "../../ChatBot/ChatBot";
// ✅ ADD: Import location filter selector
import { selectLocationFilter } from "../../../../Redux Toolkit/Customer/ProductSlice";

interface ProductCardProps {
  item: Product;
  categoryId?: string;
}

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "auto",
  borderRadius: ".5rem",
  boxShadow: 24,
};

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/300x300?text=No+Image";
const ERROR_IMAGE = "https://via.placeholder.com/300x300?text=Image+Error";

const ProductCard: React.FC<ProductCardProps> = ({ item, categoryId }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const wishlist = useAppSelector((state) => state.wishlist);
  // ✅ ADD: Get location filter from Redux
  const locationFilter = useAppSelector(selectLocationFilter);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showChatBot, setShowChatBot] = useState(false);

  const productImages = useMemo(() => {
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      return item.images;
    }
    if (item.variants && Array.isArray(item.variants) && item.variants.length > 0) {
      const firstVariantImages = item.variants[0]?.images;
      if (firstVariantImages && Array.isArray(firstVariantImages) && firstVariantImages.length > 0) {
        return firstVariantImages;
      }
    }
    return [];
  }, [item.images, item.variants]);

  // ✅ Check if product is in wishlist
  const isInWishlist = useMemo(() => {
    if (!item._id || !wishlist.wishlist || !Array.isArray(wishlist.wishlist)) {
      return false;
    }
    return isWishlisted(wishlist.wishlist, item);
  }, [item._id, item, wishlist.wishlist]);

  const handleAddWishlist = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    
    if (!item._id) {
      console.error('❌ Cannot add to wishlist: Product ID is missing');
      return;
    }
    
    console.log('🔍 [Wishlist] Adding product:', {
      productId: item._id,
      productTitle: item.title
    });
    
    dispatch(addProductToWishlist({ productId: item._id }));
  };

  // ✅ NEW: Handle remove from wishlist
  const handleRemoveWishlist = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    
    if (!item._id) {
      console.error('❌ Cannot remove from wishlist: Product ID is missing');
      return;
    }
    
    console.log('🔍 [Wishlist] Removing product:', {
      productId: item._id,
      productTitle: item.title
    });
    
    dispatch(removeProductFromWishlist({ productId: item._id }));
  };

  useEffect(() => {
    let interval: any;
    if (isHovered && productImages.length > 1) {
      interval = setInterval(() => {
        setCurrentImage((prevImage) => (prevImage + 1) % productImages.length);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHovered, productImages.length]);

  const handleShowChatBot = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setShowChatBot(true);
  };

  const handleCloseChatBot = (e: MouseEvent) => {
    e.stopPropagation();
    setShowChatBot(false);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).src = ERROR_IMAGE;
  };

  // ✅ NEW: Format distance for display
  const formatDistance = (distance?: number): string | null => {
    if (distance === undefined || distance === null || isNaN(distance)) {
      return null;
    }
    
    // Distance is already in km from backend (due to distanceMultiplier: 0.001)
    if (distance < 1) {
      return '<1 km';
    }
    return `${distance.toFixed(1)} km`;
  };

  // ✅ NEW: Check if we should show distance badge
  const shouldShowDistance = useMemo(() => {
    // Show distance when:
    // 1. Location filter is active AND type is 'current' (coordinates-based)
    // 2. Product has a distance value from backend
    return (
      locationFilter?.type === 'current' && 
      typeof item.distance === 'number' && 
      !isNaN(item.distance)
    );
  }, [locationFilter, item.distance]);

  return (
    <>
      <div
        onClick={() =>
          navigate(
            `/product-details/${categoryId}/${item.title}/${item._id}`
          )
        }
        className="group px-4 relative cursor-pointer"
      >
        <div
          className="card"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* ✅ Wishlist Button - Always Visible (Top Right Corner) */}
          <IconButton
            onClick={isInWishlist ? handleRemoveWishlist : handleAddWishlist}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              zIndex: 10,
              bgcolor: 'white',
              width: 36,
              height: 36,
              '&:hover': { 
                bgcolor: 'white',
                transform: 'scale(1.1)'
              },
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            size="small"
            aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          >
            {isInWishlist ? (
              <FavoriteIcon sx={{ color: 'error.main', fontSize: 20 }} />
            ) : (
              <FavoriteBorderIcon sx={{ color: 'gray', fontSize: 20 }} />
            )}
          </IconButton>

          {/* ✅ NEW: Distance Badge - Top Left Corner (when location search active) */}
          {shouldShowDistance && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                zIndex: 10,
                bgcolor: 'rgba(0, 146, 124, 0.9)', // Primary color with opacity
                color: 'white',
                px: 1,
                py: 0.5,
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                fontSize: '0.75rem',
                fontWeight: 500,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <LocationOnIcon sx={{ fontSize: 14 }} />
              <Typography component="span" sx={{ fontSize: 'inherit' }}>
                {formatDistance(item.distance)}
              </Typography>
            </Box>
          )}

          {productImages.length > 0 ? (
            productImages.map((image: string, index: number) => (
              <img
                key={`${image}-${index}`}
                className="card-media object-top"
                src={image}
                alt={`${item.title} - ${index + 1}`}
                style={{
                  transform: `translateX(${(index - currentImage) * 100}%)`,
                  transition: 'transform 0.3s ease-in-out',
                }}
                onError={handleImageError}
                loading="lazy"
              />
            ))
          ) : (
            <img
              key="placeholder"
              className="card-media object-top"
              src={PLACEHOLDER_IMAGE}
              alt="No image available"
              style={{ transform: 'translateX(0)' }}
            />
          )}

          {isHovered && productImages.length > 0 && (
            <div className="indicator flex flex-col items-center space-y-2">
              <div className="flex gap-4">
                {productImages.map((_, index: number) => (
                  <button
                    key={index}
                    className={`indicator-button ${index === currentImage ? "active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImage(index);
                    }}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>

              <div className="flex gap-3">
                {/* ChatBot button - Keep this on hover */}
                <Button
                  onClick={handleShowChatBot}
                  color="secondary"
                  variant="contained"
                  aria-label="Open chat"
                  sx={{ minWidth: 'auto', padding: '8px' }}
                >
                  <ModeCommentIcon sx={{ color: teal[500] }} />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="details pt-3 space-y-1 group-hover-effect rounded-md">
          <div className="name space-y">
            <h1 className="font-semibold text-lg truncate" title={
              item.seller?.businessDetails?.businessName || 
              item.seller?.sellerName || 
              'Seller'
            }>
              {item.seller?.businessDetails?.businessName || 
               item.seller?.sellerName || 
               'Seller'}
            </h1>
            <p className="truncate" title={item.title}>
              {item.title}
            </p>
          </div>
          
          <div className="price flex items-center gap-3">
            <span className="font-semibold text-gray-800">
              ₹{
                item.variants?.[0]?.sellingPrice ??
                item.minPrice ??
                item.sellingPrice ??
                'N/A'
              }
            </span>
            
            {(item.variants?.[0]?.mrpPrice || item.mrpPrice) && (
              <span className="text thin-line-through text-gray-400">
                ₹{item.variants?.[0]?.mrpPrice || item.mrpPrice}
              </span>
            )}
            
            {(() => {
              const sellingPrice = item.variants?.[0]?.sellingPrice || item.minPrice || item.sellingPrice;
              const mrpPrice = item.variants?.[0]?.mrpPrice || item.mrpPrice;
              
              if (sellingPrice && mrpPrice && mrpPrice > sellingPrice) {
                const discount = Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100);
                return (
                  <span className="text-[#00927c] font-semibold">
                    {discount}% off
                  </span>
                );
              }
              return null;
            })()}
          </div>

          {/* ✅ NEW: Distance text below price (when district filter active) */}
          {locationFilter?.type === 'district' && item.seller?.district && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
              <LocationOnIcon sx={{ fontSize: 14 }} />
              <span>{item.seller.district}</span>
            </div>
          )}
        </div>
      </div>

      {showChatBot && (
        <section className="absolute left-16 top-0 z-[1000]">
          <Modal
            open={true}
            onClose={handleCloseChatBot}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box sx={style}>
              <ChatBot handleClose={handleCloseChatBot} productId={item._id} />
            </Box>
          </Modal>
        </section>
      )}
    </>
  );
};

export default ProductCard;