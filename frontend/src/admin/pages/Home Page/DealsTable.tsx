// D:\Mani\Code with Zosh\Backup\source code\frontend\src\admin\pages\Home Page\DealsTable.tsx

import { Box, Button, IconButton, Modal, Paper, styled, Table, TableBody, TableCell, tableCellClasses, TableContainer, TableHead, TableRow, Snackbar, Alert, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import EditIcon from '@mui/icons-material/Edit';
import { deleteDeal, getAllDeals } from '../../../Redux Toolkit/Admin/DealSlice';
import UpdateDealForm from './UpdateDealForm';
import Delete from '@mui/icons-material/Delete';

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
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 450,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

const DealsTable = () => {
    const deal = useAppSelector(state => state.deal);
    const [selectedDealId, setSelectedDealId] = useState<string | undefined>();
    const [open, setOpen] = React.useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    const dispatch = useAppDispatch();

    const handleOpen = (id: string | undefined) => () => {
      setSelectedDealId(id);
      setOpen(true);
    };
    
    const handleClose = () => {
      setOpen(false);
      setSelectedDealId(undefined);
    };
    
    const handleDelete = (id: string) => async () => {
      if (window.confirm('Are you sure you want to delete this deal?')) {
        try {
          await dispatch(deleteDeal(id));
          setSnackbar({ open: true, message: 'Deal deleted successfully!', severity: 'success' });
          dispatch(getAllDeals());
        } catch (error) {
          setSnackbar({ open: true, message: 'Failed to delete deal', severity: 'error' });
        }
      }
    };

    const handleSnackbarClose = () => {
      setSnackbar({ ...snackbar, open: false });
    };
    
    useEffect(() => {
      dispatch(getAllDeals());
    }, [dispatch]);

    return (
      <>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 700 }} aria-label="customized table">
            <TableHead>
              <TableRow>
                <StyledTableCell>No</StyledTableCell>
                <StyledTableCell>Image</StyledTableCell>
                <StyledTableCell>Category</StyledTableCell>
                <StyledTableCell>Discount</StyledTableCell>
                <StyledTableCell align="right">Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deal.deals.length === 0 ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={5} align="center">
                    <Typography color="textSecondary" sx={{ py: 3 }}>
                      No deals found. Click "Create Deal" to add one.
                    </Typography>
                  </StyledTableCell>
                </StyledTableRow>
              ) : (
                deal.deals.map((deal: any, index) => (
                  <StyledTableRow key={deal._id}>
                    <StyledTableCell component="th" scope="row">
                      {index + 1}
                    </StyledTableCell>
                    <StyledTableCell>
                      <img
                        className="w-20 h-20 rounded-md object-cover"
                        src={deal.category?.image || '/placeholder.jpg'}
                        alt={deal.category?.name || 'Deal'}
                      />
                    </StyledTableCell>
                    <StyledTableCell>
                      {deal.category?.name || deal.category?.categoryId || 'N/A'}
                    </StyledTableCell>
                    <StyledTableCell>
                      <span className="font-bold text-red-600">{deal.discount}%</span>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <IconButton onClick={handleOpen(deal._id)} title="Edit">
                        <EditIcon className="text-blue-500" />
                      </IconButton>
                      <IconButton onClick={handleDelete(deal._id)} title="Delete">
                        <Delete className="text-red-600" />
                      </IconButton>
                    </StyledTableCell>
                  </StyledTableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {selectedDealId && (
          <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
          >
            <Box sx={style}>
              <UpdateDealForm 
                deal={deal.deals.find((d: any) => d._id === selectedDealId)} 
                handleClose={handleClose}
              />
            </Box>
          </Modal>
        )}

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Alert onClose={handleSnackbarClose} severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </>
    )
}

export default DealsTable;