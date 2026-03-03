// D:\Mani\Code with Zosh\Backup\source code\frontend\src\admin\components\CategoryManagement\UpdateCategoryForm.tsx
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Card,
  CardMedia,
  IconButton,
  MenuItem,
  InputLabel,
  FormControl,
  Select,
  FormHelperText,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { updateCategory } from "../../../Redux Toolkit/Admin/CategorySlice";
import { useEffect, useState } from "react";
import type { Category } from "../../../types/categoryTypes";
import { uploadToCloudinary } from "../../../util/uploadToCloudnary";
import DeleteIcon from "@mui/icons-material/Delete";

const validationSchema = Yup.object({
  name: Yup.string()
    .required("Name is required")
    .min(2, "Name must be at least 2 characters"),
  categoryId: Yup.string()
    .required("Category ID is required")
    .matches(
      /^[a-z0-9_]+$/,
      "Category ID can only contain lowercase letters, numbers, and underscores"
    ),
  level: Yup.number()
    .required("Level is required")
    .oneOf([1, 2, 3], "Level must be 1, 2, or 3"),
  parentCategory: Yup.string().when("level", {
    is: (level: number) => level > 1,
    then: (schema) =>
      schema.required("Parent category is required for level 2 and 3"),
    otherwise: (schema) => schema.nullable(),
  }),
  image: Yup.string().nullable(),
  // ✅ NEW: Order validation (only for Level 1 & 2)
  order: Yup.number()
    .min(1, "Order must be at least 1")
    .nullable()
    .when("level", {
      is: (level: number) => level <= 2,
      then: (schema) => schema.required("Order is required for Level 1 & 2"),
      otherwise: (schema) => schema.nullable(),
    }),
});

interface UpdateCategoryFormProps {
  category: Category;
  allCategories: Category[];
  onSuccess: () => void;
  onCancel: () => void;
}

