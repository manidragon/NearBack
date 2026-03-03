import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Box, Button, Menu, MenuItem, styled } from '@mui/material';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { fetchSellerOrders, updateOrderStatus } from '../../../Redux Toolkit/Seller/sellerOrderSlice';
import { type Order, type OrderItem } from '../../../types/orderTypes';
import dayjs from 'dayjs';

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

// Helper function to format date and time
const formatDateTime = (dateString: string) => {
  return dayjs(dateString).format('MMM D, YYYY h:mm A');
};

const orderStatus = [
  { color: '#FFA500', label: 'PENDING' },
  { color: '#F5BCBA', label: 'PLACED' },
  { color: '#F5BCBA', label: 'CONFIRMED' },
  { color: '#FF8C00', label: 'READY_FOR_PICKUP' },
  { color: '#1E90FF', label: 'SHIPPED' },
  { color: '#32CD32', label: 'DELIVERED' },
  { color: '#FF0000', label: 'CANCELLED' },
];

const orderStatusColor = {
  PENDING: { color: '#FFA500', label: 'PENDING' }, // Orange
  CONFIRMED: { color: '#F5BCBA', label: 'CONFIRMED' },
  PLACED: { color: '#F5BCBA', label: 'PLACED' },
  READY_FOR_PICKUP: { color: '#FF8C00', label: 'READY_FOR_PICKUP' }, // 👈 Orange for ready
  SHIPPED: { color: '#1E90FF', label: 'SHIPPED' }, // DodgerBlue
  DELIVERED: { color: '#32CD32', label: 'DELIVERED' }, // LimeGreen
  CANCELLED: { color: '#FF0000', label: 'CANCELLED' } // Red
};

