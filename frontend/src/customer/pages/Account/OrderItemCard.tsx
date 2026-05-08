// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Account\OrderItemCard.tsx

import React from 'react';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { Avatar, Box, Typography, Chip } from '@mui/material';
import { teal } from '@mui/material/colors';
import { useNavigate } from 'react-router-dom';
import type { Order, OrderItem } from '../../../types/orderTypes';
import { formatDate } from '../../util/fomateDate';
import dayjs from 'dayjs';

// ✅ Helper: Format date and time
const formatDateTime = (dateString: string) => {
  if (!dateString) return 'N/A';
  return dayjs(dateString).format('MMM D, YYYY h:mm A');
};

// ✅ Helper: Safely get product image (variants > root > placeholder)
const getProductImage = (item: OrderItem): string => {
  // Strategy 1: Check variant-level images using variantId
  if (item.product?.variants && item.variantId) {
    const variant = item.product.variants.find((v: any) => 
      String(v._id) === String(item.variantId)
    );
    if (variant?.images?.[0]) {
      return variant.images[0];
    }
  }
  
  // Strategy 2: Check product-level images
  if (item.product?.images?.[0]) {
    return item.product.images[0];
  }
  
  // Strategy 3: First variant fallback
  if (item.product?.variants?.[0]?.images?.[0]) {
    return item.product.variants[0].images[0];
  }
  
  // Strategy 4: Placeholder SVG
  return 'image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="70" height="70"%3E%3Crect width="70" height="70" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="8" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
};

// ✅ Helper: Get seller name with proper fallback chain
const getSellerName = (item: OrderItem, order: Order): string => {
  // Priority 1: Item's product seller (populated object)
  if (typeof item.product?.seller === 'object' && item.product.seller) {
    if (item.product.seller.businessDetails?.businessName) {
      return item.product.seller.businessDetails.businessName;
    }
    if (item.product.seller.sellerName) {
      return item.product.seller.sellerName;
    }
  }
  
  // Priority 2: Order's seller (populated object)
  if (typeof order?.seller === 'object' && order.seller) {
    if (order.seller.businessDetails?.businessName) {
      return order.seller.businessDetails.businessName;
    }
    if (order.seller.sellerName) {
      return order.seller.sellerName;
    }
  }
  
  return 'Seller';
};

const getVariantSpecs = (item: OrderItem): { label: string; value: string }[] => {
  const specs: { label: string; value: string }[] = [];
  const product = item?.product;
  
  if (!product) return [];
  
  // Strategy 1: Try variantId first (if available)
  if (product.variants && item.variantId) {
    const variant = product.variants.find((v: any) => 
      String(v._id) === String(item.variantId)
    );
    
    if (variant?.specifications) {
      Object.entries(variant.specifications).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') return;
        
        const stringValue = String(value).trim();
        if (!stringValue) return;
        
        const formattedLabel = key
          .replace(/_/g, ' ')
          .replace(/([A-Z])/g, ' $1')
          .trim()
          .replace(/^\w/, c => c.toUpperCase());
        
        specs.push({ label: formattedLabel, value: stringValue });
      });
      
      if (specs.length > 0) return specs;
    }
  }
  
  // ✅ Strategy 2: Match by COLOR (when variantId is missing)
  if (product.variants && item?.size) {
    const orderColor = item.size.trim();
    
    // Find variant with matching color
    const matchingVariant = product.variants.find((v: any) => 
      v.color?.toLowerCase() === orderColor.toLowerCase() && v.isActive !== false
    );
    
    if (matchingVariant?.specifications) {
      // Extract ALL specifications
      Object.entries(matchingVariant.specifications).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') return;
        
        const stringValue = String(value).trim();
        if (!stringValue) return;
        
        const formattedLabel = key
          .replace(/_/g, ' ')
          .replace(/([A-Z])/g, ' $1')
          .trim()
          .replace(/^\w/, c => c.toUpperCase());
        
        specs.push({ label: formattedLabel, value: stringValue });
      });
      
      // Add color if not already included
      if (matchingVariant.color && !specs.some(s => s.label.toLowerCase() === 'color')) {
        specs.push({ label: 'Color', value: matchingVariant.color });
      }
      
      if (specs.length > 0) return specs;
    }
    
    // Fallback: Just show color
    if (matchingVariant?.color) {
      return [{ label: 'Color', value: matchingVariant.color }];
    }
  }
  
  // Strategy 3: Parse size field
  if (item.size && item.size !== 'Default') {
    if (item.size.includes('+')) {
      return item.size.split('+').map((part, idx) => {
        const trimmed = part.trim();
        const match = trimmed.match(/^(\d+\s*[A-Za-z]+)\s*(.*)$/);
        if (match) {
          return { label: match[2] || `Spec ${idx + 1}`, value: match[1] };
        }
        return { label: `Spec ${idx + 1}`, value: trimmed };
      });
    }
    return [{ label: 'Variant', value: item.size }];
  }
  
  return [];
};

