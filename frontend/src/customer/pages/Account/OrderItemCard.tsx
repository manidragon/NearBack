import React, { useState } from 'react';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { Avatar, Box, Typography, Chip, Button } from '@mui/material';
import { teal } from '@mui/material/colors';
import { useNavigate } from 'react-router-dom';
import type { Order, OrderItem } from '../../../types/orderTypes';
import { formatDate } from '../../util/fomateDate';
import dayjs from 'dayjs';
import { Replay, HourglassEmpty, CheckCircle, Payment, AttachMoney } from '@mui/icons-material';
import ReturnRequestForm from './ReturnRequestForm';
import ReplacementRequestForm from './ReplacementRequestForm';

// ✅ Helper: Format date and time
const formatDateTime = (dateString: string | undefined) => {
  if (!dateString) return 'N/A';
  return dayjs(dateString).format('MMM D, YYYY h:mm A');
};

// ✅ Helper: Safely get product image
const getProductImage = (item: OrderItem): string => {
  if (item.product?.variants && item.variantId) {
    const variant = item.product.variants.find((v: any) =>
      String(v._id) === String(item.variantId)
    );
    if (variant?.images?.[0]) return variant.images[0];
  }
  if (item.product?.images?.[0]) return item.product.images[0];
  if (item.product?.variants?.[0]?.images?.[0]) return item.product.variants[0].images[0];
  return 'image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="70" height="70"%3E%3Crect width="70" height="70" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="8" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
};

// ✅ Helper: Get seller name
const getSellerName = (item: OrderItem, order: Order): string => {
  if (typeof item.product?.seller === 'object' && item.product.seller) {
    if (item.product.seller.businessDetails?.businessName) return item.product.seller.businessDetails.businessName;
    if (item.product.seller.sellerName) return item.product.seller.sellerName;
  }
  if (typeof order?.seller === 'object' && order.seller) {
    if (order.seller.businessDetails?.businessName) return order.seller.businessDetails.businessName;
    if (order.seller.sellerName) return order.seller.sellerName;
  }
  return 'Seller';
};

