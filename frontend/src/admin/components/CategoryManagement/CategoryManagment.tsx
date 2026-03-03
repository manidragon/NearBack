// D:\Mani\Code with Zosh\Backup\source code\frontend\src\admin\components\CategoryManagement\CategoryManagement.tsx

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Tabs,
  Tab,
  Modal,
  Paper,
  CircularProgress,
  Alert,
  Snackbar,
  Slide,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import {
  fetchCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesByLevel,
} from "../../../Redux Toolkit/Admin/CategorySlice";
import CategoryTable from "./CategoryTable";
import CreateCategoryForm from "./CreateCategoryForm";
import UpdateCategoryForm from "./UpdateCategoryForm";
import type { Category } from "../../../types/categoryTypes";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const CategoryManagement = () => {
  const dispatch = useAppDispatch();
  const categoryState = useAppSelector((state) => state.category);
  const { categories, loading, error, success } = categoryState;

  const [activeTab, setActiveTab] = useState(0);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openUpdateModal, setOpenUpdateModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    open: boolean;
    category: Category | null;
  }>({
    open: false,
    category: null,
  });
  
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      setSnackbar({
        open: true,
        message: 'Operation completed successfully!',
        severity: 'success',
      });
      
      const timer = setTimeout(() => {
        dispatch({ type: 'category/resetCategoryState' });
        setSnackbar((prev) => ({ ...prev, open: false }));
      }, 3000);
      
      return () => clearTimeout(timer);
    }
    
    if (error) {
      setSnackbar({
        open: true,
        message: error,
        severity: 'error',
      });
    }
  }, [success, error, dispatch]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    dispatch(getCategoriesByLevel(newValue + 1));
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setOpenUpdateModal(true);
  };

  const handleDelete = (category: Category) => {
    setDeleteConfirmation({ open: true, category });
  };

  const confirmDelete = async () => {
    if (deleteConfirmation.category) {
      try {
        await dispatch(
          deleteCategory({
            id: deleteConfirmation.category._id,
            jwt: localStorage.getItem("jwt") || "",
          })
        );
        setDeleteConfirmation({ open: false, category: null });
      } catch (error) {
        console.error("Delete failed:", error);
      }
    }
  };

  const handleCloseModals = () => {
    setOpenCreateModal(false);
    setOpenUpdateModal(false);
    setSelectedCategory(null);
    setDeleteConfirmation({ open: false, category: null });
  };

 

  // ✅ UPDATED: Sort Level 3 categories by Parent Category (Level 2)
  const getCategoriesByLevelFiltered = (level: number): Category[] => {
    const filtered = categories.filter((cat) => cat.level === level);
    
    // ✅ For Level 3, sort by parent category name first, then by order/name
    if (level === 3) {
      return filtered.sort((a, b) => {
        // Get parent category names for comparison
        const parentA = categories.find(p => p._id === a.parentCategory);
        const parentB = categories.find(p => p._id === b.parentCategory);
        
        // ✅ Primary: Sort by parent category name
        const parentNameA = parentA?.name || '';
        const parentNameB = parentB?.name || '';
        const parentCompare = parentNameA.localeCompare(parentNameB);
        
        if (parentCompare !== 0) {
          return parentCompare;
        }
        
        // ✅ Secondary: Sort by order field (if exists)
        const orderA = a.order || 999999;
        const orderB = b.order || 999999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        
        // ✅ Tertiary: Sort by name alphabetically
        return (a.name || '').localeCompare(b.name || '');
      });
    }
    
    // ✅ For Level 1 & 2, sort by order field
    if (level <= 2) {
      return filtered.sort((a, b) => {
        const orderA = a.order || 999999;
        const orderB = b.order || 999999;
        if (orderA !== orderB) {
          return orderA - orderB;
        }
        return (a.name || '').localeCompare(b.name || '');
      });
    }
    
    return filtered;
  };

  const getParentCategoriesForLevel = (level: number): Category[] => {
    if (level === 1) return [];

    const parents = categories.filter((cat) => cat.level === level - 1);

    if (process.env.NODE_ENV === 'development' && level > 1) {
      console.log(`Level ${level} parents:`, parents.map(p => ({
        id: p._id,
        name: p.name,
        categoryId: p.categoryId
      })));
    }

    return parents;
  };

  if (loading && categories.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "500px",
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="h5" sx={{ ml: 3 }}>
          Loading categories...
        </Typography>
      </Box>
    );
  }

  if (error && !snackbar.open) {
    return (
      <Box sx={{ maxWidth: 1400, margin: "0 auto", p: 3 }}>
        <Alert severity="error" onClose={() => dispatch(fetchCategories())}>
          {error}
        </Alert>
        <Button
          onClick={() => dispatch(fetchCategories())}
          variant="contained"
          color="primary"
          sx={{ mt: 2 }}
        >
          Retry Loading
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1400, margin: "0 auto", p: 3 }}>
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        TransitionComponent={Slide}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h3" gutterBottom>
          Category Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenCreateModal(true)}
        >
          + Create New Category
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="category level tabs"
          variant="fullWidth"
        >
          <Tab label="Level 1 Categories (Main)" />
          <Tab label="Level 2 Categories (Sub)" />
          <Tab label="Level 3 Categories (Product Types)" />
        </Tabs>
      </Paper>

      <TabPanel value={activeTab} index={0}>
        <CategoryTable
          categories={getCategoriesByLevelFiltered(1)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          level={1}
          parentCategories={[]}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <CategoryTable
          categories={getCategoriesByLevelFiltered(2)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          level={2}
          parentCategories={getParentCategoriesForLevel(2)}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <CategoryTable
          categories={getCategoriesByLevelFiltered(3)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          level={3}
          parentCategories={getParentCategoriesForLevel(3)}
        />
      </TabPanel>

      <Modal open={openCreateModal} onClose={handleCloseModals}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: 600,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
            maxHeight: "90vh",
            overflow: "auto",
          }}
        >
          <CreateCategoryForm
            onSuccess={() => {
              dispatch(fetchCategories());
              handleCloseModals();
            }}
            onCancel={handleCloseModals}
          />
        </Box>
      </Modal>

      <Modal open={openUpdateModal} onClose={handleCloseModals}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxWidth: 600,
            bgcolor: "background.paper",
            boxShadow: 24,
            p: 4,
          }}
        >
          {selectedCategory && (
            <UpdateCategoryForm
              category={selectedCategory}
              allCategories={categories}
              onSuccess={() => {
                dispatch(fetchCategories());
                handleCloseModals();
              }}
              onCancel={handleCloseModals}
            />
          )}
        </Box>
      </Modal>

      {deleteConfirmation.open && deleteConfirmation.category && (
        <Modal
          open={true}
          onClose={() => setDeleteConfirmation({ open: false, category: null })}
        >
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Confirm Deletion
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              Are you sure you want to delete the category{" "}
              <strong>"{deleteConfirmation.category.name}"</strong>?
            </Typography>
            <Typography variant="body2" color="error" sx={{ mb: 3 }}>
              This action cannot be undone. If this category has child
              categories, you must delete them first.
            </Typography>
            <Box display="flex" gap={2} justifyContent="flex-end">
              <Button
                onClick={() =>
                  setDeleteConfirmation({ open: false, category: null })
                }
                variant="outlined"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                variant="contained"
                color="error"
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </Box>
          </Box>
        </Modal>
      )}
    </Box>
  );
};

export default CategoryManagement;