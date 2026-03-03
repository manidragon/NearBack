// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Products\SimilarProduct\SimilarProductCard.tsx
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../../../types/productTypes';

interface SimilarProductCardProps {
  product: Product;
}

const SimilarProductCard = ({ product }: SimilarProductCardProps) => {
  const navigate = useNavigate();

  // ✅ Safe image getter with placeholder fallback
  const productImage = product.images && Array.isArray(product.images) && product.images.length > 0
    ? product.images[0]
    : (product.variants?.[0]?.images && Array.isArray(product.variants[0].images) && product.variants[0].images.length > 0
        ? product.variants[0].images[0]
        : 'https://via.placeholder.com/300x300?text=No+Image');

  // ✅ Safe price getter
  const sellingPrice = product.variants?.[0]?.sellingPrice || product.minPrice || product.sellingPrice || 0;
  const mrpPrice = product.variants?.[0]?.mrpPrice || product.mrpPrice;
  
  // ✅ Calculate discount safely
  const discountPercent = sellingPrice && mrpPrice && mrpPrice > sellingPrice
    ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100)
    : 0;

  // ✅ Safe seller name getter
  const sellerName = product.seller?.businessDetails?.businessName || 
                     product.seller?.sellerName || 
                     'Seller';

  // ✅ Safe category ID for navigation
  const categoryId = product.category || '';

  const handleClick = () => {
    if (product._id) {
      navigate(`/product-details/${categoryId}/${product.title || 'product'}/${product._id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className='group cursor-pointer'
    >
      <div className="relative h-[300px]">
        <img
          className="h-full w-full object-cover"
          src={productImage}
          alt={product.title || 'Product'}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x300?text=Image+Error';
          }}
          loading="lazy"
        />
      </div>
      
      <div className='details pt-3 space-y-1 group-hover-effect rounded-md'>
        <div className='name space-y'>
          <h1 className='font-semibold text-lg truncate' title={sellerName}>
            {sellerName}
          </h1>
          <p className='truncate' title={product.title}>
            {product.title || 'Untitled Product'}
          </p>
        </div>
        
        <div className='price flex items-center gap-3'>
          <span className='font-semibold text-gray-800'>
            ₹{sellingPrice.toLocaleString()}
          </span>
          
          {mrpPrice && mrpPrice > sellingPrice && (
            <span className='text thin-line-through text-gray-400'>
              ₹{mrpPrice.toLocaleString()}
            </span>
          )}
          
          {discountPercent > 0 && (
            <span className='text-[#00927c] font-semibold'>
              {discountPercent}% off
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimilarProductCard;