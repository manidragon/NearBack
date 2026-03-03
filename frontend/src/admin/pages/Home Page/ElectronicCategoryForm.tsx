// D:\Mani\Code with Zosh\Backup\source code\frontend\src\admin\pages\Home Page\ElectronicCategoryForm.tsx
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
import { 
  createElectronicCategory, 
  updateElectronicCategory 
} from "../../../Redux Toolkit/Admin/ElectronicCategorySlice";
import type { ElectronicCategory } from "../../../types/electronicCategoryTypes";
import React from "react";
import { uploadToCloudinary } from "../../../util/uploadToCloudnary";

const validationSchema = Yup.object({
  name: Yup.string().required("Name is required").max(50, "Name must be at most 50 characters"),
  categoryId: Yup.string().required("Category ID is required").max(50, "Category ID must be at most 50 characters"),
  image: Yup.string().required("Image is required"),
  description: Yup.string().max(150, "Description must be at most 150 characters"),
});

const ElectronicCategoryForm = ({
  category,
  isCreateMode,
  handleClose,
}: {
  category: ElectronicCategory | null;
  isCreateMode: boolean;
  handleClose: () => void;
}) => {
  const dispatch = useAppDispatch();
  const [uploading, setUploading] = React.useState(false);

  const formik = useFormik({
    initialValues: {
      name: category?.name || "",
      categoryId: category?.categoryId || "",
      image: category?.image || "",
      description: category?.description || "",
    },
    validationSchema: validationSchema,
    onSubmit: async (values) => {
      try {
        if (isCreateMode) {
          await dispatch(createElectronicCategory(values as ElectronicCategory));
        } else if (category?._id) {
          await dispatch(updateElectronicCategory({ id: category._id, data: values }));
        }
        handleClose();
      } catch (error) {
        console.error("Error saving category:", error);
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
        {isCreateMode ? 'Add New Electronic Category' : 'Edit Electronic Category'}
      </Typography>

      {/* Name Field */}
      <TextField
        fullWidth
        id="name"
        name="name"
        label="Category Name *"
        placeholder="e.g., Laptops, Smartphones"
        value={formik.values.name}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.name && Boolean(formik.errors.name)}
        helperText={formik.touched.name ? formik.errors.name : ""}
        sx={{ mb: 2 }}
      />

      {/* Category ID Field */}
      <TextField
        fullWidth
        id="categoryId"
        name="categoryId"
        label="Category ID *"
        placeholder="e.g., laptops, smartphones"
        value={formik.values.categoryId}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.categoryId && Boolean(formik.errors.categoryId)}
        helperText={formik.touched.categoryId ? formik.errors.categoryId : ""}
        sx={{ mb: 2 }}
      />

      {/* Image Upload */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle2" gutterBottom>
          Category Image *
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
            '📤 Upload Image (Recommended: 300x300px)'
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
                maxHeight: "200px",
                objectFit: 'contain',
                backgroundColor: '#f5f5f5',
                padding: '10px',
                borderRadius: "8px"
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

      {/* Description Field */}
      <TextField
        fullWidth
        id="description"
        name="description"
        label="Description (Optional)"
        multiline
        rows={2}
        placeholder="Brief description of this category (max 150 characters)"
        value={formik.values.description}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.description && Boolean(formik.errors.description)}
        helperText={
          formik.touched.description 
            ? `${formik.errors.description || ''} ${formik.values.description.length}/150`
            : '150 characters max'
        }
        inputProps={{ maxLength: 150 }}
        sx={{ mb: 3 }}
      />

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
            'Create Category'
          ) : (
            'Update Category'
          )}
        </Button>
      </DialogActions>
    </Box>
  );
};

export default ElectronicCategoryForm;