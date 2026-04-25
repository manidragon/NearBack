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
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import StoreIcon from '@mui/icons-material/Store';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import {
  fetchSellerProducts,
  updateProduct,
  deleteProduct,
  resetUpdateFlag,
  fetchSellerCatalogOffers  // ✅ NEW: Action to fetch catalog offers
} from '../../../Redux Toolkit/Seller/sellerProductSlice';
import EditIcon from '@mui/icons-material/Edit';
import Dialog from '@mui/material/Dialog';
import UpdateProductForm from './UpdateProductForm';
import { type Product, type ProductVariant } from '../../../types/productTypes';
import type { Category } from '../../../types/categoryTypes';

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
// ✅ Tab Panel Component (for tab content)
// ============================================
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
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// ============================================
// ✅ Row Component Props
// ============================================
interface RowProps {
  row: Product;
  onEdit: (product: Product) => void;
  onDelete: (productId: string) => void;
  getCategoryName: (categoryId: any) => string;
  isCatalogOffer?: boolean;
  onStatusToggle: (productId: string, variantId: string, offerId: string, isActive: boolean) => void;  // <-- ADD THIS
}

// ============================================
// ✅ Row Component - Enhanced for Catalog Offers
// ============================================
function Row({ row, onEdit, onDelete, getCategoryName, isCatalogOffer = false, onStatusToggle }: RowProps) {
  const [open, setOpen] = React.useState(false);

  // ✅ Debug: Log product structure on mount
  React.useEffect(() => {
    if (open) {
      console.log('🔍 [Row Debug] Product data:', {
        title: row.title,
        variantsCount: row.variants?.length,
        isCatalogOffer,
        catalogId: row.catalog?._id || row.catalog,
        minPrice: row.minPrice,
        maxPrice: row.maxPrice
      });
    }
  }, [open, row, isCatalogOffer]);

  // ✅ Group variants by color
  const variantsByColor = React.useMemo(() => {
    if (!row.variants || !Array.isArray(row.variants) || row.variants.length === 0) {
      return {};
    }
    const grouped = row.variants.reduce((acc: Record<string, any>, variant: any) => {
      const color = variant?.color || 'Unknown';
      if (!acc[color]) acc[color] = [];
      acc[color].push(variant);
      return acc;
    }, {});
    return grouped;
  }, [row.variants]);

  // ✅✅✅ FIXED: Get price range - prioritize denormalized fields
  const priceRange = React.useMemo(() => {
    if (row.minPrice != null && row.maxPrice != null) {
      return { min: Number(row.minPrice), max: Number(row.maxPrice) };
    }
    if (!row.variants || !Array.isArray(row.variants)) {
      return { min: 0, max: 0 };
    }
    const allPrices: number[] = [];
    row.variants.forEach((variant: any) => {
      if (variant.offers && Array.isArray(variant.offers)) {
        variant.offers.forEach((offer: any) => {
          if (offer?.isActive !== false && offer?.sellingPrice != null) {
            allPrices.push(Number(offer.sellingPrice));
          }
        });
      } else if (variant?.sellingPrice != null && variant?.sellingPrice > 0) {
        allPrices.push(Number(variant.sellingPrice));
      }
    });
    return {
      min: allPrices.length > 0 ? Math.min(...allPrices) : 0,
      max: allPrices.length > 0 ? Math.max(...allPrices) : 0,
    };
  }, [row.variants, row.minPrice, row.maxPrice]);

  // ✅✅✅ FIXED: Get total stock
  const totalStock = React.useMemo(() => {
    if (!row.variants || !Array.isArray(row.variants)) return 0;
    return row.variants.reduce((sum: number, variant: any) => {
      if (variant.offers && Array.isArray(variant.offers)) {
        return sum + variant.offers.reduce((offerSum: number, offer: any) =>
          offerSum + (Number(offer?.stock) || 0), 0
        );
      }
      return sum + (Number(variant?.stock) || 0);
    }, 0);
  }, [row.variants]);

  // ✅✅✅ FIXED: Get best offer
  const getBestOffer = (variant: any) => {
    if (variant?.offers && Array.isArray(variant.offers)) {
      const activeOffers = variant.offers.filter((o: any) =>
        o?.isActive !== false && o?.sellingPrice != null && o?.sellingPrice > 0
      );
      if (activeOffers.length > 0) {
        return activeOffers.reduce((best: any, current: any) =>
          Number(current.sellingPrice) < Number(best.sellingPrice) ? current : best
        );
      }
    }
    if (variant?.sellingPrice != null && variant?.sellingPrice > 0) {
      return variant;
    }
    return null;
  };

  // ✅ Get variant selector specs ONLY
  const getVariantSelectorSpecs = (variant: any) => {
    if (!variant?.specifications) return {};
    const variantFields = ['ram', 'storage', 'size', 'color', 'weight', 'networktype'];
    const specs: Record<string, any> = {};
    Object.entries(variant.specifications).forEach(([key, value]) => {
      if (variantFields.includes(key.toLowerCase())) {
        specs[key] = value;
      }
    });
    return specs;
  };

  // ✅✅✅ FIXED: Count active offers correctly
  const countActiveOffers = (variant: any) => {
    if (!variant?.offers || !Array.isArray(variant.offers)) return 0;
    return variant.offers.filter((o: any) => o?.isActive !== false).length;
  };

  // ✅✅✅ FIXED: Get seller name safely
  const getSellerName = (offer: any) => {
    if (!offer?.seller) return 'Seller';
    if (offer.seller?.businessDetails?.businessName) return offer.seller.businessDetails.businessName;
    if (offer.seller?.sellerName) return offer.seller.sellerName;
    if (typeof offer.seller === 'string') return 'Seller';
    if (offer.seller?.$oid) return 'Seller';
    return 'Seller';
  };

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
                src={image?.trim()}
                alt={`Product ${index + 1}`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=No+Image';
                }}
              />
            ))}
          </div>
        </StyledTableCell>

        {/* ✅ Title Column */}
        <StyledTableCell align="left">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" fontWeight="medium" className="max-w-[200px] truncate" title={row.title}>
              {row.title || 'N/A'}
            </Typography>
            {/* ✅ Badge for catalog offers */}
            {isCatalogOffer && (
              <Chip
                label="📦 Catalog"
                size="small"
                color="info"
                variant="outlined"
                icon={<StoreIcon fontSize="small" />}
              />
            )}
          </Box>
        </StyledTableCell>

        {/* ✅ Category Column */}
        <StyledTableCell align="left">
          <Typography variant="body2" className="max-w-[150px] truncate" title={getCategoryName(row.category)}>
            {getCategoryName(row.category)}
          </Typography>
        </StyledTableCell>

        {/* ✅ Price Range Column (MRP) */}
        <StyledTableCell align="right">
          <Typography variant="body2" color="text.secondary" className="line-through">
            ₹{priceRange.min?.toFixed(2)} - ₹{priceRange.max?.toFixed(2)}
          </Typography>
        </StyledTableCell>

        {/* ✅ Selling Price Column */}
        <StyledTableCell align="right">
          <Typography variant="body2" fontWeight="bold" color="success.main">
            ₹{priceRange.min?.toFixed(2)} - ₹{priceRange.max?.toFixed(2)}
          </Typography>
        </StyledTableCell>

        {/* ✅ Variants Column */}
        <StyledTableCell align="center">
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
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

        {/* ✅ Stock Column */}
        <StyledTableCell align="center">
          <Chip
            label={totalStock > 0 ? `${totalStock}` : '0'}
            size="small"
            color={totalStock > 0 ? 'success' : 'error'}
            variant={totalStock > 0 ? 'filled' : 'outlined'}
          />
        </StyledTableCell>

        {/* ✅ Actions Column */}
        <StyledTableCell align="center">
          <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
            <Tooltip title={isCatalogOffer ? "Update Offer" : "Edit Product"}>
              <IconButton color='primary' onClick={() => onEdit(row)} size="small">
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </StyledTableCell>
      </StyledTableRow>

      {/* ✅ Expanded Row: Variant & Offer Details */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={9}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, p: 3, bgcolor: 'grey.50', borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" gutterBottom component="div" fontWeight="bold">
                  🎨 Variant & Offer Details
                </Typography>
                {isCatalogOffer && (
                  <Chip
                    label="📦 Shared Catalog Product"
                    size="small"
                    color="info"
                    variant="outlined"
                  />
                )}
              </Box>

              {Object.entries(variantsByColor).length === 0 ? (
                <Typography variant="body2" color="text.secondary">No variants available</Typography>
              ) : (
                Object.entries(variantsByColor).map(([color, colorVariants]: [string, any[]]) => (
                  <Box key={color} sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Chip label={color} size="small" sx={{ bgcolor: 'primary.light', color: 'primary.contrastText', fontWeight: 600 }} />
                      <Typography variant="body2" color="text.secondary">
                        {colorVariants.length} option{colorVariants.length > 1 ? 's' : ''}
                      </Typography>
                    </Box>

                    {/* ✅✅✅ FIXED: Show Seller Offers PER SUB-VARIANT - minimal change, keeps your working code */}
                    {open && (
                      <Box sx={{ mt: 3 }}>
                        {/* ✅ Loop through EACH sub-variant - but keep YOUR exact inner rendering */}
                        {colorVariants.map((variant: any, variantIdx: number) => {
                          const currentSellerId = (() => {
                            try {
                              const jwt = localStorage.getItem('jwt');
                              if (!jwt) return null;
                              const payload = JSON.parse(atob(jwt.split('.')[1]));
                              return payload._id || payload.userId || payload.id || payload.sellerId;
                            } catch { return null; }
                          })();

                          // ✅ Filter ONLY your active offers
                          const allOffers = variant.offers || [];
const yourOffersList = allOffers.filter((offer: any) => {
  const offerSellerId = offer.seller?._id || offer.seller;
  return offerSellerId === currentSellerId;
});
                          const yourOffer = yourOffersList[0]; // Get your first offer

                          // ✅ Debug log (remove after testing)
                        console.log(`🔍 [Variant ${variantIdx}]`, {
  variantId: variant._id,
  totalOffers: allOffers.length,  // ✅ Updated to new variable name
  yourOffersCount: yourOffersList.length,
  currentSellerId,
  yourOffer
});

                          return (
                            <Paper
                              key={variant._id?.$oid || variant._id || `variant-${variantIdx}`}
                              sx={{
                                mb: 1,
                                p: 1.5,
                                border: '1px solid',
                                borderColor: yourOffer ? 'success.main' : 'grey.300',
                                borderRadius: 1,
                                bgcolor: yourOffer ? 'success.50' : 'grey.50'
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                {/* Variant Info */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                  <Typography variant="body2" fontWeight="bold">
                                    📦 Variant {variantIdx + 1}:
                                  </Typography>
                                  <Chip label={variant.specifications?.ram || 'N/A'} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                                  <Chip label={variant.specifications?.storage || 'N/A'} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                                </Box>

                                {/* Offer Details or Empty State */}
                                {yourOffer ? (
                                  <>
                                    <Box sx={{ textAlign: 'center' }}>
                                      <Typography variant="caption" color="text.secondary" className="line-through" sx={{ fontSize: '0.7rem' }}>
                                        MRP: ₹{Number(yourOffer.mrpPrice).toFixed(2)}
                                      </Typography>
                                      <Typography variant="body2" fontWeight="bold" color="success.main">
                                        ₹{Number(yourOffer.sellingPrice).toFixed(2)}
                                      </Typography>
                                    </Box>

                                    <Chip
                                      label={`📦 ${yourOffer.stock || 0}`}
                                      size="small"
                                      color={yourOffer.stock > 0 ? 'success' : 'error'}
                                      variant="outlined"
                                      sx={{ fontSize: '0.7rem' }}
                                    />

                                    <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                                      SKU: {yourOffer.sku || 'N/A'}
                                    </Typography>

                                    <FormControlLabel
                                      control={
                                        <Switch
                                          checked={yourOffer.isActive !== false}
                                          onChange={async (e) => {
                                            const newIsActive = e.target.checked;
                                            // ✅ Call the parent's handler with proper null checks
                                            if (row._id && variant._id && yourOffer._id) {
                                              onStatusToggle(row._id, variant._id, yourOffer._id, newIsActive);
                                            }
                                          }}
                                          color="success"
                                          size="small"
                                        />
                                      }
                                      label={yourOffer.isActive !== false ? "Active" : "Inactive"}
                                      labelPlacement="start"
                                      sx={{ ml: 0, minWidth: '90px' }}
                                    />
                                  </>
                                ) : (
                                  <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                    No offer added
                                  </Typography>
                                )}
                              </Box>
                            </Paper>
                          );
                        })}
                      </Box>
                    )}

                    {Object.keys(variantsByColor).length > 1 && <Divider sx={{ my: 2 }} />}
                  </Box>
                ))
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

// ============================================
// ✅ MAIN COMPONENT: ProductTable with Tabs
// ============================================
export default function ProductTable() {
  const sellerProduct = useAppSelector(state => state.sellerProduct);
  const categoryState = useAppSelector(state => state.category);
  const dispatch = useAppDispatch();
  const [editDialogOpen, setEditDialogOpen] = React.useState(false);
  const [editProduct, setEditProduct] = React.useState<Product | null>(null);
  const [snackbarOpen, setSnackbarOpen] = React.useState(false);
  const [snackbarMessage, setSnackbarMessage] = React.useState('');
  const [snackbarSeverity, setSnackbarSeverity] = React.useState<'success' | 'error'>('success');

  // ✅ NEW: Tab state
  const [activeTab, setActiveTab] = React.useState(0);

  // ✅ Fetch both independent products AND catalog offers on mount
  React.useEffect(() => {
    const jwt = localStorage.getItem("jwt") || "";
    if (jwt) {
      dispatch(fetchSellerProducts(jwt));
      dispatch(fetchSellerCatalogOffers(jwt));  // ✅ Fetch catalog offers too
    }
  }, [dispatch]);

  // ✅ Handle snackbar for both product types - NO REFETCH NEEDED
  React.useEffect(() => {
    if (sellerProduct.productUpdated && !sellerProduct.loading) {
      setSnackbarMessage('✅ Product updated successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      // ✅ Redux already merged the updated product - no refetch needed!
      dispatch(resetUpdateFlag());

      if (editDialogOpen) {
        setTimeout(() => {
          setEditDialogOpen(false);
          setEditProduct(null);
        }, 500);
      }
    }
    if (sellerProduct.error && !sellerProduct.loading) {
      const errorMsg = typeof sellerProduct.error === 'string'
        ? sellerProduct.error
        : (sellerProduct.error as any)?.message || 'Update failed';
      setSnackbarMessage(`❌ ${errorMsg}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  }, [sellerProduct.productUpdated, sellerProduct.error, sellerProduct.loading, dispatch, editDialogOpen]);

  const handleEditClick = (product: Product) => {
    setEditProduct(product);
    setEditDialogOpen(true);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditProduct(null);
  };

  const handleDeleteClick = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      dispatch(deleteProduct(productId));
    }
  };

  const getCategoryName = (categoryId: string | { _id: string; name?: string } | undefined): string => {
    if (!categoryId) return 'N/A';
    const id = typeof categoryId === 'string' ? categoryId : categoryId._id;
    const category = categoryState.categories?.find((cat: Category) => cat._id === id);
    return category?.name || 'Unknown';
  };

const handleToggleOfferStatus = async (
  productId: string, 
  variantId: string, 
  offerId: string, 
  newIsActive: boolean
) => {
  try {
    // ✅ Find the current offer data from Redux state to include required fields
    const product = sellerProduct.products.find(p => p._id === productId);
    const variant = product?.variants?.find((v: any) => v._id === variantId);
    const currentOffer = variant?.offers?.find((o: any) => o._id === offerId);
    
    if (!currentOffer) {
      throw new Error('Offer not found');
    }
    
    // ✅ Safely extract seller ID (handles both string and populated object)
    const sellerId = typeof currentOffer.seller === 'string' 
      ? currentOffer.seller 
      : currentOffer.seller?._id || currentOffer.seller?.id;
    
    // ✅ Send minimal valid payload with all required fields
    await dispatch(updateProduct({
      productId,
      product: {
        variants: [{
          _id: variantId,
          color: variant?.color || '',  // ✅ Required by validator
          images: variant?.images || [],  // ✅ Required by validator
          offers: [{
            _id: offerId,
            seller: sellerId,  // ✅ Use extracted sellerId (always a string)
            mrpPrice: currentOffer.mrpPrice || 0,  // ✅ Required
            sellingPrice: currentOffer.sellingPrice || 0,  // ✅ Required
            stock: currentOffer.stock || 0,  // ✅ Required (optional but safe)
            isActive: newIsActive  // ✅ The field we're actually updating
          }]
        }]
      }
    } as any)).unwrap();
    
    setSnackbarMessage(`✅ Offer ${newIsActive ? 'activated' : 'deactivated'} successfully!`);
    setSnackbarSeverity('success');
    setSnackbarOpen(true);
  } catch (error) {
    console.error("❌ Failed to toggle offer status:", error);
    setSnackbarMessage('❌ Failed to update status');
    setSnackbarSeverity('error');
    setSnackbarOpen(true);
  }
};

  // ✅ Separate products by type
  const getCurrentSellerId = () => {
    try {
      const jwt = localStorage.getItem('jwt');
      if (!jwt) return null;
      const payload = JSON.parse(atob(jwt.split('.')[1]));
      return payload._id || payload.userId || payload.id || payload.sellerId;
    } catch {
      return null;
    }
  };

  const currentSellerId = getCurrentSellerId();
  const allProducts = Array.isArray(sellerProduct.products) ? sellerProduct.products : [];

  // ✅✅✅ FIXED: Filter by seller's offers in variants[].offers[], not by catalog field
  // ✅✅✅ CORRECTED: Separate by ownership, not catalog field
  const myProducts = allProducts.filter((p: Product) => {
    // ✅ My Products: I am the OWNER (I created this product)
    const isOwner = p.seller === currentSellerId || p.seller?._id === currentSellerId;
    return isOwner;
  });

  const catalogOffers = allProducts.filter((p: Product) => {
    // ✅ Catalog Offers: I added offers to OTHER SELLERS' products
    const isOwner = p.seller === currentSellerId || p.seller?._id === currentSellerId;
    const hasMyOffers = p.variants?.some((v: any) =>
      v.offers?.some((o: any) => {
        const offerSellerId = o.seller?._id || o.seller;
        return offerSellerId === currentSellerId && o.isActive !== false;
      })
    );

    // ✅ Show in catalog offers if: NOT owner BUT has my offers
    return !isOwner && hasMyOffers;
  });

  const handleSnackbarClose = () => setSnackbarOpen(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <>
      {/* ✅ Header with Tabs */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Products</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your independent products and catalog offers
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ minWidth: 400 }}
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight={activeTab === 0 ? 'bold' : 'normal'}>
                    🛍️ My Products
                  </Typography>
                  <Chip label={myProducts.length} size="small" color="primary" variant="outlined" />
                </Box>
              }
              id="products-tab-0"
              aria-controls="products-tabpanel-0"
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" fontWeight={activeTab === 1 ? 'bold' : 'normal'}>
                    📦 Catalog Offers
                  </Typography>
                  <Chip label={catalogOffers.length} size="small" color="info" variant="outlined" />
                </Box>
              }
              id="products-tab-1"
              aria-controls="products-tabpanel-1"
            />
          </Tabs>
          <Button
            variant="contained"
            color="primary"
            onClick={() => window.location.href = '/seller/add-product'}
            startIcon={<AddPhotoAlternateIcon />}
          >
            Add New
          </Button>
        </Box>
      </Box>

      {sellerProduct.loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      )}

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
              if (jwt) {
                dispatch(fetchSellerProducts(jwt));
                dispatch(fetchSellerCatalogOffers(jwt));
              }
            }}
          >
            Retry
          </Button>
        </Alert>
      )}

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

      {/* ✅ Tab Panels */}
      {!sellerProduct.loading && !sellerProduct.error && (
        <>
          {/* Tab 0: Independent Products */}
          <TabPanel value={activeTab} index={0}>
            {myProducts.length === 0 ? (
              <Paper sx={{ p: 5, textAlign: 'center', bgcolor: 'grey.50' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No products found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Create your first product to start selling
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => window.location.href = '/seller/add-product'}
                  startIcon={<AddPhotoAlternateIcon />}
                >
                  Create Product
                </Button>
              </Paper>
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
                <Table sx={{ minWidth: 1000 }} aria-label="my products table">
                  <TableHead>
                    <TableRow>
                      <StyledTableCell />
                      <StyledTableCell>Images</StyledTableCell>
                      <StyledTableCell align="left">Title</StyledTableCell>
                      <StyledTableCell align="left">Category</StyledTableCell>
                      <StyledTableCell align="right">Price Range</StyledTableCell>
                      <StyledTableCell align="right">Selling Price</StyledTableCell>
                      <StyledTableCell align="center">Variants</StyledTableCell>
                      <StyledTableCell align="center">Stock</StyledTableCell>
                      <StyledTableCell align="center">Actions</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myProducts.map((item: Product) => (
                      <Row
                        key={item._id}
                        row={item}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        getCategoryName={getCategoryName}
                        isCatalogOffer={false}
                        onStatusToggle={handleToggleOfferStatus}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          {/* Tab 1: Catalog Offers */}
          <TabPanel value={activeTab} index={1}>
            {catalogOffers.length === 0 ? (
              <Paper sx={{ p: 5, textAlign: 'center', bgcolor: 'grey.50' }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No catalog offers found
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  List your offer on existing catalog products to start selling
                </Typography>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => window.location.href = '/seller/add-product'}
                  startIcon={<StoreIcon />}
                >
                  List Catalog Offer
                </Button>
              </Paper>
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 2 }}>
                <Table sx={{ minWidth: 1000 }} aria-label="catalog offers table">
                  <TableHead>
                    <TableRow>
                      <StyledTableCell />
                      <StyledTableCell>Images</StyledTableCell>
                      <StyledTableCell align="left">Title</StyledTableCell>
                      <StyledTableCell align="left">Category</StyledTableCell>
                      <StyledTableCell align="right">Price Range</StyledTableCell>
                      <StyledTableCell align="right">Selling Price</StyledTableCell>
                      <StyledTableCell align="center">Variants</StyledTableCell>
                      <StyledTableCell align="center">Stock</StyledTableCell>
                      <StyledTableCell align="center">Actions</StyledTableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {catalogOffers.map((item: Product) => (
                      <Row
                        key={item._id}
                        row={item}
                        onEdit={handleEditClick}
                        onDelete={handleDeleteClick}
                        getCategoryName={getCategoryName}
                        isCatalogOffer={true}
                        onStatusToggle={handleToggleOfferStatus}
                      />
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>
        </>
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
            initialValues={editProduct as any}
            onClose={handleEditDialogClose}
          />
        )}
      </Dialog>
    </>
  );
}