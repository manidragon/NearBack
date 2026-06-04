import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, TextField, MenuItem, Alert, CircularProgress, Box, Typography, Chip, IconButton
} from '@mui/material';
import { Close, SwapHoriz, CloudUpload, Delete } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { createReplacementRequest, clearReturnError } from '../../../Redux Toolkit/Customer/ReturnSlice';
import { uploadMultipleToCloudinary } from '../../../util/uploadToCloudnary';
import type { OrderItem } from '../../../types/orderTypes';

interface ReplacementRequestFormProps {
    open: boolean;
    onClose: () => void;
    orderItem: OrderItem;
    orderId: string;
}

const ReplacementRequestForm: React.FC<ReplacementRequestFormProps> = ({
    open, onClose, orderItem, orderId
}) => {
    const dispatch = useAppDispatch();
    const { loading, error, successMessage } = useAppSelector(state => state.returns);

    // ✅ Form State
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [reason, setReason] = useState('');
    const [description, setDescription] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [formError, setFormError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
    const [uploadErrors, setUploadErrors] = useState<{ [key: string]: string }>({});

    // ✅ Available Reasons
    const reasons = [
        'Wrong size',
        'Defective/Damaged',
        'Wrong item delivered',
        'Not as described',
        'Changed mind',
        'Better price found',
        'Other'
    ];

    // ✅ Available Variants (ONLY exact same variant)
    const availableVariants = React.useMemo(() => {
        if (!orderItem?.product?.variants) return [];

        // Strategy 1: Match by variantId if available
        let currentVariant: any = orderItem.variantId
            ? orderItem.product.variants.find((v: any) => String(v._id) === String(orderItem.variantId))
            : null;

        // Strategy 2: Fallback to matching by selling price
        if (!currentVariant && orderItem.sellingPrice) {
            currentVariant = orderItem.product.variants.find(
                (v: any) => v.offers?.[0]?.sellingPrice === orderItem.sellingPrice
            );
        }

        if (!currentVariant) return [];

        // Check stock availability
        const hasStock = currentVariant.offers?.some(
            (o: any) => o.stock > 0 && o.isActive !== false
        );

        return hasStock ? [currentVariant] : [];
    }, [orderItem]);

    // ✅ Auto-select variant when available
    useEffect(() => {
        if (availableVariants.length === 1 && !selectedVariant) {
            setSelectedVariant(availableVariants[0]);
        }
    }, [availableVariants]);

    // ✅ Reset form when modal closes
    useEffect(() => {
        if (!open) {
            dispatch(clearReturnError());
            setSelectedVariant(null);
            setReason('');
            setDescription('');
            setImageFiles([]);
            setFormError('');
            setSubmitting(false);
            setUploadingImages(false);
            setUploadProgress({});
            setUploadErrors({});
        }
    }, [open, dispatch]);

    // ✅ Handle Image Selection
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + imageFiles.length > 5) {
            setFormError('Maximum 5 images allowed');
            return;
        }
        setImageFiles(prev => [...prev, ...files].slice(0, 5));
        setFormError('');
        // Clear previous errors when new files selected
        setUploadErrors({});
        setUploadProgress({});
    };

    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
    };

    // ✅ Submit Handler - Upload images on submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!selectedVariant) {
            setFormError('Replacement variant not available');
            return;
        }
        if (!reason) {
            setFormError('Please select a reason for replacement');
            return;
        }

        setSubmitting(true);
        setUploadingImages(imageFiles.length > 0);

        try {
            const jwt = localStorage.getItem('jwt') || '';
            if (!jwt) {
                setFormError('Authentication required. Please login again.');
                setSubmitting(false);
                return;
            }

            // ✅ Upload images to Cloudinary (if any selected)
            let imageUrls: string[] = [];

            if (imageFiles.length > 0) {
                console.log(`📤 Uploading ${imageFiles.length} image(s) to Cloudinary...`);

                const { successful, failed } = await uploadMultipleToCloudinary(
                    imageFiles,
                    (fileName, progress) => {
                        setUploadProgress(prev => ({ ...prev, [fileName]: progress }));
                    }
                );

                imageUrls = successful;

                // ✅ Handle partial failures
                if (failed.length > 0) {
                    console.warn('⚠️ Some images failed to upload:', failed);
                    setUploadErrors(
                        failed.reduce((acc, f) => ({ ...acc, [f.fileName]: f.error }), {})
                    );

                    // Block submit if NO images uploaded successfully
                    if (imageUrls.length === 0) {
                        setFormError('Failed to upload any images. Please try again or submit without images.');
                        setSubmitting(false);
                        return;
                    }
                }
            }

            // Prepare replacement variant data
            const replacementVariant = {
                variantId: selectedVariant._id,
                color: selectedVariant.color,
                specifications: selectedVariant.specifications,
                sellingPrice: selectedVariant.offers?.[0]?.sellingPrice,
                stock: selectedVariant.offers?.[0]?.stock,
                images: selectedVariant.images
            };

            // Create replacement request
            await dispatch(createReplacementRequest({
                orderItemId: orderItem._id,
                reason,
                description,
                images: imageUrls,
                replacementVariant,
                jwt
            }));

            // Close on success
            if (!error) {
                setTimeout(() => {
                    onClose();
                }, 1500);
            }

        } catch (err: any) {
            console.error('Submit error:', err);
            setFormError('Failed to submit replacement. Please try again.');
        } finally {
            setSubmitting(false);
            setUploadingImages(false);
            setUploadProgress({});
            setUploadErrors({});
        }
    };

    // ✅ Handle modal close
    const handleModalClose = () => {
        if (!submitting) {
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={(event, reason) => {
                if (submitting) return;
                if (reason === 'backdropClick') return;
                handleModalClose();
            }}
            maxWidth="md"
            fullWidth
            disableEscapeKeyDown={submitting}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Typography component="span" sx={{ fontSize: '1.25rem', fontWeight: 'bold', lineHeight: 1.5 }}>
                    Request Replacement
                </Typography>
                <IconButton onClick={handleModalClose} size="small" disabled={submitting}>
                    <Close />
                </IconButton>
            </DialogTitle>

            <form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()}>
                <DialogContent dividers>
                    {/* ✅ Item Summary */}
                    <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
                        <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                            Current Item
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            {orderItem?.product?.images?.[0] && (
                                <img
                                    src={orderItem.product.images[0]}
                                    alt={orderItem.product?.title}
                                    style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            )}
                            <Box sx={{ flex: 1 }}>
                                <Typography component="span" variant="subtitle2" fontWeight="bold" noWrap>
                                    {orderItem?.product?.title}
                                </Typography>
                                <Typography component="span" variant="caption" color="text.secondary" display="block">
                                    {orderItem?.size}
                                </Typography>
                                <Typography component="span" variant="body2" color="success.main" fontWeight="medium">
                                    ₹{orderItem?.sellingPrice}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* ✅ Alerts */}
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
                    {formError && <Alert severity="warning" sx={{ mb: 2 }}>{formError}</Alert>}

                    {/* ✅ Reason Dropdown */}
                    <TextField
                        select
                        fullWidth
                        label="Reason for Replacement *"
                        value={reason}
                        onChange={(e) => {
                            e.stopPropagation();
                            setReason(e.target.value);
                            setFormError('');
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        required
                        sx={{ mb: 2 }}
                        disabled={submitting || loading}
                        inputProps={{
                            onClick: (e: React.MouseEvent) => e.stopPropagation()
                        }}
                    >
                        {reasons.map((r) => (
                            <MenuItem
                                key={r}
                                value={r}
                                onClick={(e) => e.stopPropagation()}
                            >
                                {r}
                            </MenuItem>
                        ))}
                    </TextField>

                    {/* ✅ Description Field */}
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Additional Details (Optional)"
                        value={description}
                        onChange={(e) => {
                            e.stopPropagation();
                            setDescription(e.target.value);
                        }}
                        placeholder="Describe why you want to replace this item..."
                        sx={{ mb: 2 }}
                        disabled={submitting || loading}
                    />

                    {/* ✅ Replacement Variant Display */}
                    {availableVariants.length > 0 && (
                        <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2, border: '1px solid', borderColor: 'primary.light' }}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1.5 }}>
                                Replacement Item
                            </Typography>

                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                {availableVariants[0].images?.[0] && (
                                    <img
                                        src={availableVariants[0].images[0]}
                                        alt={availableVariants[0].color}
                                        style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }}
                                    />
                                )}

                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body1" fontWeight="bold">
                                        {availableVariants[0].color}
                                    </Typography>

                                    {availableVariants[0].specifications &&
                                        Object.entries(availableVariants[0].specifications).map(([key, value]: [string, unknown]) => {
                                            const displayValue = String(value);
                                            return (
                                                <Typography key={key} variant="body2" color="text.secondary" display="block">
                                                    {key}: {displayValue}
                                                </Typography>
                                            );
                                        })
                                    }

                                    <Typography variant="body2" fontWeight="bold" color="success.main" sx={{ mt: 0.5 }}>
                                        ₹{availableVariants[0].offers?.[0]?.sellingPrice}
                                    </Typography>

                                    {availableVariants[0].offers?.[0]?.stock <= 5 && availableVariants[0].offers?.[0]?.stock > 0 && (
                                        <Chip
                                            label={`Only ${availableVariants[0].offers[0].stock} left`}
                                            size="small"
                                            color="warning"
                                            variant="outlined"
                                            sx={{ mt: 0.5 }}
                                        />
                                    )}
                                </Box>
                            </Box>

                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                ✅ Same variant as your original order
                            </Typography>
                        </Box>
                    )}

                    {/* ✅ Image Upload - Same as ReturnRequestForm */}
                    <Box sx={{ mb: 1 }}>
                        <Typography component="span" variant="body2" fontWeight="medium" sx={{ mb: 1, display: 'block' }}>
                            Upload Proof Images (Optional, Max 5)
                        </Typography>

                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => {
                                e.stopPropagation();
                                handleImageChange(e);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ display: 'none' }}
                            id="replacement-images-upload"
                            disabled={submitting || loading || uploadingImages || imageFiles.length >= 5}
                        />

                        <label htmlFor="replacement-images-upload">
                            <Button
                                variant="outlined"
                                component="span"
                                startIcon={uploadingImages ? <CircularProgress size={16} /> : <CloudUpload />}
                                disabled={submitting || loading || uploadingImages || imageFiles.length >= 5}
                                fullWidth
                                onClick={(e) => e.stopPropagation()}
                            >
                                {uploadingImages
                                    ? `Uploading ${Object.keys(uploadProgress).length}/${imageFiles.length}...`
                                    : imageFiles.length > 0
                                        ? `${imageFiles.length} image(s) selected`
                                        : 'Choose Images (Optional)'}
                            </Button>
                        </label>

                        {/* ✅ Upload Errors Display */}
                        {Object.keys(uploadErrors).length > 0 && (
                            <Box sx={{ mt: 1, p: 1, bgcolor: 'error.lighter', borderRadius: 1, border: '1px solid', borderColor: 'error.light' }}>
                                {Object.entries(uploadErrors).map(([fileName, error]) => (
                                    <Typography key={fileName} variant="caption" color="error.main" display="block">
                                        ❌ {fileName}: {error}
                                    </Typography>
                                ))}
                            </Box>
                        )}

                        {/* ✅ Image Preview Chips with Progress */}
                        {imageFiles.length > 0 && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                                {imageFiles.map((file, idx) => {
                                    const progress = uploadProgress[file.name];
                                    const error = uploadErrors[file.name];

                                    return (
                                        <Box key={idx} sx={{ position: 'relative' }}>
                                            <Chip
                                                label={file.name.length > 15 ? `${file.name.substring(0, 12)}...` : file.name}
                                                onDelete={() => !submitting && !uploadingImages && removeImage(idx)}
                                                deleteIcon={<Delete />}
                                                size="small"
                                                variant={error ? "filled" : "outlined"}
                                                color={error ? "error" : "default"}
                                                disabled={submitting || uploadingImages}
                                                sx={{
                                                    fontSize: '0.75rem',
                                                    maxWidth: 150,
                                                    ...(error && { bgcolor: 'error.lighter', color: 'error.main' })
                                                }}
                                            />

                                            {/* ✅ Progress bar overlay */}
                                            {progress !== undefined && !error && (
                                                <Box sx={{
                                                    position: 'absolute',
                                                    bottom: 0,
                                                    left: 0,
                                                    right: 0,
                                                    height: '3px',
                                                    bgcolor: 'primary.light',
                                                    borderRadius: '0 0 4px 4px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <Box sx={{
                                                        width: `${progress}%`,
                                                        height: '100%',
                                                        bgcolor: 'primary.main',
                                                        transition: 'width 0.2s'
                                                    }} />
                                                </Box>
                                            )}

                                            {/* ✅ Error icon */}
                                            {error && (
                                                <Box sx={{
                                                    position: 'absolute',
                                                    top: -6,
                                                    right: -6,
                                                    bgcolor: 'error.main',
                                                    borderRadius: '50%',
                                                    width: 16,
                                                    height: 16,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Typography variant="caption" color="white" fontSize="10px">!</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}

                        {/* ✅ Helper text */}
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                            Supported: JPG, PNG, WebP • Max 5MB each • Max 5 images
                        </Typography>
                    </Box>
                </DialogContent>

                {/* ✅ Actions */}
                <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
                    <Button
                        onClick={(e) => { e.stopPropagation(); handleModalClose(); }}
                        disabled={submitting || loading}
                        color="inherit"
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={submitting || loading || uploadingImages || !reason}
                        startIcon={
                            submitting || uploadingImages
                                ? <CircularProgress size={20} color="inherit" />
                                : <SwapHoriz fontSize="small" />
                        }
                        onClick={(e) => e.stopPropagation()}
                    >
                        {uploadingImages
                            ? 'Uploading Images...'
                            : submitting || loading
                                ? 'Submitting...'
                                : 'Submit Replacement'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default ReplacementRequestForm;