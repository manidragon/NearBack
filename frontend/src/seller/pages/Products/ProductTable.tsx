// D:\Mani\Code with Zosh\Backup\source code\frontend\src\seller\pages\Products\ProductTable.tsx
import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import {
  Button,
  IconButton,
  styled,
  Chip,
  Tooltip,
  Collapse,
  Box,
  Typography,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { fetchSellerProducts, updateProduct, deleteProduct, resetUpdateFlag } from '../../../Redux Toolkit/Seller/sellerProductSlice';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import Dialog from '@mui/material/Dialog';
import AddProductForm from './AddProductForm';
import { type Product, type ProductVariant } from '../../../types/productTypes';
import UpdateProductForm from './UpdateProductForm';
import type {
  ProductFormValues,
  ProductVariantForm,
  ProductSubVariantForm
} from '../../../seller/pages/Products/AddProductForm';

// ============================================
// ✅ Styled Components
// ============================================
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
    fontWeight: 'bold',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

// ============================================
// ✅ Row Component Props
// ============================================
interface RowProps {
  row: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  getCategoryName: (categoryId: any) => string;
}

// ============================================
// ✅ Row Component for Expandable Variant Details
// ============================================
function Row({ row, onEdit, onDelete, getCategoryName }: RowProps) {
  const [open, setOpen] = React.useState(false);

  // ✅ Group variants by color for display (backend returns flattened array)
  const variantsByColor = React.useMemo(() => {
    if (!row.variants || row.variants.length === 0) return {};

    return row.variants.reduce((acc: Record<string, ProductVariant[]>, variant: ProductVariant) => {
      const color = variant.color || 'Unknown';
      if (!acc[color]) acc[color] = [];
      acc[color].push(variant);
      return acc;
    }, {});
  }, [row.variants]);

  // ✅ Get price range across all variants
  const priceRange = React.useMemo(() => {
    if (!row.variants || row.variants.length === 0) {
      return { min: row.sellingPrice || 0, max: row.sellingPrice || 0 };
    }
    const prices = row.variants.map((v: ProductVariant) => v.sellingPrice).filter((p): p is number => p != null);
    return {
      min: prices.length > 0 ? Math.min(...prices) : 0,
      max: prices.length > 0 ? Math.max(...prices) : 0,
    };
  }, [row.variants, row.sellingPrice]);

  // ✅ Get total stock across all variants
  const totalStock = React.useMemo(() => {
    if (!row.variants || row.variants.length === 0) return row.quantity || 0;
    return row.variants.reduce((sum: number, v: ProductVariant) => sum + (v.stock || 0), 0);
  }, [row.variants, row.quantity]);

  return (
    <React.Fragment>
      {/* ✅ Main Product Row */}
      <StyledTableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <StyledTableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </StyledTableCell>
        <StyledTableCell component="th" scope="row">
          <div className='flex gap-1 flex-wrap'>
            {(row.variants?.[0]?.images || row.images || []).slice(0, 2).map((image: string, index: number) => (
              <img
                key={index}
                className='w-12 h-12 rounded-md object-cover border'
                src={image}
                alt={`Product ${index + 1}`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=No+Image';
                }}
              />
            ))}
          </div>
        </StyledTableCell>
        <StyledTableCell align="right">
          <div className="flex flex-col items-end">
            <Typography variant="body2" fontWeight="bold">{row.title}</Typography>
            {row.brand && <Typography variant="caption" color="text.secondary">{row.brand}</Typography>}
          </div>
        </StyledTableCell>
        <StyledTableCell align="right">
          <Typography variant="body2" className="max-w-[120px] truncate" title={getCategoryName(row.category)}>
            {getCategoryName(row.category)}
          </Typography>
        </StyledTableCell>
        <StyledTableCell align="right">
          <Typography variant="body2" color="text.secondary" className="line-through">
            ₹{priceRange.min?.toFixed(2)} - ₹{priceRange.max?.toFixed(2)}
          </Typography>
        </StyledTableCell>
        <StyledTableCell align="right">
          <Typography variant="body2" fontWeight="bold" color="success.main">
            ₹{priceRange.min?.toFixed(2)} - ₹{priceRange.max?.toFixed(2)}
          </Typography>
        </StyledTableCell>
        <StyledTableCell align="right">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-end' }}>
            <Chip
              label={`${Object.keys(variantsByColor).length} color${Object.keys(variantsByColor).length > 1 ? 's' : ''}`}
              size="small"
              color="primary"
              variant="outlined"
            />
            <Typography variant="caption" color="text.secondary">
              {row.variants?.length || 0} variant{row.variants?.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </StyledTableCell>
        <StyledTableCell align="right">
          <Chip
            label={totalStock > 0 ? `In Stock (${totalStock})` : 'Out of Stock'}
            size="small"
            color={totalStock > 0 ? 'success' : 'error'}
            variant={totalStock > 0 ? 'filled' : 'outlined'}
          />
        </StyledTableCell>
        <StyledTableCell align="right">
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
            <Tooltip title="Edit Product">
              <IconButton color='primary' onClick={() => onEdit(row)} size="small">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Product">
              <IconButton color='error' onClick={() => row._id && onDelete(row._id)} size="small">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </StyledTableCell>
      </StyledTableRow>

      {/* ✅ Expanded Row: Show Variants & Sub-Variants Details */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom component="div" fontWeight="bold">
                🎨 Variant Details
              </Typography>

              {Object.entries(variantsByColor).map(([color, colorVariants]: [string, ProductVariant[]]) => (
                <Box key={color} sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Chip
                      label={color}
                      size="small"
                      sx={{
                        bgcolor: 'primary.light',
                        color: 'primary.contrastText',
                        fontWeight: 600
                      }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {colorVariants.length} option{colorVariants.length > 1 ? 's' : ''}
                    </Typography>
                  </Box>

                  <Table size="small" aria-label="variants">
                    <TableHead>
                      <TableRow>
                        <StyledTableCell>Storage/RAM</StyledTableCell>
                        <StyledTableCell align="right">MRP</StyledTableCell>
                        <StyledTableCell align="right">Selling Price</StyledTableCell>
                        <StyledTableCell align="right">Stock</StyledTableCell>
                        <StyledTableCell align="right">SKU</StyledTableCell>
                        <StyledTableCell align="right">Status</StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {colorVariants.map((variant: ProductVariant, idx: number) => (
                        <TableRow key={variant._id || idx}>
                          <TableCell component="th" scope="row">
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                              {variant.specifications?.storage && (
                                <Typography variant="body2" fontWeight="medium">
                                  📦 {variant.specifications.storage}
                                </Typography>
                              )}
                              {variant.specifications?.ram && (
                                <Typography variant="body2" color="text.secondary">
                                  🧠 {variant.specifications.ram}
                                </Typography>
                              )}
                              {!variant.specifications?.storage && !variant.specifications?.ram && (
                                <Typography variant="body2" color="text.secondary">
                                  {Object.entries(variant.specifications || {}).map(([key, val]) => (
                                    <span key={key}>{key}: {val}, </span>
                                  ))}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary" className="line-through">
                              ₹{variant.mrpPrice?.toFixed(2) || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" fontWeight="bold" color="success.main">
                              ₹{variant.sellingPrice?.toFixed(2) || 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={variant.stock || 0}
                              size="small"
                              color={variant.stock > 0 ? 'success' : 'error'}
                              variant={variant.stock > 0 ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="caption" color="text.secondary">
                              {variant.sku || 'Auto-generated'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={variant.isActive !== false ? 'Active' : 'Inactive'}
                              size="small"
                              color={variant.isActive !== false ? 'primary' : 'default'}
                              variant={variant.isActive !== false ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {Object.keys(variantsByColor).length > 1 && <Divider sx={{ my: 2 }} />}
                </Box>
              ))}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

// ============================================
// ✅ MAIN COMPONENT: ProductTable
// ============================================
export default function ProductTable() {
  const sellerProduct = useAppSelector(state => state.sellerProduct);
  const categoryState = useAppSelector(state => state.category);
  const dispatch = useAppDispatch();
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editProduct, setEditProduct] = React.useState<Product | null>(null);

  // ✅ NEW: Snackbar state for success/error feedback
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<'success' | 'error'>('success');

  // ✅ DEBUG LOG (keep for debugging)
  React.useEffect(() => {
    console.log('🔍 [ProductTable] sellerProduct state:', {
      loading: sellerProduct.loading,
      error: sellerProduct.error,
      productsCount: Array.isArray(sellerProduct.products) ? sellerProduct.products.length : 'NOT AN ARRAY',
      products: sellerProduct.products,
      productUpdated: sellerProduct.productUpdated,
    });
  }, [sellerProduct]);

  // ✅ Initial fetch of seller products
  React.useEffect(() => {
    const jwt = localStorage.getItem("jwt") || "";
    if (jwt) {
      dispatch(fetchSellerProducts(jwt));
    }
  }, [dispatch]);

  // ✅✅✅ FIXED: Auto-refresh products after successful update AND close dialog
  React.useEffect(() => {
    // ✅ Handle successful update
    if (sellerProduct.productUpdated && !sellerProduct.loading) {
      console.log('🔄 Product updated - refreshing product list...');

      // ✅ Show success snackbar
      setSnackbarMessage('✅ Product updated successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // ✅ Re-fetch products to show updated data
      const jwt = localStorage.getItem("jwt") || "";
      if (jwt) {
        dispatch(fetchSellerProducts(jwt));
      }

      // ✅✅✅ CRITICAL: Reset the productUpdated flag to prevent infinite loop
      dispatch(resetUpdateFlag());
      console.log('✅ Reset productUpdated flag');

      // ✅ Close the edit dialog after a short delay
      if (editDialogOpen) {
        setTimeout(() => {
          setEditDialogOpen(false);
          setEditProduct(null);
        }, 500);
      }
    }

    // ✅ Handle update error
    if (sellerProduct.error && !sellerProduct.loading) {
      const errorMsg = typeof sellerProduct.error === 'string'
        ? sellerProduct.error
        : (sellerProduct.error as any)?.message || 'Update failed';

      setSnackbarMessage(`❌ ${errorMsg}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      // ✅ Don't close dialog on error - let user fix issues
    }
  }, [sellerProduct.productUpdated, sellerProduct.error, sellerProduct.loading, dispatch, editDialogOpen]);
  // ✅ Handle edit button click
  const handleEditClick = (product: Product) => {
    setEditProduct(product);
    setEditDialogOpen(true);
  };

  // ✅ Handle dialog close
  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditProduct(null);
  };

  // ✅ Handle edit form submit
  const handleEditSubmit = (values: any) => {
    if (editProduct && editProduct._id) {
      const jwt = localStorage.getItem("jwt") || "";
      dispatch(updateProduct({
        productId: editProduct._id,
        product: values
      }));
      // ✅ REMOVED: Don't close dialog here - let the useEffect handle it after successful update
    }
  };

  // ✅ Handle delete button click
  const handleDeleteClick = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      dispatch(deleteProduct(productId));
    }
  };

  // ✅ Helper: Get category name from _id
  const getCategoryName = (categoryId: string | { _id: string; name?: string } | undefined): string => {
    if (!categoryId) return 'N/A';
    const id = typeof categoryId === 'string' ? categoryId : categoryId._id;
    const category = categoryState.categories?.find((cat: any) => cat._id === id);
    return category?.name || 'Unknown';
  };

  // ✅ Transform backend flattened variants to nested form structure
  const transformProductToFormValues = (product: Product): ProductFormValues => {
    // Get category hierarchy FROM THE PRODUCT (not from form state)
    const category = typeof product.category === 'string'
      ? categoryState.categories?.find((cat: any) => cat._id === product.category)
      : product.category;

    const level3Cat = category;
    const level2Cat = level3Cat?.parentCategory
      ? categoryState.categories?.find((cat: any) => cat._id === level3Cat.parentCategory)
      : undefined;
    const level1Cat = level2Cat?.parentCategory
      ? categoryState.categories?.find((cat: any) => cat._id === level2Cat.parentCategory)
      : undefined;

    // ✅ Group backend variants by color to create nested structure
    const variantsByColor = (product.variants || []).reduce((acc: Record<string, ProductVariant[]>, variant: ProductVariant) => {
      const color = variant.color || 'Unknown';
      if (!acc[color]) acc[color] = [];
      acc[color].push(variant);
      return acc;
    }, {});

    // ✅ Transform to nested ProductVariantForm structure
    const formVariants: ProductVariantForm[] = Object.entries(variantsByColor).map(([color, colorVariants]: [string, ProductVariant[]]) => {
      // ✅ Get images from FIRST variant of this color (shared by ALL sub-variants of this color)
      const colorImages = colorVariants[0]?.images || [];

      // ✅ Create sub-variants WITHOUT images field (images are at COLOR level now)
      const subVariants: ProductSubVariantForm[] = colorVariants.map((v: ProductVariant) => ({
        _id: v._id,
        specifications: v.specifications || {},
        // ✅ FIX: Properly handle number → string conversion
        mrpPrice: typeof v.mrpPrice === 'number' ? String(v.mrpPrice) : '',
        sellingPrice: typeof v.sellingPrice === 'number' ? String(v.sellingPrice) : '',
        stock: typeof v.stock === 'number' ? String(v.stock) : '0',
        sku: v.sku,
        isActive: v.isActive,
      }));

      return {
        color,
        images: colorImages,  // ✅ Images at COLOR level (shared by all sub-variants)
        subVariants,
        isActive: colorVariants[0]?.isActive,
      };
    });

    return {
      _id: product._id,
      title: product.title,
      description: product.description,

      // ✅ Category fields: Use product's original categories (READ-ONLY in edit mode)
      category: level1Cat?._id || "",
      category2: level2Cat?._id || "",
      category3: level3Cat?._id || "",

      // ✅ Product-level images (if any) - separate from variant images
      images: product.images || [],

      // ✅ Product-level specifications (if any)
      specifications: product.specifications || {},

      // ✅ Nested variants structure for form (color → sub-variants)
      variants: formVariants,

      brand: product.brand,
      isActive: product.isActive,
    };
  };

  // ✅ Safe products array getter
  const products = Array.isArray(sellerProduct.products) ? sellerProduct.products : [];

  // ✅ Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" fontWeight="bold">Products</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => window.location.href = '/seller/add-product'}
          startIcon={<AddPhotoAlternateIcon />}
        >
          Add New Product
        </Button>
      </Box>

      {/* ✅ Loading State */}
      {sellerProduct.loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      )}

      {/* ✅ Error State */}
      {sellerProduct.error && !sellerProduct.loading && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error: {
            (() => {
              const err = sellerProduct.error;
              if (typeof err === 'string') return err;
              if (!err) return 'Unknown error';
              const errorObj = err as { message?: string; errors?: string[];[key: string]: any };
              if (errorObj.message) return String(errorObj.message);
              if (errorObj.errors && Array.isArray(errorObj.errors)) return errorObj.errors.join(', ');
              return JSON.stringify(err);
            })()
          }
          <Button
            size="small"
            variant="outlined"
            sx={{ ml: 2 }}
            onClick={() => {
              const jwt = localStorage.getItem("jwt") || "";
              if (jwt) dispatch(fetchSellerProducts(jwt));
            }}
          >
            Retry
          </Button>
        </Alert>
      )}

      {/* ✅ Success Snackbar (for update feedback) */}
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* ✅ Products Table */}
      {!sellerProduct.loading && !sellerProduct.error && (
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
          <Table sx={{ minWidth: 700 }} aria-label="customized table">
            <TableHead>
              <TableRow>
                <StyledTableCell />
                <StyledTableCell>Images</StyledTableCell>
                <StyledTableCell align="right">Title</StyledTableCell>
                <StyledTableCell align="right">Category</StyledTableCell>
                <StyledTableCell align="right">Price Range</StyledTableCell>
                <StyledTableCell align="right">Selling Price</StyledTableCell>
                <StyledTableCell align="right">Variants</StyledTableCell>
                <StyledTableCell align="right">Stock</StyledTableCell>
                <StyledTableCell align="right">Actions</StyledTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.length === 0 ? (
                <StyledTableRow>
                  <StyledTableCell colSpan={9} align="center">
                    <Box sx={{ py: 10, textAlign: 'center' }}>
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No products found
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Get started by adding your first product
                      </Typography>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => window.location.href = '/seller/add-product'}
                        startIcon={<AddPhotoAlternateIcon />}
                      >
                        Add Your First Product
                      </Button>
                    </Box>
                  </StyledTableCell>
                </StyledTableRow>
              ) : (
                products.map((item: Product) => (
                  <Row
                    key={item._id}  // ✅ Use unique product _id as key
                    row={item}
                    onEdit={handleEditClick}
                    onDelete={handleDeleteClick}
                    getCategoryName={getCategoryName}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* ✅ Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        {editProduct && (
          <UpdateProductForm
            initialValues={transformProductToFormValues(editProduct)}
            onClose={handleEditDialogClose}
          />
        )}
      </Dialog>
    </>
  );
}