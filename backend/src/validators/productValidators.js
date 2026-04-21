// ✅ backend/src/validators/productValidators.js
import Yup from "yup";

// ✅✅✅ UPDATED: Variant validation for multi-seller support (offers array)
export const variantSchema = Yup.object({
  // ✅ Shared variant fields
  color: Yup.string()
    .required("Color is required")
    .min(2, "Color name too short")
    .max(50, "Color name too long"),

  specifications: Yup.object().optional().default({}),

  images: Yup.array()
    .of(Yup.string().url("Invalid image URL"))
    .min(1, "At least one image required per variant")
    .required("Images are required"),

  sku: Yup.string().optional().max(100, "SKU too long"),
  isActive: Yup.boolean().default(true),

  // ✅✅✅ NEW: Multi-seller offers array (PRIMARY format)
 offers: Yup.array()
  .of(
    Yup.object({
      // ✅ Backend Mongoose schema expects "seller" (ObjectId string)
      seller: Yup.string()
        .required("Seller ID is required")  // ✅ Message stays same, field name changes
        .matches(/^[0-9a-fA-F]{24}$/, "Invalid Seller ID format"),
      
      mrpPrice: Yup.number()
        .required("MRP Price is required")
        .min(0, "Price must be positive"),
      
      sellingPrice: Yup.number()
        .required("Selling Price is required")
        .min(0, "Price must be positive")
        .lessThan(Yup.ref("mrpPrice"), "Selling price must be less than MRP"),
      
      stock: Yup.number().min(0, "Stock cannot be negative").default(0),
      sku: Yup.string().optional().max(100, "SKU too long"),
      isActive: Yup.boolean().default(true)
    })
  )
  .min(1, "At least one offer required per variant")
  .optional(),

  // ✅ Legacy direct price fields (for backward compatibility - ONLY if no offers array)
  mrpPrice: Yup.number()
    .when('offers', {
      is: (offers) => !offers || !Array.isArray(offers) || offers.length === 0,
      then: (schema) => schema
        .required("MRP Price is required")
        .min(0, "Price must be positive"),
      otherwise: (schema) => schema.optional()
    }),

  sellingPrice: Yup.number()
    .when(['offers', 'mrpPrice'], {
      is: (offers, mrpPrice) =>
        (!offers || !Array.isArray(offers) || offers.length === 0) &&
        mrpPrice !== undefined,
      then: (schema) => schema
        .required("Selling Price is required")
        .min(0, "Price must be positive")
        .lessThan(Yup.ref('mrpPrice'), "Selling price must be less than MRP"),
      otherwise: (schema) => schema.optional()
    }),

  stock: Yup.number()
    .when('offers', {
      is: (offers) => !offers || !Array.isArray(offers) || offers.length === 0,
      then: (schema) => schema.min(0, "Stock cannot be negative").default(0),
      otherwise: (schema) => schema.optional()
    })
})
  // ✅ Custom test: Ensure EITHER offers array OR legacy fields are present
  .test(
    'variant-pricing-required',
    'Variant must have either offers array or mrpPrice/sellingPrice fields',
    function (value) {
      const hasOffers = value?.offers && Array.isArray(value.offers) && value.offers.length > 0;
      const hasLegacy = value?.mrpPrice !== undefined && value?.sellingPrice !== undefined;

      if (!hasOffers && !hasLegacy) {
        return this.createError({
          path: this.path,
          message: 'Variant must include either "offers" array or "mrpPrice/sellingPrice" fields'
        });
      }
      return true;
    }
  );

// ✅ CREATE schema - category REQUIRED
export const createProductSchema = Yup.object({
  title: Yup.string()
    .required("Title is required")
    .min(3, "Title too short")
    .max(200, "Title too long"),

  description: Yup.string()
    .required("Description is required")
    .min(10, "Description too short")
    .max(5000, "Description too long"),

  // ✅ Category REQUIRED for create (Level 3 category _id)
  category: Yup.string().required("Category is required"),

  variants: Yup.array()
    .of(variantSchema)
    .min(1, "At least one product variant is required")
    .required("Product variants are required"),

  isActive: Yup.boolean().default(true),
  isFeatured: Yup.boolean().default(false)
});

// ✅✅✅ UPDATE schema - category OPTIONAL (categories locked in edit mode)
export const updateProductSchema = Yup.object({
  // ✅ For independent products: allow partial updates
  title: Yup.string()
    .optional()
    .min(3, "Title too short")
    .max(200, "Title too long"),

  description: Yup.string()
    .optional()
    .min(10, "Description too short")
    .max(5000, "Description too long"),

  category: Yup.string().optional(),

  // ✅ Variants: required if provided
  variants: Yup.array()
    .of(variantSchema)
    .optional()
    .min(1, "At least one product variant is required if provided"),

  // ✅ NEW: catalogId field (for linking to catalog)
  catalogId: Yup.string().optional(),

  isActive: Yup.boolean().optional(),
  isFeatured: Yup.boolean().optional()
})
  // ✅ Ensure: if catalogId is provided, title/description/category should NOT be updated
  .test(
    'catalog-offer-restriction',
    'Cannot modify shared product details for catalog-linked offers',
    function (value) {
      if (value.catalogId && (value.title || value.description || value.category)) {
        return false;
      }
      return true;
    }
  );

// ✅ Catalog offer schema (for listing on existing catalog)
export const catalogOfferSchema = Yup.object({
  // ✅ Only variants are required for catalog offers
  variants: Yup.array()
    .of(variantSchema)
    .min(1, "At least one variant with price and stock is required")
    .required("Variants are required"),

  // ✅ Optional: isActive flag for the offer
  isActive: Yup.boolean().default(true)
});