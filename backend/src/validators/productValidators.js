// ✅ backend/src/validators/productValidators.js
import Yup from "yup";

// ✅ Variant validation schema (same for create & update)
export const variantSchema = Yup.object({
  color: Yup.string()
    .required("Color is required")
    .min(2, "Color name too short")
    .max(50, "Color name too long"),
  
  specifications: Yup.object().optional().default({}),
  
  mrpPrice: Yup.number()
    .required("MRP Price is required")
    .min(0, "Price must be positive"),
  
  sellingPrice: Yup.number()
    .required("Selling Price is required")
    .min(0, "Price must be positive")
    .lessThan(Yup.ref("mrpPrice"), "Selling price must be less than MRP"),
  
  stock: Yup.number().min(0, "Stock cannot be negative").default(0),
  
  images: Yup.array()
    .of(Yup.string().url("Invalid image URL"))
    .min(1, "At least one image required per variant")
    .required("Images are required"),
  
  sku: Yup.string().optional().max(100, "SKU too long"),
  isActive: Yup.boolean().default(true)
});

// ✅ CREATE schema - category REQUIRED
export const createProductSchema = Yup.object({
  title: Yup.string().required("Title is required").min(3, "Title too short").max(200, "Title too long"),
  description: Yup.string().required("Description is required").min(10, "Description too short").max(5000, "Description too long"),
  
  // ✅ Category REQUIRED for create
  category: Yup.string().required("Category is required"),
  
  
  variants: Yup.array()
    .of(variantSchema)
    .min(1, "At least one product variant is required")
    .required("Product variants are required"),
  
  isActive: Yup.boolean().default(true),
  isFeatured: Yup.boolean().default(false)
});

// ✅✅✅ UPDATE schema - category OPTIONAL (since categories are locked in edit mode)
export const updateProductSchema = Yup.object({
  title: Yup.string().optional().min(3, "Title too short").max(200, "Title too long"),
  description: Yup.string().optional().min(10, "Description too short").max(5000, "Description too long"),
  
  // ✅ Category OPTIONAL for update (not changed in edit mode)
  category: Yup.string().optional(),
  
  
  variants: Yup.array()
    .of(variantSchema)
    .optional()
    .min(1, "At least one product variant is required if provided"),
  
  isActive: Yup.boolean().optional(),
  isFeatured: Yup.boolean().optional()
});