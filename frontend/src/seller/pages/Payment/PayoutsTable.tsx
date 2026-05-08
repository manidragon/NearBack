// D:\Mani\Code with Zosh\Backup\source code\frontend\src\seller\pages\Payment\PayoutsTable.tsx
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import React from "react";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { type Order, type OrderItem } from "../../../types/orderTypes";
import { fetchPayoutsBySeller } from "../../../Redux Toolkit/Seller/payoutSlice";

const PayoutsTable = () => {
  const sellerOrder = useAppSelector((state) => state.sellerOrder);
  const dispatch = useAppDispatch();

  React.useEffect(() => {
    dispatch(fetchPayoutsBySeller(localStorage.getItem("jwt") || ""));
  }, [dispatch]);

  return (
    <div>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 700 }} aria-label="customized table">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell align="right">Status</TableCell>
              {/* <TableCell align="right">Amount</TableCell> */}
            </TableRow>
          </TableHead>
          <TableBody>
            {sellerOrder.orders.map((item: Order) => (
              <TableRow key={item._id}>
                <TableCell align="left">{item._id}</TableCell>
                <TableCell component="th" scope="row">
                  <div className="flex gap-1 flex-wrap">
                    {item.orderItems.map((orderItem: OrderItem) => (
                      <div key={orderItem._id} className="flex gap-5">
                        <img
                          className="w-20 rounded-md"
                          src={orderItem.product.images[0]}
                          alt=""
                        />
                        <div className="flex flex-col justify-between py-2">
                          <h1>Title: {orderItem.product.title}</h1>
                          <h1>Price: Rs.{orderItem.product.sellingPrice}</h1>
                          <h1>Color: {orderItem.product.color}</h1>
                          <h1>Size: {orderItem.size}</h1>
                        </div>
                      </div>
                    ))}
                  </div>
                </TableCell>
                {/* <TableCell>
                  <div className='flex flex-col gap-y-2'>
                    <h1>{item.shippingAddress.name}</h1>
                    <h1>{item.shippingAddress.address}, {item.shippingAddress.city}</h1>
                    <h1>{item.shippingAddress.state} - {item.shippingAddress.pinCode}</h1>
                    <h1><strong>Mobile:</strong> {item.shippingAddress.mobile}</h1>
                  </div>
                </TableCell> */}
                {/* <TableCell 
                 sx={{color:orderStatusColor[item.orderStatus].color}} 
                 align="center"> <Box sx={{borderColor:orderStatusColor[item.orderStatus].color}}  className={`border px-2 py-1 rounded-full text-xs`}>
                  {item.orderStatus}</Box> 
                 </TableCell> */}
                {/* <TableCell align="right">
                  <Button
                    size='small'
                    onClick={(e) => handleClick(e, item._id)}
                    color='primary'
                    className='bg-primary-color'>
                    Status
                  </Button>
                  <Menu
                    id={`status-menu ${item._id}`}
                    anchorEl={anchorEl[item._id]}
                    open={Boolean(anchorEl[item._id])}
                    onClose={() => handleClose(item._id)}
                    MenuListProps={{
                      'aria-labelledby': `status-menu ${item._id}`,
                    }}
                  >
                    {orderStatus.map((status) =>
                      <MenuItem 
                      key={status.label} 
                      onClick={() => handleUpdateOrder(item._id, status.label)}>
                        {status.label}</MenuItem>
                    )}
                  </Menu>
                </TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default PayoutsTable;