const getVariantSpecs = (item: OrderItem): { label: string; value: string }[] => {
  const specs: { label: string; value: string }[] = [];
  const product = item?.product;
  if (!product) return [];

  if (product.variants && item.variantId) {
    const variant = product.variants.find((v: any) => String(v._id) === String(item.variantId));
    if (variant?.specifications) {
      Object.entries(variant.specifications).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') return;
        const stringValue = String(value).trim();
        if (!stringValue) return;
        const formattedLabel = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase());
        specs.push({ label: formattedLabel, value: stringValue });
      });
      if (specs.length > 0) return specs;
    }
  }

  if (product.variants && item?.size) {
    const orderColor = item.size.trim();
    const matchingVariant = product.variants.find((v: any) => v.color?.toLowerCase() === orderColor.toLowerCase() && v.isActive !== false);
    if (matchingVariant?.specifications) {
      Object.entries(matchingVariant.specifications).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') return;
        const stringValue = String(value).trim();
        if (!stringValue) return;
        const formattedLabel = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim().replace(/^\w/, c => c.toUpperCase());
        specs.push({ label: formattedLabel, value: stringValue });
      });
      if (matchingVariant.color && !specs.some(s => s.label.toLowerCase() === 'color')) {
        specs.push({ label: 'Color', value: matchingVariant.color });
      }
      if (specs.length > 0) return specs;
    }
    if (matchingVariant?.color) return [{ label: 'Color', value: matchingVariant.color }];
  }

  if (item.size && item.size !== 'Default') {
    if (item.size.includes('+')) {
      return item.size.split('+').map((part, idx) => {
        const trimmed = part.trim();
        const match = trimmed.match(/^(\d+\s*[A-Za-z]+)\s*(.*)$/);
        if (match) return { label: match[2] || `Spec ${idx + 1}`, value: match[1] };
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
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [replacementModalOpen, setReplacementModalOpen] = useState(false);

  const imageUrl = getProductImage(item);
  const sellerName = getSellerName(item, order);
  const productTitle = item.product?.title || 'Product title not available';
  const variantSpecs = getVariantSpecs(item);
  const isSelfPickup = order.fulfillmentType === 'SELF_PICKUP';

  // ✅ Helper: Check if item is eligible for return/replacement
  const isReturnEligible = (): boolean => {
    if (order.orderStatus !== 'DELIVERED') return false;
    const deliveredDate = order.updatedAt || order.deliverDate;
    if (!deliveredDate) return false;
    const daysSinceDelivery = Math.floor((Date.now() - new Date(deliveredDate).getTime()) / (1000 * 60 * 60 * 24));
    return daysSinceDelivery <= 7;
  };

  const hasReturnRequest = (): boolean => {
    return !!(item as any).returnRequest;
  };

  const hasReplacementRequest = (): boolean => {
    return !!(item as any).replacementRequest;
  };

  // ✅ NEW: Get replacement status configuration for display
  const getReplacementStatus = () => {
    const replacementReq = (item as any).replacementRequest;
    if (!replacementReq?.status) return null;

    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; subtext?: string }> = {
      'PENDING': { label: 'Replacement Pending', color: '#FFA500', icon: <HourglassEmpty fontSize="small" /> },
      'APPROVED': { label: 'Replacement Approved', color: '#1E90FF', icon: <CheckCircle fontSize="small" /> },
      'REJECTED': { label: 'Replacement Rejected', color: '#FF0000', icon: <Replay fontSize="small" /> },
      'ORIGINAL_RETURNED': { label: 'Original Item Returned', color: '#9C27B0', icon: <LocalShippingIcon fontSize="small" /> },
      'REVIEW_COMPLETED': { label: 'Review Completed', color: '#2196F3', icon: <CheckCircle fontSize="small" />, subtext: 'Awaiting shipment' },
      'REPLACEMENT_SHIPPED': { label: 'Replacement Shipped', color: '#FF9800', icon: <LocalShippingIcon fontSize="small" /> },
      'COMPLETED': { label: 'Replacement Completed', color: '#32CD32', icon: <CheckCircle fontSize="small" /> },
      'CANCELLED': { label: 'Replacement Cancelled', color: '#999', icon: <Replay fontSize="small" /> }
    };

    const config = statusConfig[replacementReq.status];
    if (!config) return null;

    return {
      ...config,
      tracking: replacementReq.replacementOrder?.trackingNumber
    };
  };

  // ✅ Helper: Get return status configuration for display
  const getReturnStatus = () => {
    const returnReq = (item as any).returnRequest;
    if (!returnReq?.status) return null;

    const getRefundTimeline = () => {
      if (returnReq.refundMethod === 'WALLET') return 'Instant';
      if (returnReq.refundMethod === 'RAZORPAY') return '2-5 days';
      return 'Pending';
    };

    const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode; subtext?: string }> = {
      'PENDING': { label: 'Return Pending', color: '#FFA500', icon: <HourglassEmpty fontSize="small" /> },
      'APPROVED': { label: 'Return Approved', color: '#1E90FF', icon: <CheckCircle fontSize="small" /> },
      'REJECTED': { label: 'Return Rejected', color: '#FF0000', icon: <Replay fontSize="small" /> },
      'PICKED_UP': { label: 'Item Picked Up', color: '#9C27B0', icon: <LocalShippingIcon fontSize="small" /> },
      'COMPLETED': {
        label: 'Refunded',
        color: '#32CD32',
        icon: <CheckCircle fontSize="small" />,
        subtext: `₹${returnReq.refundAmount} to ${returnReq.refundMethod === 'WALLET' ? 'Wallet' : 'Original Method'}`
      },
      'CANCELLED': { label: 'Return Cancelled', color: '#999', icon: <Replay fontSize="small" /> }
    };

    const config = statusConfig[returnReq.status];
    if (!config) return null;

    return {
      ...config,
      timeline: returnReq.status === 'COMPLETED' ? getRefundTimeline() : undefined
    };
  };

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
          
          {/* ✅ Show if this entire order is a replacement order */}
          {order.replacementFor && (
            <Typography variant="caption" color="primary" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <Replay fontSize="inherit" /> Replacement Order
            </Typography>
          )}
          
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

      <div className='pl-11 mt-1'>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ScheduleIcon fontSize="small" sx={{ color: 'gray' }} />
          Ordered: {formatDateTime(order.createdAt)}
        </Typography>
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
          <Typography variant="subtitle2" fontWeight="bold">
            {sellerName}
          </Typography>

          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {productTitle}
          </Typography>

          {variantSpecs.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {variantSpecs.map((spec, index) => (
                <Chip
                  key={`${spec.label}-${index}`}
                  label={`${spec.label}: ${spec.value}`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: '20px', '& .MuiChip-label': { px: 1 } }}
                />
              ))}
            </Box>
          )}

          <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
            <strong>Qty:</strong> {item.quantity || 1} • <strong>Price:</strong> ₹{(item.sellingPrice || 0).toFixed(0)}
          </Typography>

          {/* ✅ Return Status Badge */}
          {hasReturnRequest() && (() => {
            const returnReq = (item as any).returnRequest;
            const returnStatus = getReturnStatus();
            if (!returnStatus) return null;

            const isProcessingRazorpay =
              returnReq?.refundMethod === 'RAZORPAY' &&
              (returnReq?.refundStatus === 'PROCESSING' || returnReq?.refundStatus === 'PENDING');

            return (
              <Box sx={{ mt: 1.5 }}>
                <Chip
                  icon={returnStatus.icon as React.ReactElement | undefined}
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Typography variant="body2" fontWeight="bold">{returnStatus.label}</Typography>
                      {returnStatus.subtext && (
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.9 }}>
                          {returnStatus.subtext}
                        </Typography>
                      )}
                    </Box>
                  }
                  size="small"
                  sx={{
                    backgroundColor: `${returnStatus.color}20`,
                    color: returnStatus.color,
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                    border: `1px solid ${returnStatus.color}40`,
                    '& .MuiChip-label': { py: 0.5 }
                  }}
                />
                {isProcessingRazorpay && (
                  <Box sx={{ mt: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'warning.main', animation: 'pulse 1.5s infinite' }} />
                    <Typography variant="caption" color="warning.main" fontWeight="medium">
                      ⏳ Processing refund...
                    </Typography>
                  </Box>
                )}
              </Box>
            );
          })()}

          {/* ✅ Replacement Status Badge */}
          {hasReplacementRequest() && (() => {
            const replacementStatus = getReplacementStatus();
            if (!replacementStatus) return null;

            return (
              <Box sx={{ mt: 1.5 }}>
                <Chip
                  icon={replacementStatus.icon as React.ReactElement | undefined}
                  label={
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                      <Typography variant="body2" fontWeight="bold">{replacementStatus.label}</Typography>
                      {replacementStatus.subtext && (
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.9 }}>
                          {replacementStatus.subtext}
                        </Typography>
                      )}
                      {replacementStatus.tracking && (
                        <Typography variant="caption" sx={{ fontSize: '0.65rem', opacity: 0.9, fontWeight: 'bold', mt: 0.5 }}>
                          📦 Tracking: {replacementStatus.tracking}
                        </Typography>
                      )}
                    </Box>
                  }
                  size="small"
                  sx={{
                    backgroundColor: `${replacementStatus.color}20`,
                    color: replacementStatus.color,
                    fontWeight: 'bold',
                    fontSize: '0.7rem',
                    border: `1px solid ${replacementStatus.color}40`,
                    '& .MuiChip-label': { py: 0.5 }
                  }}
                />
              </Box>
            );
          })()}

          {/* ✅ Return/Replace Buttons */}
          {isReturnEligible() && !hasReturnRequest() && !hasReplacementRequest() && (
            <Box sx={{ mt: 1.5, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="outlined"
                color="error"
                startIcon={<Replay fontSize="small" />}
                onClick={(e) => {
                  e.stopPropagation();
                  setReturnModalOpen(true);
                }}
                sx={{ fontSize: '0.75rem', textTransform: 'none', borderColor: 'error.main', color: 'error.main', '&:hover': { borderColor: 'error.dark', backgroundColor: 'error.lighter' } }}
              >
                Return Item
              </Button>

              <Button
                size="small"
                variant="contained"
                color="primary"
                startIcon={<Replay fontSize="small" />}
                onClick={(e) => {
                  e.stopPropagation();
                  setReplacementModalOpen(true);
                }}
                sx={{ fontSize: '0.75rem', textTransform: 'none', '&:hover': { backgroundColor: 'primary.dark' } }}
              >
                Replace Item
              </Button>
            </Box>
          )}

          {/* Fulfillment Type Badge */}
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

          {/* Payment Method Badge */}
          <Box sx={{ mt: 1, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
            {order.paymentMethod === 'CASH_ON_DELIVERY' ? (
              <>
                <AttachMoney fontSize="small" sx={{ color: 'orange.600' }} />
                <Typography variant="caption" color="orange.700" fontWeight="medium">Cash on Delivery</Typography>
              </>
            ) : (
              <>
                <Payment fontSize="small" sx={{ color: 'teal.600' }} />
                <Typography variant="caption" color="teal.700" fontWeight="medium">Paid via Razorpay</Typography>
              </>
            )}
          </Box>

          {/* Pickup Time Badge */}
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

      {/* Return Request Modal */}
      <ReturnRequestForm
        open={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        orderItemId={item._id}
        itemDetails={{
          title: productTitle,
          sellingPrice: item.sellingPrice,
          image: imageUrl,
          variant: item.size,
          paymentMethod: order.paymentMethod
        }}
      />

      {/* Replacement Request Modal */}
      <ReplacementRequestForm
        open={replacementModalOpen}
        onClose={() => setReplacementModalOpen(false)}
        orderItem={item}
        orderId={order._id}
      />
    </div>
  );
};

export default OrderItemCard;