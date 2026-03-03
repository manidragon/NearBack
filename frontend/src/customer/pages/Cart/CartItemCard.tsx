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

const CartItemCard: React.FC<CartItemProps> = ({ item }) => {
  const dispatch = useAppDispatch();
  
  console.log('CartItem debug:', {
  productTitle: item.product?.title,
  sellingPrice: item.sellingPrice,
  mrpPrice: item.mrpPrice,
  quantity: item.quantity,
  itemTotal: item.sellingPrice, // ✅ Already total
  perUnitPrice: item.sellingPrice / item.quantity, // ✅ Added for debugging
  perUnitMrp: item.mrpPrice / item.quantity // ✅ Added for debugging
});

  // Use absolute quantity instead of delta to prevent race conditions
  const handleUpdateQuantity = (newQuantity: number) => {
    if (newQuantity < 1) return;
    
    dispatch(updateCartItem({
      jwt: localStorage.getItem("jwt") || "",
      cartItemId: item._id,
      cartItem: { quantity: newQuantity }
    }));
  };

  const handleRemoveCartItem = () => {
    dispatch(deleteCartItem({
      jwt: localStorage.getItem("jwt") || "", 
      cartItemId: item._id
    }));
  };

  // ✅ FIXED: item.sellingPrice is already the total price
  const itemTotal = item.sellingPrice;

  return (
    <div className='border rounded-md relative'>
      <div className='p-5 flex gap-3'>
        <div>
          <img 
            className='w-[90px] rounded-md' 
            src={item.product.images[0]} 
            alt={item.product.title || "Product image"} 
          />
        </div>
        <div className='space-y-2'>
          <h1 className='font-semibold text-lg'>
            {item.product?.seller?.businessDetails?.businessName || 'Seller'}
          </h1>
          <p className='text-gray-600 font-medium text-sm'>
            {item.product?.title || 'Product title'}
          </p>
          <p className='text-gray-400 text-xs'>
            <strong>Sold by:</strong> {item.product?.seller?.businessDetails?.businessName || 'Seller'}
          </p>
          <p className='text-xs'><strong>7 days replacement</strong> available</p>
          <p className='text-sm text-gray-500'>
            <strong>MRP:</strong> ₹{item.mrpPrice.toFixed(0)} {/* ✅ FIXED */}
          </p>
          <p className='text-sm text-gray-500'>
            <strong>You Save:</strong> ₹{(item.mrpPrice - item.sellingPrice).toFixed(0)} {/* ✅ FIXED */}
          </p>
          <p className='text-sm text-gray-500'>
            <strong>Size:</strong> {item.size}
          </p>
          
        </div>
      </div>
      <Divider />
      <div className='px-5 py-2 flex justify-between items-center'>
        <div className='flex items-center gap-2 w-[140px] justify-between'>
          <Button 
            size='small' 
            disabled={item.quantity <= 1} 
            onClick={() => handleUpdateQuantity(item.quantity - 1)}
          >
            <RemoveIcon />
          </Button>
          <span className='px-3 font-semibold'>
            {item.quantity}
          </span>
          <Button 
            size='small' 
            onClick={() => handleUpdateQuantity(item.quantity + 1)}
          >
            <AddIcon />
          </Button>
        </div>
        <div>
          {/* ✅ FIXED: Display item.sellingPrice directly (already total) */}
          <p className='text-gray-700 font-medium'>₹{itemTotal.toFixed(0)}</p>
          {/* ✅ FIXED: Display item.mrpPrice directly (already total) */}
          <p className='text-gray-400 text-sm line-through'>
            ₹{item.mrpPrice.toFixed(0)}
          </p>
        </div>
      </div>
      <div className='absolute top-1 right-1'>
        <IconButton onClick={handleRemoveCartItem} color='primary'>
          <CloseIcon />
        </IconButton>
      </div>
    </div>
    
  );
};

export default CartItemCard;