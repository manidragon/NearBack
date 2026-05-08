// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Wishlist\WishlistProductCard.tsx

import { teal } from "@mui/material/colors";
import type { Product } from "../../../types/productTypes";
import { useAppDispatch } from "../../../Redux Toolkit/Store";
import CloseIcon from "@mui/icons-material/Close";
import { Button, IconButton } from "@mui/material";
import { addProductToWishlist } from "../../../Redux Toolkit/Customer/WishlistSlice";

interface ProductCardProps {
  item: Product;
}

const WishlistProductCard: React.FC<ProductCardProps> = ({ item }) => {
  const dispatch = useAppDispatch();

const handleRemoveClick = () => {
  if (item._id) {
    // ✅ Same endpoint toggles: if exists → remove, if not → add
    dispatch(addProductToWishlist({ productId: item._id }));
  }
};

  // ✅ Get price from first variant's offer or use minPrice
  const sellingPrice = item.variants?.[0]?.offers?.[0]?.sellingPrice || item.minPrice;
  const mrpPrice = item.variants?.[0]?.offers?.[0]?.mrpPrice || item.mrpPrice;
  
  // ✅ Calculate discount
  const discountPercent = sellingPrice && mrpPrice 
    ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100)
    : 0;

  return (
    <div className="w-60 relative group">
      <div className="w-full">
        <img
          className="object-top w-full h-48 object-cover rounded-md"
          src={item.images?.[0] || item.variants?.[0]?.images?.[0] || "https://via.placeholder.com/300"}
          alt={`product-${item.title}`}
          onError={(e) => {
            (e.target as HTMLImageElement).src = "https://via.placeholder.com/300?text=Image+Error";
          }}
        />
      </div>
      <div className="pt-3 space-y-1 rounded-md">
        <div className="space-y">
          <p className="font-medium truncate">{item.title}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* ✅ Use calculated sellingPrice */}
          <span className="font-semibold text-gray-800">
            ₹{sellingPrice || 'N/A'}
          </span>
          
          {/* ✅ Show MRP if available */}
          {mrpPrice && (
            <span className="text thin-line-through text-gray-400">
              ₹{mrpPrice}
            </span>
          )}
          
          {/* ✅ Show discount if applicable */}
          {discountPercent > 0 && (
            <span className="text-[#00927c] font-semibold text-sm">
              {discountPercent}% off
            </span>
          )}
        </div>
      </div>

      {/* Remove button */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <IconButton 
          onClick={handleRemoveClick}
          size="small"
          sx={{ 
            bgcolor: 'white', 
            '&:hover': { bgcolor: '#ffebee' },
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <CloseIcon sx={{ color: teal[500], fontSize: "1.2rem" }} />
        </IconButton>
      </div>
    </div>
  );
};

export default WishlistProductCard;