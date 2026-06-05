// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Account\ReturnHistory.tsx
import React, { useEffect } from 'react';
import { 
  Box, Typography, Card, CardContent, Chip, CircularProgress, Alert, 
  Stack, Avatar, LinearProgress, Button, Divider 
} from '@mui/material';
import { 
  CheckCircle, Pending, LocalShipping, Cancel, Replay, 
  AccountBalanceWallet, CalendarToday 
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { fetchUserReturns } from '../../../Redux Toolkit/Customer/ReturnSlice';
import type { ReturnRequest, ReturnStatus } from '../../../types/orderTypes';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

// 🔹 Helper: Get status configuration
const getStatusConfig = (status: ReturnStatus) => {
  switch (status) {
    case 'PENDING': return { color: '#FFA500', label: 'Pending Approval', icon: <Pending fontSize="small" /> };
    case 'APPROVED': return { color: '#1E90FF', label: 'Approved', icon: <LocalShipping fontSize="small" /> };
    case 'REJECTED': return { color: '#FF0000', label: 'Rejected', icon: <Cancel fontSize="small" /> };
    case 'PICKED_UP': return { color: '#9C27B0', label: 'Picked Up', icon: <LocalShipping fontSize="small" /> };
    case 'COMPLETED': return { color: '#32CD32', label: 'Refunded', icon: <CheckCircle fontSize="small" /> };
    case 'CANCELLED': return { color: '#999', label: 'Cancelled', icon: <Replay fontSize="small" /> };
    default: return { color: '#999', label: status, icon: undefined }; 
  }
};

// 🔹 Helper: Get product image safely
const getProductImage = (item: any): string => {
  if (!item) return 'https://via.placeholder.com/60?text=No+Image';
  
  if (item.product?.images?.[0]) return item.product.images[0];
  
  // Fallback to variant image
  if (item.variantId && item.product?.variants) {
    const variant = item.product.variants.find((v: any) => String(v._id) === String(item.variantId));
    if (variant?.images?.[0]) return variant.images[0];
  }
  
  return 'https://via.placeholder.com/60?text=No+Image';
};

const ReturnItemCard: React.FC<{ returnReq: ReturnRequest }> = ({ returnReq }) => {
  const navigate = useNavigate();
  const statusConfig = getStatusConfig(returnReq.status as ReturnStatus);
  
  // Get item details (handle populated vs ID string)
  const item = returnReq.orderItem;
  const itemTitle = (item as any)?.product?.title || 'Product';
  const variantName = (item as any)?.size || 'Standard';
  const imageSrc = getProductImage(item);

  return (
    <Card sx={{ mb: 2, borderRadius: 2, border: '1px solid #eee', overflow: 'hidden' }}>
      <CardContent sx={{ p: 3 }}>
        
        {/* ✅ Header: Status & Date */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Chip 
            icon={statusConfig.icon} 
            label={statusConfig.label} 
            sx={{ 
              backgroundColor: `${statusConfig.color}20`, 
              color: statusConfig.color,
              fontWeight: 'bold',
              fontSize: '0.8rem'
            }} 
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
            <CalendarToday fontSize="small" sx={{ fontSize: '1rem' }} />
            <Typography variant="caption">
              {dayjs(returnReq.createdAt).format('MMM DD, YYYY')}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* ✅ Body: Product & Reason */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {/* Product Image */}
          <Avatar 
            variant="rounded" 
            src={imageSrc} 
            sx={{ width: 70, height: 70, flexShrink: 0 }} 
          />
          
          {/* Product Details */}
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" noWrap>
              {itemTitle}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
              Variant: {variantName}
            </Typography>
            
            {/* Reason Badge */}
            <Chip 
              label={returnReq.reason} 
              size="small" 
              variant="outlined" 
              sx={{ 
                mt: 0.5, 
                fontSize: '0.75rem', 
                bgcolor: 'grey.50',
                borderColor: 'grey.300'
              }} 
            />
          </Box>
        </Box>

        {/* ✅ Footer: Refund Info */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mt: 2,
          p: 2,
          bgcolor: 'grey.50',
          borderRadius: 1.5
        }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Refund Amount
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="success.main">
              ₹{returnReq.refundAmount}
            </Typography>
          </Box>

          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Refund Method
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <AccountBalanceWallet fontSize="small" color="primary" />
              <Typography variant="body2" fontWeight="medium">
                Wallet
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* ✅ Progress Bar (Visual Feedback) */}
        {returnReq.status === 'PENDING' && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="indeterminate" color="warning" sx={{ height: 4, borderRadius: 2 }} />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Awaiting seller approval
            </Typography>
          </Box>
        )}

      </CardContent>
    </Card>
  );
};

const ReturnHistory: React.FC = () => {
  const dispatch = useAppDispatch();
  const { returns, loading, error } = useAppSelector(state => state.returns);
  const auth = useAppSelector(state => state.auth);

  useEffect(() => {
    const jwt = auth.jwt || localStorage.getItem('jwt');
    if (jwt && !returns.length) {
      dispatch(fetchUserReturns(jwt));
    }
  }, [dispatch, auth, returns.length]);

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', py: 10 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading return history...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ m: 3 }}>{error}</Alert>;
  }

  if (returns.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 10, color: 'text.secondary' }}>
        <Replay sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
        <Typography variant="h6">No Return Requests</Typography>
        <Typography variant="body2">You haven't requested any returns yet.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Replay color="primary" /> My Returns
      </Typography>
      
      <Stack spacing={2}>
        {returns.map((returnReq) => (
          <ReturnItemCard key={returnReq._id} returnReq={returnReq} />
        ))}
      </Stack>
    </Box>
  );
};

export default ReturnHistory;