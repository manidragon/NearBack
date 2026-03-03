// D:\Mani\Code with Zosh\Backup\source code\frontend\src\admin\pages\Home Page\ElectronicCategoriesTable.tsx
import * as React from "react";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { Box, IconButton, Modal, Snackbar, Alert, Button, Chip, Typography } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import RestoreFromTrashIcon from "@mui/icons-material/RestoreFromTrash";
import AddIcon from "@mui/icons-material/Add";
import ElectronicCategoryForm from "./ElectronicCategoryForm";
import { useAppSelector, useAppDispatch } from "../../../Redux Toolkit/Store";
import { 
  fetchElectronicCategories, 
  deleteElectronicCategory, 
  restoreElectronicCategory,
  resetOperationSuccess 
} from "../../../Redux Toolkit/Admin/ElectronicCategorySlice";
import type { ElectronicCategory } from "../../../types/electronicCategoryTypes";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 550,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};

function ElectronicCategoriesTable() {
  const [selectedCategory, setSelectedCategory] = React.useState<ElectronicCategory | null>(null);
  const [open, setOpen] = React.useState(false);
  const [isCreateMode, setIsCreateMode] = React.useState(false);
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.electronicCategories);
  const [snackbar, setSnackbar] = React.useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  React.useEffect(() => {
    dispatch(fetchElectronicCategories());
  }, [dispatch]);

  const handleOpen = (category: ElectronicCategory | null, createMode: boolean = false) => () => {
    setSelectedCategory(category);
    setIsCreateMode(createMode);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedCategory(null);
    setIsCreateMode(false);
    if (state.operationSuccess) {
      setSnackbar({ open: true, message: isCreateMode ? 'Category created successfully!' : 'Category updated successfully!', severity: 'success' });
      dispatch(fetchElectronicCategories());
      dispatch(resetOperationSuccess());
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await dispatch(deleteElectronicCategory(id));
        setSnackbar({ open: true, message: 'Category deleted successfully!', severity: 'success' });
        dispatch(fetchElectronicCategories());
      } catch (error) {
        setSnackbar({ open: true, message: 'Failed to delete category', severity: 'error' });
      }
    }
  };

  const handleRestore = async (id: string) => {
    if (window.confirm('Are you sure you want to restore this category?')) {
      try {
        await dispatch(restoreElectronicCategory(id));
        setSnackbar({ open: true, message: 'Category restored successfully!', severity: 'success' });
        dispatch(fetchElectronicCategories());
      } catch (error) {
        setSnackbar({ open: true, message: 'Failed to restore category', severity: 'error' });
      }
    }
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" gutterBottom>
          Electronic Categories Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpen(null, true)}
        >
          Add New Category
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 750 }} aria-label="electronic categories table">
          <TableHead>
            <TableRow>
              <TableCell>No</TableCell>
              <TableCell>Image</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Category ID</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {state.categories.map((category, index) => (
              <TableRow key={category._id} sx={{ opacity: category.isActive === false ? 0.6 : 1 }}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <img 
                    src={category.image} 
                    alt={category.name} 
                    style={{ width: 50, height: 50, objectFit: 'contain' }} 
                  />
                </TableCell>
                <TableCell>{category.name}</TableCell>
                <TableCell>
                  <code>{category.categoryId}</code>
                </TableCell>
                <TableCell>{category.description || '-'}</TableCell>
                <TableCell>
                  <Chip 
                    label={category.isActive ? 'Active' : 'Inactive'} 
                    color={category.isActive ? 'success' : 'default'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell align="right">
                  {category.isActive ? (
                    <>
                      <IconButton onClick={handleOpen(category)} size="small" title="Edit">
                        <EditIcon color="primary" />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(category._id!)} size="small" title="Delete">
                        <DeleteIcon color="error" />
                      </IconButton>
                    </>
                  ) : (
                    <IconButton onClick={() => handleRestore(category._id!)} size="small" title="Restore">
                      <RestoreFromTrashIcon color="warning" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {state.categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="textSecondary" sx={{ py: 3 }}>
                    No electronic categories found. Click "Add New Category" to create one.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Modal open={open} onClose={handleClose} aria-labelledby="modal-modal-title">
        <Box sx={style}>
          <ElectronicCategoryForm
            category={selectedCategory}
            isCreateMode={isCreateMode}
            handleClose={handleClose}
          />
        </Box>
      </Modal>

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
    </Box>
  );
}

export default ElectronicCategoriesTable;