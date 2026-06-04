// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Account\OrderDetails.tsx
import { Box, Button, Divider, CircularProgress, Alert, Typography, Chip } from '@mui/material';
import { useEffect } from 'react';
import PaymentsIcon from '@mui/icons-material/Payments';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { Replay, AccountBalanceWallet } from '@mui/icons-material'; // ✅ ADD THESE IMPORTS
import OrderStepper from './OrderStepper';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { cancelOrder, fetchOrderById, fetchOrderItemById } from '../../../Redux Toolkit/Customer/OrderSlice';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ReturnRequest } from '../../../types/orderTypes'; // ✅ ADD THIS IMPORT

// Helper function to format date and time
const formatDateTime = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return dayjs(dateString).format('MMM D, YYYY h:mm A');
};

// ✅ Helper: Safely get product image
const getProductImage = (orderItem: any): string => {
  const product = orderItem?.product;
  
  if (!product) return 'image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
  
  // Strategy 1: Check if orderItem has variantId and product has variants
  if (product.variants && orderItem.variantId) {
    const variant = product.variants.find((v: any) => String(v._id) === String(orderItem.variantId));
    if (variant?.images && variant.images.length > 0) {
      return variant.images[0]; // ✅ Return first variant image
    }
  }
  
  // Strategy 2: Check product-level images array
  if (product.images && product.images.length > 0) {
    return product.images[0];
  }
  
  // Strategy 3: Check first variant's images as fallback
  if (product.variants && product.variants.length > 0 && product.variants[0].images) {
    return product.variants[0].images[0];
  }
  
  // Strategy 4: Return placeholder
  return 'image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
};

// ✅ Helper: Safely get seller name
const getSellerName = (orderItem: any): string => {
  const seller = orderItem?.product?.seller;
  if (typeof seller === 'object' && seller) {
    return seller.businessDetails?.businessName || seller.sellerName || 'Seller';
  }
  return 'Seller';
};

