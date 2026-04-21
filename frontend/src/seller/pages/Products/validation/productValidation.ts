// D:\Mani\Code with Zosh\Backup\source code\frontend\src\seller\pages\Products\validation\productValidation.ts
import * as Yup from "yup";
import type { CategoryAttribute } from "../types/productFormTypes";

// ✅ Helper: Build Yup validation for a single attribute based on admin config
const buildAttributeValidation = (attr: CategoryAttribute): Yup.AnySchema => {
  let field: Yup.AnySchema;

  switch (attr.type) {
    case 'number': {
      let numberField = Yup.number()
        .transform((value) => (isNaN(value) ? undefined : value))
        .nullable();

      if (attr.min !== undefined) numberField = numberField.min(attr.min, `Must be at least ${attr.min}`);
      if (attr.max !== undefined) numberField = numberField.max(attr.max, `Must be at most ${attr.max}`);
      field = numberField;
      break;
    }
    case 'select': {
      let stringField = Yup.string();
      if (attr.options?.length) {
        stringField = stringField.oneOf(attr.options, `Invalid ${attr.label}`);
      }
      field = stringField;
      break;
    }
    case 'boolean':
      field = Yup.boolean();
      break;
    case 'textarea':
    case 'text':
    default:
      field = Yup.string();
      break;
  }

  if (attr.required) {
    field = field.required(`${attr.label} is required`);
  }

  return field;
};

