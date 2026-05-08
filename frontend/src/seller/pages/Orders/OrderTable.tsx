// D:\Mani\Code with Zosh\Backup\source code\frontend\src\seller\pages\Orders\OrderTable.tsx

import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Box, Button, Menu, MenuItem, styled, Chip, Typography } from '@mui/material';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { fetchSellerOrders, updateOrderStatus } from '../../../Redux Toolkit/Seller/sellerOrderSlice';
import { type Order, type OrderItem } from '../../../types/orderTypes';
import dayjs from 'dayjs';

type OrderStatus = 
  | 'PENDING'
  | 'PLACED' 
  | 'READY_FOR_PICKUP'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const formatDateTime = (dateString?: string) => {
  if (!dateString) return 'N/A';
  return dayjs(dateString).format('MMM D, YYYY h:mm A');
};

const getProductImage = (orderItem: OrderItem): string => {
  const product = orderItem?.product;
  if (!product) return 'image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect width="80" height="80" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
  if (product.variants && orderItem.variantId) {
    const variant = product.variants.find((v: any) => String(v._id) === String(orderItem.variantId));
    if (variant?.images?.[0]) return variant.images[0];
  }
  if (product.images && product.images.length > 0) return product.images[0];
  if (product.variants?.[0]?.images?.[0]) return product.variants[0].images[0];
  return 'image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect width="80" height="80" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
};

const getVariantSpecs = (orderItem: OrderItem): { label: string; value: string }[] => {
  const specs: { label: string; value: string }[] = [];
  const product = orderItem?.product;
  
  if (!product) return [];
  
  // Strategy 1: Match by variantId
  if (product.variants && orderItem.variantId) {
    const variant = product.variants.find((v: any) => 
      String(v._id) === String(orderItem.variantId)
    );
    
    if (variant?.specifications) {
      Object.entries(variant.specifications).forEach(([key, value]) => {
        if (value && String(value).trim()) {
          const label = key
            .replace(/_/g, ' ')
            .replace(/^\w/, c => c.toUpperCase());
          specs.push({ label, value: String(value) });
        }
      });
      
      if (specs.length > 0) {
        // ✅ SORT specs for stable order (prevents flicker)
        return specs.sort((a, b) => a.label.localeCompare(b.label));
      }
    }
    
    if (variant?.color) {
      return [{ label: 'Color', value: variant.color }];
    }
  }
  
  // Strategy 2: Match by color (fallback)
  if (product.variants && orderItem?.size) {
    const matchingVariant = product.variants.find((v: any) => 
      v.color?.toLowerCase() === orderItem.size.toLowerCase()
    );
    
    if (matchingVariant?.specifications) {
      Object.entries(matchingVariant.specifications).forEach(([key, value]) => {
        if (value && String(value).trim()) {
          const label = key
            .replace(/_/g, ' ')
            .replace(/^\w/, c => c.toUpperCase());
          specs.push({ label, value: String(value) });
        }
      });
      
      if (specs.length > 0) {
        // ✅ SORT specs for stable order
        return specs.sort((a, b) => a.label.localeCompare(b.label));
      }
    }
  }
  
  // Strategy 3: Use size field
  if (orderItem.size && orderItem.size !== 'Default') {
    return [{ label: 'Variant', value: orderItem.size }];
  }
  
  return [];
};

const orderStatusColor: Record<string, { color: string; label: string }> = {
  PENDING: { color: '#FFA500', label: 'PENDING' },
  CONFIRMED: { color: '#F5BCBA', label: 'CONFIRMED' },
  PLACED: { color: '#F5BCBA', label: 'PLACED' },
  READY_FOR_PICKUP: { color: '#FF8C00', label: 'READY_FOR_PICKUP' },
  SHIPPED: { color: '#1E90FF', label: 'SHIPPED' },
  DELIVERED: { color: '#32CD32', label: 'DELIVERED' },
  CANCELLED: { color: '#FF0000', label: 'CANCELLED' }
};

interface StatusOption {
  color: string;
  label: string;
}

const orderStatus: StatusOption[] = [
  { color: '#FFA500', label: 'PENDING' },
  { color: '#F5BCBA', label: 'PLACED' },
  { color: '#F5BCBA', label: 'CONFIRMED' },
  { color: '#FF8C00', label: 'READY_FOR_PICKUP' },
  { color: '#1E90FF', label: 'SHIPPED' },
  { color: '#32CD32', label: 'DELIVERED' },
  { color: '#FF0000', label: 'CANCELLED' },
];

// ✅✅✅ NEW: Extract Order Row as Separate Component (Prevents Full Table Re-renders)
interface OrderRowProps {
  item: Order;
  anchorEl: { [key: string]: HTMLElement | null };
  onStatusClick: (event: React.MouseEvent<HTMLElement>, orderId: string) => void;
  onStatusClose: (orderId: string) => void;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  isSelfPickupTable: boolean;
}

const OrderRow: React.FC<OrderRowProps> = React.memo(({ 
  item, 
  anchorEl, 
  onStatusClick, 
  onStatusClose, 
  onStatusUpdate,
  isSelfPickupTable 
}) => {
  const statusConfig = orderStatusColor[item.orderStatus as keyof typeof orderStatusColor];
  const statusColor = statusConfig?.color || '#999';
  
  return (
    <StyledTableRow key={item._id}>
      <StyledTableCell align="left">{item._id?.slice(-8) || 'N/A'}</StyledTableCell>
      
      {/* Products Column */}
      <StyledTableCell component="th" scope="row">
        <div className='flex gap-1 flex-wrap'>
          {item.orderItems?.map((orderItem: OrderItem) => {
            const imageUrl = getProductImage(orderItem);
            const productTitle = orderItem.product?.title || 'Product';
            const specs = getVariantSpecs(orderItem);
            
            return (
              <div key={orderItem._id} className='flex gap-3 mb-2'>
                <img 
                  className='w-20 h-20 object-cover rounded-md border' 
                  src={imageUrl} 
                  alt={productTitle}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="80" height="80"%3E%3Crect width="80" height="80" fill="%23f5f5f5"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                  }}
                />
                <div className='flex flex-col justify-between py-1'>
                  <Typography variant="body2" fontWeight="medium">{productTitle}</Typography>
                  {specs.length > 0 && (
                    <div className='flex flex-wrap gap-1 mt-1'>
                      {specs.map((spec, idx) => (
                        <Chip 
                          key={`${spec.label}-${idx}-${orderItem._id}`}
                          label={`${spec.label}: ${spec.value}`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: '0.7rem', height: '20px' }}
                        />
                      ))}
                    </div>
                  )}
                  <Typography variant="caption" color="text.secondary" className='mt-1'>
                    Qty: {orderItem.quantity || 1} • ₹{(orderItem.sellingPrice || 0).toFixed(0)}
                  </Typography>
                </div>
              </div>
            );
          })}
        </div>
      </StyledTableCell>
      
      {/* ✅ Shipping Address Column - Stable Content */}
      <StyledTableCell>
        <div className='flex flex-col gap-y-1 text-xs'>
          <Typography variant="body2">{item.shippingAddress?.name || 'N/A'}</Typography>
          <Typography variant="body2">
            {item.shippingAddress?.address || 'N/A'}, {item.shippingAddress?.city || 'N/A'}
          </Typography>
          <Typography variant="body2">
            {item.shippingAddress?.state || 'N/A'} - {item.shippingAddress?.pinCode || 'N/A'}
          </Typography>
          <Typography variant="body2">
            <strong>Mobile:</strong> {item.shippingAddress?.mobile || 'N/A'}
          </Typography>
          {item.fulfillmentType === 'SELF_PICKUP' && item.pickupTime && (
            <Box className='mt-1 p-1 bg-green-50 rounded border border-green-200'>
              <Typography variant="caption" color="green.700" className='flex items-center gap-1'>
                <ScheduleIcon fontSize='small' />
                {formatDateTime(item.pickupTime)}
              </Typography>
            </Box>
          )}
        </div>
      </StyledTableCell>

      {/* Pickup Time Column (Self Pickup tables only) */}
      {isSelfPickupTable && (
        <StyledTableCell align="center">
          {item.pickupTime ? (
            <Box className='bg-green-100 text-green-800 px-2 py-0.5 rounded-full text-xs'>
              {formatDateTime(item.pickupTime)}
            </Box>
          ) : (
            <Box className='bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full text-xs'>
              Not Scheduled
            </Box>
          )}
        </StyledTableCell>
      )}

      {/* Order Status */}
      <StyledTableCell align="center">
        <Box 
          sx={{ 
            borderColor: statusColor,
            color: statusColor 
          }}
          className='border px-2 py-1 rounded-full text-xs'
        >
          {item.orderStatus}
        </Box>
      </StyledTableCell>
      
      {/* Status Update Button + Menu */}
      <StyledTableCell align="right">
        <Button
          size='small'
          onClick={(e) => onStatusClick(e, item._id)}
          color='primary'
          disabled={item.orderStatus === 'CANCELLED'}
          className={`${item.orderStatus === 'CANCELLED' ? 'opacity-50 cursor-not-allowed' : ''}`}
          sx={{ textTransform: 'none' }}
        >
          Status
        </Button>
        <Menu
          id={`status-menu-${item._id}`}
          anchorEl={anchorEl[item._id]}
          open={Boolean(anchorEl[item._id])}
          onClose={() => onStatusClose(item._id)}
          MenuListProps={{ 'aria-labelledby': `status-menu-${item._id}` }}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          {orderStatus
  .filter((status: StatusOption) => {
    // ✅ Dynamic filtering based on fulfillment type
    if (item.fulfillmentType === 'SELF_PICKUP') {
      // Self Pickup: Only show these statuses
      return [
        'PLACED', 
        'CONFIRMED', 
        'READY_FOR_PICKUP', 
        'DELIVERED',
        'CANCELLED'
      ].includes(status.label);
    } else {
      // Delivery: Show delivery-specific statuses
      return [
        'PENDING',
        'PLACED', 
        'CONFIRMED', 
        'SHIPPED',
        'DELIVERED',
        'CANCELLED'
      ].includes(status.label);
    }
  })
  .map((status: StatusOption) => (
    <MenuItem
      key={`${item._id}-${status.label}`}
      onClick={() => onStatusUpdate(item._id, status.label)}
      disabled={item.orderStatus === status.label}
    >
      {status.label}
    </MenuItem>
  ))}
        </Menu>
      </StyledTableCell>
    </StyledTableRow>
  );
});

