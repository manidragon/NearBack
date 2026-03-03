// D:\Mani\Code with Zosh\Backup\source code\frontend\src\admin\pages\Home Page\HomeCategoryTable.tsx
import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { Box, IconButton, Modal, styled, Snackbar, Alert, Button, Typography } from "@mui/material";
import type { HomeCategory } from "../../../types/homeDataTypes";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddIcon from "@mui/icons-material/Add";
import UpdateHomeCategoryForm from "./UpdateHomeCategoryForm";
import { useAppSelector, useAppDispatch } from "../../../Redux Toolkit/Store";
import { resetCategoryUpdated, deleteHomeCategory } from "../../../Redux Toolkit/Admin/AdminSlice";

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
  width: 500,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

function HomeCategoryTable({categories, section}:{categories:HomeCategory[] | undefined, section: string}) {
  const [selectedCategory, setSelectedCategory] = React.useState<HomeCategory | null>(null);
  const [open, setOpen] = React.useState(false);
  const [isCreateMode, setIsCreateMode] = React.useState(false);
  const dispatch = useAppDispatch();
  const adminState = useAppSelector((state) => state.admin);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<'success' | 'error'>('success');

  const handleOpen = (category: HomeCategory | null, createMode: boolean = false) => () => {
    setSelectedCategory(category);
    setIsCreateMode(createMode);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedCategory(null);
    setIsCreateMode(false);
    if (adminState.categoryUpdated) {
      setSnackbarMessage(isCreateMode ? 'Banner created successfully!' : 'Banner updated successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      dispatch(resetCategoryUpdated());
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        await dispatch(deleteHomeCategory(id));
        setSnackbarMessage('Banner deleted successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } catch (error) {
        setSnackbarMessage('Failed to delete banner');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" gutterBottom>
          {section === 'GRID' ? 'Banner Grid Management' : section}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpen(null, true)}
        >
          Add New Banner
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 700 }} aria-label="customized table">
          <TableHead>
            <TableRow>
              <StyledTableCell>No</StyledTableCell>
              <StyledTableCell>Image</StyledTableCell>
              <StyledTableCell>Description</StyledTableCell>
              <StyledTableCell align="right">Actions</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories?.map((category: HomeCategory, index) => (
              <StyledTableRow key={category._id}>
                <StyledTableCell component="th" scope="row">{index + 1}</StyledTableCell>
                <StyledTableCell component="th" scope="row">
                  <img className="w-24 h-24 rounded-md object-cover" src={category.image} alt={category.description} />
                </StyledTableCell>
                <StyledTableCell>
                  {category.description || 'No description'}
                </StyledTableCell>
                <StyledTableCell align="right">
                  <IconButton onClick={handleOpen(category)} size="small" title="Edit">
                    <EditIcon className="text-blue-500" />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(category._id!)} size="small" title="Delete">
                    <DeleteIcon className="text-red-500" />
                  </IconButton>
                </StyledTableCell>
              </StyledTableRow>
            ))}
            {(!categories || categories.length === 0) && (
              <StyledTableRow>
                <StyledTableCell colSpan={4} align="center">
                  <Typography color="textSecondary">
                    No banners found. Click "Add New Banner" to create one.
                  </Typography>
                </StyledTableCell>
              </StyledTableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal open={open} onClose={handleClose} aria-labelledby="modal-modal-title">
        <Box sx={style}>
          <UpdateHomeCategoryForm
            category={selectedCategory}
            section={section}
            isCreateMode={isCreateMode}
            handleClose={handleClose}
          />
        </Box>
      </Modal>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}

export default HomeCategoryTable;