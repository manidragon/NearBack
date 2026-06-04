// D:\Mani\Code with Zosh\Backup\source code\frontend\src\seller\pages\Payment\TransactionTable.tsx
import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import Collapse from '@mui/material/Collapse';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme, useMediaQuery } from '@mui/material';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  InputAdornment,
  Chip as MuiChip,
  Stack,
} from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import SortIcon from '@mui/icons-material/Sort';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CheckIcon from '@mui/icons-material/Check';

import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { fetchTransactionsBySeller } from '../../../Redux Toolkit/Seller/transactionSlice';
import { type Transaction } from '../../../types/Transaction';
import { redableDateTime } from '../../../util/redableDateTime';

// ✅ Helper: Format currency
const formatCurrency = (amount: number | undefined | null) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
  return `₹${Number(amount).toFixed(2)}`;
};

// ✅ Helper: Get payment status badge color
const getStatusColor = (status: string) => {
  switch (status) {
    case 'COMPLETED': return 'success';
    case 'PENDING': return 'warning';
    case 'FAILED': return 'error';
    case 'REFUNDED': return 'default';
    default: return 'default';
  }
};

// ✅ Helper: Get payment method label
const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case 'RAZORPAY': return 'Razorpay';
    case 'CASH_ON_DELIVERY': return 'COD';
    default: return method;
  }
};

// ✅ Filter State Interface
interface FilterState {
  paymentMethod: string;
  paymentStatus: string;
  dateFrom: string;
  dateTo: string;
  sortBy: 'date' | 'amount' | 'netAmount';
  sortOrder: 'asc' | 'desc';
}

