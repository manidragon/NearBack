// D:\Mani\Code with Zosh\Backup\source code\frontend\src\seller\pages\Products\AddProductForm.tsx
import { useFormik, type FormikHelpers } from "formik";
import * as Yup from "yup";
import {
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormHelperText,
  Grid,
  CircularProgress,
  IconButton,
  Snackbar,
  Alert,
  Typography,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Box,
  Tabs,
  Tab,
  Chip,
  Divider,
  Switch,
  FormControlLabel,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import "tailwindcss/tailwind.css";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CloseIcon from "@mui/icons-material/Close";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import PaletteIcon from "@mui/icons-material/Palette";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StorageIcon from "@mui/icons-material/Storage";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { createProduct, updateProduct } from "../../../Redux Toolkit/Seller/sellerProductSlice";
import { uploadToCloudinary } from "../../../util/uploadToCloudnary";
import { fetchCategories } from "../../../Redux Toolkit/Admin/CategorySlice";
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { Category } from "../../../types/categoryTypes";
import type { CategoryAttribute } from "../../../types/categoryAttributeTypes";
import { separateAttributesByType } from '../../../types/categoryAttributeTypes';
import {
  fetchCategoryAttributes,
  selectCategoryAttributes,
  selectCategoryAttributesLoading,
  clearCategoryAttributes,
} from "../../../Redux Toolkit/Admin/CategoryAttributeSlice";

// ============================================
// ✅ TYPE DEFINITIONS
// ============================================
export interface ProductSubVariantForm {
  _id?: string;
  specifications: Record<string, string | number | boolean>;
  mrpPrice: string;
  sellingPrice: string;
  stock: string;
  sku?: string;
  isActive?: boolean;
  toBeDeleted?: boolean;
}

export interface ProductVariantForm {
  _id?: string;
  color: string;
  images: string[];
  subVariants: ProductSubVariantForm[];
  isActive?: boolean;
}

export interface ProductFormValues {
  _id?: string;
  title: string;
  description: string;
  images: string[];
  category: string;
  category2: string;
  category3: string;
  specifications: Record<string, string | number | boolean>;
  variants: ProductVariantForm[];
  isActive?: boolean;
}

// ✅ Default Initial Values
const defaultInitialValues: ProductFormValues = {
  title: "",
  description: "",
  images: [],
  category: "",
  category2: "",
  category3: "",
  specifications: {},
  variants: [],
  isActive: true,
};

// ============================================
// ✅ VALIDATION SCHEMA
// ============================================
const validationSchema = Yup.object({
  category: Yup.string().required("Main category is required"),
  category2: Yup.string().required("Sub-category is required"),
  category3: Yup.string().required("Product type is required"),
  title: Yup.string()
    .when("category3", {
      is: (val: string) => !!val,
      then: (schema) => schema.required("Title is required").min(3, "Title too short"),
      otherwise: (schema) => schema,
    }),
  description: Yup.string()
    .when("category3", {
      is: (val: string) => !!val,
      then: (schema) => schema.required("Description is required").max(5000, "Description too long"),
      otherwise: (schema) => schema,
    }),
  variants: Yup.array()
    .of(
      Yup.object({
        color: Yup.string().required("Color is required").min(2, "Color too short"),
        images: Yup.array()
          .of(Yup.string().url("Invalid image URL"))
          .min(1, "At least one image required per color")
          .required("Images are required"),
        // ✅ NEW: Validate color-level highlights
        highlights: Yup.object().optional().default({}),
        subVariants: Yup.array()
          .of(
            Yup.object({
              specifications: Yup.object().optional().default({}),
              mrpPrice: Yup.string()
                .required("MRP Price is required")
                .test("is-number", "Must be a valid number", (val) => {
                  if (!val || String(val).trim() === '') return false;
                  return !isNaN(Number(val));
                })
                .test("positive", "Price must be greater than 0", (val) => {
                  if (!val || String(val).trim() === '') return false;
                  return Number(val) > 0;
                }),
              sellingPrice: Yup.string()
                .required("Selling Price is required")
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
                  if (!mrpPrice || !value || String(mrpPrice).trim() === '' || String(value).trim() === '') return false;
                  const mrp = Number(mrpPrice);
                  const sell = Number(value);
                  return !isNaN(mrp) && !isNaN(sell) && sell < mrp;
                }),
              stock: Yup.string()
                .optional()
                .test("is-number", "Must be a valid number", (val) => {
                  if (!val || String(val).trim() === '') return true;
                  return !isNaN(Number(val));
                })
                .test("non-negative", "Stock cannot be negative", (val) => {
                  if (!val || String(val).trim() === '') return true;
                  return Number(val) >= 0;
                }),
              sku: Yup.string().optional().max(100, "SKU too long"),
              isActive: Yup.boolean().default(true),
            })
          )
          .min(1, "Each color must have at least one storage variant")
          .required("Sub-variants are required"),
        isActive: Yup.boolean().default(true),
      })
    )
    .min(1, "At least one color variant is required")
    .required("Product variants are required"),
  specifications: Yup.object().optional().default({}),
});

