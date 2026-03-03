// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Products\ProductCard\ProductCard.tsx
import "./ProductCard.css";
import React, { useState, useEffect, useMemo } from "react";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { teal } from "@mui/material/colors";
import { Box, Button, Modal } from "@mui/material";
import { useNavigate } from "react-router-dom";
import type { Product } from "../../../../types/productTypes";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../../Redux Toolkit/Store";
import { addProductToWishlist } from "../../../../Redux Toolkit/Customer/WishlistSlice";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { isWishlisted } from "../../../../util/isWishlisted";
import ModeCommentIcon from "@mui/icons-material/ModeComment";
import ChatBot from "../../ChatBot/ChatBot";

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

// ✅ Placeholder image constant
const PLACEHOLDER_IMAGE = "https://via.placeholder.com/300x300?text=No+Image";
const ERROR_IMAGE = "https://via.placeholder.com/300x300?text=Image+Error";

const ProductCard: React.FC<ProductCardProps> = ({ item, categoryId }) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const wishlist = useAppSelector((state) => state.wishlist);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showChatBot, setShowChatBot] = useState(false);

  // ✅✅✅ SAFE: Get images with fallback logic
  const productImages = useMemo(() => {
    // Priority 1: Product-level images array
    if (item.images && Array.isArray(item.images) && item.images.length > 0) {
      return item.images;
    }
    // Priority 2: First variant's images
    if (item.variants && Array.isArray(item.variants) && item.variants.length > 0) {
      const firstVariantImages = item.variants[0]?.images;
      if (firstVariantImages && Array.isArray(firstVariantImages) && firstVariantImages.length > 0) {
        return firstVariantImages;
      }
    }
    // Fallback: Empty array (will show placeholder)
    return [];
  }, [item.images, item.variants]);

  const handleAddWishlist = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (item._id) dispatch(addProductToWishlist({ productId: item._id }));
  };

  // ✅✅✅ FIXED: Safe useEffect with productImages dependency
  useEffect(() => {
    let interval: any;
    // Only start interval if we have multiple images to cycle through
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

  // ✅ Handle image load error
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    (e.target as HTMLImageElement).src = ERROR_IMAGE;
  };

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
          {/* ✅✅✅ SAFE: Render images with placeholder fallback */}
          {productImages.length > 0 ? (
            productImages.map((image: string, index: number) => (
              <img
                key={`${image}-${index}`}  // ✅ Unique key using image URL + index
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
            // ✅ Show placeholder if no images available
            <img
              key="placeholder"
              className="card-media object-top"
              src={PLACEHOLDER_IMAGE}
              alt="No image available"
              style={{
                transform: 'translateX(0)',
              }}
            />
          )}

          {isHovered && productImages.length > 0 && (
            <div className="indicator flex flex-col items-center space-y-2">
              {/* ✅ Image indicator dots */}
              <div className="flex gap-4">
                {productImages.map((_, index: number) => (
                  <button
                    key={index}
                    className={`indicator-button ${index === currentImage ? "active" : ""
                      }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImage(index);
                    }}
                    aria-label={`Go to image ${index + 1}`}
                  />
                ))}
              </div>

              {/* ✅ Action buttons */}
              <div className="flex gap-3">
                {/* Wishlist button - safe check for wishlist array */}
                {wishlist.wishlist && Array.isArray(wishlist.wishlist) && (
                  <Button
                    variant="contained"
                    color="secondary"
                    sx={{ zIndex: 10 }}
                    className="z-50"
                    onClick={handleAddWishlist}
                    aria-label={isWishlisted(wishlist.wishlist, item) ? "Remove from wishlist" : "Add to wishlist"}
                  >
                    {isWishlisted(wishlist.wishlist, item) ? (
                      <FavoriteIcon sx={{ color: teal[500] }} />
                    ) : (
                      <FavoriteBorderIcon sx={{ color: "gray" }} />
                    )}
                  </Button>
                )}

                {/* ChatBot button */}
                <Button
                  onClick={handleShowChatBot}
                  color="secondary"
                  variant="contained"
                  aria-label="Open chat"
                >
                  <ModeCommentIcon sx={{ color: teal[500] }} />
                </Button>
              </div>
            </div>
          )}
        </div>


<div className="details pt-3 space-y-1 group-hover-effect rounded-md">
  <div className="name space-y">
    {/* ✅✅✅ FIXED: Display business name with proper fallback chain */}
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
    {/* ✅✅✅ FIXED: Display correct price with variant fallback */}
    <span className="font-semibold text-gray-800">
      ₹{
        // Priority 1: First variant's selling price
        item.variants?.[0]?.sellingPrice ??
        // Priority 2: Product-level minPrice (aggregated field)
        item.minPrice ??
        // Priority 3: Legacy product-level sellingPrice
        item.sellingPrice ??
        // Fallback
        'N/A'
      }
    </span>
    
    {/* ✅ Display MRP if available */}
    {(item.variants?.[0]?.mrpPrice || item.mrpPrice) && (
      <span className="text thin-line-through text-gray-400">
        ₹{item.variants?.[0]?.mrpPrice || item.mrpPrice}
      </span>
    )}
    
    {/* ✅ Calculate and display discount percentage */}
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
</div>
      </div>

      {/* ✅ ChatBot Modal */}
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