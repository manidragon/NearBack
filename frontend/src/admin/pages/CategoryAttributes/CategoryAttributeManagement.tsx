// D:\Mani\Code with Zosh\Backup\source code\frontend\src\admin\pages\CategoryAttributes\CategoryAttributeManagement.tsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  Chip,
  Alert,
  Snackbar,
  CircularProgress,
  Switch,
  FormControlLabel,
  Tooltip,
  Divider,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select'; // ✅ FIXED: Type-only import
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  DragIndicator as DragIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Restore as RestoreIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import {
  fetchCategoryAttributes,
  createCategoryAttribute,
  updateCategoryAttribute,
  deleteCategoryAttribute,
  reorderCategoryAttributes,
  selectCategoryAttributes,
  selectCategoryAttributesLoading,
  selectCategoryAttributesError,
  clearCategoryAttributes,
  setSelectedCategoryId,
} from '../../../Redux Toolkit/Admin/CategoryAttributeSlice';
// ✅ FIXED: Use getChildCategories instead of getAllCategories
import { getChildCategories } from '../../../Redux Toolkit/Admin/CategorySlice';
import type { CategoryAttribute, AttributeInputType } from '../../../types/categoryAttributeTypes';
import type { Category } from '../../../types/categoryTypes';
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
  type DroppableProvided,
  type DroppableStateSnapshot,
  type DraggableProvided,
  type DraggableStateSnapshot,
} from '@hello-pangea/dnd';

// ✅ Attribute type options for form
const ATTRIBUTE_TYPES: { value: AttributeInputType; label: string }[] = [
  { value: 'text', label: 'Text Input' },
  { value: 'number', label: 'Number Input' },
  { value: 'select', label: 'Dropdown Select' },
  { value: 'textarea', label: 'Multi-line Text' },
  { value: 'boolean', label: 'Yes/No Toggle' },
];

const CategoryAttributeManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  // ✅ Use typed selectors from Redux slices
  const attributes = useAppSelector(selectCategoryAttributes);
  const loading = useAppSelector(selectCategoryAttributesLoading);
  const error = useAppSelector(selectCategoryAttributesError);
  const categories = useAppSelector((state: { category?: { categories: Category[] } }) =>
    state.category?.categories || []
  );

  // ✅ State for category selection
  const [selectedCategoryId, setSelectedCategory] = useState<string>('');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string>('');
  // ✅ State for dialogs
  const [openFormDialog, setOpenFormDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<CategoryAttribute | null>(null);
  const [deletingAttribute, setDeletingAttribute] = useState<CategoryAttribute | null>(null);
  // ✅ State for tabs (All, Active, Inactive)
  const [activeTab, setActiveTab] = useState(0);
  // ✅ State for form - INCLUDES variant control fields
  const [formData, setFormData] = useState<Partial<CategoryAttribute>>({
    name: '',
    label: '',
    type: 'text',
    options: [],
    required: false,
    placeholder: '',
    min: undefined,
    max: undefined,
    step: 1,
    order: 0,
    isActive: true,
    // ✅✅✅ NEW: Variant Control Fields
    isVariantField: false,
    displayInHighlights: true,
    isFilterable: true,
    sortOrder: 0,
  });
  // ✅ State for options input (select type)
  const [optionInput, setOptionInput] = useState('');
  // ✅ State for snackbar
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  // ✅ Fetch categories on mount
  useEffect(() => {
    if (categories.length === 0) {
      // ✅ FIXED: Pass empty string for root categories
      dispatch(getChildCategories(''));
    }
  }, [dispatch, categories.length]);

  // ✅ Get Level 3 categories for dropdown (with proper typing)
  const levelThreeCategories = useMemo(() => {
    const cats = categories as Category[];
    return cats
      .filter((cat) => cat.level === 3)
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [categories]);

  // ✅ Fetch attributes when category changes (include inactive)
  useEffect(() => {
    if (selectedCategoryId) {
      dispatch(fetchCategoryAttributes({
        categoryId: selectedCategoryId,
        includeInactive: true // ✅ Fetch both active and inactive
      }));
    } else {
      dispatch(clearCategoryAttributes(''));
    }
  }, [selectedCategoryId, dispatch]);

  // ✅ Filter attributes based on tab
  const filteredAttributes = useMemo(() => {
    return attributes.filter((attr: CategoryAttribute) => {
      // Tab 0 = All, Tab 1 = Active, Tab 2 = Inactive
      if (activeTab === 1 && !attr.isActive) return false;
      if (activeTab === 2 && attr.isActive) return false;
      return true;
    });
  }, [attributes, activeTab]);

  // ✅ Show snackbar
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  // ✅ Handle category selection - FIXED: Use SelectChangeEvent<string>
  const handleCategoryChange = (event: SelectChangeEvent<string>) => { // ✅ Fixed type
    const categoryId = event.target.value;
    const category = levelThreeCategories.find((c: Category) => c.categoryId === categoryId);
    setSelectedCategory(categoryId);
    setSelectedCategoryName(category?.name || '');
    setActiveTab(0); // Reset tab when category changes
  };

  // ✅ Open create dialog
  const handleOpenCreate = () => {
    setEditingAttribute(null);
    setFormData({
      name: '',
      label: '',
      type: 'text',
      options: [],
      required: false,
      placeholder: '',
      min: undefined,
      max: undefined,
      step: 1,
      order: attributes.length,
      isActive: true,
      // ✅✅✅ NEW: Reset variant control fields
      isVariantField: false,
      displayInHighlights: true,
      isFilterable: true,
      sortOrder: 0,
    });
    setOptionInput('');
    setOpenFormDialog(true);
  };

  // ✅ Open edit dialog - FIXED: Properly load ALL fields including variant controls
  const handleOpenEdit = (attribute: CategoryAttribute) => {
    setEditingAttribute(attribute);
    setFormData({
      name: attribute.name,
      label: attribute.label,
      type: attribute.type,
      options: attribute.options ? [...attribute.options] : [],
      required: attribute.required,
      placeholder: attribute.placeholder || '',
      min: attribute.min,
      max: attribute.max,
      step: attribute.step || 1,
      order: attribute.order,
      isActive: attribute.isActive,
      // ✅✅✅ NEW: Load variant control fields with defaults
      isVariantField: attribute.isVariantField ?? false,
      displayInHighlights: attribute.displayInHighlights ?? true,
      isFilterable: attribute.isFilterable ?? true,
      sortOrder: attribute.sortOrder ?? 0,
    });
    setOptionInput('');
    setOpenFormDialog(true);
  };

  // ✅ Open delete/deactivate dialog
  const handleOpenDelete = (attribute: CategoryAttribute) => {
    setDeletingAttribute(attribute);
    setOpenDeleteDialog(true);
  };

  // ✅ Close form dialog - FIXED: Reset ALL fields including variant controls
  const handleCloseFormDialog = () => {
    setOpenFormDialog(false);
    setEditingAttribute(null);
    setFormData({
      name: '',
      label: '',
      type: 'text',
      options: [],
      required: false,
      placeholder: '',
      min: undefined,
      max: undefined,
      step: 1,
      order: 0,
      isActive: true,
      // ✅✅✅ NEW: Reset variant control fields
      isVariantField: false,
      displayInHighlights: true,
      isFilterable: true,
      sortOrder: 0,
    });
    setOptionInput('');
  };

  // ✅ Close delete dialog
  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setDeletingAttribute(null);
  };

  // ✅ Handle form input changes
  const handleFormChange = (field: keyof CategoryAttribute, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ✅ Add option to select type - FIXED: Functional update pattern
  const handleAddOption = () => {
    const trimmed = optionInput.trim();
    if (!trimmed) {
      console.log('⚠️ Empty option, not adding');
      return;
    }
    setFormData((prev) => {
      const currentOptions = prev.options || [];
      if (currentOptions.includes(trimmed)) {
        console.log('⚠️ Option already exists:', trimmed);
        return prev;
      }
      const newOptions = [...currentOptions, trimmed];
      console.log('✅ Added option. New array:', newOptions);
      return {
        ...prev,
        options: newOptions,
      };
    });
    setOptionInput('');
  };

  // ✅ Remove option from select type
  const handleRemoveOption = (optionToRemove: string) => {
    console.log('🗑️ Removing option:', optionToRemove);
    setFormData((prev) => {
      const newOptions = (prev.options || []).filter(
        (opt: string) => opt !== optionToRemove
      );
      console.log('✅ After removal:', newOptions);
      return {
        ...prev,
        options: newOptions,
      };
    });
  };

  // ✅ Submit form (create or update)
  const handleSubmitForm = async () => {
    console.log('🚀 [FRONTEND] handleSubmitForm triggered');
    console.log('editingAttribute:', editingAttribute?._id);
    console.log('selectedCategoryId:', selectedCategoryId);
    console.log('formData:', JSON.stringify(formData, null, 2));
    // ✅ Validate required fields
    if (!formData.name?.trim()) {
      showSnackbar('Attribute name is required', 'error');
      return;
    }
    if (!formData.label?.trim()) {
      showSnackbar('Attribute label is required', 'error');
      return;
    }
    if (formData.type === 'select' && (!formData.options || formData.options.length === 0)) {
      showSnackbar('Select type must have at least one option', 'error');
      return;
    }
    console.log('✅ Validation passed, preparing dispatch...');
    try {
      if (editingAttribute && editingAttribute._id) {
        // ✅ UPDATE existing attribute
        console.log('📡 [UPDATE] Dispatching updateCategoryAttribute thunk');
        console.log('attributeId:', editingAttribute._id);
        console.log('updates being sent:', JSON.stringify(formData, null, 2));
        const result = await dispatch(
          updateCategoryAttribute({
            attributeId: editingAttribute._id,
            updates: formData,
          })
        );
        console.log('📥 [UPDATE] Thunk completed');
        console.log('result.type:', result.type);
        // ✅ FIXED: Check action type instead of using unwrap()
        if (updateCategoryAttribute.fulfilled.match(result)) {
          console.log('✅ [UPDATE] Thunk FULFILLED - Success!');
          console.log('response payload:', JSON.stringify(result.payload, null, 2));
          showSnackbar('Attribute updated successfully', 'success');
          handleCloseFormDialog();
          // ✅ Re-fetch to ensure UI sync
          if (selectedCategoryId) {
            dispatch(fetchCategoryAttributes({ categoryId: selectedCategoryId }));
          }
        } else if (updateCategoryAttribute.rejected.match(result)) {
          console.log('❌ [UPDATE] Thunk REJECTED');
          console.log('error payload:', result.payload);
          showSnackbar(result.payload as string || 'Failed to update attribute', 'error');
        }
      } else {
        // ✅ CREATE new attribute
        console.log('📡 [CREATE] Dispatching createCategoryAttribute thunk');
        if (!selectedCategoryId) {
          showSnackbar('Please select a category first', 'error');
          return;
        }
        console.log('categoryId:', selectedCategoryId);
        console.log('attribute data:', JSON.stringify(formData, null, 2));
        const result = await dispatch(
          createCategoryAttribute({
            categoryId: selectedCategoryId,
            attribute: formData,
          })
        );
        console.log('📥 [CREATE] Thunk completed');
        console.log('result.type:', result.type);
        // ✅ FIXED: Check action type instead of using unwrap()
        if (createCategoryAttribute.fulfilled.match(result)) {
          console.log('✅ [CREATE] Thunk FULFILLED - Success!');
          console.log('created attribute:', JSON.stringify(result.payload, null, 2));
          showSnackbar('Attribute created successfully', 'success');
          handleCloseFormDialog();
          // ✅ Re-fetch to show new attribute
          if (selectedCategoryId) {
            dispatch(fetchCategoryAttributes({ categoryId: selectedCategoryId }));
          }
        } else if (createCategoryAttribute.rejected.match(result)) {
          console.log('❌ [CREATE] Thunk REJECTED');
          console.log('error payload:', result.payload);
          showSnackbar(result.payload as string || 'Failed to create attribute', 'error');
        }
      }
    } catch (err: unknown) {
      const error = err as Error;
      console.log('❌ [EXCEPTION] handleSubmitForm caught error');
      console.log('error name:', error.name);
      console.log('error message:', error.message);
      showSnackbar(error.message || 'Operation failed', 'error');
    }
  };

  // ✅✅✅ UPDATED: Confirm permanent delete with better feedback
  const handleConfirmDelete = async () => {
    if (!deletingAttribute?._id) return;

    const attributeName = deletingAttribute.label || deletingAttribute.name;

    try {
      console.log(`🗑️ [DELETE] Permanently deleting attribute: ${attributeName}`);

      const result = await dispatch(
        deleteCategoryAttribute({ attributeId: deletingAttribute._id })
      );

      if (deleteCategoryAttribute.fulfilled.match(result)) {
        console.log(`✅ [DELETE] Successfully deleted: ${attributeName}`);

        // ✅ Show detailed success message
        showSnackbar(
          `Attribute "${attributeName}" permanently deleted`,
          'success'
        );

        handleCloseDeleteDialog();

        // ✅ Re-fetch to ensure UI sync
        if (selectedCategoryId) {
          dispatch(fetchCategoryAttributes({ categoryId: selectedCategoryId }));
        }
      } else {
        console.error('❌ [DELETE] Failed:', result.payload);
        showSnackbar(
          result.payload as string || `Failed to delete "${attributeName}"`,
          'error'
        );
      }
    } catch (error: unknown) {
      const errorMessage = (error as Error).message || 'Delete failed';
      console.error('❌ [DELETE] Exception:', errorMessage);
      showSnackbar(errorMessage, 'error');
    }
  };

  // ✅ Handle drag-drop reorder
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || result.source.index === result.destination.index) {
      return;
    }
    const reorderedAttributes = Array.from(attributes);
    const [removed] = reorderedAttributes.splice(result.source.index, 1);
    reorderedAttributes.splice(result.destination.index, 0, removed);
    const orderedIds: string[] = reorderedAttributes.map((attr: unknown) => {
      const a = attr as CategoryAttribute;
      return String(a._id);
    });
    try {
      const reorderResult = await dispatch(
        reorderCategoryAttributes({
          categoryId: selectedCategoryId,
          orderedIds,
        })
      );
      if (reorderCategoryAttributes.fulfilled.match(reorderResult)) {
        showSnackbar('Order updated successfully', 'success');
      } else {
        showSnackbar(reorderResult.payload as string || 'Failed to reorder', 'error');
        dispatch(fetchCategoryAttributes({ categoryId: selectedCategoryId }));
      }
    } catch (error: unknown) {
      showSnackbar((error as Error).message || 'Reorder failed', 'error');
      dispatch(fetchCategoryAttributes({ categoryId: selectedCategoryId }));
    }
  };

  // ✅ Refresh attributes
  const handleRefresh = () => {
    if (selectedCategoryId) {
      dispatch(fetchCategoryAttributes({ categoryId: selectedCategoryId }));
      showSnackbar('Attributes refreshed', 'info');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          📋 Category Attribute Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Define custom product specifications for each category (e.g., RAM for phones, Fabric for clothing)
        </Typography>
      </Box>

      {/* Category Selection */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid size={{ xs: 12, md: 6 }}>
            <FormControl fullWidth required>
              <InputLabel id="category-select-label">Select Level 3 Category *</InputLabel>
              <Select
                labelId="category-select-label"
                value={selectedCategoryId}
                label="Select Level 3 Category *"
                onChange={handleCategoryChange} // ✅ Fixed type
              >
                <MenuItem value="">
                  <em>Select a category</em>
                </MenuItem>
                {levelThreeCategories.map((cat: Category) => (
                  <MenuItem key={cat._id} value={cat.categoryId}>
                    {cat.name} ({cat.categoryId})
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                Attributes are specific to Level 3 categories (e.g., T-Shirts, Mobile Phones)
              </FormHelperText>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Tooltip title="Refresh attributes">
              <span>
                <IconButton
                  onClick={handleRefresh}
                  disabled={!selectedCategoryId || loading}
                >
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              disabled={!selectedCategoryId}
            >
              Add Attribute
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Attributes Table with Tabs */}
      <Paper sx={{ overflow: 'hidden' }}>
        {/* ✅✅✅ NEW: Tabs for filtering */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label={`All (${attributes.length})`} />
            <Tab label={`Active (${attributes.filter((a: any) => a.isActive).length})`} />
            <Tab label={`Inactive (${attributes.filter((a: any) => !a.isActive).length})`} />
          </Tabs>
        </Box>

        {loading ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>Loading attributes...</Typography>
          </Box>
        ) : !selectedCategoryId ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <Typography color="text.secondary">
              Please select a category to view and manage its attributes
            </Typography>
          </Box>
        ) : filteredAttributes.length === 0 ? (
          <Box sx={{ p: 5, textAlign: 'center' }}>
            <Typography color="text.secondary">
              No {activeTab === 1 ? 'active' : activeTab === 2 ? 'inactive' : ''} attributes found for this category
            </Typography>
            {activeTab === 0 && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenCreate}
                sx={{ mt: 2 }}
              >
                Create First Attribute
              </Button>
            )}
          </Box>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="attributes">
              {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                <TableContainer
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  sx={{ overflow: 'hidden' }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ width: '50px' }}>
                          <DragIcon fontSize="small" color="action" />
                        </TableCell>
                        <TableCell><strong>Name</strong></TableCell>
                        <TableCell><strong>Label</strong></TableCell>
                        <TableCell><strong>Type</strong></TableCell>
                        <TableCell><strong>Options</strong></TableCell>
                        <TableCell><strong>Required</strong></TableCell>
                        <TableCell><strong>Status</strong></TableCell>
                        {/* ✅✅✅ NEW: Variant/Highlight Columns */}
                        <TableCell><strong>Variant</strong></TableCell>
                        <TableCell><strong>Highlights</strong></TableCell>
                        <TableCell><strong>Filter</strong></TableCell>
                        <TableCell><strong>Sort</strong></TableCell>
                        <TableCell align="right"><strong>Actions</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAttributes.map((attr: CategoryAttribute, index: number) => (
                        <Draggable
                          key={String(attr._id)}
                          draggableId={String(attr._id)}
                          index={index}
                        >
                          {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                            <TableRow
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              sx={{
                                backgroundColor: !attr.isActive ? 'action.hover' :
                                  snapshot.isDragging ? 'action.selected' : 'inherit',
                                opacity: !attr.isActive ? 0.6 : 1,
                                boxShadow: snapshot.isDragging ? 3 : 'none',
                                '&:hover': { backgroundColor: 'action.hover' },
                              }}
                            >
                              <TableCell {...provided.dragHandleProps} sx={{ width: '50px', cursor: 'move' }}>
                                <DragIcon fontSize="small" color="action" />
                              </TableCell>
                              <TableCell>
                                <code>{attr.name}</code>
                              </TableCell>
                              <TableCell>{attr.label}</TableCell>
                              <TableCell>
                                <Chip
                                  label={attr.type}
                                  size="small"
                                  color={
                                    attr.type === 'select'
                                      ? 'primary'
                                      : attr.type === 'number'
                                        ? 'secondary'
                                        : 'default'
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                {attr.type === 'select' && attr.options && attr.options.length > 0 ? (
                                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: '200px' }}>
                                    {attr.options.slice(0, 3).map((opt: string, i: number) => (
                                      <Chip key={`${attr._id}-opt-${i}`} label={opt} size="small" variant="outlined" />
                                    ))}
                                    {attr.options.length > 3 && (
                                      <Chip label={`+${attr.options.length - 3}`} size="small" />
                                    )}
                                  </Box>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">
                                    -
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>
                                {attr.required ? (
                                  <Chip label="Yes" size="small" color="success" />
                                ) : (
                                  <Chip label="No" size="small" color="default" />
                                )}
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={attr.isActive ? 'Active' : 'Inactive'}
                                  size="small"
                                  color={attr.isActive ? 'success' : 'default'}
                                  icon={attr.isActive ? <VisibilityIcon /> : <VisibilityOffIcon />}
                                />
                              </TableCell>
                              {/* ✅✅✅ NEW: Variant Column */}
                              <TableCell>
                                {attr.isVariantField ? (
                                  <Tooltip title="Appears as Flipkart-style selector chips">
                                    <Chip
                                      label="Selector"
                                      size="small"
                                      color="primary"
                                      variant="filled"
                                      icon={<InfoIcon fontSize="small" />}
                                    />
                                  </Tooltip>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">-</Typography>
                                )}
                              </TableCell>
                              {/* ✅✅✅ NEW: Highlights Column */}
                              <TableCell>
                                {attr.displayInHighlights && !attr.isVariantField ? (
                                  <Tooltip title="Appears in Product Highlights section">
                                    <Chip
                                      label="Yes"
                                      size="small"
                                      color="success"
                                      variant="outlined"
                                      icon={<InfoIcon fontSize="small" />}
                                    />
                                  </Tooltip>
                                ) : (
                                  <Typography variant="body2" color="text.secondary">-</Typography>
                                )}
                              </TableCell>

                              {/* ✅✅✅ NEW: Filter Visibility Column */}
                              <TableCell>
                                {attr.isFilterable !== false ? (
                                  <Tooltip title="Visible in customer filter section">
                                    <Chip
                                      label="Yes"
                                      size="small"
                                      color="success"
                                      variant="outlined"
                                      icon={<VisibilityIcon fontSize="small" />}
                                    />
                                  </Tooltip>
                                ) : (
                                  <Tooltip title="Hidden from customer filter section">
                                    <Chip
                                      label="No"
                                      size="small"
                                      color="default"
                                      variant="outlined"
                                      icon={<VisibilityOffIcon fontSize="small" />}
                                    />
                                  </Tooltip>
                                )}
                              </TableCell>
                              {/* ✅✅✅ NEW: Sort Order Column */}
                              <TableCell>
                                <Typography variant="body2" fontWeight={attr.sortOrder === 0 ? 'bold' : 'normal'}>
                                  {attr.sortOrder ?? 0}
                                </Typography>
                              </TableCell>
                              {/* ✅✅✅ UPDATED: Delete button with permanent delete tooltip */}
                              <TableCell align="right">
                                <Tooltip title="Edit attribute">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleOpenEdit(attr)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip
                                  title={
                                    <Box>
                                      <Typography variant="body2" fontWeight="bold" color="error.main">
                                        ⚠️ Permanent Delete
                                      </Typography>
                                      <Typography variant="caption">
                                        This will permanently remove "{attr.label}" from the database.
                                        <br />
                                        This action cannot be undone.
                                      </Typography>
                                    </Box>
                                  }
                                  arrow
                                  placement="top"
                                >
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleOpenDelete(attr)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </Paper>

      {/* Create/Edit Dialog */}
      <Dialog open={openFormDialog} onClose={handleCloseFormDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingAttribute ? '✏️ Edit Attribute' : '➕ Create New Attribute'}
          {selectedCategoryName && (
            <Typography variant="body2" color="text.secondary">
              For: {selectedCategoryName}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Name */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Attribute Name *"
                value={formData.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="e.g., ram, fabric, wattage"
                helperText="Lowercase, no spaces (used in specifications object)"
                disabled={!!editingAttribute}
                required
              />
            </Grid>
            {/* Label */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Display Label *"
                value={formData.label}
                onChange={(e) => handleFormChange('label', e.target.value)}
                placeholder="e.g., RAM, Fabric Type, Wattage"
                helperText="Shown in product forms"
                required
              />
            </Grid>
            {/* Type */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required>
                <InputLabel>Input Type *</InputLabel>
                <Select
                  value={formData.type}
                  label="Input Type *"
                  onChange={(e) => handleFormChange('type', e.target.value as AttributeInputType)}
                >
                  {ATTRIBUTE_TYPES.map((type) => (
                    <MenuItem key={type.value} value={type.value}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            {/* Order (form order) */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Form Display Order"
                type="number"
                value={formData.order ?? 0}
                onChange={(e) => handleFormChange('order', Number(e.target.value))}
                helperText="Lower numbers appear first in product form"
              />
            </Grid>
            {/* Required */}
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.required ?? false}
                    onChange={(e) => handleFormChange('required', e.target.checked)}
                  />
                }
                label="Required field in product form"
              />
            </Grid>
            {/* Active */}
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive ?? true}
                    onChange={(e) => handleFormChange('isActive', e.target.checked)}
                  />
                }
                label="Active (visible in forms)"
              />
            </Grid>
            {/* Placeholder */}
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Placeholder Text"
                value={formData.placeholder ?? ''}
                onChange={(e) => handleFormChange('placeholder', e.target.value)}
                placeholder="e.g., Enter RAM size"
              />
            </Grid>
            {/* Number-specific fields */}
            {formData.type === 'number' && (
              <>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Min Value"
                    type="number"
                    value={formData.min ?? ''}
                    onChange={(e) => handleFormChange('min', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Max Value"
                    type="number"
                    value={formData.max ?? ''}
                    onChange={(e) => handleFormChange('max', e.target.value ? Number(e.target.value) : undefined)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    label="Step"
                    type="number"
                    value={formData.step ?? 1}
                    onChange={(e) => handleFormChange('step', e.target.value ? Number(e.target.value) : 1)}
                  />
                </Grid>
              </>
            )}
            {/* Select options */}
            {formData.type === 'select' && (
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Dropdown Options *
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    placeholder="Enter option value (e.g., 12 GB)"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                  />
                  <Button
                    variant="outlined"
                    onClick={handleAddOption}
                    disabled={!optionInput.trim()}
                  >
                    Add
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, minHeight: '40px' }}>
                  {formData.options && formData.options.length > 0 ? (
                    formData.options.map((opt: string, i: number) => (
                      <Chip
                        key={`${opt}-${i}`}
                        label={opt}
                        onDelete={() => handleRemoveOption(opt)}
                        color="primary"
                        variant="outlined"
                        size="small"
                      />
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      No options added yet
                    </Typography>
                  )}
                </Box>
                {(!formData.options || formData.options.length === 0) && (
                  <FormHelperText error>
                    Add at least one option for select type
                  </FormHelperText>
                )}
              </Grid>
            )}
            {/* ✅✅✅ NEW: Variant & Display Configuration Section */}
            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 3 }} />
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                🎯 Variant & Display Configuration
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Control how this attribute appears in the seller and customer interfaces
              </Typography>
              {/* Variant Field Toggle */}
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isVariantField ?? false}
                    onChange={(e) => handleFormChange('isVariantField', e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="500">
                      Use as Variant Selector
                    </Typography>
                    <Typography variant="caption" color="text.secondary" component="div">
                      If enabled, this field appears as Flipkart-style selector chips (e.g., RAM, Size, Color).
                      Users select options to differentiate product variants.
                      <br />
                      <em>Example: Mobile → RAM: [4GB] [8GB●] [16GB]</em>
                    </Typography>
                  </Box>
                }
                sx={{ mb: 2, display: 'block' }}
              />
              {/* Highlight Field Toggle */}
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.displayInHighlights ?? true}
                    onChange={(e) => handleFormChange('displayInHighlights', e.target.checked)}
                    disabled={formData.isVariantField} // Can't be both variant and highlight
                    color="success"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight="500">
                      Show in Product Highlights
                    </Typography>
                    <Typography variant="caption" color="text.secondary" component="div">
                      If enabled, this field appears in the Product Highlights checklist.
                      Same value shown for all variants (e.g., Processor, Warranty).
                      <br />
                      <em>Disabled when "Variant Selector" is enabled.</em>
                      <br />
                      <em>Example: Mobile → ✓ Processor: A16 Bionic</em>
                    </Typography>
                  </Box>
                }
                sx={{ mb: 2, display: 'block' }}
              />

              <FormControlLabel
  control={
    <Switch
      checked={formData.isFilterable ?? true}
      onChange={(e) => handleFormChange('isFilterable', e.target.checked)}
      color="success"
    />
  }
  label={
    <Box>
      <Typography variant="body2" fontWeight="500">
        Show in Customer Filters
      </Typography>
      <Typography variant="caption" color="text.secondary" component="div">
        If enabled, this attribute appears in the customer-facing filter section.
        Disable to hide from filters while keeping it in product details.
        <br />
        <em>Example: Disable "Warranty" from filters but still show in product specs</em>
      </Typography>
    </Box>
  }
  sx={{ mb: 2, display: 'block' }}
/>

              {/* Sort Order Input */}
              <TextField
                fullWidth
                label="UI Display Sort Order"
                type="number"
                value={formData.sortOrder ?? 0}
                onChange={(e) => handleFormChange('sortOrder', Number(e.target.value))}
                helperText="Lower values display first in variant selectors/highlights (0 = first position). Independent of form order."
                InputProps={{ inputProps: { min: 0 } }}
                sx={{ maxWidth: '200px' }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseFormDialog} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitForm}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : editingAttribute ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ✅✅✅ UPDATED: Delete Confirmation Dialog - Permanent Delete */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>⚠️ Confirm Permanent Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to <strong>permanently delete</strong> the attribute "
            <strong>{deletingAttribute?.label}</strong>"?
          </Typography>

          <Alert severity="warning" sx={{ mt: 2 }}>
            <Typography variant="body2" fontWeight="500">
              ⚠️ This action cannot be undone:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2, mt: 1 }}>
              <li>Attribute will be permanently removed from database</li>
              <li>It will no longer appear in product forms</li>
              <li>Existing products may lose this specification data</li>
            </Box>
          </Alert>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
            Attribute: <code>{deletingAttribute?.name}</code> |
            Category: {selectedCategoryName}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            startIcon={<DeleteIcon />}
          >
            Permanently Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CategoryAttributeManagement;