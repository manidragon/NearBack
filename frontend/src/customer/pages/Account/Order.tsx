// Order.tsx
import { useEffect } from 'react';
import OrderItemCard from './OrderItemCard';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { fetchUserOrderHistory } from '../../../Redux Toolkit/Customer/OrderSlice';

const Order = () => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);
  const orders = useAppSelector(state => state.orders);

  useEffect(() => {
    dispatch(fetchUserOrderHistory(localStorage.getItem("jwt") || ""));
  }, [auth.jwt]);

  // ✅ Filter orders by fulfillment type
  const selfPickupOrders = orders.orders.filter(order => order.fulfillmentType === 'SELF_PICKUP');
  const deliveryOrders = orders.orders.filter(order => order.fulfillmentType === 'DELIVERY');

  // ✅ Helper function to render order items for a specific order type
  const renderOrderItems = (orderList: any[]) => {
    return orderList.flatMap(order => 
      order.orderItems.map((item: any) => (
        <OrderItemCard key={item._id} item={item} order={order} />
      ))
    );
  };

  return (
    <div className='text-sm min-h-screen'>
      {/* ✅ Self Pickup Orders Section */}
      {selfPickupOrders.length > 0 && (
        <div className='pb-8'>
          <div className='pb-5'>
            <h1 className='font-semibold text-xl'>🏪 Self Pickup Orders</h1>
            <p>Ready for collection from store</p>
          </div>
          <div className='space-y-2'>
            {renderOrderItems(selfPickupOrders)}
          </div>
        </div>
      )}

      {/* ✅ Delivery Orders Section */}
      {deliveryOrders.length > 0 && (
        <div className='pb-8'>
          <div className='pb-5'>
            <h1 className='font-semibold text-xl'>🚚 Delivery Orders</h1>
            <p>Shipped to your address</p>
          </div>
          <div className='space-y-2'>
            {renderOrderItems(deliveryOrders)}
          </div>
        </div>
      )}

      {/* ✅ No orders message */}
      {orders.orders.length === 0 && (
        <div className='text-center py-10'>
          <p className='text-gray-500'>No orders found</p>
        </div>
      )}
    </div>
  );
};

export default Order;