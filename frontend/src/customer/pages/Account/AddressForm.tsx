// D:\Mani\Code with Zosh\Backup\source code\frontend\src\customer\pages\Account\AddressForm.tsx
import { useState } from 'react';
import { TextField, Button, Box, FormControl, FormHelperText, Typography } from '@mui/material';
import { type Address } from '../../../types/addressTypes';

interface AddressFormProps {
  initialData?: Address | null;
  onSubmit: (data: Omit<Address, '_id'> | Address) => void;
  onCancel?: () => void;
}

const AddressForm = ({ initialData, onSubmit, onCancel }: AddressFormProps) => {
  const [formData, setFormData] = useState<Omit<Address, '_id'>>({
    name: initialData?.name || '',
    locality: initialData?.locality || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    pinCode: initialData?.pinCode || '',
    mobile: initialData?.mobile || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof Omit<Address, '_id'>, string>>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof Omit<Address, '_id'>]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof Omit<Address, '_id'>, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.locality.trim()) {
      newErrors.locality = 'Locality is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.pinCode.trim()) {
      newErrors.pinCode = 'Pin Code is required';
    } else if (!/^\d{6}$/.test(formData.pinCode)) {
      newErrors.pinCode = 'Pin Code must be 6 digits';
    }

    if (!formData.mobile.trim()) {
      newErrors.mobile = 'Mobile is required';
    } else if (!/^\d{10}$/.test(formData.mobile)) {
      newErrors.mobile = 'Mobile must be 10 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <Box className="border p-4 rounded-md shadow-sm">
      <form onSubmit={handleSubmit}>
        <Typography variant="subtitle2" className="mb-3 text-gray-600">
          {initialData ? 'Edit Address Details' : 'Add New Address'}
        </Typography>

        <FormControl fullWidth className="mb-3">
          <TextField
            size="small"
            label="Full Name *"
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={!!errors.name}
            helperText={errors.name}
            required
          />
        </FormControl>

        <FormControl fullWidth className="mb-3">
          <TextField
            size="small"
            label="Address Line *"
            name="address"
            value={formData.address}
            onChange={handleChange}
            error={!!errors.address}
            helperText={errors.address}
            required
            multiline
            rows={2}
          />
        </FormControl>

        <FormControl fullWidth className="mb-3">
          <TextField
            size="small"
            label="Locality / Area *"
            name="locality"
            value={formData.locality}
            onChange={handleChange}
            error={!!errors.locality}
            helperText={errors.locality}
            required
          />
        </FormControl>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <FormControl fullWidth>
            <TextField
              size="small"
              label="City *"
              name="city"
              value={formData.city}
              onChange={handleChange}
              error={!!errors.city}
              helperText={errors.city}
              required
            />
          </FormControl>

          <FormControl fullWidth>
            <TextField
              size="small"
              label="State *"
              name="state"
              value={formData.state}
              onChange={handleChange}
              error={!!errors.state}
              helperText={errors.state}
              required
            />
          </FormControl>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          <FormControl fullWidth>
            <TextField
              size="small"
              label="Pin Code *"
              name="pinCode"
              value={formData.pinCode}
              onChange={handleChange}
              error={!!errors.pinCode}
              helperText={errors.pinCode || '6-digit postal code'}
              required
              inputProps={{ maxLength: 6 }}
            />
          </FormControl>

          <FormControl fullWidth>
            <TextField
              size="small"
              label="Mobile *"
              name="mobile"
              value={formData.mobile}
              onChange={handleChange}
              error={!!errors.mobile}
              helperText={errors.mobile || '10-digit mobile number'}
              required
              inputProps={{ maxLength: 10 }}
            />
          </FormControl>
        </div>

        <Box className="flex gap-2 mt-4 pt-3 border-t">
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            fullWidth
            sx={{ py: 1.2 }}
          >
            {initialData ? 'Update Address' : 'Add Address'}
          </Button>
          {onCancel && (
            <Button 
              type="button" 
              variant="outlined" 
              onClick={onCancel}
              fullWidth
              sx={{ py: 1.2 }}
            >
              Cancel
            </Button>
          )}
        </Box>

        {Object.keys(errors).length > 0 && (
          <Typography variant="caption" color="error" className="mt-2 block">
            Please fix the errors above before submitting
          </Typography>
        )}
      </form>
    </Box>
  );
};

export default AddressForm;