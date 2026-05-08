// src/customer/pages/Cart/CartItemCard.tsx

import { Button, Divider, IconButton } from '@mui/material';
import React from 'react';
import RemoveIcon from '@mui/icons-material/Remove';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import type { CartItem } from '../../../types/cartTypes';
import { useAppDispatch } from '../../../Redux Toolkit/Store';
import { deleteCartItem, updateCartItem } from '../../../Redux Toolkit/Customer/CartSlice';

interface CartItemProps {
  item: CartItem;
}

// ✅ Helper: Safely get first image from product/variant
const getProductImage = (item: CartItem): string => {
  // Strategy 1: Check variant-level images (most specific)
  if (item.product?.variants && item.variantId) {
    const variant = item.product.variants.find((v: any) => 
      v._id?.toString() === item.variantId?.toString()
    );
    if (variant?.images?.[0]) {
      return variant.images[0];
    }
  }
  
  // Strategy 2: Check product-level images
  if (item.product?.images?.[0]) {
    return item.product.images[0];
  }
  
  // Strategy 3: Check first variant's images as fallback
  if (item.product?.variants?.[0]?.images?.[0]) {
    return item.product.variants[0].images[0];
  }
  
  // Strategy 4: Return placeholder
  return 'image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="90" height="90"%3E%3Crect width="90" height="90" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
};

// ✅ Helper: Get seller name with proper fallback chain
const getSellerName = (item: CartItem): string => {
  // Strategy 1: Find the specific offer's seller (most accurate for multi-seller)
  if (item.product?.variants && item.variantId && item.sellerId) {
    const variant = item.product.variants.find((v: any) => 
      String(v._id) === String(item.variantId)
    );
    
    if (variant?.offers) {
      const offer = variant.offers.find((o: any) => {
        const offerSellerId = typeof o.seller === 'string' 
          ? o.seller 
          : String((o.seller as any)?._id);
        return offerSellerId === item.sellerId;
      });
      
      // ✅ If offer is populated, use its seller
      if (offer?.seller && typeof offer.seller === 'object') {
        const sellerObj = offer.seller as any;
        if (sellerObj.businessDetails?.businessName) {
          return sellerObj.businessDetails.businessName;  // ✅ "test businessname"
        }
        if (sellerObj.sellerName) {
          return sellerObj.sellerName;  // ✅ "test seller name"
        }
      }
    }
  }
  
  // Strategy 2: Fallback to product-level seller
  if (item.product?.seller) {
    if (typeof item.product.seller === 'object') {
      const sellerObj = item.product.seller as any;
      if (sellerObj.businessDetails?.businessName) {
        return sellerObj.businessDetails.businessName;
      }
      if (sellerObj.sellerName) {
        return sellerObj.sellerName;
      }
    }
  }
  
  // Strategy 3: Fallback to sellerBusinessName
  if ((item.product as any)?.sellerBusinessName) {
    return (item.product as any).sellerBusinessName;
  }
  
  return 'Seller';
};


const getVariantSpecs = (item: CartItem): { label: string; value: string }[] => {
  const specs: { label: string; value: string }[] = [];
  
  // Strategy 1: From variant specifications (Dynamic based on Category Attributes)
  if (item.product?.variants && item.variantId) {
    const variant = item.product.variants.find((v: any) => 
      String(v._id) === String(item.variantId)
    );
    
    if (variant?.specifications) {
      // ✅ Iterate through ALL keys in specifications object
      Object.entries(variant.specifications).forEach(([key, value]) => {
        // Skip empty/null values
        if (value === null || value === undefined || value === '') return;
        
        // ✅ Convert value to string safely (handles string/number/boolean)
        const stringValue = String(value).trim();
        if (!stringValue) return;
        
        // ✅ Format Label: Capitalize and replace underscores/camelCase
        // Example: "processor_brand" -> "Processor Brand", "ram" -> "Ram"
        const formattedLabel = key
          .replace(/_/g, ' ')       // Replace underscores with spaces
          .replace(/([A-Z])/g, ' $1') // Split camelCase
          .trim()
          .replace(/^\w/, c => c.toUpperCase()); // Capitalize first letter
        
        specs.push({
          label: formattedLabel,
          value: stringValue
        });
      });
      
      // If we found dynamic specs, return them
      if (specs.length > 0) {
        return specs;
      }
    }
    
    // Fallback: Show Color if no other specs found
    if (variant?.color) {
      return [{ label: 'Color', value: variant.color }];
    }
  }
  
  // Strategy 2: From item.size (e.g., "4 GB+128 GB")
  if (item.size && item.size !== 'Default') {
    if (item.size.includes('+')) {
      return item.size.split('+').map(part => {
        const trimmed = part.trim();
        return { label: 'Spec', value: trimmed };
      });
    }
    return [{ label: 'Variant', value: item.size }];
  }
  
  return [];
};

