// D:\Mani\Code with Zosh\Backup\source code\frontend\src\admin\pages\Home Page\UpdateHomeCategoryForm.tsx
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Button,
  TextField,
  Typography,
  Box,
  CircularProgress,
  DialogActions,
} from "@mui/material";
import { useAppDispatch } from "../../../Redux Toolkit/Store";
import { updateHomeCategory, createHomeCategory } from "../../../Redux Toolkit/Admin/AdminSlice";
import type { HomeCategory } from "../../../types/homeDataTypes";
import React from "react";
import { uploadToCloudinary } from "../../../util/uploadToCloudnary";

const validationSchema = Yup.object({
  image: Yup.string().required("Image is required"),
  description: Yup.string()
    .max(100, "Description must be at most 100 characters")
    .required("Description is required"),
});

const UpdateHomeCategoryForm = ({
  category,
  section,
  isCreateMode,
  handleClose,
}: {
  category: HomeCategory | null;
  section: string;
  isCreateMode: boolean;
  handleClose: () => void;
}) => {
  const dispatch = useAppDispatch();
  const [uploading, setUploading] = React.useState(false);

  const formik = useFormik({
    initialValues: {
      image: category?.image || "",
      description: category?.description || "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      console.log("Form Data:", values);
      
      try {
        if (isCreateMode) {
          // Create new banner
          await dispatch(
            createHomeCategory({
              image: values.image,
              description: values.description,
              section: section,
            })
          );
        } else if (category?._id) {
          // Update existing banner
          await dispatch(
            updateHomeCategory({
              id: category._id,
              data: { image: values.image, description: values.description },
            })
          );
        }
        handleClose();
      } catch (error) {
        console.error("Error saving banner:", error);
      }
    },
  });

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const imageUrl = await uploadToCloudinary(file);
      formik.setFieldValue("image", imageUrl);
    } catch (error) {
      console.error("Image upload failed:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box component="form" onSubmit={formik.handleSubmit} sx={{ width: '100%' }}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        {isCreateMode ? 'Add New Banner' : 'Edit Banner'}
      </Typography>

      {/* Image Upload Section */}
      <Box className="space-y-2" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Banner Image *
        </Typography>
        <Button
          variant="outlined"
          component="label"
          disabled={uploading}
          fullWidth
          sx={{ 
            border: formik.touched.image && formik.errors.image ? '2px solid red' : undefined,
            minHeight: '56px'
          }}
        >
          {uploading ? (
            <CircularProgress size={24} />
          ) : formik.values.image ? (
            '✅ Image Uploaded - Click to Change'
          ) : (
            '📤 Upload Image (Recommended: 800x400px)'
          )}
          <input
            type="file"
            hidden
            accept="image/*"
            onChange={handleImageUpload}
          />
        </Button>
        
        {formik.values.image && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <img
              src={formik.values.image}
              alt="Preview"
              style={{ 
                maxWidth: "100%", 
                maxHeight: "300px",
                borderRadius: "8px",
                border: "2px solid #e0e0e0"
              }}
            />
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Image Preview
            </Typography>
          </Box>
        )}
        
        {formik.touched.image && formik.errors.image && (
          <Typography variant="caption" color="error">
            {formik.errors.image}
          </Typography>
        )}
      </Box>

      {/* Description Section */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          id="description"
          name="description"
          label="Description *"
          multiline
          rows={3}
          placeholder="Write a brief description about this banner (max 100 characters)"
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.description && Boolean(formik.errors.description)}
          helperText={
            formik.touched.description 
              ? `${formik.errors.description || ''} ${formik.values.description.length}/100`
              : '100 characters max'
          }
          inputProps={{ maxLength: 100 }}
        />
      </Box>

      {/* Action Buttons */}
      <DialogActions>
        <Button onClick={handleClose} disabled={formik.isSubmitting || uploading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disabled={formik.isSubmitting || uploading}
          sx={{ 
            minWidth: '120px',
            bgcolor: isCreateMode ? 'success.main' : 'primary.main',
            '&:hover': {
              bgcolor: isCreateMode ? 'success.dark' : 'primary.dark',
            }
          }}
        >
          {formik.isSubmitting || uploading ? (
            <CircularProgress size={24} color="inherit" />
          ) : isCreateMode ? (
            'Create Banner'
          ) : (
            'Update Banner'
          )}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default UpdateHomeCategoryForm;