// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\components\Wallet\WalletBalance.tsx
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, IconButton, Popover, List, ListItem,
  ListItemIcon, ListItemText, Divider, Chip, CircularProgress, Alert
} from '@mui/material';
import { AccountBalanceWallet, ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { fetchUserReturns } from '../../../Redux Toolkit/Customer/ReturnSlice';
import { api } from '../../../Config/Api';
import type { WalletTransaction } from '../../../types/orderTypes';
import dayjs from 'dayjs';

interface WalletBalanceProps {
  compact?: boolean; // true = sidebar mode (popover), false = full page mode
}

// ✅ Local transaction type for safety
interface LocalTransaction {
  _id?: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  reason: string;
  referenceId: string;
  referenceModel?: string;
  balanceAfter?: number;
  notes?: string;
  createdAt: string;
}

const WalletBalance: React.FC<WalletBalanceProps> = ({ compact = false }) => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector(state => state.auth);

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [recentTransactions, setRecentTransactions] = useState<LocalTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

  // ✅ Fetch wallet data on mount
  useEffect(() => {
    fetchWalletData();
  }, [auth.jwt]);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      const jwt = auth.jwt || localStorage.getItem('jwt');
      if (!jwt) {
        console.warn('⚠️ No JWT token found');
        return;
      }

      const response = await api.get('/api/wallet', {
        headers: { Authorization: `Bearer ${jwt}` }
      });

      setWalletBalance(response.data.balance || 0);
      setRecentTransactions(response.data.recentTransactions || []);
    } catch (err: any) {
      console.error('❌ Failed to fetch wallet:', err);
      setError(err.response?.data?.error || 'Failed to load wallet');
      // Fallback: Calculate balance from return refunds
      calculateBalanceFromReturns();
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fallback: Calculate balance from completed returns (Phase 1)
  const calculateBalanceFromReturns = async () => {
    try {
      const jwt = auth.jwt || localStorage.getItem('jwt');
      if (!jwt) return;

      const returns: any = await dispatch(fetchUserReturns(jwt)).unwrap();
      
      const totalRefunds = returns
        .filter((r: any) => r.status === 'COMPLETED' && r.refundMethod === 'WALLET')
        .reduce((sum: number, r: any) => sum + r.refundAmount, 0);
      
      setWalletBalance(totalRefunds);
    } catch (error) {
      console.error('❌ Fallback calculation failed:', error);
    }
  };

  // ✅ Handle popover click (compact mode only)
  const handlePopoverOpen = (event: React.MouseEvent<HTMLElement>) => {
    if (compact) {
      setAnchorEl(event.currentTarget);
    }
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  // ✅ Format transaction reason for display
  const formatReason = (reason: string) => {
    switch (reason) {
      case 'RETURN_REFUND': return 'Return Refund';
      case 'ORDER_PAYMENT': return 'Order Payment';
      case 'COUPON_CASHBACK': return 'Cashback';
      case 'REFERRAL_BONUS': return 'Referral Bonus';
      default: return reason.replace(/_/g, ' ');
    }
  };

  // ✅ Loading state
  if (loading && walletBalance === 0 && recentTransactions.length === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: compact ? 1.5 : 3 }}>
        <CircularProgress size={compact ? 16 : 24} />
        <Typography variant={compact ? "caption" : "body1"}>Loading wallet...</Typography>
      </Box>
    );
  }

  // ✅ COMPACT MODE: Sidebar widget with popover
  if (compact) {
    return (
      <>
        <Box
          onClick={handlePopoverOpen}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1.5,
            bgcolor: 'primary.lighter',
            borderRadius: 2,
            cursor: 'pointer',
            '&:hover': { bgcolor: 'primary.light' },
            transition: 'background-color 0.2s'
          }}
        >
          <AccountBalanceWallet fontSize="small" color="primary" />
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              Wallet
            </Typography>
            <Typography variant="body2" fontWeight="bold" color="primary.main">
              ₹{walletBalance.toFixed(0)}
            </Typography>
          </Box>
          {error && (
            <Typography variant="caption" color="error" sx={{ ml: 1 }}>⚠️</Typography>
          )}
        </Box>

        {/* ✅ Popover for compact mode */}
        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handlePopoverClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
          transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        >
          <Box sx={{ p: 2, width: 320 }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
              Wallet Balance: ₹{walletBalance.toFixed(0)}
            </Typography>
            
            {error && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {recentTransactions.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                No recent transactions
              </Typography>
            ) : (
              <List dense sx={{ maxHeight: 250, overflow: 'auto' }}>
                {recentTransactions.map((tx) => (
                  <React.Fragment key={tx._id || tx.referenceId}>
                    <ListItem sx={{ py: 1, px: 0 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        {tx.type === 'CREDIT' ? (
                          <ArrowUpward fontSize="small" color="success" />
                        ) : (
                          <ArrowDownward fontSize="small" color="error" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="body2" fontWeight="medium">
                            {formatReason(tx.reason)}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            {dayjs(tx.createdAt).format('MMM DD')}
                          </Typography>
                        }
                      />
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={tx.type === 'CREDIT' ? 'success.main' : 'error.main'}
                      >
                        {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toFixed(0)}
                      </Typography>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </Popover>
      </>
    );
  }

  // ✅ FULL PAGE MODE: Dedicated wallet page
  return (
    <Box sx={{ maxWidth: 700, mx: 'auto' }}>
      
      {/* 💰 Balance Card */}
      <Box sx={{
        p: 4,
        bgcolor: 'primary.lighter',
        borderRadius: 3,
        mb: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 3,
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <Box sx={{
          width: 60, height: 60, borderRadius: '50%',
          bgcolor: 'primary.main',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <AccountBalanceWallet sx={{ fontSize: 32, color: 'white' }} />
        </Box>
        <Box>
          <Typography variant="body1" color="text.secondary">
            Available Balance
          </Typography>
          <Typography variant="h3" fontWeight="bold" color="primary.main">
            ₹{walletBalance.toFixed(0)}
          </Typography>
        </Box>
      </Box>

      {/* 📜 Transactions Section Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold">
          Recent Transactions
        </Typography>
        {loading && recentTransactions.length > 0 && (
          <CircularProgress size={20} />
        )}
      </Box>

      {/* ✅ Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* ✅ Empty State */}
      {recentTransactions.length === 0 ? (
        <Box sx={{
          textAlign: 'center', py: 6, color: 'text.secondary',
          border: '2px dashed', borderColor: 'grey.300', borderRadius: 2
        }}>
          <AccountBalanceWallet sx={{ fontSize: 48, mb: 2, opacity: 0.3 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>No transactions yet</Typography>
          <Typography variant="body2">
            Complete a return request to receive wallet credits
          </Typography>
        </Box>
      ) : (
        /* ✅ Transaction List */
        <List sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 1 }}>
          {recentTransactions.map((tx) => (
            <React.Fragment key={tx._id || tx.referenceId}>
              <ListItem sx={{ py: 2, px: 2 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Box sx={{
                    width: 36, height: 36, borderRadius: '50%',
                    bgcolor: tx.type === 'CREDIT' ? 'success.lighter' : 'error.lighter',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {tx.type === 'CREDIT' ? (
                      <ArrowUpward fontSize="small" color="success" />
                    ) : (
                      <ArrowDownward fontSize="small" color="error" />
                    )}
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography variant="body1" fontWeight="medium">
                      {formatReason(tx.reason)}
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" color="text.secondary">
                      {dayjs(tx.createdAt).format('MMM DD, YYYY • h:mm A')}
                      <br />
                      <Typography component="span" variant="caption">
                        Ref: {tx.referenceId?.slice(-8) || 'N/A'}
                      </Typography>
                    </Typography>
                  }
                />
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color={tx.type === 'CREDIT' ? 'success.main' : 'error.main'}
                  sx={{ minWidth: 80, textAlign: 'right' }}
                >
                  {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount.toFixed(0)}
                </Typography>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      )}
    </Box>
  );
};

export default WalletBalance;