const CartItemCard: React.FC<CartItemProps> = ({ item }) => {
  const dispatch = useAppDispatch();
  
  // ✅ Safe price calculations with fallbacks
  const sellingPrice = item.sellingPrice || 0;
  const mrpPrice = item.mrpPrice || 0;
  const quantity = item.quantity || 1;
  
  const handleUpdateQuantity = (newQuantity: number) => {
    if (!newQuantity || newQuantity < 1) return;
    
    const qty = Number(newQuantity);
    if (isNaN(qty)) return;
    
    dispatch(updateCartItem({
      jwt: localStorage.getItem("jwt") || "",
      cartItemId: item._id,
      cartItem: { quantity: qty }
    }));
  };

  const handleRemoveCartItem = () => {
    dispatch(deleteCartItem({
      jwt: localStorage.getItem("jwt") || "", 
      cartItemId: item._id
    }));
  };

  // ✅ Get data safely
  const imageUrl = getProductImage(item);
  const sellerName = getSellerName(item);
  const productTitle = item.product?.title || 'Product title';
  const variantSpecs = getVariantSpecs(item);
  
  // ✅ Get stock from variant's offer
  const getStock = (): number | null => {
    if (item.product?.variants && item.variantId && item.sellerId) {
      const variant = item.product.variants.find((v: any) => 
        v._id?.toString() === item.variantId?.toString()
      );
      
      if (variant?.offers) {
        const offer = variant.offers.find((o: any) => {
          const offerSellerId = typeof o.seller === 'string' 
            ? o.seller 
            : o.seller?._id?.toString();
          return offerSellerId === item.sellerId;
        });
        
        if (offer?.stock !== undefined) {
          return offer.stock;
        }
      }
    }
    return null;
  };
  
  const stock = getStock();

  return (
    <div className='border rounded-md relative hover:shadow-md transition-shadow'>
      <div className='p-5 flex gap-4'>
        {/* Product Image */}
        <div className='flex-shrink-0'>
          <img 
            className='w-[100px] h-[100px] rounded-md object-cover border border-gray-200' 
            src={imageUrl}
            alt={productTitle}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
            }}
          />
        </div>
        
        {/* Product Details */}
        <div className='flex-1 space-y-2'>
          {/* ✅ Seller Name - Bold & Prominent */}
          <h1 className='font-bold text-lg text-gray-800'>
            {sellerName}
          </h1>
          
          {/* ✅ Product Title */}
          <p className='text-gray-700 font-medium text-base'>
            {productTitle}
          </p>
          
          {/* ✅ Variant Specifications (RAM + Storage) */}
         {variantSpecs.length > 0 && (
  <p className='text-sm text-gray-600'>
    <span className='font-medium'>Variant:</span>{' '}
    {variantSpecs.map((spec, index) => (
      <React.Fragment key={spec.label}>
        {/* Add a bullet point separator between items */}
        {index > 0 && ' • '}
        {/* Display the dynamic value (e.g., "4 GB", "Black", "Cotton") */}
        {spec.value}
      </React.Fragment>
    ))}
  </p>
)}
          
          {/* ✅ Sold By */}
          <p className='text-sm text-gray-500'>
            <span className='font-medium'>Sold by:</span> {sellerName}
          </p>
          
          {/* ✅ Replacement Policy */}
          <p className='text-sm text-green-600 font-medium'>
            ✓ 7 days replacement available
          </p>
          
          {/* ✅ MRP */}
          <p className='text-sm text-gray-600'>
            <span className='font-medium'>MRP:</span> ₹{mrpPrice.toFixed(0)}
          </p>
          
          {/* ✅ Savings */}
          <p className='text-sm text-gray-600'>
            <span className='font-medium'>You Save:</span> ₹{(mrpPrice - sellingPrice).toFixed(0)} 
            <span className='text-green-600 ml-1'>
              ({mrpPrice > 0 ? Math.round(((mrpPrice - sellingPrice) / mrpPrice) * 100) : 0}% off)
            </span>
          </p>
          
          {/* ✅ Stock Info */}
          {stock !== null && (
            <p className='text-xs text-gray-500'>
              <span className='font-medium'>Stock:</span> {stock} available
            </p>
          )}
        </div>
      </div>
      
      <Divider />
      
      {/* Quantity & Price Section */}
      <div className='px-5 py-4 flex justify-between items-center bg-gray-50'>
        {/* Quantity Controls */}
        <div className='flex items-center gap-3 border border-gray-300 rounded-md px-2 py-1 bg-white'>
          <Button 
            size='small' 
            disabled={quantity <= 1} 
            onClick={() => handleUpdateQuantity(quantity - 1)}
            variant='text'
            sx={{ 
              minWidth: '28px', 
              padding: '4px',
              color: quantity <= 1 ? 'gray.400' : 'primary.main',
              '&:disabled': { cursor: 'not-allowed' }
            }}
          >
            <RemoveIcon fontSize='small' />
          </Button>
          <span className='px-4 font-semibold text-lg min-w-[40px] text-center'>
            {quantity}
          </span>
          <Button 
            size='small' 
            onClick={() => handleUpdateQuantity(quantity + 1)}
            variant='text'
            sx={{ 
              minWidth: '28px', 
              padding: '4px',
              color: 'primary.main'
            }}
          >
            <AddIcon fontSize='small' />
          </Button>
        </div>
        
        {/* Price Display */}
        <div className='text-right'>
          <p className='text-gray-900 font-bold text-xl'>
            ₹{sellingPrice.toFixed(0)}
          </p>
          {mrpPrice > sellingPrice && (
            <p className='text-gray-400 text-sm line-through'>
              ₹{mrpPrice.toFixed(0)}
            </p>
          )}
        </div>
      </div>
      
      {/* Remove Button */}
      <div className='absolute top-3 right-3'>
        <IconButton 
          onClick={handleRemoveCartItem} 
          color='error' 
          size='small'
          sx={{ 
            bgcolor: 'rgba(255,255,255,0.95)', 
            '&:hover': { bgcolor: 'white', boxShadow: 1 },
            border: '1px solid #e0e0e0'
          }}
        >
          <CloseIcon fontSize='small' />
        </IconButton>
      </div>
    </div>
  );
};

export default CartItemCard;