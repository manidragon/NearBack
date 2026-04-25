// frontend/src/seller/pages/Products/components/CatalogSearchStep.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  CircularProgress,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';


interface CatalogSearchStepProps {
  searchQuery: string;
  results: any[];
  isSearching: boolean;
  selectedCatalog: any | null;
  selectedVariants?: any[];
  isCatalogProduct?: boolean; 

  onSearchQueryChange: (query: string) => void;
  onSearch: () => void;
  onSelectCatalog: (catalog: any, variants?: any[]) => void;
  onSkip: () => void;
  onNext: () => void;
}

export const CatalogSearchStep: React.FC<CatalogSearchStepProps> = ({
  searchQuery,
  results,
  isSearching,
  selectedCatalog,
  selectedVariants = [],
    isCatalogProduct = false,
  onSearchQueryChange,
  onSearch,
  onSelectCatalog,
  onSkip,
  onNext,
}) => {
  // ✅ NEW: State to track which variants are selected for the selected catalog
  const [variantSelection, setVariantSelection] = useState<Record<number, boolean>>({});

  const prevIsSearchingRef = useRef<boolean>(false);

  // ✅ Debug log ONLY when search is initiated (button click)
  useEffect(() => {
    // Check if isSearching just changed from false → true (search started)
    if (isSearching && !prevIsSearchingRef.current) {
      console.log('🔍 [CatalogSearchStep] Search initiated:', {
        query: searchQuery,
        timestamp: new Date().toISOString()
      });
    }

    // Update ref for next render
    prevIsSearchingRef.current = isSearching;

    // ✅ Also log when results arrive (search completed)
    if (!isSearching && prevIsSearchingRef.current && results?.length >= 0) {
      console.log('📦 [CatalogSearchStep] Search completed:', {
        resultsLength: results?.length,
        firstResult: results?.[0]?.title,
        query: searchQuery
      });
    }

    // Update ref again after potential state changes
    prevIsSearchingRef.current = isSearching;

  }, [isSearching, results, searchQuery]);

 // ✅ Sync variantSelection when selectedVariants prop changes (from parent)
useEffect(() => {
  if (selectedVariants && Array.isArray(selectedVariants) && selectedCatalog?.variantTemplate) {
    const newSelection: Record<number, boolean> = {};

    selectedVariants.forEach((selectedVar: any) => {
      const idx = selectedCatalog.variantTemplate?.findIndex(
        (v: any) => v._id === selectedVar._id || v._id === selectedVar
      );
      if (idx !== undefined && idx >= 0) {
        newSelection[idx] = true;
      }
    });

    if (Object.keys(newSelection).length > 0) {
      setVariantSelection(newSelection);
    }
  }
}, [selectedVariants, selectedCatalog?.variantTemplate]);  // ✅ Updated dependencies

  // ✅ Helper: Get unique colors from variants
  const getUniqueColors = (catalog: any) => {
    if (!catalog.variantTemplate || !Array.isArray(catalog.variantTemplate)) return [];
    const colors = new Set<string>();
    catalog.variantTemplate.forEach((v: any) => {
      if (v.color && typeof v.color === 'string') {
        colors.add(v.color);
      }
    });
    return Array.from(colors);
  };

  // ✅ Helper: Get variant count
  const getVariantCount = (catalog: any) => {
    return catalog.variantTemplate?.length || 0;
  };

  // ✅ Helper: Get price range
  const getPriceRange = (catalog: any) => {
    if (!catalog.lowestPrice && !catalog.highestPrice) return 'N/A';
    if (catalog.lowestPrice === catalog.highestPrice) {
      return `₹${catalog.lowestPrice?.toLocaleString()}`;
    }
    return `₹${catalog.lowestPrice?.toLocaleString()} - ₹${catalog.highestPrice?.toLocaleString()}`;
  };

  // ✅✅✅ UPDATED: Get unique specs - FILTER OUT HIGHLIGHTS
  const getUniqueSpecs = (catalog: any): Record<string, string[]> => {
    if (!catalog.variantTemplate || !Array.isArray(catalog.variantTemplate)) return {};

    // ✅ List of highlight attribute names to exclude
    const highlightAttributes = [
      'brand', 'processor', 'processorbrand', 'gpu', 'operatingsystem',
      'displaysize', 'displaytype', 'resolution', 'refreshrate',
      'rearcamera', 'frontcamera', 'battery', 'waterresistance',
      'wifisupport', 'bluetoothversion', 'headphonejack', 'fingerprinttype',
      'screenprotection', 'networktype', 'simtype', 'esimsupport'
    ];

    const specs: Record<string, Set<string>> = {};
    catalog.variantTemplate.forEach((variant: any) => {
      if (variant.specifications && typeof variant.specifications === 'object') {
        Object.entries(variant.specifications).forEach(([key, value]: [string, any]) => {
          // ✅ Skip highlight attributes - only show variant-specific fields
          if (highlightAttributes.includes(key.toLowerCase())) return;

          if (!specs[key]) specs[key] = new Set<string>();
          if (value !== undefined && value !== null) {
            specs[key].add(String(value));
          }
        });
      }
    });

    return Object.fromEntries(
      Object.entries(specs).map(([key, value]) => [key, Array.from(value)])
    ) as Record<string, string[]>;
  };

  // ✅✅✅ NEW: Handle variant selection toggle
  const handleVariantToggle = (variantIndex: number) => {
    setVariantSelection(prev => ({
      ...prev,
      [variantIndex]: !prev[variantIndex]
    }));
  };

  // ✅✅✅ NEW: Get selected variants count
  const getSelectedVariantsCount = (catalog: any) => {
    if (!catalog.variantTemplate) return 0;
    return catalog.variantTemplate.filter((_: any, idx: number) => variantSelection[idx]).length;
  };

  // ✅✅✅ NEW: Handle "Select All" variants
  const handleSelectAllVariants = (catalog: any, selectAll: boolean) => {
    if (!catalog.variantTemplate) return;
    const newSelection: Record<string, boolean> = {};
    catalog.variantTemplate.forEach((_: any, idx: number) => {
      newSelection[idx] = selectAll;
    });
    setVariantSelection(newSelection);
  };

  // ✅✅✅ UPDATED: Handle catalog selection with selected variants
  const handleSelectCatalogWithVariants = (catalog: any) => {
    // Get selected variants from the catalog
    const selectedVars = catalog.variantTemplate?.filter((_: any, idx: number) => variantSelection[idx]) || [];

    if (selectedVars.length === 0) {
      alert('⚠️ Please select at least one variant to continue');
      return;
    }

    onSelectCatalog(catalog, selectedVars);
  };

  return (
    <Grid container spacing={3}>
      {/* Header */}
      <Grid size={{ xs: 12 }}>
        <Paper className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <Typography variant="h6" className="font-semibold text-blue-800">
            🔍 Search Existing Products
          </Typography>
          <Typography variant="body2" className="text-blue-600 mt-1">
            Check if this product already exists in our catalog. Select specific variants to add your prices.
          </Typography>
        </Paper>
      </Grid>

      {/* Search Input */}
      <Grid size={{ xs: 12 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            fullWidth
            placeholder="Search by product name, brand, or model (e.g., 'iPhone 15', 'Samsung Galaxy')"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && onSearch()}
            InputProps={{
              endAdornment: isSearching ? <CircularProgress size={20} /> : null
            }}
          />
          <Button
            variant="contained"
            onClick={onSearch}
            disabled={!searchQuery.trim() || isSearching}
            sx={{ minWidth: 100 }}
          >
            {isSearching ? 'Searching...' : 'Search'}
          </Button>
        </Box>
      </Grid>

      {/* Results Section */}
      {results && results.length > 0 ? (
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
            Search Results ({results.length})
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {results.map((catalog: any, index: number) => {
              const colors = getUniqueColors(catalog);
              const variantCount = getVariantCount(catalog);
              const priceRange = getPriceRange(catalog);
              const specs = getUniqueSpecs(catalog);  // ✅ Now filtered (no highlights)
              const isSelected = selectedCatalog?._id === catalog._id;
              const selectedCount = getSelectedVariantsCount(catalog);

              return (
                <Paper
                  key={catalog._id || index}
                  sx={{
                    p: 0,
                    cursor: 'pointer',
                    border: isSelected ? '2px solid #1976d2' : '1px solid #e0e0e0',
                    '&:hover': {
                      bgcolor: 'action.hover',
                      boxShadow: 2
                    },
                    transition: 'all 0.2s'
                  }}
                  onClick={() => { }}  // ✅ Prevent card click - use Select button only
                >
                  {/* Main Info */}
                  <Box sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', gap: 3 }}>
                      {/* Product Image */}
                      <Box
                        sx={{
                          width: 120,
                          height: 120,
                          flexShrink: 0,
                          bgcolor: 'grey.100',
                          borderRadius: 2,
                          overflow: 'hidden',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {catalog.images?.[0] ? (
                          <img
                            src={catalog.images[0]}
                            alt={catalog.title}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="120" height="120"%3E%3Crect width="120" height="120" fill="%23f0f0f0"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="12" fill="%23999"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <Box
                            component="img"
                            src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Crect width='120' height='120' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='12' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E"
                            alt="No image"
                          />
                        )}
                      </Box>

                      {/* Product Details */}
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight="bold" gutterBottom>
                          {catalog.title}
                        </Typography>

                        {/* Brand & Seller Info */}
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Brand:</strong> {catalog.brand || 'N/A'} |
                          <strong> Sellers:</strong> {catalog.totalOffers || 1}
                        </Typography>

                        {/* Price Range */}
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Price Range:</strong> {priceRange}
                        </Typography>

                        {/* Variant Count */}
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <strong>Total Variants:</strong> {variantCount} options
                        </Typography>

                        {/* Created By */}
                        <Typography variant="caption" color="text.secondary">
                          Created by: {catalog.createdBy?.businessDetails?.businessName || catalog.createdBy?.sellerName || 'Unknown'}
                        </Typography>
                      </Box>

                      {/* Select Button */}
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Button
                          variant={isSelected ? 'contained' : 'outlined'}
                          size="large"
                          sx={{ minWidth: 100 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // If already selected, just keep it selected
                            // If not selected, open variant selection
                            if (!isSelected) {
                              handleSelectCatalogWithVariants(catalog);
                            }
                          }}
                        >
                          {isSelected ? '✓ Selected' : 'Select'}
                        </Button>
                      </Box>
                    </Box>
                  </Box>

                  {/* ✅✅✅ EXPANDABLE: Variant Selection Table */}
                  <Divider />
                  <Accordion disableGutters elevation={0} sx={{ border: 'none', '&:before': { display: 'none' } }}>
                    <AccordionSummary
                      expandIcon={<ExpandMoreIcon />}
                      sx={{
                        bgcolor: 'grey.50',
                        py: 1,
                        px: 2,
                        '& .MuiAccordionSummary-content': {
                          my: 1
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <Typography variant="body2" fontWeight="500" color="text.secondary">
                          📋 Select Variants to Offer ({selectedCount}/{variantCount})
                        </Typography>
                        {selectedCount > 0 && (
                          <Chip
                            label={`${selectedCount} selected`}
                            size="small"
                            color="success"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ bgcolor: 'grey.50', p: 0 }}>
                      {/* Select All Checkbox */}
                      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={selectedCount === variantCount && variantCount > 0}
                              indeterminate={selectedCount > 0 && selectedCount < variantCount}
                              onChange={(e) => handleSelectAllVariants(catalog, e.target.checked)}
                            />
                          }
                          label={<Typography variant="body2" fontWeight="500">Select All Variants</Typography>}
                        />
                      </Box>

                      {/* Variants Table */}
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                              <TableCell padding="checkbox">
                                <Typography variant="caption" fontWeight="bold">Select</Typography>
                              </TableCell>
                              <TableCell>
                                <Typography variant="caption" fontWeight="bold">Color</Typography>
                              </TableCell>
                              {/* Dynamic spec columns */}
                              {Object.keys(specs).map(specName => (
                                <TableCell key={specName}>
                                  <Typography variant="caption" fontWeight="bold">
                                    {specName.charAt(0).toUpperCase() + specName.slice(1)}
                                  </Typography>
                                </TableCell>
                              ))}
                              <TableCell>
                                <Typography variant="caption" fontWeight="bold">Images</Typography>
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {catalog.variantTemplate?.map((variant: any, idx: number) => (
                              <TableRow
                                key={idx}
                                hover
                                sx={{
                                  bgcolor: variantSelection[idx] ? 'success.50' : 'inherit',
                                  '&:hover': { bgcolor: 'action.hover' }
                                }}
                              >
                                <TableCell padding="checkbox">
                                  <Checkbox
                                    checked={variantSelection[idx] || false}
                                    onChange={() => handleVariantToggle(idx)}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">{variant.color || 'N/A'}</Typography>
                                </TableCell>
                                {/* Dynamic spec values */}
                                {Object.keys(specs).map(specName => (
                                  <TableCell key={specName}>
                                    <Typography variant="body2">
                                      {variant.specifications?.[specName] || '-'}
                                    </Typography>
                                  </TableCell>
                                ))}
                                <TableCell>
                                  <Typography variant="body2">
                                    {variant.images?.length || 0} image(s)
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {/* Selected variants info */}
                      {selectedCount > 0 && (
                        <Box sx={{ p: 2, bgcolor: 'success.50', borderTop: '1px solid #e0e0e0' }}>
                          <Typography variant="body2" color="success.main" fontWeight="500">
                            ✅ {selectedCount} variant(s) selected. Click "Continue" to add your prices.
                          </Typography>
                        </Box>
                      )}
                    </AccordionDetails>
                  </Accordion>
                </Paper>
              );
            })}
          </Box>
        </Grid>
      ) : isSearching ? (
        <Grid size={{ xs: 12 }} className="flex justify-center py-8">
          <CircularProgress />
        </Grid>
      ) : searchQuery ? (
        <Grid size={{ xs: 12 }}>
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'info.50' }}>
            <Typography variant="body1" color="text.secondary">
              No catalog products found for "<strong>{searchQuery}</strong>"
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              You can create a new independent product instead.
            </Typography>
          </Paper>
        </Grid>
      ) : null}

      {/* Action Buttons */}
      <Grid size={{ xs: 12 }}>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 2 }}>
          <Button
            variant="outlined"
            onClick={onSkip}
            color="inherit"
          >
            Create New Product Instead
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              // ✅ Validate: if catalog is selected, ensure at least 1 variant is chosen
              if (selectedCatalog && selectedCatalog.variantTemplate?.length > 0) {
                const selectedCount = Object.values(variantSelection).filter(v => v).length;
                if (selectedCount === 0) {
                  alert('⚠️ Please select at least one variant to continue');
                  return;
                }
                // ✅ Re-pass selected variants to ensure parent has latest selection
                const selectedVars = selectedCatalog.variantTemplate.filter(
                  (_: any, idx: number) => variantSelection[idx]
                );
                onSelectCatalog(selectedCatalog, selectedVars);
              }
              onNext();  // ✅ Proceed to next step
            }}
            disabled={!selectedCatalog && results.length > 0}
          >
            {selectedCatalog ? 'Continue with Selected Product' : 'Skip Search'}
          </Button>
        </Box>
      </Grid>
    </Grid>
  );
};