const getVariantSpecs = (orderItem: any): { label: string; value: string }[] => {
  const specs: { label: string; value: string }[] = [];
  const product = orderItem?.product;
  
  if (!product) return [];
  
  // 🔍 Strategy 1: Try to find variant by variantId (if available)
  if (product.variants && orderItem.variantId) {
    const variant = product.variants.find((v: any) => String(v._id) === String(orderItem.variantId));
    
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
  
  // 🔍 Strategy 2: Match variant by COLOR (when variantId is missing)
  if (product.variants && orderItem?.size) {
    const orderColor = orderItem.size.trim();
    
    const matchingVariant = product.variants.find((v: any) => 
      v.color?.toLowerCase() === orderColor.toLowerCase() && v.isActive !== false
    );
    
    if (matchingVariant?.specifications) {
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
      
      if (matchingVariant.color && !specs.some(s => s.label.toLowerCase() === 'color')) {
        specs.push({ label: 'Color', value: matchingVariant.color });
      }
      
      if (specs.length > 0) return specs;
    }
    
    if (matchingVariant?.color) {
      return [{ label: 'Color', value: matchingVariant.color }];
    }
  }
  
  if (orderItem?.size && orderItem.size !== 'Default') {
    if (orderItem.size.includes('+')) {
      return orderItem.size.split('+').map((part: string, idx: number) => {
        const trimmed = part.trim();
        const match = trimmed.match(/^(\d+\s*[A-Za-z]+)\s*(.*)$/);
        if (match) {
          return { label: match[2] || `Spec ${idx + 1}`, value: match[1] };
        }
        return { label: `Spec ${idx + 1}`, value: trimmed };
      });
    }
    return [{ label: 'Variant', value: orderItem.size }];
  }
  
  return [];
};

const OrderDetails = () => {
  const dispatch = useAppDispatch();
  const orders = useAppSelector(state => state.orders);
  const auth = useAppSelector(state => state.auth);
  const { orderItemId, orderId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (orderItemId && orderId) {
      dispatch(fetchOrderItemById({
        orderItemId,
        jwt: localStorage.getItem("jwt") || ""
      }));
      dispatch(fetchOrderById({
        orderId,
        jwt: localStorage.getItem("jwt") || ""
      }));
    }
  }, [orderItemId, orderId, dispatch]);

  // Show loading spinner while fetching
  if (orders.loading) {
    return (
      <div className='h-[80vh] flex justify-center items-center'>
        <CircularProgress />
      </div>
    );
  }

  // Show error if exists
  if (orders.error) {
    return (
      <div className='h-[80vh] flex justify-center items-center'>
        <Alert severity="error">{orders.error}</Alert>
      </div>
    );
  }

  // Only show "No order found" after loading completes
  if (!orders.currentOrder || !orders.orderItem) {
    return (
      <div className='h-[80vh] flex justify-center items-center'>
        <Alert severity="info">Order not found</Alert>
      </div>
    );
  }

  const handleCancelOrder = () => {
    if (orderId) {
      dispatch(cancelOrder(orderId));
    }
  };

  // ✅ Determine fulfillment type
  const isSelfPickup = orders.currentOrder?.fulfillmentType === 'SELF_PICKUP';
  
  // ✅ Safe data access
  const imageUrl = getProductImage(orders.orderItem);
  const sellerName = getSellerName(orders.orderItem);
  const productTitle = orders.orderItem?.product?.title || 'Product';
  const variantSpecs = getVariantSpecs(orders.orderItem);
  const addressToDisplay = orders.currentOrder?.shippingAddress;

  // ✅ Helper: Get return status for this order item
  const getItemReturnStatus = (): ReturnRequest | null => {
    // Check if orderItem has returnRequest populated (backend can populate this)
    return orders.orderItem?.returnRequest || null;
  };

  // ✅ Helper: Format return status display
  const getReturnStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING': return { label: 'Pending Approval', color: '#FFA500' as const };
      case 'APPROVED': return { label: 'Approved - Awaiting Pickup', color: '#1E90FF' as const };
      case 'REJECTED': return { label: 'Rejected', color: '#FF0000' as const };
      case 'PICKED_UP': return { label: 'Picked Up - Processing', color: '#9C27B0' as const };
      case 'COMPLETED': return { label: 'Refunded to Wallet', color: '#32CD32' as const };
      case 'CANCELLED': return { label: 'Cancelled', color: '#999' as const };
      default: return { label: status, color: '#999' as const };
    }
  };

  // ✅ Check if any item has pending return (for cancel button logic)
  const hasPendingReturn = orders.currentOrder?.orderItems?.some(
    (item: any) => item.returnRequest?.status === 'PENDING'
  );

  return (
    <Box className='space-y-5 px-4 py-6'>
      {/* Product Header */}
      <section className='flex flex-col gap-5 justify-center items-center'>
        {/* ✅ Fixed Image with onError fallback */}
        <img 
          className='w-[100px] h-[100px] object-cover rounded border' 
          src={imageUrl} 
          alt={productTitle}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
          }}
        />
        
        <div className='text-sm space-y-1 text-center'>
          <h1 className='font-bold'>{sellerName}</h1>
          <p>{productTitle}</p>
          
          {/* ✅ Dynamic Variant Specs Display */}
          {variantSpecs.length > 0 && (
            <div className='flex flex-wrap justify-center gap-1 mt-2'>
              {variantSpecs.map((spec, idx) => (
                <Chip 
                  key={`${spec.label}-${idx}`} 
                  label={`${spec.label}: ${spec.value}`} 
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
            </div>
          )}

          {/* ✅ Return Status Badge - Show if item has a return request */}
          {(() => {
            const returnReq = getItemReturnStatus();
            if (!returnReq) return null;
            
            const statusDisplay = getReturnStatusDisplay(returnReq.status);
            
            return (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px dashed', borderColor: statusDisplay.color, maxWidth: 400 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <Replay fontSize="small" sx={{ color: statusDisplay.color }} />
                  <Typography variant="caption" fontWeight="bold" sx={{ color: statusDisplay.color }}>
                    Return: {statusDisplay.label}
                  </Typography>
                </Box>
                
                {returnReq.status === 'COMPLETED' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                    <AccountBalanceWallet fontSize="small" color="success" />
                    <Typography variant="caption" color="success.main" fontWeight="medium">
                      ₹{returnReq.refundAmount} credited to wallet
                    </Typography>
                  </Box>
                )}
                
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  Requested: {dayjs(returnReq.createdAt).format('MMM DD, YYYY')}
                </Typography>
              </Box>
            );
          })()}
        </div>
        
        <div>
          <Button onClick={() => navigate(`/reviews/${orders.orderItem?.product?._id}/create`)}>
            Write Review
          </Button>
        </div>
      </section>

      {/* Order Stepper */}
      <section className='border p-5'>
        <OrderStepper 
          orderStatus={orders.currentOrder?.orderStatus || 'PLACED'} 
          fulfillmentType={orders.currentOrder?.fulfillmentType} 
        />
      </section>
      
      {/* Address Section */}
      <div className='border p-5'>
        <h1 className='font-bold pb-3'>
          {isSelfPickup ? 'Pickup Address' : 'Delivery Address'}
        </h1>
        <div className='text-sm space-y-2'>
          <div className='flex gap-5 font-medium'>
            <p>{addressToDisplay?.name || 'N/A'}</p>
            <Divider flexItem orientation='vertical' />
            <p>{addressToDisplay?.mobile || 'N/A'}</p>
          </div>
          <p>
            {addressToDisplay?.address || 'N/A'}, {addressToDisplay?.city || 'N/A'}, {addressToDisplay?.state || 'N/A'} - {addressToDisplay?.pinCode || 'N/A'}
          </p>
          {isSelfPickup && (
            <div className='bg-blue-50 p-2 rounded-md mt-2'>
              <p className='text-blue-700 text-xs flex items-center gap-1'>
                <StorefrontIcon fontSize='small' />
                Please collect your order from the store during business hours
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pickup Time Display Section */}
      {isSelfPickup && (
        <div className='border p-5'>
          <h1 className='font-bold pb-3'>Pickup Schedule</h1>
          {orders.currentOrder?.pickupTime ? (
            <div className='bg-green-50 p-4 rounded-md'>
              <div className='flex items-center gap-2 text-green-700 mb-2'>
                <ScheduleIcon />
                <Typography variant='h6' fontWeight='bold'>Scheduled for Pickup</Typography>
              </div>
              <Typography variant='body1' className='font-medium'>
                {formatDateTime(orders.currentOrder.pickupTime)}
              </Typography>
              <Typography variant='body2' color='text.secondary' className='mt-1'>
                Please arrive at the store at the scheduled time
              </Typography>
            </div>
          ) : (
            <div className='bg-yellow-50 p-4 rounded-md'>
              <Typography variant='body2' color='text.secondary'>
                No pickup time scheduled for this order
              </Typography>
            </div>
          )}
        </div>
      )}

      {/* Pricing & Payment Info */}
      <div className='border space-y-4'>
        <div className='flex justify-between text-sm pt-5 px-5'>
          <div className='space-y-1'>
            <p className='font-bold'>Total Item Price</p>
            <p>You saved <span className='text-green-500 font-medium text-xs'>₹
              {(orders.orderItem?.mrpPrice || 0) - (orders.orderItem?.sellingPrice || 0)}.00</span> on this item</p>
          </div>
          <p className='font-medium'>₹ {(orders.orderItem?.sellingPrice || 0).toFixed(2)}</p>
        </div>

        <div className='px-5'>
          <div className='bg-teal-50 px-5 py-2 text-xs font-medium flex items-center gap-3'>
            {isSelfPickup ? (
              <>
                <StorefrontIcon />
                <p>Pay On Pickup</p>
              </>
            ) : (
              <>
                <PaymentsIcon />
                <p>Pay On Delivery</p>
              </>
            )}
          </div>
        </div>

        <Divider />
        
        {/* ✅ Safe seller name in footer */}
        <div className='px-5 pb-5'>
          <p className='text-xs'><strong>Sold by : </strong>{sellerName}</p>
        </div>

        <div className='p-10'>
          <Button
            disabled={orders.currentOrder?.orderStatus === "CANCELLED" || hasPendingReturn}
            onClick={handleCancelOrder}
            color='error' 
            sx={{ py: "0.7rem" }} 
            variant='outlined' 
            fullWidth
          >
            {hasPendingReturn 
              ? "Return Request Pending" 
              : orders.currentOrder?.orderStatus === "CANCELLED" 
                ? "Order Canceled" 
                : "Cancel Order"
            }
          </Button>
        </div>
      </div>
    </Box>
  );
};

export default OrderDetails;