export default function OrderTable() {

  const sellerOrder = useAppSelector(state => state.sellerOrder);
  const dispatch = useAppDispatch();

  // ✅ FIX: Change key type from number to string
  const [anchorEl, setAnchorEl] = React.useState<{ [key: string]: HTMLElement | null }>({});

  // ✅ FIX: Change orderId type from number to string
  const handleClick = (event: React.MouseEvent<HTMLElement>, orderId: string) => {
    setAnchorEl((prev) => ({ ...prev, [orderId]: event.currentTarget }));
  };

  const handleClose = (orderId: string) => {
    setAnchorEl((prev) => ({ ...prev, [orderId]: null }));
  };

  React.useEffect(() => {
    dispatch(fetchSellerOrders(localStorage.getItem("jwt") || ""));
  }, [dispatch]);

  const handleUpdateOrder = (orderId: string, orderStatus: any) => {
    dispatch(updateOrderStatus({
      jwt: localStorage.getItem("jwt") || "",
      orderId,
      orderStatus,
    }));
    handleClose(orderId);
  };

  // ✅ Filter orders by fulfillment type
  const selfPickupOrders = sellerOrder.orders.filter(order => order.fulfillmentType === 'SELF_PICKUP');
  const deliveryOrders = sellerOrder.orders.filter(order => order.fulfillmentType === 'DELIVERY');

  const renderOrderTable = (orders: Order[], title: string) => {
    if (orders.length === 0) return null;

    return (
      <>
        <h1 className='pb-5 font-bold text-xl'>{title}</h1>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 700 }} aria-label="customized table">
            <TableHead>
              <TableRow>
                <StyledTableCell>Order Id</StyledTableCell>
                <StyledTableCell>Products</StyledTableCell>
                <StyledTableCell>Shipping Address</StyledTableCell>
                {/* ✅ Add Pickup Time column for self-pickup orders */}
                {title.includes('Self Pickup') && (
                  <StyledTableCell align="center">Pickup Time</StyledTableCell>
                )}
                <StyledTableCell align="right">Order Status</StyledTableCell>
                <StyledTableCell align="right">Update</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((item: Order) => (
                <StyledTableRow key={item._id}>
                  <StyledTableCell align="left">{item._id}</StyledTableCell>
                  <StyledTableCell component="th" scope="row">
                    <div className='flex gap-1 flex-wrap'>
                      {item.orderItems.map((orderItem: OrderItem) =>
                        <div key={orderItem._id} className='flex gap-5'>
                          <img className='w-20 rounded-md' src={orderItem.product.images[0]} alt="" />
                          <div className='flex flex-col justify-between py-2'>
                            <h1>Title: {orderItem.product.title}</h1>
                            <h1>Price: Rs.{orderItem.product.sellingPrice}</h1>
                            <h1>Color: {orderItem.product.color}</h1>
                            <h1>Size: {orderItem.size}</h1>
                          </div>
                        </div>
                      )}
                    </div>
                  </StyledTableCell>
                  <StyledTableCell>
                    <div className='flex flex-col gap-y-2'>
                      <h1>{item.shippingAddress.name}</h1>
                      <h1>{item.shippingAddress.address}, {item.shippingAddress.city}</h1>
                      <h1>{item.shippingAddress.state} - {item.shippingAddress.pinCode}</h1>
                      <h1><strong>Mobile:</strong> {item.shippingAddress.mobile}</h1>

                      {/* ✅ Show pickup time for self-pickup orders */}
                      {item.fulfillmentType === 'SELF_PICKUP' && item.pickupTime && (
                        <div className='mt-2 p-2 bg-green-50 rounded-md border border-green-200'>
                          <p className='text-xs font-medium text-green-700 flex items-center gap-1'>
                            <ScheduleIcon fontSize='small' />
                            {formatDateTime(item.pickupTime)}
                          </p>
                        </div>
                      )}
                    </div>
                  </StyledTableCell>

                  {/* ✅ Pickup Time column (only for self-pickup table) */}
                  {title.includes('Self Pickup') && (
                    <StyledTableCell align="center">
                      {item.pickupTime ? (
                        <div className='bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs'>
                          {formatDateTime(item.pickupTime)}
                        </div>
                      ) : (
                        <div className='bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs'>
                          Not Scheduled
                        </div>
                      )}
                    </StyledTableCell>
                  )}

                  <StyledTableCell
                    sx={{ color: orderStatusColor[item.orderStatus as keyof typeof orderStatusColor]?.color }}
                    align="center">
                    <Box sx={{ borderColor: orderStatusColor[item.orderStatus as keyof typeof orderStatusColor]?.color }}
                      className={`border px-2 py-1 rounded-full text-xs`}>
                      {item.orderStatus}
                    </Box>
                  </StyledTableCell>
                  <StyledTableCell align="right">
                    {/* ✅ DISABLE BUTTON IF ORDER IS CANCELLED */}
                    <Button
                      size='small'
                      onClick={(e) => handleClick(e, item._id)}
                      color='primary'
                      disabled={item.orderStatus === 'CANCELLED'}
                      className={`bg-primary-color ${item.orderStatus === 'CANCELLED' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      Status
                    </Button>
                    <Menu
                      id={`status-menu-${item._id}`}
                      anchorEl={anchorEl[item._id]}
                      open={Boolean(anchorEl[item._id])}
                      onClose={() => handleClose(item._id)}
                      MenuListProps={{
                        'aria-labelledby': `status-menu-${item._id}`,
                      }}
                    >
                      {/* ✅ ONLY SHOW REQUIRED STATUSES FOR SELF-PICKUP ORDERS */}
                      {orderStatus
                        .filter(status => {
                          // ✅ For self-pickup orders, only show specific statuses
                          if (item.fulfillmentType === 'SELF_PICKUP') {
                            return [
                              'PLACED', 
                              'CONFIRMED', 
                              'READY_FOR_PICKUP', 
                              'DELIVERED'
                            ].includes(status.label);
                          }
                          // ✅ For delivery orders, show all statuses
                          return true;
                        })
                        .map((status) => (
                          <MenuItem
                            key={status.label}
                            onClick={() => handleUpdateOrder(item._id, status.label)}
                          >
                            {status.label}
                          </MenuItem>
                        ))}
                    </Menu>
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </>
    );
  };

  return (
    <>
      {/* ✅ Self Pickup Orders Table */}
      {renderOrderTable(selfPickupOrders, `🏪 Self Pickup Orders (${selfPickupOrders.length})`)}

      {/* ✅ Add spacing between tables if both exist */}
      {selfPickupOrders.length > 0 && deliveryOrders.length > 0 && (
        <div className='py-8'></div>
      )}

      {/* ✅ Delivery Orders Table */}
      {renderOrderTable(deliveryOrders, `🚚 Delivery Orders (${deliveryOrders.length})`)}
    </>
  );
}