const UpdateCategoryForm: React.FC<UpdateCategoryFormProps> = ({
  category,
  allCategories,
  onSuccess,
  onCancel,
}) => {
  const dispatch = useAppDispatch();
  const categoryState = useAppSelector((state) => state.category);
  const { loading, error, success } = categoryState;

  const [parentCategories, setParentCategories] = useState<Category[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<number>(category.level);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(category.image || null);
  const [uploading, setUploading] = useState(false);

  // ✅ Handle image upload
  const handleImageUpload = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadToCloudinary(file);
      setImageUrl(url);
      formik.setFieldValue("image", url);
    } catch (error) {
      console.error("Image upload failed:", error);
      alert("Failed to upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // ✅ Handle image change
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      handleImageUpload(file);
    }
  };

  // ✅ Handle image remove
  const handleRemoveImage = () => {
    setImageFile(null);
    setImageUrl(null);
    formik.setFieldValue("image", null);
  };

  // ✅ Filter parent categories based on selected level
  useEffect(() => {
    if (selectedLevel > 1) {
      const parents = allCategories.filter(
        (cat) => cat.level === selectedLevel - 1 && cat._id !== category._id
      );
      setParentCategories(parents);
      
      if (
        formik.values.parentCategory &&
        !parents.some((p) => p._id === formik.values.parentCategory)
      ) {
        formik.setFieldValue("parentCategory", "");
      }
    } else {
      setParentCategories([]);
      formik.setFieldValue("parentCategory", "");
    }
  }, [selectedLevel, allCategories, category._id]);

  const formik = useFormik({
    initialValues: {
      name: category.name || "",
      categoryId: category.categoryId || "",
      level: category.level,
      parentCategory: category.parentCategory || "",
      image: category.image || null,
      order: category.order || 1,  // ✅ Include order
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        await dispatch(
          updateCategory({
            id: category._id,
            category: {
              name: values.name,
              categoryId: values.categoryId,
              level: values.level,
              parentCategory: values.level > 1 ? values.parentCategory : null,
              image: values.image,
              order: values.level <= 2 ? values.order : undefined,  // ✅ Only send order for Level 1 & 2
            },
            jwt: localStorage.getItem("jwt") || "",
          })
        );
        onSuccess();
      } catch (error) {
        console.error("Update category failed:", error);
      }
    },
  });

  return (
    <Box
      component="form"
      onSubmit={formik.handleSubmit}
      sx={{ maxWidth: 600, margin: "auto", padding: 3 }}
      className="space-y-4"
    >
      <Typography variant="h4" gutterBottom align="center">
        Update Category
      </Typography>

      {error && (
        <Alert
          severity="error"
          onClose={() => dispatch({ type: "category/resetCategoryState" })}
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          onClose={() => dispatch({ type: "category/resetCategoryState" })}
        >
          Category updated successfully!
        </Alert>
      )}

      {/* Image Upload Field (Level 1 only) */}
      {selectedLevel === 1 && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Category Image (Optional)
          </Typography>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
            id="image-upload"
          />
          <label htmlFor="image-upload">
            <Button
              variant="outlined"
              component="span"
              disabled={uploading}
            >
              {uploading ? "Uploading..." : imageUrl ? "Change Image" : "Upload Image"}
            </Button>
          </label>
          
          {imageUrl && (
            <Box mt={2} position="relative" display="inline-block">
              <Card sx={{ maxWidth: 200 }}>
                <CardMedia
                  component="img"
                  height="140"
                  image={imageUrl}
                  alt="Category preview"
                />
              </Card>
              <IconButton
                size="small"
                onClick={handleRemoveImage}
                sx={{
                  position: 'absolute',
                  top: 5,
                  right: 5,
                  bgcolor: 'error.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'error.dark' }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
      )}

      {/* Name Field */}
      <TextField
        fullWidth
        id="name"
        name="name"
        label="Category Name"
        value={formik.values.name}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.name && Boolean(formik.errors.name)}
        helperText={
          formik.touched.name ? String(formik.errors.name || "") : ""
        }
      />

      {/* Category ID Field */}
      <TextField
        fullWidth
        id="categoryId"
        name="categoryId"
        label="Category ID"
        value={formik.values.categoryId}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.categoryId && Boolean(formik.errors.categoryId)}
        helperText={
          formik.touched.categoryId
            ? String(formik.errors.categoryId || "")
            : ""
        }
      />

      {/* Level Field */}
      <FormControl
        fullWidth
        error={formik.touched.level && Boolean(formik.errors.level)}
      >
        <InputLabel id="level-label">Category Level</InputLabel>
        <Select
          labelId="level-label"
          id="level"
          name="level"
          value={formik.values.level}
          onChange={(e) => {
            const newLevel = Number(e.target.value);
            formik.handleChange(e);
            setSelectedLevel(newLevel);
            formik.setFieldValue("parentCategory", "");
            if (newLevel !== 1 && imageUrl) {
              setImageUrl(null);
              formik.setFieldValue("image", null);
            }
          }}
          onBlur={formik.handleBlur}
          label="Category Level"
        >
          <MenuItem value={1}>Level 1 (Main Category)</MenuItem>
          <MenuItem value={2}>Level 2 (Sub Category)</MenuItem>
          <MenuItem value={3}>Level 3 (Product Type)</MenuItem>
        </Select>
        {formik.touched.level && formik.errors.level && (
          <FormHelperText>{String(formik.errors.level)}</FormHelperText>
        )}
      </FormControl>

      {/* ✅ NEW: Order Field (Level 1 & 2 only) */}
      {selectedLevel <= 2 && (
        <TextField
          fullWidth
          id="order"
          name="order"
          label="Display Order"
          type="number"
          value={formik.values.order}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={formik.touched.order && Boolean(formik.errors.order)}
          helperText={
            formik.touched.order
              ? String(formik.errors.order || "")
              : "Lower numbers appear first in navigation"
          }
          InputProps={{ inputProps: { min: 1 } }}
        />
      )}

      {/* Parent Category Field (conditional) */}
      {selectedLevel > 1 && (
        <FormControl
          fullWidth
          error={
            formik.touched.parentCategory && Boolean(formik.errors.parentCategory)
          }
        >
          <InputLabel id="parentCategory-label">
            Parent Category (Level {selectedLevel - 1})
          </InputLabel>
          <Select
            labelId="parentCategory-label"
            id="parentCategory"
            name="parentCategory"
            value={formik.values.parentCategory}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            label={`Parent Category (Level ${selectedLevel - 1})`}
          >
            <MenuItem value="">
              <em>Select Parent Category</em>
            </MenuItem>
            {parentCategories.map((parent) => (
              <MenuItem key={parent._id} value={parent._id}>
                {parent.name} ({parent.categoryId})
              </MenuItem>
            ))}
          </Select>
          {formik.touched.parentCategory && formik.errors.parentCategory && (
            <FormHelperText>{String(formik.errors.parentCategory)}</FormHelperText>
          )}
        </FormControl>
      )}

      {/* Action Buttons */}
      <Box display="flex" gap={2} justifyContent="center">
        <Button
          type="button"
          variant="outlined"
          color="secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading || !formik.isValid || !formik.dirty}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? "Updating..." : "Update Category"}
        </Button>
      </Box>
    </Box>
  );
};

export default UpdateCategoryForm;