// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Account\Order.tsx

import { useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import OrderItemCard from './OrderItemCard';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { fetchUserOrderHistory } from '../../../Redux Toolkit/Customer/OrderSlice';

const Order = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);
  const orders = useAppSelector(state => state.orders);

  useEffect(() => {
    const jwt = localStorage.getItem("jwt");
    if (jwt) {
      dispatch(fetchUserOrderHistory(jwt));
    }
  }, [auth.jwt, dispatch]);

  // ✅ FIX 1: Safe orders array with fallback
  const ordersList = orders?.orders || [];

  // ✅ FIX 2: Safe filtering with null checks
  const selfPickupOrders = ordersList.filter(order => 
    order?.fulfillmentType === 'SELF_PICKUP'
  );
  const deliveryOrders = ordersList.filter(order => 
    order?.fulfillmentType === 'DELIVERY' || !order?.fulfillmentType // Default to delivery
  );

  // ✅ FIX 3: Render order items with proper key and null checks
  const renderOrderItems = (orderList: any[]) => {
    return orderList.flatMap(order => {
      // Skip invalid orders
      if (!order?._id || !Array.isArray(order.orderItems)) {
        console.warn('⚠️ Skipping invalid order:', order?._id);
        return [];
      }
      
      return order.orderItems.map((item: any) => {
        // ✅ Use composite key: order._id + item._id for uniqueness
        const uniqueKey = `${order._id}-${item._id || 'unknown'}`;
        
        return (
          <OrderItemCard 
            key={uniqueKey}  // ✅ FIX: Proper unique key
            item={item} 
            order={order} 
          />
        );
      });
    });
  };

  // ✅ FIX 4: Loading state
  if (orders.loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading your orders...</Typography>
      </Box>
    );
  }

  // ✅ FIX 5: Error state
  if (orders.error) {
    return (
      <Alert severity="error" sx={{ m: 3 }}>
        {orders.error}
      </Alert>
    );
  }

  // ✅ FIX 6: Empty state with helpful message
  if (ordersList.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <Typography variant="h6" color="text.secondary">
          No orders yet
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Start shopping to see your orders here
        </Typography>
      </Box>
    );
  }

  return (
    <div className='text-sm min-h-screen px-4 py-6'>
      {/* ✅ Self Pickup Orders Section */}
      {selfPickupOrders.length > 0 && (
        <div className='pb-8'>
          <div className='pb-5 border-b mb-4'>
            <Typography variant="h5" fontWeight="bold">
              🏪 Self Pickup Orders
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Ready for collection from store
            </Typography>
          </div>
          <div className='space-y-3'>
            {renderOrderItems(selfPickupOrders)}
          </div>
        </div>
      )}

      {/* ✅ Delivery Orders Section */}
      {deliveryOrders.length > 0 && (
        <div className='pb-8'>
          <div className='pb-5 border-b mb-4'>
            <Typography variant="h5" fontWeight="bold">
              🚚 Delivery Orders
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Shipped to your address
            </Typography>
          </div>
          <div className='space-y-3'>
            {renderOrderItems(deliveryOrders)}
          </div>
        </div>
      )}
    </div>
  );
};

export default Order;