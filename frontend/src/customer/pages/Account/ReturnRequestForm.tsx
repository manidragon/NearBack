// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Account\ReturnRequestForm.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, MenuItem, Alert, CircularProgress, Box, Typography, Chip, IconButton
} from '@mui/material';
import { CloudUpload, Close, Delete, Replay } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../Redux Toolkit/Store';
import { createReturnRequest, clearReturnError } from '../../../Redux Toolkit/Customer/ReturnSlice';
import type { ReturnReason } from '../../../types/orderTypes';
import { uploadToCloudinary, uploadMultipleToCloudinary, type UploadResult } from '../../../util/uploadToCloudnary';

interface ReturnRequestFormProps {
  open: boolean;
  onClose: () => void;
  orderItemId: string;
  itemDetails?: {
    title: string;
    sellingPrice: number;
    image?: string;
    variant?: string;
    paymentMethod?: string;
  };
}

const ReturnRequestForm: React.FC<ReturnRequestFormProps> = ({
  open, onClose, orderItemId, itemDetails
}) => {
  const dispatch = useAppDispatch();
  const { loading, error, successMessage } = useAppSelector(state => state.returns);

  // ✅ Form State
  const [reason, setReason] = useState<ReturnReason | ''>('');
  const [description, setDescription] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [uploadErrors, setUploadErrors] = useState<{ [key: string]: string }>({});
  const [refundMethod, setRefundMethod] = useState<'WALLET' | 'RAZORPAY'>('WALLET');
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<string>('');

  // ✅ Available Reasons
  const reasons: ReturnReason[] = [
    'Wrong size',
    'Defective/Damaged',
    'Wrong item delivered',
    'Not as described',
    'Changed mind',
    'Better price found',
    'Other'
  ];

  // ✅ Reset form when modal closes
  useEffect(() => {
    if (!open) {
      dispatch(clearReturnError());
      setReason('');
      setDescription('');
      setImageFiles([]);
      setFormError('');
      setSubmitting(false);
    }
  }, [open, dispatch]);

  useEffect(() => {
    if (open && itemDetails?.paymentMethod) {
      console.log('🔍 Setting orderPaymentMethod from props:', itemDetails.paymentMethod);
      setOrderPaymentMethod(itemDetails.paymentMethod);

      // Auto-select wallet for COD orders (business rule)
      if (itemDetails.paymentMethod === 'CASH_ON_DELIVERY') {
        setRefundMethod('WALLET');
      }
    }
  }, [open, itemDetails?.paymentMethod]);


  // ✅ Handle Image Selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + imageFiles.length > 5) {
      setFormError('Maximum 5 images allowed');
      return;
    }
    setImageFiles(prev => [...prev, ...files].slice(0, 5));
    setFormError('');
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  // ✅ Submit Handler - ONLY triggers on button click
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!reason) {
      setFormError('Please select a reason for return');
      return;
    }

    setSubmitting(true);
    setUploadingImages(imageFiles.length > 0); // Show upload indicator if images selected

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

        // ✅ Handle partial failures: allow submit with successful uploads
        if (failed.length > 0) {
          console.warn('⚠️ Some images failed to upload:', failed);
          setUploadErrors(
            failed.reduce((acc, f) => ({ ...acc, [f.fileName]: f.error }), {})
          );

          // Optional: Block submit if NO images uploaded successfully
          if (imageUrls.length === 0) {
            setFormError('Failed to upload any images. Please try again or submit without images.');
            setSubmitting(false);
            return;
          }
        }
      }

      // ✅ Create return request with image URLs
      await dispatch(createReturnRequest({
        orderItemId,
        reason,
        description,
        images: imageUrls,
        refundMethod,
        jwt
      }));

      // ✅ Only close on success
      if (!error) {
        setTimeout(() => {
          onClose();
        }, 1500);
      }

    } catch (err: any) {
      console.error('Submit error:', err);
      setFormError('Failed to submit return. Please try again.');
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
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown={submitting}
    >
      {/* ✅ FIX 1: DialogTitle with SPAN instead of heading to avoid <h2><h6> nesting */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
          // ✅ Override MUI's default h2 styling for span
          '& .MuiTypography-root': {
            display: 'inline-block'
          }
        }}
      >
        {/* ✅ Use component="span" to render as <span>, not <h6> */}
        <Typography
          component="span"  // ✅ CRITICAL: Renders as <span>, not heading
          sx={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            lineHeight: 1.5
          }}
        >
          Request Return
        </Typography>
        <IconButton onClick={handleModalClose} size="small" disabled={submitting}>
          <Close />
        </IconButton>
      </DialogTitle>

      {/* ✅ FIX 2: Form with comprehensive event prevention */}
      <form
        onSubmit={handleSubmit}
        onReset={(e) => { e.preventDefault(); e.stopPropagation(); }}
        // ✅ Prevent any click inside form from triggering submit
        onClick={(e) => e.stopPropagation()}
      >
        <DialogContent dividers>
          {/* ✅ Item Summary Card */}
          {itemDetails && (
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
              {itemDetails.image && (
                <img
                  src={itemDetails.image}
                  alt={itemDetails.title}
                  style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              )}
              <Box sx={{ flex: 1 }}>
                <Typography component="span" variant="subtitle2" fontWeight="bold" noWrap>
                  {itemDetails.title}
                </Typography>
                {itemDetails.variant && (
                  <Typography component="span" variant="caption" color="text.secondary" display="block">
                    {itemDetails.variant}
                  </Typography>
                )}
                <Typography component="span" variant="body2" color="success.main" fontWeight="medium">
                  Refund Amount: ₹{itemDetails.sellingPrice}
                </Typography>
              </Box>
            </Box>
          )}

          {/* ✅ Alerts */}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
          {formError && <Alert severity="warning" sx={{ mb: 2 }}>{formError}</Alert>}

          {/* ✅ Reason Dropdown - with event stop propagation */}
          <TextField
            select
            fullWidth
            label="Reason for Return *"
            value={reason}
            onChange={(e) => {
              e.stopPropagation(); // ✅ Stop event bubbling
              setReason(e.target.value as ReturnReason);
              setFormError('');
            }}
            // ✅ CRITICAL: Prevent dropdown interaction from triggering form submit
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            required
            sx={{ mb: 2 }}
            disabled={submitting || loading}
            // ✅ Prevent native form submission on select
            inputProps={{
              onClick: (e: React.MouseEvent) => e.stopPropagation()
            }}
          >
            {reasons.map((r) => (
              <MenuItem
                key={r}
                value={r}
                // ✅ Stop propagation on each menu item click
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
            placeholder="Describe the issue with your item..."
            sx={{ mb: 2 }}
            disabled={submitting || loading}
          />

          {/* ✅ Refund Method Selection */}
          <Box sx={{ mb: 2, p: 2, bgcolor: 'primary.lighter', borderRadius: 2 }}>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              Refund Method
            </Typography>

            {/* Wallet Option */}
            <Box
              component="label"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: 1,
                border: '2px solid',
                borderColor: refundMethod === 'WALLET' ? 'primary.main' : 'transparent',
                bgcolor: refundMethod === 'WALLET' ? 'white' : 'transparent',
                cursor: 'pointer',
                '&:hover': { borderColor: 'primary.light' }
              }}
            >
              <input
                type="radio"
                name="refundMethod"
                value="WALLET"
                checked={refundMethod === 'WALLET'}
                onChange={(e) => setRefundMethod(e.target.value as 'WALLET')}
                style={{ display: 'none' }}
              />
              <Box sx={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid', borderColor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {refundMethod === 'WALLET' && <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" fontWeight="medium">Refund to Wallet</Typography>
                <Typography variant="caption" color="text.secondary">Instant credit • Use for future orders</Typography>
              </Box>
              <Chip label="Instant" size="small" color="success" variant="outlined" sx={{ fontSize: '0.7rem' }} />
            </Box>

            {/* Razorpay Option - Only show if order was paid via Razorpay */}
            {orderPaymentMethod === 'RAZORPAY' && (
              <Box
                component="label"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  mt: 1,
                  borderRadius: 1,
                  border: '2px solid',
                  borderColor: refundMethod === 'RAZORPAY' ? 'primary.main' : 'transparent',
                  bgcolor: refundMethod === 'RAZORPAY' ? 'white' : 'transparent',
                  cursor: 'pointer',
                  '&:hover': { borderColor: 'primary.light' }
                }}
              >
                <input
                  type="radio"
                  name="refundMethod"
                  value="RAZORPAY"
                  checked={refundMethod === 'RAZORPAY'}
                  onChange={(e) => setRefundMethod(e.target.value as 'RAZORPAY')}
                  style={{ display: 'none' }}
                />
                <Box sx={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid', borderColor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {refundMethod === 'RAZORPAY' && <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body2" fontWeight="medium">Refund to Original Payment Method</Typography>
                  <Typography variant="caption" color="text.secondary">2-5 business days • Back to card/UPI</Typography>
                </Box>
                <Chip label="2-5 days" size="small" color="warning" variant="outlined" sx={{ fontSize: '0.7rem' }} />
              </Box>
            )}

            {/* COD Notice */}
            {orderPaymentMethod === 'CASH_ON_DELIVERY' && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, pl: 3 }}>
                💡 COD orders can only be refunded to wallet
              </Typography>
            )}
          </Box>

          {/* ✅ Image Upload */}
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
                // ✅ Clear previous errors when new files selected
                setUploadErrors({});
                setUploadProgress({});
              }}
              onClick={(e) => e.stopPropagation()}
              style={{ display: 'none' }}
              id="return-images-upload"
              disabled={submitting || loading || uploadingImages || imageFiles.length >= 5}
            />

            <label htmlFor="return-images-upload">
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
            color="error"
            disabled={submitting || loading || uploadingImages || !reason}
            startIcon={
              submitting || uploadingImages
                ? <CircularProgress size={20} color="inherit" />
                : <Replay fontSize="small" />
            }
            onClick={(e) => e.stopPropagation()}
          >
            {uploadingImages
              ? 'Uploading Images...'
              : submitting || loading
                ? 'Submitting...'
                : 'Submit Return'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ReturnRequestForm;