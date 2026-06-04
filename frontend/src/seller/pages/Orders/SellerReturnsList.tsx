// D:\Mani\Code with Zosh\Backup\source code\frontend\src\seller\pages\Orders\SellerReturnsList.tsx
import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Chip, Typography, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert, Box, IconButton, Collapse, Avatar, CircularProgress
} from '@mui/material';
import {
  CheckCircle, Cancel, LocalShipping, Replay, Check,
  KeyboardArrowDown, KeyboardArrowUp, LocationOn, Description,
  Image as ImageIcon, AccountCircle, Phone, Email
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import {
  fetchSellerReturns,
  approveReturn,
  rejectReturn,
  updateReturnStatus,
  clearSuccessMessage
} from '../../../Redux Toolkit/Customer/ReturnSlice';
import type { ReturnRequest, ReturnStatus } from '../../../types/orderTypes';
import dayjs from 'dayjs';

// ✅ Status Config
const getStatusConfig = (status: ReturnStatus) => {
  switch (status) {
    case 'PENDING': return { color: '#FFA500', label: 'Pending', icon: <Replay fontSize="small" /> };
    case 'APPROVED': return { color: '#1E90FF', label: 'Approved', icon: <Check fontSize="small" /> };
    case 'REJECTED': return { color: '#FF0000', label: 'Rejected', icon: <Cancel fontSize="small" /> };
    case 'PICKED_UP': return { color: '#9C27B0', label: 'Picked Up', icon: <LocalShipping fontSize="small" /> };
    case 'COMPLETED': return { color: '#32CD32', label: 'Refunded', icon: <CheckCircle fontSize="small" /> };
    case 'CANCELLED': return { color: '#999', label: 'Cancelled', icon: <Cancel fontSize="small" /> };
    default: return { color: '#999', label: status, icon: undefined };
  }
};

// ✅ Expandable Row Component (Hydration-Safe)
const ReturnRow: React.FC<{
  returnReq: ReturnRequest;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onMarkPickedUp: (id: string) => void;
  onMarkCompleted: (id: string) => void;
}> = ({ returnReq, onApprove, onReject, onMarkPickedUp, onMarkCompleted }) => {
  const [open, setOpen] = useState(false);
  const statusConf = getStatusConfig(returnReq.status as ReturnStatus);
  const customer = typeof returnReq.customer === 'object' ? returnReq.customer : null;
  const orderItem = typeof returnReq.orderItem === 'object' ? returnReq.orderItem : null;
  const product = orderItem?.product;
  const order = typeof returnReq.order === 'object' ? returnReq.order : null;

  const renderActions = () => {
    switch (returnReq.status) {
      case 'PENDING':
        return (
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button size="small" variant="contained" color="success" onClick={() => onApprove(returnReq._id)} startIcon={<CheckCircle />}>Approve</Button>
            <Button size="small" variant="outlined" color="error" onClick={() => onReject(returnReq._id)} startIcon={<Cancel />}>Reject</Button>
          </Box>
        );
      case 'APPROVED':
        return <Button size="small" variant="contained" color="primary" onClick={() => onMarkPickedUp(returnReq._id)} startIcon={<LocalShipping />}>Mark Picked Up</Button>;
      case 'PICKED_UP':
        return <Button size="small" variant="contained" color="success" onClick={() => onMarkCompleted(returnReq._id)} startIcon={<CheckCircle />}>Mark Completed</Button>;
      default:
        return null;
    }
  };

  // ✅ Safe address formatter
  const formatAddress = (addr: any) => {
    if (!addr) return null;
    const parts = [addr.street, addr.city, addr.district, addr.pincode ? `PIN: ${addr.pincode}` : null].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  const pickupAddr = formatAddress(returnReq.pickupAddress);
  const shippingAddr = formatAddress(order?.shippingAddress);

  return (
    <>
      <TableRow hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
        <TableCell padding="checkbox" sx={{ width: 40 }}>
          <IconButton size="small" onClick={() => setOpen(!open)} aria-label="expand row">
            {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ minWidth: 80 }}>{returnReq._id.slice(-6)}</TableCell>
        <TableCell sx={{ minWidth: 80 }}>{order?._id.slice(-6) || 'N/A'}</TableCell>
        <TableCell sx={{ minWidth: 140 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccountCircle fontSize="small" color="action" />
            <Typography variant="body2" noWrap>{customer?.fullName || 'Customer'}</Typography>
          </Box>
        </TableCell>
        <TableCell sx={{ minWidth: 100 }}>{returnReq.reason}</TableCell>
        <TableCell sx={{ minWidth: 90 }}><Typography color="success.main" fontWeight="medium">₹{returnReq.refundAmount}</Typography></TableCell>
        <TableCell sx={{ minWidth: 100 }}><Typography variant="caption" color="text.secondary">{dayjs(returnReq.createdAt).format('MMM DD, YYYY')}</Typography></TableCell>
        <TableCell sx={{ minWidth: 110 }}>
          <Chip icon={statusConf.icon} label={statusConf.label} size="small" sx={{ backgroundColor: `${statusConf.color}20`, color: statusConf.color, fontWeight: 'bold' }} />
        </TableCell>
        <TableCell align="right" sx={{ minWidth: 160 }}>{renderActions()}</TableCell>
      </TableRow>

      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ p: 3, bgcolor: 'grey.50', borderRadius: 2, m: 1 }}>

              {returnReq.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Description fontSize="small" color="primary" /> Return Description
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ pl: 3 }}>{returnReq.description}</Typography>
                </Box>
              )}

              {returnReq.images && returnReq.images.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ImageIcon fontSize="small" color="primary" /> Return Images ({returnReq.images.length})
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, pl: 3, flexWrap: 'wrap' }}>
                    {returnReq.images.map((img, idx) => (
                      <Box key={idx} component="img" src={img} alt={`Proof ${idx + 1}`} sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'grey.300', cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }} onClick={() => window.open(img, '_blank')} />
                    ))}
                  </Box>
                </Box>
              )}

              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOn fontSize="small" color="primary" /> Pickup Address
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ pl: 3 }}>
                  {pickupAddr || shippingAddr || 'No address provided'}
                </Typography>
              </Box>

              {/* ✅ Refund Method & Status */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>
                  Refund Details
                </Typography>
                <Box sx={{ pl: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Method:</strong> {returnReq.refundMethod || 'WALLET'}
                    {returnReq.refundMethod === 'RAZORPAY' && returnReq.razorpayRefundId && (
                      <Typography component="span" variant="caption" color="primary.main" sx={{ ml: 1 }}>
                        • Refund ID: {returnReq.razorpayRefundId.slice(-8)}
                      </Typography>
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    <strong>Status:</strong> {returnReq.refundStatus || 'PENDING'}
                    {returnReq.refundStatus === 'PROCESSING' && (
                      <Chip label="Processing" size="small" color="warning" variant="outlined" sx={{ ml: 1, fontSize: '0.7rem' }} />
                    )}
                  </Typography>
                  {returnReq.refundMethod === 'RAZORPAY' && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                      💡 Razorpay refunds take 2-5 business days to reflect in customer's account
                    </Typography>
                  )}
                </Box>
              </Box>

              {customer && (customer.email || customer.mobile) && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>Customer Contact</Typography>
                  <Box sx={{ pl: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    {customer.email && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Email fontSize="small" color="action" /><Typography variant="body2">{customer.email}</Typography></Box>}
                    {customer.mobile && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><Phone fontSize="small" color="action" /><Typography variant="body2">{customer.mobile}</Typography></Box>}
                  </Box>
                </Box>
              )}

              {product && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>Product Information</Typography>
                  <Box sx={{ pl: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
                    {product.images?.[0] && <Avatar variant="rounded" src={product.images[0]} sx={{ width: 50, height: 50 }} />}
                    <Box>
                      <Typography variant="body2" fontWeight="medium">{product.title}</Typography>
                      {orderItem?.size && <Typography variant="caption" color="text.secondary">Variant: {orderItem.size}</Typography>}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Qty: {orderItem?.quantity || 1} • Price: ₹{orderItem?.sellingPrice || 0}</Typography>
                    </Box>
                  </Box>
                </Box>
              )}

              <Box>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 0.5 }}>Return Timeline</Typography>
                <Box sx={{ pl: 3 }}>
                  <Typography variant="caption" color="text.secondary" display="block"><strong>Requested:</strong> {dayjs(returnReq.createdAt).format('MMM DD, YYYY • h:mm A')}</Typography>
                  {returnReq.approvedAt && <Typography variant="caption" color="text.secondary" display="block"><strong>Approved:</strong> {dayjs(returnReq.approvedAt).format('MMM DD, YYYY • h:mm A')}</Typography>}
                  {returnReq.pickedUpAt && <Typography variant="caption" color="text.secondary" display="block"><strong>Picked Up:</strong> {dayjs(returnReq.pickedUpAt).format('MMM DD, YYYY • h:mm A')}</Typography>}
                  {returnReq.completedAt && <Typography variant="caption" color="success.main" display="block" fontWeight="medium"><strong>Completed:</strong> {dayjs(returnReq.completedAt).format('MMM DD, YYYY • h:mm A')}</Typography>}
                </Box>
              </Box>

            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

// ✅ Main Component
const SellerReturnsList: React.FC = () => {
  const dispatch = useAppDispatch();
  const { returns, loading, error, successMessage } = useAppSelector(state => state.returns);
  const sellerAuth = useAppSelector(state => state.sellerAuth);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [currentReturnId, setCurrentReturnId] = useState<string | null>(null);

  useEffect(() => {
    const jwt = sellerAuth.jwt || localStorage.getItem('jwt');
    if (jwt) dispatch(fetchSellerReturns(jwt));
  }, [dispatch, sellerAuth.jwt]);

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => dispatch(clearSuccessMessage()), 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, dispatch]);

  const handleApprove = (id: string) => {
    const jwt = sellerAuth.jwt || localStorage.getItem('jwt');
    if (jwt) dispatch(approveReturn({ returnId: id, jwt }));
  };

  const handleOpenReject = (id: string) => {
    setCurrentReturnId(id);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    const jwt = sellerAuth.jwt || localStorage.getItem('jwt');
    if (currentReturnId && jwt) {
      dispatch(rejectReturn({ returnId: currentReturnId, reason: rejectReason || 'No reason provided', jwt }));
      setRejectDialogOpen(false);
      setRejectReason('');
    }
  };

  const handleMarkPickedUp = (id: string) => {
    const jwt = sellerAuth.jwt || localStorage.getItem('jwt');
    if (jwt) dispatch(updateReturnStatus({ returnId: id, status: 'PICKED_UP', jwt }));
  };

  const handleMarkCompleted = (id: string) => {
    const jwt = sellerAuth.jwt || localStorage.getItem('jwt');
    if (jwt) dispatch(updateReturnStatus({ returnId: id, status: 'COMPLETED', jwt }));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>📦 Return Requests</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell padding="checkbox" sx={{ width: 40 }}></TableCell>
              <TableCell sx={{ minWidth: 80 }}>Return ID</TableCell>
              <TableCell sx={{ minWidth: 80 }}>Order ID</TableCell>
              <TableCell sx={{ minWidth: 140 }}>Customer</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Reason</TableCell>
              <TableCell sx={{ minWidth: 90 }}>Refund</TableCell>
              <TableCell sx={{ minWidth: 100 }}>Date</TableCell>
              <TableCell sx={{ minWidth: 110 }}>Status</TableCell>
              <TableCell align="right" sx={{ minWidth: 160 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}><CircularProgress /></TableCell></TableRow>
            ) : !Array.isArray(returns) || returns.length === 0 ? (
              <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No return requests found</Typography></TableCell></TableRow>
            ) : (
              returns.map((item) => (
                <ReturnRow key={item._id} returnReq={item} onApprove={handleApprove} onReject={handleOpenReject} onMarkPickedUp={handleMarkPickedUp} onMarkCompleted={handleMarkCompleted} />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reject Return Request</DialogTitle>
        <DialogContent>
          <TextField autoFocus multiline rows={3} fullWidth placeholder="Reason for rejection..." value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} sx={{ mt: 1 }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRejectConfirm} color="error" variant="contained" disabled={!rejectReason.trim()}>Confirm Reject</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SellerReturnsList;