// ✅ EXPORT: Function to create schema dynamically with attributes
export const createValidationSchema = (
  attributes: CategoryAttribute[],
  isCatalogProduct: boolean = false
) => {
  const highlightAttrs = attributes.filter(a => a.displayInHighlights && !a.isVariantField && a.isActive);
  const variantAttrs = attributes.filter(a => a.isVariantField && a.isActive);

  const highlightsShape: Record<string, Yup.AnySchema> = {};
  highlightAttrs.forEach(attr => {
    highlightsShape[attr.name] = buildAttributeValidation(attr);
  });

  const variantSpecsShape: Record<string, Yup.AnySchema> = {};
  variantAttrs.forEach(attr => {
    variantSpecsShape[attr.name] = buildAttributeValidation(attr);
  });

  return Yup.object({
    // ✅ Category fields - always required
    category: Yup.string().required("Main category is required"),
    category2: Yup.string().required("Sub-category is required"),
    category3: Yup.string().required("Product type is required"),

    // ✅ Title & Description - conditional based on catalog mode
    // Use function form of `when` for complex conditions
    title: Yup.string()
      .test(
        'title-required-for-independent',
        'Title is required for independent products',
        function (value) {
          // ✅ Properly access context from Formik
          const ctx = this.options.context as { isCatalogProduct?: boolean; category3?: string } | undefined;
          const isCatalog = ctx?.isCatalogProduct === true;
          const hasCategory = !!ctx?.category3;

          // Only require title for independent products with category selected
          if (!isCatalog && hasCategory) {
            if (!value || value.trim().length < 3) return false;
            if (value.trim().length > 200) return false;
          }
          return true; // Optional for catalog products or no category
        }
      ),

    description: Yup.string()
      .test(
        'description-required-for-independent',
        'Description is required for independent products',
        function (value) {
          const ctx = this.options.context as { isCatalogProduct?: boolean; category3?: string } | undefined;
          const isCatalog = ctx?.isCatalogProduct === true;
          const hasCategory = !!ctx?.category3;

          if (!isCatalog && hasCategory) {
            if (!value || value.trim().length < 10) return false;
            if (value.trim().length > 5000) return false;
          }
          return true;
        }
      ),

    // ✅ Highlights - optional, shaped by admin-configured attributes
    highlights: Yup.object().shape(highlightsShape).optional().default({}),

    // ✅ Variants validation
    variants: Yup.array()
      .of(
        Yup.object({
          color: Yup.string()
            .required("Color is required")
            .min(2, "Color name too short")
            .max(50, "Color name too long"),

          // ✅ FIX 1: Image validation - accept Cloudinary URLs properly
          images: Yup.array()
            .of(
              Yup.string().test(
                'is-valid-image-url',
                'Invalid image URL',
                (value) => {
                  if (!value || typeof value !== 'string') return false;
                  const trimmed = value.trim();
                  // ✅ Accept Cloudinary URLs (fixed: removed trailing spaces)
                  return trimmed.startsWith('https://res.cloudinary.com/') ||
                    trimmed.startsWith('http://res.cloudinary.com/') ||
                    trimmed.startsWith('image/'); // Also accept base64 for previews
                }
              )
            )
            .min(1, "At least one image required per color")
            // ✅ FIX: Use type assertion for context to avoid TypeScript error
            .when([], {
              is: (_values: any, context: Yup.TestContext) => {
                // ✅ Type assertion: tell TypeScript context.options.context has isCatalogProduct
                const ctx = context.options?.context as { isCatalogProduct?: boolean } | undefined;
                return ctx?.isCatalogProduct === false;
              },
              then: (schema) => schema.required("Images are required"),
              otherwise: (schema) => schema.notRequired() // Catalog products inherit images
            }),

          // ✅ Color-level highlights (optional)
          highlights: Yup.object().shape(highlightsShape).optional().default({}),

          // ✅ Sub-variants (storage/RAM variants)
          subVariants: Yup.array()
            .of(
              Yup.object({
                // ✅ Dynamic specs validation based on admin attributes
                specifications: Yup.object().shape(variantSpecsShape).optional().default({}),

                // ✅ MRP Price - ONLY validate if seller added an offer
                mrpPrice: Yup.string()
                  .when('offers', {
                    is: (offers: any[]) => {
                      // ✅ Get current seller directly from localStorage (Yup .when() can't access context easily)
                      let currentSeller: string | null = null;
                      try {
                        const jwt = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null;
                        if (jwt) {
                          const payload = JSON.parse(atob(jwt.split('.')[1]));
                          currentSeller = payload._id || payload.userId || payload.id || payload.sellerId;
                        }
                      } catch (e) {
                        console.warn('⚠️ Could not decode JWT in validation');
                      }

                      // ✅ Only validate if this variant has an offer from current seller with a price value
                      return offers?.some((o: any) =>
                        o?.sellerId === currentSeller &&
                        o?.mrpPrice != null &&
                        String(o.mrpPrice).trim() !== ''
                      );
                    },
                    then: (schema) => schema
                      .required("MRP Price is required for your offer")
                      .test("is-number", "Must be a valid number", (val) => {
                        if (!val || String(val).trim() === '') return false;
                        return !isNaN(Number(val));
                      })
                      .test("positive", "Price must be greater than 0", (val) => {
                        if (!val || String(val).trim() === '') return false;
                        return Number(val) > 0;
                      }),
                    otherwise: (schema) => schema.notRequired()
                  }),

                // ✅ Selling Price - with MRP comparison, only validate if seller added offer
                sellingPrice: Yup.string()
                  .when('offers', {
                    is: (offers: any[]) => {
                      let currentSeller: string | null = null;
                      try {
                        const jwt = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null;
                        if (jwt) {
                          const payload = JSON.parse(atob(jwt.split('.')[1]));
                          currentSeller = payload._id || payload.userId || payload.id || payload.sellerId;
                        }
                      } catch (e) {
                        console.warn('⚠️ Could not decode JWT in validation');
                      }
                      return offers?.some((o: any) =>
                        o?.sellerId === currentSeller &&
                        o?.sellingPrice != null &&
                        String(o.sellingPrice).trim() !== ''
                      );
                    },
                    then: (schema) => schema
                      .required("Selling Price is required for your offer")
                      .test("is-number", "Must be a valid number", (val) => {
                        if (!val || String(val).trim() === '') return false;
                        return !isNaN(Number(val));
                      })
                      .test("positive", "Price must be greater than 0", (val) => {
                        if (!val || String(val).trim() === '') return false;
                        return Number(val) > 0;
                      })
                      .test("less-than-mrp", "Selling price must be less than MRP", function (value) {
                        const { mrpPrice } = this.parent;
                        if (!mrpPrice || !value) return true;
                        const mrp = Number(String(mrpPrice).trim());
                        const sell = Number(String(value).trim());
                        if (isNaN(mrp) || isNaN(sell)) return true;
                        return sell < mrp;
                      }),
                    otherwise: (schema) => schema.notRequired()
                  }),

                // ✅ Stock - only validate if seller added offer
                stock: Yup.string()
                  .when('offers', {
                    is: (offers: any[]) => {
                      let currentSeller: string | null = null;
                      try {
                        const jwt = typeof window !== 'undefined' ? localStorage.getItem('jwt') : null;
                        if (jwt) {
                          const payload = JSON.parse(atob(jwt.split('.')[1]));
                          currentSeller = payload._id || payload.userId || payload.id || payload.sellerId;
                        }
                      } catch (e) {
                        console.warn('⚠️ Could not decode JWT in validation');
                      }
                      return offers?.some((o: any) =>
                        o?.sellerId === currentSeller
                      );
                    },
                    then: (schema) => schema
                      .required("Stock quantity is required for your offer")
                      .test("is-number", "Must be a valid number", (val) => {
                        if (!val || String(val).trim() === '') return false;
                        return !isNaN(Number(val));
                      })
                      .test("non-negative", "Stock cannot be negative", (val) => {
                        if (!val || String(val).trim() === '') return false;
                        return Number(val) >= 0;
                      }),
                    otherwise: (schema) => schema.notRequired().default('0')
                  }),

                // ✅ SKU - optional
                sku: Yup.string()
                  .optional()
                  .max(100, "SKU too long")
                  .matches(/^[a-zA-Z0-9\-_]+$/, "SKU can only contain letters, numbers, hyphens, and underscores"),

                isActive: Yup.boolean().default(true),
              })
            )
            .min(1, "Each color must have at least one variant")
            .required("At least one variant is required"),

          isActive: Yup.boolean().default(true),
        })
      )
      .min(1, "At least one color variant is required")
      .required("Product variants are required"),
  });
};

// ✅ REMOVE THIS: Static export with empty attributes causes issues
// export const validationSchema = createValidationSchema([], false);
// Instead, create schema dynamically in AddProductForm.tsx using useMemo