// ============================================
// ✅ MAIN COMPONENT
// ============================================
const AddProductForm: React.FC<{
  initialValues?: ProductFormValues;
  mode?: "add" | "edit";
  onSubmit?: (values: ProductFormValues) => void;
  onClose?: () => void;
}> = ({
  initialValues = defaultInitialValues,
  mode = "add",
  onSubmit,
  onClose,
}) => {
    // ============================================
    // ✅ STATE & REFS
    // ============================================
    const formikRef = useRef<any>(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [activeStep, setActiveStep] = useState(mode === "edit" ? 0 : 0);
    const [activeColorTab, setActiveColorTab] = useState(0);
    const [expandedSubVariant, setExpandedSubVariant] = useState<number | null>(0);
    const [snackbarOpen, setOpenSnackbar] = useState(false);
    const [specDefinitions, setSpecDefinitions] = useState<Record<string, string[]>>({});

    // ✅✅✅ NEW: State for color-level highlights (shared across sub-variants)
    const [colorHighlights, setColorHighlights] = useState<Record<number, Record<string, string>>>({});

    // ============================================
    // ✅ REDUX & HOOKS
    // ============================================
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const sellerProduct = useAppSelector((state: any) => state.sellerProduct);
    const categoryState = useAppSelector((state: any) => state.category);
    const attributeState = useAppSelector(selectCategoryAttributes);
    const attributesLoading = useAppSelector(selectCategoryAttributesLoading);

    // ✅✅✅ NEW: Separate attributes by type for clear UI sections
    const { variantAttributes, highlightAttributes, otherAttributes } = useMemo(() => {
      if (attributeState.length === 0) {
        return { variantAttributes: [], highlightAttributes: [], otherAttributes: [] };
      }
      return separateAttributesByType(attributeState);
    }, [attributeState]);

    // ============================================
    // ✅ FORMIK CONFIGURATION
    // ============================================
    const formik = useFormik<ProductFormValues>({
      initialValues,
      enableReinitialize: true,
      validationSchema,
      validateOnChange: false,
      validateOnBlur: false,
      validateOnMount: false,
      onSubmit: async (values) => {
        console.log('🎯 onSubmit called', { mode, activeStep, title: values.title });
        const finalStep = mode === "edit" ? 1 : 2;
        if (activeStep !== finalStep) {
          console.log('⛔ Submission blocked - not on final step', { activeStep, finalStep });
          return;
        }
        console.log('🚀 Form submitted from Review step');
        if (onSubmit) {
          onSubmit(values);
          return;
        }

        // ✅ Debug: Log transformation start
        console.log('🔍 Starting variant transformation...');
        const transformationDebug = {
          totalColors: values.variants.length,
          totalSubVariants: 0,
          validVariants: 0,
          skippedVariants: [] as Array<{ color: string; specs: any; reason: string; mrp: string; sell: string }>,
        };

        const productData: any = {
          title: values.title.trim(),
          description: values.description.trim(),
          ...(mode !== "edit" && { category: values.category3 }),
          // ✅ Flatten variants with filtering for deleted/invalid
          variants: values.variants.flatMap((colorVariant, colorIndex) => {
            transformationDebug.totalSubVariants += colorVariant.subVariants.length;
            return colorVariant.subVariants
              // ✅ Filter out deleted variants
              .filter((subVar) => !(subVar as any).toBeDeleted)
              .map(subVar => {
                const mrpPriceRaw = String(subVar.mrpPrice ?? '').trim();
                const sellingPriceRaw = String(subVar.sellingPrice ?? '').trim();
                const stockRaw = String(subVar.stock ?? '0').trim();
                const mrpPrice = mrpPriceRaw && !isNaN(Number(mrpPriceRaw)) ? Number(mrpPriceRaw) : null;
                const sellingPrice = sellingPriceRaw && !isNaN(Number(sellingPriceRaw)) ? Number(sellingPriceRaw) : null;
                const stock = stockRaw && !isNaN(Number(stockRaw)) ? Number(stockRaw) : 0;

                // ✅ Track why variants are skipped
                if (!mrpPriceRaw || !sellingPriceRaw) {
                  transformationDebug.skippedVariants.push({ color: colorVariant.color, specs: subVar.specifications, reason: 'empty price', mrp: mrpPriceRaw, sell: sellingPriceRaw });
                  console.warn('⚠️ Skipped - empty price:', { color: colorVariant.color, mrpPriceRaw, sellingPriceRaw });
                  return null;
                }
                if (mrpPrice === null || sellingPrice === null) {
                  transformationDebug.skippedVariants.push({ color: colorVariant.color, specs: subVar.specifications, reason: 'invalid number', mrp: mrpPriceRaw, sell: sellingPriceRaw });
                  console.warn('⚠️ Skipped - invalid number:', { color: colorVariant.color, mrpPriceRaw, sellingPriceRaw });
                  return null;
                }
                if (mrpPrice <= 0 || sellingPrice <= 0) {
                  transformationDebug.skippedVariants.push({ color: colorVariant.color, specs: subVar.specifications, reason: 'price <= 0', mrp: mrpPriceRaw, sell: sellingPriceRaw });
                  console.warn('⚠️ Skipped - price <= 0:', { color: colorVariant.color, mrpPrice, sellingPrice });
                  return null;
                }
                if (sellingPrice >= mrpPrice) {
                  transformationDebug.skippedVariants.push({ color: colorVariant.color, specs: subVar.specifications, reason: 'selling >= MRP', mrp: mrpPriceRaw, sell: sellingPriceRaw });
                  console.warn('⚠️ Skipped - selling >= MRP:', { color: colorVariant.color, mrpPrice, sellingPrice });
                  return null;
                }

                transformationDebug.validVariants++;

                // ✅✅✅ MERGE: Color-level highlights + Sub-variant-specific specs
                const specifications = {
                  // First: Add shared highlights for this color
                  ...(colorHighlights[colorIndex] || {}),
                  // Then: Add variant-specific specs (RAM, Storage, etc.)
                  ...(subVar.specifications || {})
                };

                return {
                  color: colorVariant.color.trim(),
                  specifications,
                  mrpPrice,
                  sellingPrice,
                  stock,
                  images: colorVariant.images,
                  sku: subVar.sku?.trim() || undefined,
                  isActive: subVar.isActive !== false,
                };
              })
              .filter((v): v is NonNullable<typeof v> => v !== null);
          }),
          isActive: values.isActive !== false,
        };

        // ✅ Debug: Log transformation summary
        console.log('🔍 Variant transformation summary:', {
          ...transformationDebug,
          finalVariantCount: productData.variants.length,
        });

        if (productData.variants.length === 0) {
          console.error('❌ No valid variants after transformation');
          alert('⚠️ Please ensure all variants have valid MRP and Selling Prices (greater than 0, and Selling Price < MRP)');
          return;
        }

        // ✅ Debug: Log final payload
        console.log('📤 Final payload:', {
          title: productData.title,
          variantsCount: productData.variants.length,
          firstVariant: productData.variants[0] ? {
            color: productData.variants[0].color,
            mrpPrice: productData.variants[0].mrpPrice,
            mrpPriceType: typeof productData.variants[0].mrpPrice,
            sellingPrice: productData.variants[0].sellingPrice,
            specifications: productData.variants[0].specifications,
          } : null,
        });

        // ✅ Dispatch
        if (mode === "edit" && initialValues._id) {
          console.log('🔄 Dispatching updateProduct');
          dispatch(updateProduct({ productId: initialValues._id, product: productData }));
        } else {
          const jwt = localStorage.getItem("jwt");
          console.log('🆕 Dispatching createProduct', { hasJwt: !!jwt });
          dispatch(createProduct({ request: productData, jwt: jwt || "" }));
        }
      },
    });

    // ============================================
    // ✅ EFFECTS
    // ============================================
    useEffect(() => {
      if (categoryState.categories.length === 0) dispatch(fetchCategories());
    }, [dispatch, categoryState.categories.length]);

    useEffect(() => {
      const category3Id = formik.values.category3;
      if (initialValues.variants?.length === 0 && category3Id && mode === "add") {
        const level3Category = categoryState.categories.find((cat: Category) => cat._id === category3Id);
        if (level3Category?.categoryId) {
          dispatch(fetchCategoryAttributes({ categoryId: level3Category.categoryId, includeInactive: false }));
        }
      }
      if (mode === "edit" && category3Id && attributeState.length === 0) {
        const level3Category = categoryState.categories.find((cat: Category) => cat._id === category3Id);
        if (level3Category?.categoryId) {
          dispatch(fetchCategoryAttributes({ categoryId: level3Category.categoryId, includeInactive: false }));
        }
      }
    }, [formik.values.category3, dispatch, categoryState.categories, initialValues.variants?.length, mode, attributeState.length]);

    useEffect(() => {
      if (attributeState.length > 0) {
        const specs: Record<string, string[]> = {};
        attributeState.forEach((attr: CategoryAttribute) => {
          if (attr.type === 'select' && attr.options?.length) specs[attr.name] = attr.options;
        });
        setSpecDefinitions(specs);
      }
    }, [attributeState]);

    useEffect(() => {
      if (sellerProduct.productCreated && mode === "add") {
        const timer = setTimeout(() => navigate("/seller/products"), 1500);
        return () => clearTimeout(timer);
      }
      if (sellerProduct.productUpdated && mode === "edit") {
        const timer = setTimeout(() => navigate("/seller/products"), 1500);
        return () => clearTimeout(timer);
      }
    }, [sellerProduct.productCreated, sellerProduct.productUpdated, mode, navigate]);

    useEffect(() => { formikRef.current = formik; }, [formik]);

    // ============================================
    // ✅ MEMOIZED HELPERS
    // ============================================
    const levelOneCategories = useMemo(() =>
      categoryState.categories
        .filter((cat: Category) => cat.level === 1)
        .sort((a: Category, b: Category) => {
          const orderA = a.order ?? 999999;
          const orderB = b.order ?? 999999;
          return orderA !== orderB ? orderA - orderB : (a.name || "").localeCompare(b.name || "");
        }),
      [categoryState.categories]
    );

    const levelTwoCategories = useMemo(() => {
      if (!formik.values.category) return [];
      return categoryState.categories
        .filter((cat: Category) => cat.level === 2 && cat.parentCategory === formik.values.category)
        .sort((a: Category, b: Category) => {
          const orderA = a.order ?? 999999;
          const orderB = b.order ?? 999999;
          return orderA !== orderB ? orderA - orderB : (a.name || "").localeCompare(b.name || "");
        });
    }, [categoryState.categories, formik.values.category]);

    const levelThreeCategories = useMemo(() => {
      if (!formik.values.category2) return [];
      return categoryState.categories
        .filter((cat: Category) => cat.level === 3 && cat.parentCategory === formik.values.category2)
        .sort((a: Category, b: Category) => (a.name || "").localeCompare(b.name || ""));
    }, [categoryState.categories, formik.values.category2]);

    // ============================================
    // ✅ CATEGORY RESET EFFECTS
    // ============================================
    useEffect(() => {
      if (mode === "add") {
        formik.setFieldValue("category2", "");
        formik.setFieldValue("category3", "");
        formik.setFieldValue("variants", []);
        setColorHighlights({}); // ✅ Reset highlights
        setActiveColorTab(0);
        setExpandedSubVariant(0);
      }
    }, [formik.values.category, mode]);

    useEffect(() => {
      if (mode === "add") {
        formik.setFieldValue("category3", "");
        formik.setFieldValue("variants", []);
        setColorHighlights({}); // ✅ Reset highlights
        setActiveColorTab(0);
        setExpandedSubVariant(0);
      }
    }, [formik.values.category2, mode]);

    // ============================================
    // ✅ VARIANT HANDLERS
    // ============================================
    const handleAddColorVariant = useCallback(() => {
      const newColorVariant: ProductVariantForm = {
        color: '', images: [],
        subVariants: [{ specifications: {}, mrpPrice: '', sellingPrice: '', stock: '0', isActive: true }],
        isActive: true,
      };
      formik.setFieldValue('variants', [...formik.values.variants, newColorVariant]);
      setActiveColorTab(formik.values.variants.length);
      setExpandedSubVariant(0);
    }, [formik.values.variants, formik]);

    const handleRemoveColorVariant = useCallback((index: number) => {
      if (formik.values.variants.length <= 1) {
        formik.setFieldValue('variants', [{ color: '', images: [], subVariants: [{ specifications: {}, mrpPrice: '', sellingPrice: '', stock: '0', isActive: true }], isActive: true }]);
        setColorHighlights({});
        setActiveColorTab(0); setExpandedSubVariant(0); return;
      }
      const newVariants = formik.values.variants.filter((_, i) => i !== index);
      formik.setFieldValue('variants', newVariants);
      // ✅ Remove highlights for deleted color
      setColorHighlights(prev => {
        const newHighlights = { ...prev };
        delete newHighlights[index];
        // Re-index remaining highlights
        const reIndexed: Record<number, Record<string, string>> = {};
        Object.keys(newHighlights).forEach(key => {
          const numKey = Number(key);
          if (numKey < index) reIndexed[numKey] = newHighlights[numKey];
          else if (numKey > index) reIndexed[numKey - 1] = newHighlights[numKey];
        });
        return reIndexed;
      });
      if (activeColorTab >= newVariants.length) setActiveColorTab(Math.max(0, newVariants.length - 1));
    }, [formik.values.variants, activeColorTab, formik]);

    const handleColorVariantChange = useCallback((colorIndex: number, field: keyof ProductVariantForm, value: any) => {
      const newVariants = [...formik.values.variants];
      newVariants[colorIndex] = { ...newVariants[colorIndex], [field]: value };
      formik.setFieldValue('variants', newVariants);
    }, [formik.values.variants, formik]);

    const handleAddSubVariant = useCallback((colorIndex: number) => {
      const newVariants = [...formik.values.variants];
      newVariants[colorIndex].subVariants.push({ specifications: {}, mrpPrice: '', sellingPrice: '', stock: '0', isActive: true });
      formik.setFieldValue('variants', newVariants);
      setExpandedSubVariant(newVariants[colorIndex].subVariants.length - 1);
    }, [formik.values.variants, formik]);

    const handleRemoveSubVariant = useCallback((colorIndex: number, subVariantIndex: number) => {
      const newVariants = [...formik.values.variants];
      const subVariant = newVariants[colorIndex].subVariants[subVariantIndex];
      if (subVariant._id) {
        newVariants[colorIndex].subVariants[subVariantIndex] = {
          ...subVariant,
          toBeDeleted: true,
        };
        formik.setFieldValue('variants', newVariants);
        console.log('🗑️ Sub-variant marked for deletion:', { _id: subVariant._id, color: newVariants[colorIndex].color });
      } else {
        if (newVariants[colorIndex].subVariants.length <= 1) {
          alert('Each color must have at least one storage variant');
          return;
        }
        newVariants[colorIndex].subVariants.splice(subVariantIndex, 1);
        formik.setFieldValue('variants', newVariants);
        if (expandedSubVariant !== null && expandedSubVariant >= newVariants[colorIndex].subVariants.length) {
          setExpandedSubVariant(newVariants[colorIndex].subVariants.length - 1);
        }
      }
    }, [formik.values.variants, expandedSubVariant, formik]);

    const handleSubVariantChange = useCallback((colorIndex: number, subVariantIndex: number, field: keyof ProductSubVariantForm, value: any) => {
      const newVariants = [...formik.values.variants];
      newVariants[colorIndex].subVariants[subVariantIndex] = { ...newVariants[colorIndex].subVariants[subVariantIndex], [field]: value };
      formik.setFieldValue('variants', newVariants);
    }, [formik.values.variants, formik]);

    const handleSubVariantSpecChange = useCallback((colorIndex: number, subVariantIndex: number, attributeName: string, value: any) => {
      const newVariants = [...formik.values.variants];
      newVariants[colorIndex].subVariants[subVariantIndex] = {
        ...newVariants[colorIndex].subVariants[subVariantIndex],
        specifications: { ...newVariants[colorIndex].subVariants[subVariantIndex].specifications, [attributeName]: value },
      };
      formik.setFieldValue('variants', newVariants);
    }, [formik.values.variants, formik]);

    // ✅✅✅ NEW: Handle color-level highlight change
    const handleColorHighlightChange = useCallback((colorIndex: number, attrName: string, value: string) => {
      setColorHighlights(prev => ({
        ...prev,
        [colorIndex]: {
          ...prev[colorIndex],
          [attrName]: value
        }
      }));
    }, []);

    const handleColorVariantImageUpload = useCallback(async (colorIndex: number, files: FileList | null) => {
      if (!files?.length) return;
      setUploadingImage(true);
      try {
        const uploadedUrls: string[] = [];
        for (let i = 0; i < files.length; i++) {
          const url = await uploadToCloudinary(files[i]);
          if (url) uploadedUrls.push(url);
        }
        if (uploadedUrls.length > 0) {
          const newVariants = [...formik.values.variants];
          newVariants[colorIndex] = { ...newVariants[colorIndex], images: [...newVariants[colorIndex].images, ...uploadedUrls] };
          formik.setFieldValue('variants', newVariants);
        }
      } catch (error) {
        console.error("Image upload failed:", error);
        alert("Failed to upload images");
      } finally { setUploadingImage(false); }
    }, [formik.values.variants, formik]);

    const handleRemoveColorVariantImage = useCallback((colorIndex: number, imageIndex: number) => {
      const newVariants = [...formik.values.variants];
      newVariants[colorIndex].images.splice(imageIndex, 1);
      formik.setFieldValue('variants', newVariants);
    }, [formik.values.variants, formik]);

    // ============================================
    // ✅ VALIDATION HELPERS
    // ============================================
    const isStepValid = (step: number) => {
      const isValidPrice = (value: any): boolean => {
        if (value == null) return false;
        const strValue = String(value).trim();
        if (strValue === '') return false;
        const numValue = Number(strValue);
        return !isNaN(numValue) && numValue > 0;
      };
      if (mode === "edit") {
        if (step === 0) {
          return !!(formik.values.title?.trim() && formik.values.description?.trim() &&
            formik.values.variants?.length > 0 &&
            formik.values.variants.every(cv => cv?.color?.trim() && cv?.images?.length > 0 &&
              cv?.subVariants?.length > 0 && cv?.subVariants?.every(sv => isValidPrice(sv?.mrpPrice) && isValidPrice(sv?.sellingPrice))));
        }
        return true;
      }
      if (step === 0) return !!(formik.values.category && formik.values.category2 && formik.values.category3);
      if (step === 1) {
        return !!(formik.values.title?.trim() && formik.values.description?.trim() &&
          formik.values.variants?.length > 0 &&
          formik.values.variants.every(cv => cv?.color?.trim() && cv?.images?.length > 0 &&
            cv?.subVariants?.length > 0 && cv?.subVariants?.every(sv => isValidPrice(sv?.mrpPrice) && isValidPrice(sv?.sellingPrice))));
      }
      return true;
    };

    const handleNext = async () => {
      if (mode === "edit") {
        if (activeStep === 0) {
          const errors = await formik.validateForm();
          const step0Fields = ['title', 'description', 'variants'];
          const hasStep0Errors = step0Fields.some(field => errors[field as keyof typeof errors]);
          if (!hasStep0Errors && isStepValid(activeStep)) {
            setActiveStep((prev) => prev + 1);
          } else {
            formik.setTouched({
              title: true,
              description: true,
              variants: formik.values.variants.map(() => ({
                color: true,
                images: true,
                highlights: {},
                subVariants: formik.values.variants[0]?.subVariants.map(() => ({
                  mrpPrice: true,
                  sellingPrice: true,
                  stock: true,
                  sku: true,
                  specifications: {},
                  isActive: false,
                })) || [],
                isActive: false,
              })),
            });
            console.log('⚠️ Step 0 validation errors:', errors);
          }
        }
      } else {
        if (activeStep === 0) {
          const errors = await formik.validateForm();
          const step0Fields = ['category', 'category2', 'category3'];
          const hasStep0Errors = step0Fields.some(field => errors[field as keyof typeof errors]);
          if (!hasStep0Errors && isStepValid(activeStep)) {
            setActiveStep((prev) => prev + 1);
          } else {
            formik.setTouched({
              category: true,
              category2: true,
              category3: true,
            });
            console.log('⚠️ Step 0 validation errors:', errors);
          }
        } else if (activeStep === 1) {
          const errors = await formik.validateForm();
          const step1Fields = ['title', 'description', 'variants'];
          const hasStep1Errors = step1Fields.some(field => errors[field as keyof typeof errors]);
          if (!hasStep1Errors && isStepValid(activeStep)) {
            setActiveStep((prev) => prev + 1);
          } else {
            formik.setTouched({
              title: true,
              description: true,
              variants: formik.values.variants.map(() => ({
                color: true,
                images: true,
                highlights: {},
                subVariants: formik.values.variants[0]?.subVariants.map(() => ({
                  mrpPrice: true,
                  sellingPrice: true,
                  stock: true,
                  sku: true,
                  specifications: {},
                  isActive: false,
                })) || [],
                isActive: false,
              })),
            });
            console.log('⚠️ Step 1 validation errors:', errors);
          }
        }
      }
    };

    const handleBack = () => setActiveStep((prev) => prev - 1);
    const handleCloseSnackbar = () => setOpenSnackbar(false);

    // ============================================
    // ✅ IMAGE HANDLERS
    // ============================================
    const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      setUploadingImage(true);
      try {
        const image = await uploadToCloudinary(file);
        if (image) formik.setFieldValue("images", [...formik.values.images, image]);
      } catch (error) {
        console.error("Image upload failed:", error);
        alert("Failed to upload image");
      } finally { setUploadingImage(false); }
    };

    const handleRemoveImage = (index: number) => {
      const updated = [...formik.values.images];
      updated.splice(index, 1);
      formik.setFieldValue("images", updated);
    };

    // ============================================
    // ✅ ERROR HELPERS
    // ============================================
    const getColorVariantError = (colorIndex: number, field: keyof ProductVariantForm): string | undefined => {
      const errors = formik.errors.variants;
      if (Array.isArray(errors) && errors[colorIndex]) return (errors[colorIndex] as any)[field] as string | undefined;
      return undefined;
    };

    const getSubVariantError = (colorIndex: number, subVariantIndex: number, field: keyof ProductSubVariantForm): string | undefined => {
      const errors = formik.errors.variants;
      if (Array.isArray(errors) && errors[colorIndex]) {
        const colorError = errors[colorIndex] as any;
        if (colorError.subVariants?.[subVariantIndex] && field !== 'specifications') {
          return colorError.subVariants[subVariantIndex][field] as string | undefined;
        }
      }
      return undefined;
    };

    const getSubVariantSpecError = (colorIndex: number, subVariantIndex: number, attributeName: string): string | undefined => {
      const errors = formik.errors.variants;
      if (Array.isArray(errors) && errors[colorIndex]) {
        const colorError = errors[colorIndex] as any;
        if (colorError.subVariants?.[subVariantIndex]?.specifications) {
          return colorError.subVariants[subVariantIndex].specifications[attributeName];
        }
      }
      return undefined;
    };

    // ✅✅✅ NEW: Get color highlight error
    const getColorHighlightError = (colorIndex: number, attributeName: string): string | undefined => {
      const errors = formik.errors.variants;
      if (Array.isArray(errors) && errors[colorIndex]) {
        const colorError = errors[colorIndex] as any;
        if (colorError.highlights) {
          return colorError.highlights[attributeName];
        }
      }
      return undefined;
    };

    // ============================================
    // ✅ RENDER METHODS
    // ============================================
    const renderCategoryStep = () => (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          <Paper className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <Typography variant="h6" className="font-semibold text-blue-800">📁 Select Product Category</Typography>
            <Typography variant="body2" className="text-blue-600 mt-1">Choose the most specific category for your product (Level 3)</Typography>
          </Paper>
        </Grid>
        {[
          { label: "Main Category", field: "category", items: levelOneCategories, disabled: false },
          { label: "Sub-Category", field: "category2", items: levelTwoCategories, disabled: !formik.values.category },
          { label: "Product Type", field: "category3", items: levelThreeCategories, disabled: !formik.values.category2 },
        ].map(({ label, field, items, disabled }) => (
          <Grid key={field} size={{ xs: 12, sm: 6, lg: 4 }}>
            <FormControl fullWidth error={Boolean(formik.errors[field as keyof ProductFormValues])} required>
              <InputLabel id={`${field}-label`}>{label} *</InputLabel>
              <Select labelId={`${field}-label`} id={field} name={field} value={formik.values[field as keyof ProductFormValues] as string}
                onChange={formik.handleChange} onBlur={formik.handleBlur} label={`${label} *`} disabled={disabled || mode === "edit"}>
                <MenuItem value=""><em>Select {label}</em></MenuItem>
                {items.map((item: Category) => <MenuItem key={item._id} value={item._id}>{item.name}</MenuItem>)}
              </Select>
              {formik.errors[field as keyof ProductFormValues] && <FormHelperText error>{String(formik.errors[field as keyof ProductFormValues])}</FormHelperText>}
            </FormControl>
          </Grid>
        ))}
        {formik.values.category3 && (
          <Grid size={{ xs: 12 }}>
            <Paper className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <Typography variant="body2" className="text-green-700">✅ Selected:{" "}
                {categoryState.categories.find((c: Category) => c._id === formik.values.category)?.name} →{" "}
                {categoryState.categories.find((c: Category) => c._id === formik.values.category2)?.name} →{" "}
                <strong>{categoryState.categories.find((c: Category) => c._id === formik.values.category3)?.name}</strong>
              </Typography>
            </Paper>
          </Grid>
        )}
        {formik.values.category3 && attributesLoading && (
          <Grid size={{ xs: 12 }}><Box className="flex items-center gap-2 text-amber-600"><CircularProgress size={20} /><Typography variant="body2">Loading product specifications...</Typography></Box></Grid>
        )}
        {mode === "edit" && <Grid size={{ xs: 12 }}><Alert severity="info" variant="outlined">ℹ️ Categories are locked in edit mode. To change categories, create a new product.</Alert></Grid>}
      </Grid>
    );

    // ✅✅✅ NEW: Render Color-Level Highlights Section (shared across sub-variants)
    const renderColorHighlightsSection = (colorIndex: number, variant: ProductVariantForm) => {
      if (highlightAttributes.length === 0) return null;

      return (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.light' }}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'success.main' }}>
            <CheckCircleIcon color="success" fontSize="small" />
            🔸 Product Highlights for {variant.color || 'this color'} (Shared Across All Variants)
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block', ml: 3 }}>
            These values apply to ALL variants of this color. Enter once, used everywhere.
          </Typography>
          <Grid container spacing={2}>
            {highlightAttributes.map((attr: CategoryAttribute) => {
              const value = colorHighlights[colorIndex]?.[attr.name] || '';
              const error = getColorHighlightError(colorIndex, attr.name);

              return (
                <Grid key={attr.name} size={{ xs: 12, sm: 6 }}>
                  {attr.type === 'select' ? (
                    <FormControl fullWidth required={attr.required} error={!!error}>
                      <InputLabel>{attr.label}{attr.required && ' *'}</InputLabel>
                      <Select
                        value={value}
                        onChange={(e) => handleColorHighlightChange(colorIndex, attr.name, e.target.value)}
                        label={`${attr.label}${attr.required ? ' *' : ''}`}
                      >
                        <MenuItem value=""><em>Select {attr.label}</em></MenuItem>
                        {attr.options?.map((opt: string) => (
                          <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                        ))}
                      </Select>
                      {error && <FormHelperText>{String(error)}</FormHelperText>}
                    </FormControl>
                  ) : attr.type === 'number' ? (
                    <TextField
                      fullWidth
                      label={`${attr.label}${attr.required ? ' *' : ''}`}
                      type="number"
                      value={value}
                      onChange={(e) => handleColorHighlightChange(colorIndex, attr.name, e.target.value)}
                      required={attr.required}
                      error={!!error}
                      helperText={error || ''}
                      InputProps={{ inputProps: { min: attr.min, max: attr.max, step: attr.step || 1 } }}
                    />
                  ) : (
                    <TextField
                      fullWidth
                      label={`${attr.label}${attr.required ? ' *' : ''}`}
                      value={value}
                      onChange={(e) => handleColorHighlightChange(colorIndex, attr.name, e.target.value)}
                      required={attr.required}
                      error={!!error}
                      helperText={error || ''}
                    />
                  )}
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      );
    };

    const renderVariantsSection = () => (
      <Box sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">🎨 Color Variants with Storage Options</Typography>
          <Button startIcon={<AddCircleIcon />} onClick={handleAddColorVariant} variant="outlined" size="small">Add Color</Button>
        </Box>
        {formik.values.variants.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'amber.50' }}><Typography>No color variants added yet.</Typography><Typography variant="body2" color="text.secondary">Click "Add Color" to create color variants, then add storage options under each color</Typography></Paper>
        ) : (
          <>
            <Tabs
              value={activeColorTab}
              onChange={(_: React.SyntheticEvent, val: number) => setActiveColorTab(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{ mb: 2 }}
            >
              {formik.values.variants.map((colorVariant, colorIndex) => (
                <Tab
                  key={colorIndex}
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PaletteIcon fontSize="small" />
                      <Typography variant="body2">
                        {colorVariant.color || `Color ${colorIndex + 1}`}
                        {colorVariant.subVariants.length > 0 && ` (${colorVariant.subVariants.length} variants)`}
                      </Typography>
                    </Box>
                  }
                  icon={
                    formik.values.variants.length > 1 ? (
                      <Tooltip title="Remove color variant">
                        <Box
                          component="span"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleRemoveColorVariant(colorIndex);
                          }}
                          sx={{
                            ml: 1,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            color: 'error.main',
                            '&:hover': { opacity: 0.8 }
                          }}
                        >
                          <RemoveCircleIcon fontSize="small" />
                        </Box>
                      </Tooltip>
                    ) : undefined
                  }
                  iconPosition="end"
                />
              ))}
            </Tabs>
            {formik.values.variants[activeColorTab] && (
              <Paper sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold">📦 Storage Variants for {formik.values.variants[activeColorTab].color || 'this color'}</Typography>
                  <Button startIcon={<AddCircleIcon />} onClick={() => handleAddSubVariant(activeColorTab)} variant="outlined" size="small">Add Storage Variant</Button>
                </Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField fullWidth label="Color *" value={formik.values.variants[activeColorTab].color}
                      onChange={(e) => handleColorVariantChange(activeColorTab, 'color', e.target.value)}
                      error={Boolean(getColorVariantError(activeColorTab, 'color'))}
                      helperText={getColorVariantError(activeColorTab, 'color') || ''} required placeholder="e.g., Navy Blue, Rose Gold" />
                  </Grid>
                </Grid>
                <Grid size={{ xs: 12 }} sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>Images for {formik.values.variants[activeColorTab].color || 'this color'} *</Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input type="file" accept="image/*" multiple id={`color-images-${activeColorTab}`} style={{ display: 'none' }} onChange={(e) => handleColorVariantImageUpload(activeColorTab, e.target.files)} />
                    <label htmlFor={`color-images-${activeColorTab}`}><Button component="span" variant="outlined" startIcon={<AddPhotoAlternateIcon />} disabled={uploadingImage}>{uploadingImage ? <CircularProgress size={20} /> : 'Upload Images'}</Button></label>
                    <Typography variant="caption" color="text.secondary">These images will be used for all storage variants of this color</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                    {formik.values.variants[activeColorTab].images.map((img, idx) => (
                      <Box key={idx} sx={{ position: 'relative' }}><img src={img} alt={`Color ${activeColorTab + 1} - ${idx + 1}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                        <IconButton size="small" onClick={() => handleRemoveColorVariantImage(activeColorTab, idx)} sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'white', '&:hover': { bgcolor: 'error.light' } }}><CloseIcon fontSize="small" /></IconButton>
                      </Box>
                    ))}
                  </Box>
                  {formik.touched.variants?.[activeColorTab] && getColorVariantError(activeColorTab, 'images') && <FormHelperText error>{String(getColorVariantError(activeColorTab, 'images'))}</FormHelperText>}
                </Grid>
                <Divider sx={{ mb: 3 }} />

                {/* ✅✅✅ NEW: Color-Level Highlights (Enter Once Per Color) */}
                {renderColorHighlightsSection(activeColorTab, formik.values.variants[activeColorTab])}

                {/* ✅ Filter out toBeDeleted variants from UI */}
                {formik.values.variants[activeColorTab].subVariants
                  .filter((subVariant) => !(subVariant as any).toBeDeleted)
                  .map((subVariant, subIndex) => (
                    <Accordion key={subVariant._id || subIndex} expanded={expandedSubVariant === subIndex} onChange={() => setExpandedSubVariant(expandedSubVariant === subIndex ? null : subIndex)} sx={{ mb: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                          <StorageIcon color="primary" /><Typography variant="subtitle2" fontWeight="bold">{subVariant.specifications?.storage || `Storage Variant ${subIndex + 1}`}{subVariant.specifications?.ram && ` • ${subVariant.specifications.ram}`}</Typography>
                          <Chip label={`₹${subVariant.sellingPrice || '0'}`} size="small" color="success" variant="outlined" />
                          {!subVariant.isActive && <Chip label="Inactive" size="small" color="default" />}
                        </Box>
                        {formik.values.variants[activeColorTab].subVariants.filter((sv) => !(sv as any).toBeDeleted).length > 1 && (
                          <Box component="span" onClick={(e) => { e.stopPropagation(); handleRemoveSubVariant(activeColorTab, formik.values.variants[activeColorTab].subVariants.indexOf(subVariant)); }} sx={{ cursor: 'pointer', color: 'error.main', display: 'flex', alignItems: 'center', '&:hover': { opacity: 0.8 }, ml: 1 }}><RemoveCircleIcon fontSize="small" /></Box>
                        )}
                      </AccordionSummary>
                      <AccordionDetails>
                        <Grid container spacing={2}>
                          {attributesLoading ? (
                            <Grid size={{ xs: 12 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress size={20} />
                                <Typography variant="body2">Loading specifications...</Typography>
                              </Box>
                            </Grid>
                          ) : attributeState.length > 0 ? (
                            <>
                              {/* 🔹 SECTION 1: Variant Selector Attributes ONLY (RAM, Storage, etc.) */}
                              {variantAttributes.length > 0 && (
                                <Grid size={{ xs: 12 }}>
                                  <Box sx={{
                                    p: 2,
                                    bgcolor: 'primary.50',
                                    borderRadius: 2,
                                    border: '1px solid',
                                    borderColor: 'primary.light',
                                    mb: 2
                                  }}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="primary.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <PaletteIcon fontSize="small" />
                                      🔹 Variant-Specific Fields
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                                      These differentiate this variant from others of the same color.
                                    </Typography>
                                    <Grid container spacing={2}>
                                      {variantAttributes.map((attr: CategoryAttribute) => {
                                        const specValue = subVariant.specifications?.[attr.name];
                                        const specError = getSubVariantSpecError(activeColorTab, formik.values.variants[activeColorTab].subVariants.indexOf(subVariant), attr.name);
                                        const fieldIndex = formik.values.variants[activeColorTab].subVariants.indexOf(subVariant);
                                        return (
                                          <Grid key={attr._id || attr.name} size={{ xs: 12, sm: 6 }}>
                                            {attr.type === 'select' ? (
                                              <FormControl fullWidth required={attr.required}>
                                                <InputLabel>{attr.label}{attr.required && ' *'}</InputLabel>
                                                <Select
                                                  value={specValue || ''}
                                                  onChange={(e) => handleSubVariantSpecChange(activeColorTab, fieldIndex, attr.name, e.target.value)}
                                                  label={`${attr.label}${attr.required ? ' *' : ''}`}
                                                >
                                                  <MenuItem value=""><em>Select {attr.label}</em></MenuItem>
                                                  {attr.options?.map((opt: string) => (
                                                    <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                                                  ))}
                                                </Select>
                                                {specError && <FormHelperText error>{String(specError)}</FormHelperText>}
                                              </FormControl>
                                            ) : attr.type === 'number' ? (
                                              <TextField
                                                fullWidth
                                                label={`${attr.label}${attr.required ? ' *' : ''}`}
                                                type="number"
                                                value={specValue || ''}
                                                onChange={(e) => handleSubVariantSpecChange(activeColorTab, fieldIndex, attr.name, e.target.value ? Number(e.target.value) : '')}
                                                required={attr.required}
                                                InputProps={{ inputProps: { min: attr.min, max: attr.max, step: attr.step || 1 } }}
                                              />
                                            ) : (
                                              <TextField
                                                fullWidth
                                                label={`${attr.label}${attr.required ? ' *' : ''}`}
                                                value={specValue || ''}
                                                onChange={(e) => handleSubVariantSpecChange(activeColorTab, fieldIndex, attr.name, e.target.value)}
                                                required={attr.required}
                                              />
                                            )}
                                          </Grid>
                                        );
                                      })}
                                    </Grid>
                                  </Box>
                                </Grid>
                              )}

                              {/* ✅ Price/Stock fields remain unchanged below the attribute sections */}
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                  fullWidth
                                  label="MRP Price (₹) *"
                                  type="number"
                                  value={subVariant.mrpPrice}
                                  onChange={(e) => handleSubVariantChange(activeColorTab, formik.values.variants[activeColorTab].subVariants.indexOf(subVariant), 'mrpPrice', e.target.value)}
                                  error={Boolean(getSubVariantError(activeColorTab, formik.values.variants[activeColorTab].subVariants.indexOf(subVariant), 'mrpPrice'))}
                                  helperText={getSubVariantError(activeColorTab, formik.values.variants[activeColorTab].subVariants.indexOf(subVariant), 'mrpPrice') || ''}
                                  InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                  fullWidth
                                  label="Selling Price (₹) *"
                                  type="number"
                                  value={subVariant.sellingPrice}
                                  onChange={(e) => handleSubVariantChange(activeColorTab, formik.values.variants[activeColorTab].subVariants.indexOf(subVariant), 'sellingPrice', e.target.value)}
                                  error={Boolean(getSubVariantError(activeColorTab, formik.values.variants[activeColorTab].subVariants.indexOf(subVariant), 'sellingPrice'))}
                                  helperText={getSubVariantError(activeColorTab, formik.values.variants[activeColorTab].subVariants.indexOf(subVariant), 'sellingPrice') || ''}
                                  InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                  fullWidth
                                  label="Stock Quantity"
                                  type="number"
                                  value={subVariant.stock}
                                  onChange={(e) => handleSubVariantChange(activeColorTab, formik.values.variants[activeColorTab].subVariants.indexOf(subVariant), 'stock', e.target.value)}
                                  InputProps={{ inputProps: { min: 0 } }}
                                />
                              </Grid>
                              <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                  fullWidth
                                  label="SKU (Optional)"
                                  value={subVariant.sku || ''}
                                  onChange={(e) => handleSubVariantChange(activeColorTab, formik.values.variants[activeColorTab].subVariants.indexOf(subVariant), 'sku', e.target.value)}
                                  placeholder="Auto-generated if empty"
                                />
                              </Grid>
                              <Grid size={{ xs: 12 }}>
                                <FormControlLabel
                                  control={
                                    <Switch
                                      checked={subVariant.isActive !== false}
                                      onChange={(e) => handleSubVariantChange(activeColorTab, formik.values.variants[activeColorTab].subVariants.indexOf(subVariant), 'isActive', e.target.checked)}
                                    />
                                  }
                                  label="Active (visible to customers)"
                                />
                              </Grid>
                            </>
                          ) : (
                            <Grid size={{ xs: 12 }}>
                              <Typography variant="body2" color="text.secondary">
                                No additional specifications configured for this category
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </AccordionDetails>
                    </Accordion>
                  ))}
              </Paper>
            )}
          </>
        )}
      </Box>
    );

    const renderBasicInfoStep = () => (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}><Paper className="p-4 bg-purple-50 border border-purple-200 rounded-lg"><Typography variant="h6" className="font-semibold text-purple-800">📝 {mode === "edit" ? "Update" : "Basic"} Product Information</Typography><Typography variant="body2" className="text-purple-600 mt-1">{mode === "edit" ? "Update product details and variants" : "Enter the core details for your product"}</Typography></Paper></Grid>
        <Grid size={{ xs: 12 }}><TextField fullWidth id="title" name="title" label="Product Title *" value={formik.values.title} onChange={(e) => formik.setFieldValue('title', e.target.value)} onBlur={formik.handleBlur} error={formik.touched.title && Boolean(formik.errors.title)} helperText={formik.touched.title && formik.errors.title ? String(formik.errors.title) : ""} required /></Grid>
        <Grid size={{ xs: 12 }}><TextField multiline rows={4} fullWidth id="description" name="description" label="Description *" value={formik.values.description} onChange={(e) => formik.setFieldValue('description', e.target.value)} onBlur={formik.handleBlur} error={formik.touched.description && Boolean(formik.errors.description)} helperText={formik.touched.description && formik.errors.description ? String(formik.errors.description) : ""} required /></Grid>
        <Grid size={{ xs: 12 }}><Divider sx={{ my: 2 }} />{renderVariantsSection()}</Grid>
      </Grid>
    );

    const renderReviewStep = () => (
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}><Paper className="p-4 bg-green-50 border border-green-200 rounded-lg"><Typography variant="h6" className="font-semibold text-green-800">✅ Review & Submit</Typography><Typography variant="body2" className="text-green-600 mt-1">Review your product details before submitting</Typography></Paper></Grid>
        <Grid size={{ xs: 12 }}><Paper sx={{ p: 3, bgcolor: 'grey.50' }}><Typography variant="subtitle1" fontWeight="bold" gutterBottom>📦 Product Summary</Typography><Grid container spacing={2}><Grid size={{ xs: 6 }}><Typography variant="body2" color="text.secondary">Title:</Typography><Typography variant="body1">{formik.values.title || 'N/A'}</Typography></Grid><Grid size={{ xs: 6 }}></Grid>{mode !== "edit" && (<Grid size={{ xs: 12 }}><Typography variant="body2" color="text.secondary">Category:</Typography><Typography variant="body1">{categoryState.categories.find((c: Category) => c._id === formik.values.category)?.name} →{categoryState.categories.find((c: Category) => c._id === formik.values.category2)?.name} →<strong>{categoryState.categories.find((c: Category) => c._id === formik.values.category3)?.name}</strong></Typography></Grid>)}<Grid size={{ xs: 12 }}><Typography variant="body2" color="text.secondary">Description:</Typography><Typography variant="body1" className="line-clamp-3">{formik.values.description || 'N/A'}</Typography></Grid></Grid></Paper></Grid>
        <Grid size={{ xs: 12 }}><Paper sx={{ p: 3, bgcolor: 'grey.50' }}><Typography variant="subtitle1" fontWeight="bold" gutterBottom>🎨 Color Variants ({formik.values.variants.length})</Typography>{formik.values.variants.map((colorVariant, colorIndex) => (<Box key={colorIndex} sx={{ mb: 3, p: 2, bgcolor: 'white', borderRadius: 1, border: '1px solid #e0e0e0' }}><Typography variant="body2" fontWeight="bold" color="primary">Color: {colorVariant.color || 'N/A'}</Typography><Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>Storage Options: {colorVariant.subVariants.length} | Images: {colorVariant.images.length}</Typography>{colorVariant.subVariants.map((subVar, subIndex) => (<Box key={subIndex} sx={{ ml: 4, mt: 1, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}><Typography variant="body2">{subVar.specifications?.storage || 'N/A'} |{subVar.specifications?.ram || 'N/A'} |₹{subVar.sellingPrice} |Stock: {subVar.stock}</Typography></Box>))}</Box>))}</Paper></Grid>
        <Grid size={{ xs: 12 }}><Alert severity="info">✅ All category-specific specifications (RAM, Storage, etc.) are configured per sub-variant. Product Highlights (Processor, Warranty) are shared across all variants of the same color.</Alert></Grid>
      </Grid>
    );

    const steps = mode === "edit" ? ["Product Details & Variants", "Review & Submit"] : ["Select Category", "Basic Information & Variants", "Review & Submit"];

    // ============================================
    // ✅ JSX RETURN
    // ============================================
    return (
      <div className="p-4">
        {mode !== "edit" && (<Stepper activeStep={activeStep} className="mb-6" alternativeLabel>{steps.map((label, index) => <Step key={index}><StepLabel>{label}</StepLabel></Step>)}</Stepper>)}
        {mode === "edit" && (<Box sx={{ mb: 4 }}><Typography variant="h5" fontWeight="bold">✏️ Edit Product: {formik.values.title || 'Loading...'}</Typography><Typography variant="body2" color="text.secondary">Update variant details, prices, and stock. Categories cannot be changed.</Typography></Box>)}
        <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); const finalStep = mode === "edit" ? 1 : 2; if (activeStep !== finalStep) { console.log('⛔ Submission blocked - not on final step', { activeStep }); return; } console.log('✅ Step confirmed - proceeding with formik submit'); formik.handleSubmit(e); }} onKeyDown={(e) => { const finalStep = mode === "edit" ? 1 : 2; if (e.key === 'Enter' && activeStep !== finalStep) { e.preventDefault(); e.stopPropagation(); } }}>
          <Grid container spacing={2}>
            {activeStep === 0 && mode !== "edit" && renderCategoryStep()}
            {((activeStep === 0 && mode === "edit") || (activeStep === 1 && mode !== "edit")) && renderBasicInfoStep()}
            {((mode === "edit" && activeStep === 1) || (mode !== "edit" && activeStep === 2)) && renderReviewStep()}
            <Grid size={12} className="flex justify-between mt-6">
              <Button type="button" disabled={(mode === "edit" && activeStep === 0) || (mode !== "edit" && activeStep === 0)} onClick={handleBack} variant="outlined">Back</Button>
              {activeStep === steps.length - 1 ? (
                <Button sx={{ px: 4, py: 1.5 }} color="primary" variant="contained" type="button"
                  disabled={sellerProduct.loading || !isStepValid(activeStep) || attributesLoading}
                  onClick={() => {
                    console.log('🎯 Submit button clicked');
                    if (sellerProduct.loading) { console.log('⛔ Submit blocked - already loading'); return; }
                    const formElement = document.querySelector('form');
                    if (formElement) {
                      requestAnimationFrame(() => {
                        console.log('✅ Triggering form submit event');
                        formElement.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                      });
                    }
                  }}>
                  {sellerProduct.loading ? <CircularProgress size={24} color="inherit" /> : mode === "edit" ? "✅ Update Product" : "🚀 Add Product"}
                </Button>
              ) : (<Button type="button" sx={{ px: 4, py: 1.5 }} variant="contained" onClick={handleNext} disabled={!isStepValid(activeStep)}>Next</Button>)}
            </Grid>
            {onClose && activeStep === 0 && mode !== "edit" && (<Grid size={12}><Button type="button" onClick={onClose} color="secondary" fullWidth variant="outlined">Cancel</Button></Grid>)}
          </Grid>
        </form>
        <Snackbar anchorOrigin={{ vertical: "top", horizontal: "right" }} open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
          <Alert onClose={handleCloseSnackbar} severity={sellerProduct.error ? "error" : "success"} variant="filled" sx={{ width: "100%" }}>
            {(() => { const err = sellerProduct.error; if (!err) return mode === "edit" ? "Product updated successfully!" : "Product created successfully!"; if (typeof err === 'string') return err; if (typeof err === 'object' && err !== null) { const errorObj = err as { message?: string; errors?: string[] }; if (errorObj.message) return String(errorObj.message); if (errorObj.errors && Array.isArray(errorObj.errors)) return errorObj.errors.join(', '); return JSON.stringify(err); } return "An error occurred"; })()}
          </Alert>
        </Snackbar>
      </div>
    );
  };

export default AddProductForm;