// ✅ Mobile Card Row Component
function MobileTransactionCard({ transaction }: { transaction: Transaction }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Paper sx={{ mb: 2, p: 2, bgcolor: 'background.paper' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="subtitle2" fontWeight="bold">
          #{transaction.order?._id?.slice(-8)}
        </Typography>
        <Chip
          label={transaction.paymentStatus}
          color={getStatusColor(transaction.paymentStatus) as any}
          size="small"
        />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        📅 {redableDateTime(transaction.date)}
      </Typography>
      <Typography variant="body2" sx={{ mb: 0.5 }}>
        👤 {transaction.customer?.fullName || 'N/A'}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        {transaction.customer?.email}
      </Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mb: 1 }}>
        <Box>
          <Typography variant="caption" color="text.secondary">Total Paid</Typography>
          <Typography variant="body2" fontWeight="bold">{formatCurrency(transaction.amount)}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Platform Fee</Typography>
          <Typography variant="body2">{formatCurrency(transaction.platformFee)}</Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">Seller Gets</Typography>
          <Typography variant="body2" fontWeight="bold" color="success.main">
            {formatCurrency(transaction.netAmount)}
          </Typography>
        </Box>
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        💳 {getPaymentMethodLabel(transaction.paymentMethod)}
      </Typography>
      <IconButton size="small" onClick={() => setOpen(!open)} sx={{ mt: 1 }}>
        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
      </IconButton>
      <Collapse in={open}>
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            Order Status: {transaction.order?.orderStatus}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            MRP: {formatCurrency(transaction.order?.totalMrpPrice)}
          </Typography>
          {transaction.razorpayPaymentId && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', wordBreak: 'break-all' }}>
              Payment ID: {transaction.razorpayPaymentId}
            </Typography>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}

// ✅ Desktop Table Row Component
function DesktopTransactionRow({ transaction }: { transaction: Transaction }) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <TableRow hover>
        <TableCell sx={{ py: 1, px: 1.5 }}>
          <Typography variant="caption" sx={{ display: 'block', fontSize: '0.75rem' }}>
            {redableDateTime(transaction.date).split(" at ")[0]}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {redableDateTime(transaction.date).split(" at ")[1]}
          </Typography>
        </TableCell>
        <TableCell sx={{ py: 1, px: 1.5 }}>
          <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>
            {transaction.customer?.fullName || 'N/A'}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', display: 'block' }}>
            {transaction.customer?.email}
          </Typography>
        </TableCell>
        <TableCell sx={{ py: 1, px: 1.5 }}>
          <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>
            #{transaction.order?._id?.slice(-8)}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
            {transaction.order?.orderStatus}
          </Typography>
        </TableCell>
        <TableCell align="right" sx={{ py: 1, px: 1.5 }}>
          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.85rem' }}>
            {formatCurrency(transaction.amount)}
          </Typography>
        </TableCell>
        <TableCell align="right" sx={{ py: 1, px: 1.5 }}>
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
            {formatCurrency(transaction.platformFee)}
          </Typography>
        </TableCell>
        <TableCell align="right" sx={{ py: 1, px: 1.5 }}>
          <Typography variant="body2" fontWeight="bold" color="success.main" sx={{ fontSize: '0.85rem' }}>
            {formatCurrency(transaction.netAmount)}
          </Typography>
        </TableCell>
        <TableCell sx={{ py: 1, px: 1.5 }}>
          <Chip
            label={transaction.paymentStatus}
            color={getStatusColor(transaction.paymentStatus) as any}
            size="small"
            sx={{ fontSize: '0.7rem' }}
          />
        </TableCell>
        <TableCell sx={{ py: 1, px: 1.5 }}>
          <Typography variant="caption" sx={{ fontSize: '0.75rem' }}>
            {getPaymentMethodLabel(transaction.paymentMethod)}
          </Typography>
        </TableCell>
        <TableCell sx={{ py: 1, px: 1.5 }}>
          <IconButton size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={9} sx={{ py: 0, px: 0 }}>
          <Collapse in={open}>
            <Box sx={{ p: 2, bgcolor: 'grey.50' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Order MRP: {formatCurrency(transaction.order?.totalMrpPrice)}
              </Typography>
              {transaction.razorpayPaymentId && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', wordBreak: 'break-all' }}>
                  Payment ID: {transaction.razorpayPaymentId}
                </Typography>
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// ✅ Main Table Component
export default function TransactionTable() {
  const transaction = useAppSelector(state => state.transaction);
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // ✅ FIXED: Explicitly typed initial filters to resolve TS errors
  const initialFilters: FilterState = {
    paymentMethod: 'ALL',
    paymentStatus: 'ALL',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date',
    sortOrder: 'desc',
  };

  const [appliedFilters, setAppliedFilters] = React.useState<FilterState>(initialFilters);
  const [tempFilters, setTempFilters] = React.useState<FilterState>(initialFilters);

  // Fetch transactions on mount
  React.useEffect(() => {
    dispatch(fetchTransactionsBySeller(localStorage.getItem("jwt") || ""));
  }, [dispatch]);

  // ✅ Apply filters and sorting based on appliedFilters (not tempFilters)
  const filteredAndSortedTransactions = React.useMemo(() => {

    let result = [...transaction.transactions];

    if (appliedFilters.paymentMethod !== 'ALL') {
      result = result.filter(t => t.paymentMethod === appliedFilters.paymentMethod);
    }
    if (appliedFilters.paymentStatus !== 'ALL') {
      result = result.filter(t => t.paymentStatus === appliedFilters.paymentStatus);
    }
    if (appliedFilters.dateFrom) {
      const fromDate = new Date(appliedFilters.dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      result = result.filter(t => new Date(t.date) >= fromDate);
    }
    if (appliedFilters.dateTo) {
      const toDate = new Date(appliedFilters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(t => new Date(t.date) <= toDate);
    }

    result.sort((a, b) => {
      let comparison = 0;
      if (appliedFilters.sortBy === 'date') comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (appliedFilters.sortBy === 'amount') comparison = (a.amount || 0) - (b.amount || 0);
      else if (appliedFilters.sortBy === 'netAmount') comparison = (a.netAmount || 0) - (b.netAmount || 0);
      return appliedFilters.sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [transaction.transactions, appliedFilters]);

  // ✅ Handlers
  const handleApplyFilters = () => setAppliedFilters({ ...tempFilters });

  const handleClearFilters = () => {
    setTempFilters(initialFilters);
    setAppliedFilters(initialFilters);
  };

  const handleChipDelete = (key: keyof FilterState, value: any) => {
    const newFilters: FilterState = { ...appliedFilters, [key]: value };
    setAppliedFilters(newFilters);
    setTempFilters(newFilters);
  };

  // ✅ Check states
  const hasUnappliedChanges =
    tempFilters.paymentMethod !== appliedFilters.paymentMethod ||
    tempFilters.paymentStatus !== appliedFilters.paymentStatus ||
    tempFilters.dateFrom !== appliedFilters.dateFrom ||
    tempFilters.dateTo !== appliedFilters.dateTo ||
    tempFilters.sortBy !== appliedFilters.sortBy ||
    tempFilters.sortOrder !== appliedFilters.sortOrder;

  const hasActiveFilters =
    appliedFilters.paymentMethod !== 'ALL' ||
    appliedFilters.paymentStatus !== 'ALL' ||
    appliedFilters.dateFrom !== '' ||
    appliedFilters.dateTo !== '';

  if (transaction.loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>Loading transactions...</Box>;
  }
  if (transaction.error) {
    return <Box sx={{ p: 2, color: 'error.main', bgcolor: 'error.lighter', borderRadius: 1 }}>Error: {transaction.error}</Box>;
  }

  return (
    <>
      {/* ✅ Filter & Sort Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterListIcon color="primary" />
          <Typography variant="h6" fontWeight="bold">Filters & Sorting</Typography>
          {hasActiveFilters && (
            <Button size="small" startIcon={<ClearIcon />} onClick={handleClearFilters} color="error" variant="text" sx={{ ml: 'auto', mr: 2 }}>
              Clear All
            </Button>
          )}
        </Box>

        {/* ✅ Responsive Flex Layout (Replaces Grid to fix TS errors) */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(20% - 8px)' } }}>
            <FormControl fullWidth size="small">
              <InputLabel>Payment Method</InputLabel>
              <Select value={tempFilters.paymentMethod} label="Payment Method" onChange={(e) => setTempFilters({ ...tempFilters, paymentMethod: e.target.value })} startAdornment={<InputAdornment position="start">💳</InputAdornment>}>
                <MenuItem value="ALL">All Methods</MenuItem>
                <MenuItem value="RAZORPAY">Razorpay</MenuItem>
                <MenuItem value="CASH_ON_DELIVERY">Cash on Delivery</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(20% - 8px)' } }}>
            <FormControl fullWidth size="small">
              <InputLabel>Payment Status</InputLabel>
              <Select value={tempFilters.paymentStatus} label="Payment Status" onChange={(e) => setTempFilters({ ...tempFilters, paymentStatus: e.target.value })} startAdornment={<InputAdornment position="start">✅</InputAdornment>}>
                <MenuItem value="ALL">All Status</MenuItem>
                <MenuItem value="COMPLETED">Completed</MenuItem>
                <MenuItem value="PENDING">Pending</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
                <MenuItem value="REFUNDED">Refunded</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(20% - 8px)' } }}>
            <TextField fullWidth size="small" type="date" label="From Date" value={tempFilters.dateFrom} onChange={(e) => setTempFilters({ ...tempFilters, dateFrom: e.target.value })} InputLabelProps={{ shrink: true }} InputProps={{ startAdornment: <InputAdornment position="start"><CalendarTodayIcon fontSize="small" /></InputAdornment> }} />
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(20% - 8px)' } }}>
            <TextField fullWidth size="small" type="date" label="To Date" value={tempFilters.dateTo} onChange={(e) => setTempFilters({ ...tempFilters, dateTo: e.target.value })} InputLabelProps={{ shrink: true }} InputProps={{ startAdornment: <InputAdornment position="start"><CalendarTodayIcon fontSize="small" /></InputAdornment> }} />
          </Box>

          <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 8px)', md: '1 1 calc(20% - 8px)' } }}>
            <Button fullWidth variant="contained" color="primary" onClick={handleApplyFilters} startIcon={<CheckIcon />} sx={{ height: '40px', bgcolor: hasUnappliedChanges ? 'success.main' : 'primary.main', '&:hover': { bgcolor: hasUnappliedChanges ? 'success.dark' : 'primary.dark' } }}>
              Apply Filter
            </Button>
          </Box>
        </Box>

        {/* ✅ Active Filter Chips */}
        {hasActiveFilters && (
          <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap' }}>
            {appliedFilters.paymentMethod !== 'ALL' && <MuiChip label={`Method: ${appliedFilters.paymentMethod}`} onDelete={() => handleChipDelete('paymentMethod', 'ALL')} color="primary" size="small" />}
            {appliedFilters.paymentStatus !== 'ALL' && <MuiChip label={`Status: ${appliedFilters.paymentStatus}`} onDelete={() => handleChipDelete('paymentStatus', 'ALL')} color="primary" size="small" />}
            {appliedFilters.dateFrom && <MuiChip label={`From: ${appliedFilters.dateFrom}`} onDelete={() => handleChipDelete('dateFrom', '')} color="primary" size="small" />}
            {appliedFilters.dateTo && <MuiChip label={`To: ${appliedFilters.dateTo}`} onDelete={() => handleChipDelete('dateTo', '')} color="primary" size="small" />}
          </Stack>
        )}

        {hasUnappliedChanges && <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>⚠️ You have unapplied changes. Click "Apply Filter" to update.</Typography>}
      </Paper>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Showing {filteredAndSortedTransactions.length} of {transaction.transactions.length} transactions</Typography>

      {/* ✅ Desktop Table */}
      {!isMobile && (
        <TableContainer component={Paper} sx={{ maxHeight: 600, overflow: 'auto', '& .MuiTableHead-root': { position: 'sticky', top: 0, zIndex: 1, backgroundColor: 'primary.main' }, '& .MuiTableHead-root .MuiTableCell-root': { color: 'white', fontWeight: 'bold', fontSize: '0.85rem', py: 1.5, px: 2 } }}>
          <Table aria-label="transaction table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ minWidth: 130 }}>Date</TableCell>
                <TableCell sx={{ minWidth: 180 }}>Customer</TableCell>
                <TableCell sx={{ minWidth: 120 }}>Order</TableCell>
                <TableCell align="right" sx={{ minWidth: 100 }}>Total Paid</TableCell>
                <TableCell align="right" sx={{ minWidth: 90 }}>Platform Fee</TableCell>
                <TableCell align="right" sx={{ minWidth: 100 }}>Seller Earnings</TableCell>
                <TableCell sx={{ minWidth: 100 }}>Status</TableCell>
                <TableCell sx={{ minWidth: 110 }}>Method</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedTransactions.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center" sx={{ py: 4 }}><Typography color="text.secondary">No transactions found</Typography></TableCell></TableRow>
              ) : (
                filteredAndSortedTransactions.map((item) => <DesktopTransactionRow key={item._id} transaction={item} />)
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ✅ Mobile Cards */}
      {isMobile && (
        <Box>
          {filteredAndSortedTransactions.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" py={4}>No transactions found</Typography>
          ) : (
            filteredAndSortedTransactions.map((item) => <MobileTransactionCard key={item._id} transaction={item} />)
          )}
        </Box>
      )}

     {/* ✅ Summary Footer */}
{filteredAndSortedTransactions.length > 0 && (
  <Paper sx={{ mt: 2, p: 2, bgcolor: 'grey.50' }}>
    {(() => {
      // ✅ Filter only COMPLETED transactions for earnings
      const completedTransactions = filteredAndSortedTransactions.filter(
        t => t.paymentStatus === 'COMPLETED'
      );
      
      const totalGross = completedTransactions.reduce((sum, t) => sum + (t.amount ?? 0), 0);
      const totalFees = completedTransactions.reduce((sum, t) => sum + (t.platformFee ?? 0), 0);
      const totalNet = completedTransactions.reduce((sum, t) => sum + (t.netAmount ?? 0), 0);
      
      // ✅ Calculate refunded amount from order's returnRequest
      // We need to check if the order has completed returns
      const totalRefunded = completedTransactions.reduce((sum, t) => {
        // Check if order has returnRequest with COMPLETED status
        const orderHasRefund = t.order?.orderItems?.some((item: any) => 
          item.returnRequest?.status === 'COMPLETED' && 
          item.returnRequest?.refundStatus === 'COMPLETED'
        );
        
        if (orderHasRefund) {
          // Calculate total refunded amount for this order
          const orderRefunded = t.order?.orderItems?.reduce((itemSum: number, item: any) => {
            if (item.returnRequest?.status === 'COMPLETED' && 
                item.returnRequest?.refundStatus === 'COMPLETED') {
              return itemSum + (item.returnRequest.refundAmount || item.sellingPrice || 0);
            }
            return itemSum;
          }, 0) || 0;
          
          return sum + orderRefunded;
        }
        return sum;
      }, 0);
      
      // ✅ Net after returns
      const netAfterReturns = totalNet - totalRefunded;

      return (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(5, 1fr)' }, gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Total Transactions</Typography>
            <Typography variant="h6" fontWeight="bold">{completedTransactions.length}</Typography>
            <Typography variant="caption" color="text.secondary">
              (of {filteredAndSortedTransactions.length} shown)
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Total Gross</Typography>
            <Typography variant="h6" fontWeight="bold">
              {formatCurrency(totalGross)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              (COMPLETED only)
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Platform Fees</Typography>
            <Typography variant="h6" fontWeight="bold" color="warning.main">
              {formatCurrency(totalFees)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Refunded</Typography>
            <Typography variant="h6" fontWeight="bold" color="error.main">
              -{formatCurrency(totalRefunded)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              (Completed returns)
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Net Earnings</Typography>
            <Typography variant="h6" fontWeight="bold" color="success.main">
              {formatCurrency(netAfterReturns)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              (After returns)
            </Typography>
          </Box>
        </Box>
      );
    })()}
  </Paper>
)}
    </>
  );
}