// OrderDetails.tsx
import { Box, Button, Divider, CircularProgress, Alert, Typography } from '@mui/material';
import { useEffect } from 'react';
import PaymentsIcon from '@mui/icons-material/Payments';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ScheduleIcon from '@mui/icons-material/Schedule'; // 👈 Add this import
import OrderStepper from './OrderStepper';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { cancelOrder, fetchOrderById, fetchOrderItemById } from '../../../Redux Toolkit/Customer/OrderSlice';
import { useNavigate, useParams } from 'react-router-dom';
import dayjs from 'dayjs'; // 👈 Add this import

// Helper function to format date and time
const formatDateTime = (dateString: string) => {
  return dayjs(dateString).format('MMM D, YYYY h:mm A');
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
  }, [orderItemId, orderId]);

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

  // ✅ Determine if this is a self-pickup order
  const isSelfPickup = orders.currentOrder?.fulfillmentType === 'SELF_PICKUP';

  // ✅ Get seller's business address for self-pickup
  const getSellerAddress = () => {
    // For delivery orders, use the shipping address from order
    return orders.currentOrder?.shippingAddress;
  };

  const addressToDisplay = getSellerAddress();

  return (
    <Box className='space-y-5 '>
      <section className='flex flex-col gap-5 justify-center items-center'>
        <img className='w-[100px]' src={orders.orderItem?.product.images[0]} alt="" />
        <div className='text-sm space-y-1 text-center'>
          <h1 className='font-bold'>{orders.orderItem?.product.seller?.businessDetails.businessName}
          </h1>
          <p>{orders.orderItem?.product.title}</p>
          <p><strong>Size:</strong>M</p>
        </div>
        <div>
          <Button onClick={() => navigate(`/reviews/${orders.orderItem?.product._id}/create`)}>Write Review</Button>
        </div>
      </section>

      <section className='border p-5'>
        <OrderStepper 
          orderStatus={orders.currentOrder?.orderStatus} 
          fulfillmentType={orders.currentOrder?.fulfillmentType} 
        />
      </section>
      
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

      {/* ✅ Pickup Time Display Section */}
      {isSelfPickup && (
        <div className='border p-5'>
          <h1 className='font-bold pb-3'>Pickup Schedule</h1>
          {orders.currentOrder?.pickupTime ? (
            <div className='bg-green-50 p-4 rounded-md'>
              <div className='flex items-center gap-2 text-green-700 mb-2'>
                <ScheduleIcon />
                <Typography variant='h6' fontWeight='bold'>
                  Scheduled for Pickup
                </Typography>
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

      <div className='border space-y-4'>
        <div className='flex justify-between text-sm pt-5 px-5'>
          <div className='space-y-1'>
            <p className='font-bold'>Total Item Price</p>
            <p>You saved <span className='text-green-500 font-medium text-xs'>₹
              {orders.orderItem?.mrpPrice - orders.orderItem?.sellingPrice}.00</span> on this item</p>
          </div>
          <p className='font-medium'>₹ {orders.orderItem?.sellingPrice}.00</p>
        </div>

        <div className='px-5 '>
          <div className='bg-teal-50 px-5 py-2 text-xs font-medium flex items-center gap-3 '>
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
        <div className='px-5 pb-5'>
          <p className='text-xs'><strong>Sold by : </strong>{orders.orderItem.product.seller?.businessDetails.businessName}</p>
        </div>

        <div className='p-10'>
          <Button
            disabled={orders.currentOrder?.orderStatus === "CANCELLED"}
            onClick={handleCancelOrder}
            color='error' sx={{ py: "0.7rem" }} className='' variant='outlined' fullWidth>
            {orders.currentOrder?.orderStatus === "CANCELLED" ? "order canceled" : "Cancel Order"}
          </Button>
        </div>
      </div>
    </Box>
  );
};

export default OrderDetails;