interface OrderItemCardProps {
  item: OrderItem;
  order: Order;
}

const OrderItemCard: React.FC<OrderItemCardProps> = ({ item, order }) => {
  const navigate = useNavigate();

  // ✅ Safe data access
  const imageUrl = getProductImage(item);
  const sellerName = getSellerName(item, order);
  const productTitle = item.product?.title || 'Product title not available';
  const variantSpecs = getVariantSpecs(item); // ✅ Returns array of {label, value}
  
  // ✅ Check fulfillment type
  const isSelfPickup = order.fulfillmentType === 'SELF_PICKUP';

  return (
    <div 
      onClick={() => navigate(`/account/orders/${order._id}/item/${item._id}`)} 
      className='text-sm bg-white p-5 space-y-4 border rounded-md cursor-pointer hover:shadow-md transition-shadow'
    >
      {/* Header: Status + Delivery/Pickup Info */}
      <div className='flex items-center gap-3'>
        <div>
          <Avatar sizes='small' sx={{ bgcolor: teal[500] }}>
            {isSelfPickup ? <StorefrontIcon /> : <ElectricBoltIcon />}
          </Avatar>
        </div>
        <div>
          <Typography variant="body2" fontWeight="bold" color="teal.600">
            {order.orderStatus || 'Unknown'}
          </Typography>
          
          {isSelfPickup ? (
            order.pickupTime ? (
              <Typography variant="caption" color="green.600" fontWeight="medium">
                📅 Pickup: {formatDateTime(order.pickupTime)}
              </Typography>
            ) : (
              <Typography variant="caption" color="orange.600">
                ⏰ Pickup time not scheduled
              </Typography>
            )
          ) : (
            <Typography variant="caption">
              Arriving by {formatDate(order.deliverDate)}
            </Typography>
          )}
        </div>
      </div>
      
      {/* Product Card */}
      <div className='p-5 bg-teal-50 flex gap-4 rounded-md'>
        {/* Product Image */}
        <Box sx={{ flexShrink: 0 }}>
          <img 
            className='w-[70px] h-[70px] object-cover rounded border border-gray-200' 
            src={imageUrl}
            alt={productTitle}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="70" height="70"%3E%3Crect width="70" height="70" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="8" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
            }}
          />
        </Box>
        
        {/* Product Details */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/* ✅ Seller Name - Bold & Prominent */}
          <Typography variant="subtitle2" fontWeight="bold">
            {sellerName}
          </Typography>
          
          {/* ✅ Product Title */}
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {productTitle}
          </Typography>
          
          {/* ✅✅✅ DYNAMIC Variant Specs - Works for ANY category */}
          {variantSpecs.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {variantSpecs.map((spec, index) => (
                <Chip
                  key={`${spec.label}-${index}`}
                  label={`${spec.label}: ${spec.value}`}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    fontSize: '0.7rem', 
                    height: '20px',
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              ))}
            </Box>
          )}
          
          {/* ✅ Quantity & Price */}
          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            <strong>Qty:</strong> {item.quantity || 1} • <strong>Price:</strong> ₹{(item.sellingPrice || 0).toFixed(0)}
          </Typography>
          
          {/* ✅ Fulfillment Type Badge */}
          <Box sx={{ mt: 1, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            {isSelfPickup ? (
              <>
                <StorefrontIcon fontSize="small" sx={{ color: 'teal.600' }} />
                <Typography variant="caption" color="teal.700">Self Pickup</Typography>
              </>
            ) : (
              <>
                <LocalShippingIcon fontSize="small" sx={{ color: 'teal.600' }} />
                <Typography variant="caption" color="teal.700">Home Delivery</Typography>
              </>
            )}
          </Box>
          
          {/* ✅ Pickup Time Badge (if scheduled) */}
          {isSelfPickup && order.pickupTime && (
            <Box sx={{ mt: 1, p: 1, bgcolor: 'white', borderRadius: 1, border: '1px solid', borderColor: 'green.200' }}>
              <Typography variant="caption" color="green.700" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <ScheduleIcon fontSize="small" />
                Scheduled: {formatDateTime(order.pickupTime)}
              </Typography>
            </Box>
          )}
        </Box>
      </div>
    </div>
  );
};

export default OrderItemCard;