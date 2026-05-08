// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Checkout\AddresssForm.tsx
import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  Button,
  TextField,
  Grid,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { useAppDispatch } from '../../../Redux Toolkit/Store';
import { addAddress } from '../../../Redux Toolkit/Customer/UserSlice'; // ✅ Changed to addAddress
import type { Address } from '../../../types/addressTypes';

// Validation schema
const ContactSchema = Yup.object().shape({
  name: Yup.string().required('Required'),
  mobile: Yup.string()
    .matches(/^[6-9]\d{9}$/, 'Invalid mobile number')
    .required('Required'),
  pinCode: Yup.string()
    .matches(/^\d{6}$/, 'Invalid pincode')
    .required('Required'),
  address: Yup.string().required('Required'),
  locality: Yup.string().required('Required'),
  city: Yup.string().required('Required'),
  state: Yup.string().required('Required'),
});

interface AddressFormProp {
  handleClose: () => void;
  onSuccess?: () => void; // ✅ Callback after successful address add
}

const AddressForm: React.FC<AddressFormProp> = ({ handleClose, onSuccess }) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const formik = useFormik({
    initialValues: {
      name: '',
      mobile: '',
      pinCode: '',
      address: '',
      locality: '',
      city: '',
      state: '',
    },
    validationSchema: ContactSchema,
    onSubmit: async (values) => {
      setLoading(true);
      try {
        console.log("Adding address:", values);
        
        // ✅ Only add address, don't create order
        const result = await dispatch(addAddress(values as Omit<Address, '_id'>)).unwrap();

        setSnackbarMessage('Address added successfully!');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        
        // ✅ Close modal after success
        setTimeout(() => {
          handleClose();
          if (onSuccess) onSuccess();
          setLoading(false);
          formik.resetForm(); // ✅ Reset form
        }, 1500);
      } catch (error: any) {
        setSnackbarMessage(error || 'Failed to add address');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setLoading(false);
      }
    },
  });

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <p className='text-xl font-bold text-center pb-5'>
        Add New Address
      </p>
      
      {loading && (
        <Box className='flex justify-center mb-4'>
          <CircularProgress />
        </Box>
      )}

      <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={3}>
          <Grid size={12}>
            <TextField
              fullWidth
              name="name"
              label="Name *"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
              required
            />
          </Grid>
          <Grid size={6}>
            <TextField
              fullWidth
              name="mobile"
              label="Mobile *"
              value={formik.values.mobile}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.mobile && Boolean(formik.errors.mobile)}
              helperText={formik.touched.mobile && formik.errors.mobile}
              required
            />
          </Grid>
          <Grid size={6}>
            <TextField
              fullWidth
              name="pinCode"
              label="Pin Code *"
              value={formik.values.pinCode}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.pinCode && Boolean(formik.errors.pinCode)}
              helperText={formik.touched.pinCode && formik.errors.pinCode}
              required
            />
          </Grid>
          <Grid size={12}>
            <TextField
              fullWidth
              name="address"
              label="Address (House No, Building, Street) *"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.address && Boolean(formik.errors.address)}
              helperText={formik.touched.address && formik.errors.address}
              multiline
              rows={2}
              required
            />
          </Grid>
          <Grid size={12}>
            <TextField
              fullWidth
              name="locality"
              label="Locality/Town *"
              value={formik.values.locality}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.locality && Boolean(formik.errors.locality)}
              helperText={formik.touched.locality && formik.errors.locality}
              required
            />
          </Grid>
          <Grid size={6}>
            <TextField
              fullWidth
              name="city"
              label="City *"
              value={formik.values.city}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.city && Boolean(formik.errors.city)}
              helperText={formik.touched.city && formik.errors.city}
              required
            />
          </Grid>
          <Grid size={6}>
            <TextField
              fullWidth
              name="state"
              label="State *"
              value={formik.values.state}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.state && Boolean(formik.errors.state)}
              helperText={formik.touched.state && formik.errors.state}
              required
            />
          </Grid>
          <Grid size={12} className='flex gap-3'>
            <Button 
              type="button"
              onClick={handleClose}
              variant="outlined" 
              fullWidth
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              fullWidth
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Address'}
            </Button>
          </Grid>
        </Grid>
      </form>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddressForm;