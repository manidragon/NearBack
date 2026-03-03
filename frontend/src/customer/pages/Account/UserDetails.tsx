import {
  Divider,
  Button,
  TextField,
  Box,
  Avatar,
  IconButton,
  Modal,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";
import { useState, useEffect } from "react";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import ProfileFildCard from "../../../seller/pages/Account/ProfileFildCard";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { updateUserProfile, updateProfilePicture } from "../../../Redux Toolkit/Customer/UserSlice";
import { uploadToCloudinary } from "../../../util/uploadToCloudnary";

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'background.paper',
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
};

const UserDetails = () => {
  const user = useAppSelector((state) => state.user);
  const dispatch = useAppDispatch();
  
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(user.user?.fullName || '');
  const [mobile, setMobile] = useState(user.user?.mobile || '');
  const [profilePicture, setProfilePicture] = useState(user.user?.profilePicture || '');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  useEffect(() => {
    if (user.user) {
      setFullName(user.user.fullName);
      setMobile(user.user.mobile || '');
      setProfilePicture(user.user.profilePicture || '');
    }
  }, [user.user]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setFullName(user.user?.fullName || '');
    setMobile(user.user?.mobile || '');
    setProfilePicture(user.user?.profilePicture || '');
    setPreviewImage(null);
    setSelectedFile(null);
    setIsEditing(false);
  };

  // ✅ FIX: Upload image to backend and get URL
  const uploadImageToServer = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwt')}`
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload image');
    }

    const data = await response.json();
    return data.imageUrl; // Backend should return the uploaded image URL
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const jwt = localStorage.getItem('jwt') || '';
      
      // ✅ FIX: Upload image first if a new file is selected
      let imageUrl = profilePicture;
      if (selectedFile) {
        try {
          imageUrl = await uploadImageToServer(selectedFile);
          setProfilePicture(imageUrl);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          // Continue with profile update even if image upload fails
        }
      }

      // ✅ FIX: Update profile picture if it changed
      if (imageUrl !== user.user?.profilePicture) {
        await dispatch(updateProfilePicture({ 
          imageUrl, 
          jwt 
        })).unwrap();
      }

      // Update other profile fields
      await dispatch(updateUserProfile({ 
        fullName, 
        mobile: mobile || undefined, 
        jwt 
      })).unwrap();

      setSnackbarMessage('Profile updated successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setIsEditing(false);
      setSelectedFile(null);
      setPreviewImage(null);
    } catch (error: any) {
      setSnackbarMessage(error || 'Failed to update profile');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIX: Handle image selection and preview
 const handleImageUpload = async (
  e: React.ChangeEvent<HTMLInputElement>
) => {
  const file = e.target.files?.[0];
  if (!file) return;

  try {
    setLoading(true);

    // 1️⃣ Upload to Cloudinary
    const imageUrl = await uploadToCloudinary(file);

    // 2️⃣ Preview immediately
    setPreviewImage(imageUrl);

    // 3️⃣ Save in DB
    const jwt = localStorage.getItem("jwt") || "";
    await dispatch(
      updateProfilePicture({ imageUrl, jwt })
    ).unwrap();

    setSnackbarMessage("Profile picture updated successfully");
    setSnackbarSeverity("success");
    setSnackbarOpen(true);
  } catch (error) {
    setSnackbarMessage("Image upload failed");
    setSnackbarSeverity("error");
    setSnackbarOpen(true);
  } finally {
    setLoading(false);
  }
};

  const handleRemovePicture = () => {
    setProfilePicture('');
    setPreviewImage(null);
    setSelectedFile(null);
    const jwt = localStorage.getItem('jwt') || '';
    dispatch(updateProfilePicture({ imageUrl: '', jwt }));
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  return (
    <div className="flex justify-center py-10">
      <div className="w-full lg:w-[70%]">
        <div className="flex items-center pb-3 justify-between">
          <h1 className="text-2xl font-bold text-gray-600">
            Personal Details
          </h1>
          {!isEditing ? (
            <Button
              onClick={handleEditClick}
              size="small"
              variant="contained"
              startIcon={<EditIcon />}
            >
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                onClick={handleCancel}
                size="small"
                variant="outlined"
                startIcon={<CloseIcon />}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                size="small"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {/* Profile Picture Section */}
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="relative">
              <Avatar
                sx={{ 
                  width: 120, 
                  height: 120,
                  border: '4px solid #00927c',
                  boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}
                src={previewImage || profilePicture || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png"}
                alt="Profile"
              />
              {isEditing && (
                <div className="absolute bottom-0 right-0 bg-primary-color rounded-full p-2">
                  <input
                    accept="image/*"
                    style={{ display: 'none' }}
                    id="profile-picture-upload"
                    type="file"
                    onChange={handleImageUpload}
                  />
                  <label htmlFor="profile-picture-upload">
                    <IconButton 
                      component="span" 
                      sx={{ 
                        bgcolor: 'white',
                        '&:hover': { bgcolor: '#f0f0f0' }
                      }}
                    >
                      <EditIcon sx={{ color: '#00927c' }} />
                    </IconButton>
                  </label>
                </div>
              )}
            </div>
            
            {isEditing && (profilePicture || previewImage) && (
              <Button 
                onClick={handleRemovePicture} 
                variant="text" 
                color="error"
                size="small"
              >
                Remove Picture
              </Button>
            )}
          </div>

          <div>
            {isEditing ? (
              <Box className="space-y-4">
                <TextField
                  fullWidth
                  label="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
                <Divider />
                <TextField
                  fullWidth
                  label="Email"
                  value={user.user?.email}
                  disabled
                  helperText="Email cannot be changed"
                />
                <Divider />
                <TextField
                  fullWidth
                  label="Mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="Enter mobile number"
                />
              </Box>
            ) : (
              <div>
                <ProfileFildCard keys={"Name"} value={user.user?.fullName} />
                <Divider />
                <ProfileFildCard keys={"Email"} value={user.user?.email} />
                <Divider />
                <ProfileFildCard keys={"Mobile"} value={user.user?.mobile || 'Not provided'} />
              </div>
            )}
          </div>
        </div>
      </div>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity} 
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default UserDetails;