// ✅ Memoize the row component to prevent unnecessary re-renders
OrderRow.displayName = 'OrderRow';

// ✅✅✅ MAIN COMPONENT - Now Much Cleaner
export default function OrderTable() {
  const sellerOrder = useAppSelector(state => state.sellerOrder);
  const dispatch = useAppDispatch();

  // ✅ Use useMemo for anchorEl to prevent recreation
  const [anchorEl, setAnchorEl] = React.useState<{ [key: string]: HTMLElement | null }>({});

  // ✅ useCallback for handlers (prevents recreation on every render)
  const handleClick = React.useCallback((event: React.MouseEvent<HTMLElement>, orderId: string) => {
    setAnchorEl((prev) => ({ ...prev, [orderId]: event.currentTarget }));
  }, []);

  const handleClose = React.useCallback((orderId: string) => {
    setAnchorEl((prev) => ({ ...prev, [orderId]: null }));
  }, []);

 const handleUpdateOrder = React.useCallback(
  (orderId: string, newStatus: string) => {  // ✅ Use plain string
    dispatch(updateOrderStatus({
      jwt: localStorage.getItem("jwt") || "",
      orderId,
      orderStatus: newStatus as any,  // ✅ Assertion to satisfy action creator
    }));
    handleClose(orderId);
  }, 
  [dispatch, handleClose]
);

  React.useEffect(() => {
    dispatch(fetchSellerOrders(localStorage.getItem("jwt") || ""));
  }, [dispatch]);

  // ✅ Filter orders (stable references)
  const selfPickupOrders = React.useMemo(
    () => sellerOrder.orders.filter(order => order.fulfillmentType === 'SELF_PICKUP'),
    [sellerOrder.orders]
  );
  const deliveryOrders = React.useMemo(
    () => sellerOrder.orders.filter(order => order.fulfillmentType === 'DELIVERY'),
    [sellerOrder.orders]
  );

  // ✅ Loading state
  if (sellerOrder.loading) {
    return (
      <Box className='flex justify-center items-center py-10'>
        <Box className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></Box>
        <Typography className='ml-2'>Loading orders...</Typography>
      </Box>
    );
  }

  return (
    <>
      {/* Self Pickup Orders Table */}
      {selfPickupOrders.length > 0 && (
        <>
          <Typography variant="h5" fontWeight="bold" className='pb-4'>
            🏪 Self Pickup Orders ({selfPickupOrders.length})
          </Typography>
          <TableContainer component={Paper} className='mb-6'>
            <Table sx={{ minWidth: 700 }} aria-label="self pickup orders">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Order Id</StyledTableCell>
                  <StyledTableCell>Products</StyledTableCell>
                  <StyledTableCell>Shipping Address</StyledTableCell>
                  <StyledTableCell align="center">Pickup Time</StyledTableCell>
                  <StyledTableCell align="right">Order Status</StyledTableCell>
                  <StyledTableCell align="right">Update</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {selfPickupOrders.map((order: Order) => (
                  <OrderRow
                    key={order._id}  // ✅ Stable key
                    item={order}
                    anchorEl={anchorEl}
                    onStatusClick={handleClick}
                    onStatusClose={handleClose}
                    onStatusUpdate={handleUpdateOrder}
                    isSelfPickupTable={true}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Spacing between tables */}
      {selfPickupOrders.length > 0 && deliveryOrders.length > 0 && <div className='py-4'></div>}

      {/* Delivery Orders Table */}
      {deliveryOrders.length > 0 && (
        <>
          <Typography variant="h5" fontWeight="bold" className='pb-4'>
            🚚 Delivery Orders ({deliveryOrders.length})
          </Typography>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 700 }} aria-label="delivery orders">
              <TableHead>
                <TableRow>
                  <StyledTableCell>Order Id</StyledTableCell>
                  <StyledTableCell>Products</StyledTableCell>
                  <StyledTableCell>Shipping Address</StyledTableCell>
                  <StyledTableCell align="right">Order Status</StyledTableCell>
                  <StyledTableCell align="right">Update</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deliveryOrders.map((order: Order) => (
                  <OrderRow
                    key={order._id}  // ✅ Stable key
                    item={order}
                    anchorEl={anchorEl}
                    onStatusClick={handleClick}
                    onStatusClose={handleClose}
                    onStatusUpdate={handleUpdateOrder}
                    isSelfPickupTable={false}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Empty state */}
      {sellerOrder.orders.length === 0 && !sellerOrder.loading && (
        <Box className='text-center py-10'>
          <Typography color="text.secondary">No orders found</Typography>
        </Box>
      )}
    </>
  );
}