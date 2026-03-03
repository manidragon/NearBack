// OrderItemCard.tsx
import React from 'react';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import StorefrontIcon from '@mui/icons-material/Storefront';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ScheduleIcon from '@mui/icons-material/Schedule'; // 👈 NEW IMPORT
import { Avatar } from '@mui/material';
import { teal } from '@mui/material/colors';
import { useNavigate } from 'react-router-dom';
import type { Order, OrderItem } from '../../../types/orderTypes';
import { formatDate } from '../../util/fomateDate';
import dayjs from 'dayjs'; // 👈 NEW IMPORT

// 👈 NEW: Helper function to format date and time
const formatDateTime = (dateString: string) => {
  return dayjs(dateString).format('MMM D, YYYY h:mm A');
};

interface OrderItemCardProps {
    item: OrderItem,
    order: Order
}

const OrderItemCard: React.FC<OrderItemCardProps> = ({ item, order }) => {
    
    const navigate = useNavigate();

    // Handle seller business name safely
    const getBusinessName = () => {
        // Check product seller's businessDetails (most common case)
        if (item.product?.seller?.businessDetails?.businessName) {
            return item.product.seller.businessDetails.businessName;
        }
        
        // Check order seller's businessDetails (fallback)
        if (order?.seller?.businessDetails?.businessName) {
            return order.seller.businessDetails.businessName;
        }
        
        // Final fallback - use seller's email or generic name
        if (item.product?.seller?.email) {
            return item.product.seller.email.split('@')[0];
        }
        
        if (order?.seller?.email) {
            return order.seller.email.split('@')[0];
        }
        
        return "Seller";
    };

    // ✅ Check if this is a self-pickup order
    const isSelfPickup = order.fulfillmentType === 'SELF_PICKUP';

    return (
        <div 
            onClick={() => navigate(`/account/orders/${order._id}/item/${item._id}`)} 
            className='text-sm bg-white p-5 space-y-4 border rounded-md cursor-pointer'
        >
            <div className='flex items-center gap-3'>
                <div>
                    <Avatar sizes='small' sx={{ bgcolor: teal[500] }}>
                        {isSelfPickup ? <StorefrontIcon /> : <ElectricBoltIcon />}
                    </Avatar>
                </div>
                <div>
                    <h1 className='font-bold text-teal-600'>{order.orderStatus}</h1>
                    {/* 👈 UPDATED: Show pickup time if scheduled */}
                    {isSelfPickup ? (
                        order.pickupTime ? (
                            <p className='text-green-600 font-medium'>
                                📅 Pickup: {formatDateTime(order.pickupTime)}
                            </p>
                        ) : (
                            <p className='text-orange-600'>⏰ Pickup time not scheduled</p>
                        )
                    ) : (
                        <p>Arriving by {formatDate(order.deliverDate)}</p>
                    )}
                </div>
            </div>
            
            <div className='p-5 bg-teal-50 flex gap-3 '>
                <div>
                    <img 
                        className='w-[70px] h-auto object-cover' 
                        src={item.product?.images?.[0] || '/placeholder-image.jpg'} 
                        alt={item.product?.title || 'Product'} 
                    />
                </div>
                
                <div className='w-full space-y-2'>
                    <h1 className='font-bold'>{getBusinessName()}</h1>
                    <p>{item.product?.title || 'Product title not available'}</p>
                    
                    {/* 🔥 CRITICAL FIX: Use actual size from order item */}
                    <p><strong>Size:</strong> {item.size || 'N/A'}</p>
                    
                    <p><strong>Quantity:</strong> {item.quantity || 1}</p>
                    <p><strong>Price:</strong> ₹{item.sellingPrice}.00</p>
                    
                    {/* ✅ Show fulfillment type */}
                    <p className='text-xs'>
                        <strong>{isSelfPickup ? 'Self Pickup' : 'Home Delivery'}</strong>
                    </p>
                    
                    {/* 👈 NEW: Show pickup time badge if scheduled */}
                    {isSelfPickup && order.pickupTime && (
                        <div className='mt-2 p-2 bg-white rounded-md border border-green-200'>
                            <p className='text-xs font-medium text-green-700 flex items-center gap-1'>
                                <ScheduleIcon fontSize='small' />
                                Scheduled: {formatDateTime(order.pickupTime)}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderItemCard;