// 📄 File: D:\Mani\Code with Zosh\Backup\source code\frontend\src\seller\pages\Account\LocationForm.tsx
import React, { useState } from 'react';
import {
  Box, Button, TextField, FormControl, InputLabel, Select,
  MenuItem, FormHelperText, CircularProgress, Alert, Snackbar,
  Typography  // ✅ FIX 1: Added Typography import
} from '@mui/material';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import { useAppDispatch } from '../../../Redux Toolkit/Store';
// ✅ FIX 2: Correct casing + correct action name
import { updateSeller } from '../../../Redux Toolkit/Seller/sellerSlice'; // ← lowercase 's', and updateSeller

// ✅ Tamil Nadu districts (same as backend)
const TN_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore',
  'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kanchipuram',
  'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
  'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
  'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi',
  'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupathur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur',
  'Vellore', 'Viluppuram', 'Virudhunagar'
];

interface LocationFormProps {
  onClose: () => void;
}

const LocationForm: React.FC<LocationFormProps> = ({ onClose }) => {
  const dispatch = useAppDispatch();
  const [district, setDistrict] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error'
  }>({ 
    open: false, 
    message: '', 
    severity: 'success' 
  });

  // ✅ Get current location via browser
  const handleGetCurrentLocation = async () => {
    try {
      setLoading(true);
      setError('');
      
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });
      
      setCoordinates({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude
      });
      
    } catch (err: any) {
      setError(err.message || 'Failed to get location');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Save location to backend - FIXED: Allow district OR coordinates
  const handleSave = async () => {
    // ✅ Validation: At least ONE of district or coordinates must be set
    if (!district && !coordinates) {
      setError('Please select a district OR set your location coordinates');
      return;
    }

    try {
      setLoading(true);
      
      // ✅ Build payload with ONLY the fields that are set
      const updateData: any = {};
      
      if (district) {
        updateData.district = district;
      }
      
      if (coordinates) {
        // ✅ GeoJSON format: [longitude, latitude]
        updateData.location = {
          type: 'Point',
          coordinates: [coordinates.lng, coordinates.lat],  // ✅ [lng, lat] for GeoJSON
          ...(address && { address: address.trim() })
        };
      }
      
      await dispatch(updateSeller(updateData)).unwrap();
      
      setSnackbar({ open: true, message: 'Location updated successfully!', severity: 'success' });
      setTimeout(onClose, 1500);
      
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Failed to update location', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" className="text-xl font-bold mb-4">📍 Set Business Location</Typography>
      
      {/* District Dropdown */}
      <FormControl fullWidth margin="normal">
        <InputLabel>District</InputLabel>
        <Select
          value={district}
          onChange={(e) => setDistrict(e.target.value)}
          label="District"
        >
          <MenuItem value=""><em>None</em></MenuItem>  {/* ✅ Allow clearing district */}
          {TN_DISTRICTS.map((dist) => (
            <MenuItem key={dist} value={dist}>{dist}</MenuItem>
          ))}
        </Select>
        <FormHelperText>Select your business district (optional)</FormHelperText>
      </FormControl>

      {/* Current Location Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, my: 2 }}>
        <Button
          variant="outlined"
          startIcon={loading ? <CircularProgress size={20} /> : <MyLocationIcon />}
          onClick={handleGetCurrentLocation}
          disabled={loading}
        >
          {loading ? 'Detecting...' : '📍 Use Current Location'}
        </Button>
        {coordinates && (
          <Typography variant="body2" className="text-sm text-green-600">
            ✓ {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
          </Typography>
        )}
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Optional Address (only shown if coordinates are set) */}
      {coordinates && (
        <TextField
          fullWidth
          label="Location Address (Optional)"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g., 123 Main St, Theni"
          margin="normal"
          helperText="Helps customers recognize your location"
        />
      )}

      {/* Coordinates Preview */}
      {coordinates && (
        <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mt: 2 }}>
          <Typography variant="caption" color="text.secondary">Preview:</Typography>
          <Typography variant="body2" fontWeight="medium">
            Lat: {coordinates.lat.toFixed(6)}, Lng: {coordinates.lng.toFixed(6)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            (Stored as GeoJSON: [{coordinates.lng.toFixed(6)}, {coordinates.lat.toFixed(6)}])
          </Typography>
        </Box>
      )}

      {/* Actions */}
      <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
        <Button onClick={onClose} variant="outlined" fullWidth disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          fullWidth 
          // ✅ FIXED: Enable if EITHER district OR coordinates is set
          disabled={loading || (!district && !coordinates)}
        >
          {loading ? 'Saving...' : 'Save Location'}
        </Button>
      </Box>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LocationForm;