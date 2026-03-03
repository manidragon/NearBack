import { useState, useEffect } from "react";
import { Button, Box, Typography, CircularProgress, Alert } from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { updateSeller } from "../../../Redux Toolkit/Seller/sellerSlice";

// ✅ Cloudinary Upload Function
const uploadToCloudinary = async (file: File) => {
  const cloud_name = "dt6nu9oqs";
  const upload_preset = "nearlook";
  const url = `https://api.cloudinary.com/v1_1/${cloud_name}/image/upload`;
  
  if (file) {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", upload_preset);
    data.append("cloud_name", cloud_name);

    const res = await fetch(url, {
      method: "post",
      body: data,
    });
    
    const fileData = await res.json();
    console.log("imageurl : ", fileData.url);
    return fileData.url;
  } else {
    console.log("error");
  }
};

interface LogoUploadFormProps {
  onClose: () => void;
}

const LogoUploadForm = ({ onClose }: LogoUploadFormProps) => {
  const sellers = useAppSelector((state) => state.sellers);
  const dispatch = useAppDispatch();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sellers.profile?.businessDetails?.logo) {
      setPreviewUrl(sellers.profile.businessDetails.logo);
    }
  }, [sellers.profile]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file (JPG, PNG, GIF)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setError(null);
      setSelectedFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // ✅ Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(selectedFile);
      
      if (!cloudinaryUrl) {
        throw new Error('Failed to upload to Cloudinary');
      }

      // ✅ Update seller with Cloudinary URL
      await dispatch(
        updateSeller({
          businessDetails: {
            ...sellers.profile?.businessDetails,
            logo: cloudinaryUrl,
          },
        })
      ).unwrap();

      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    try {
      await dispatch(
        updateSeller({
          businessDetails: {
            ...sellers.profile?.businessDetails,
            logo: null,
          },
        })
      ).unwrap();
      
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.message || 'Failed to remove logo');
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h6" gutterBottom className="text-center font-bold text-gray-600">
        Upload Business Logo
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 2 }}>
        {/* Logo Preview */}
        {previewUrl ? (
          <Box sx={{ 
            border: '2px dashed #1976d2', 
            borderRadius: 2, 
            p: 2,
            width: '100%',
            maxWidth: 300,
            textAlign: 'center'
          }}>
            <img 
              src={previewUrl} 
              alt="Logo Preview" 
              style={{ 
                maxWidth: '100%', 
                maxHeight: 200,
                objectFit: 'contain'
              }} 
            />
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              Current Logo
            </Typography>
          </Box>
        ) : (
          <Box sx={{ 
            border: '2px dashed #ccc', 
            borderRadius: 2, 
            p: 4,
            width: '100%',
            maxWidth: 300,
            textAlign: 'center'
          }}>
            <CloudUploadIcon sx={{ fontSize: 48, color: '#ccc' }} />
            <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
              No logo uploaded yet
            </Typography>
          </Box>
        )}

        {/* File Input */}
        <Button
          variant="outlined"
          component="label"
          startIcon={<CloudUploadIcon />}
          fullWidth
          sx={{ maxWidth: 300 }}
        >
          Choose Logo
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleFileChange}
          />
        </Button>

        {/* File Info */}
        {selectedFile && (
          <Box sx={{ textAlign: 'center', maxWidth: 300 }}>
            <Typography variant="caption" color="primary">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </Typography>
          </Box>
        )}

        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ width: '100%', maxWidth: 300 }}>
            {error}
          </Alert>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, width: '100%', maxWidth: 300, mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            fullWidth
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? <CircularProgress size={24} /> : 'Upload to Cloudinary'}
          </Button>
          
          {previewUrl && (
            <Button
              variant="outlined"
              color="error"
              fullWidth
              onClick={handleRemoveLogo}
              disabled={uploading}
            >
              Remove
            </Button>
          )}
        </Box>

        {/* Guidelines */}
        <Box sx={{ textAlign: 'center', mt: 2, maxWidth: 300 }}>
          <Typography variant="caption" color="text.secondary">
            • Recommended size: 200x200px<br />
            • Max file size: 5MB<br />
            • Supported formats: JPG, PNG, GIF<br />
            • Stored on Cloudinary
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default LogoUploadForm;