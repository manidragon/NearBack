// D:\Mani\Code with Zosh\Backup\source code\frontend\src\seller\pages\Products\UpdateProductForm.tsx
import { useFormik } from "formik";
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
    Box,
    Tabs,
    Tab,
    Chip,
    Autocomplete,
    Divider,
    Switch,
    FormControlLabel,
    Tooltip,
    Accordion,
    AccordionSummary,
    AccordionDetails,
} from "@mui/material";
import "tailwindcss/tailwind.css";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import CloseIcon from "@mui/icons-material/Close";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import PaletteIcon from "@mui/icons-material/Palette";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import StorageIcon from "@mui/icons-material/Storage";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { updateProduct } from "../../../Redux Toolkit/Seller/sellerProductSlice";
import { uploadToCloudinary } from "../../../util/uploadToCloudnary";
import { fetchCategories } from "../../../Redux Toolkit/Admin/CategorySlice";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { Category } from "../../../types/categoryTypes";
import type { CategoryAttribute } from "../../../types/categoryAttributeTypes";
import { separateAttributesByType } from '../../../types/categoryAttributeTypes';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
    fetchCategoryAttributes,
    selectCategoryAttributes,
    selectCategoryAttributesLoading,
} from "../../../Redux Toolkit/Admin/CategoryAttributeSlice";

// ============================================
// ✅ TYPE DEFINITIONS
// ============================================
export interface UpdateProductSubVariantForm {
    _id?: string;
    specifications: Record<string, string | number | boolean>;
    mrpPrice: string;
    sellingPrice: string;
    stock: string;
    sku?: string;
    isActive?: boolean;
}

export interface UpdateProductVariantForm {
    _id?: string;
    color: string;
    images: string[];
    subVariants: UpdateProductSubVariantForm[];
    isActive?: boolean;
}

export interface UpdateProductFormValues {
    _id?: string;
    title: string;
    description: string;
    images: string[];
    category: string;
    category2: string;
    category3: string;
    specifications: Record<string, string | number | boolean>;
    brand?: string;
    variants: UpdateProductVariantForm[];
    isActive?: boolean;
}

// ============================================
// ✅ Validation Schema
// ============================================
const validationSchema = Yup.object({
    title: Yup.string().required("Title is required").min(3, "Title too short").max(200, "Title too long"),
    description: Yup.string().required("Description is required").min(10, "Description too short").max(5000, "Description too long"),
    brand: Yup.string().optional().max(100),
    variants: Yup.array()
        .of(
            Yup.object({
                color: Yup.string().required("Color is required").min(2, "Color too short").max(50, "Color too long"),
                images: Yup.array()
                    .of(Yup.string().url("Invalid image URL"))
                    .min(1, "At least one image required per color")
                    .required("Images are required"),
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
const UpdateProductForm: React.FC<{
    initialValues: UpdateProductFormValues;
    onSubmit?: (values: UpdateProductFormValues) => void;
    onClose?: () => void;
}> = ({ initialValues, onSubmit, onClose }) => {
    // ============================================
    // ✅ STATE & REFS - ✅ FIXED: Added snackbarMessage & snackbarSeverity
    // ============================================
    const [uploadingImage, setUploadingImage] = useState(false);
    const [activeColorTab, setActiveColorTab] = useState(0);
    const [expandedSubVariant, setExpandedSubVariant] = useState<number | null>(0);
    const [snackbarOpen, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState("");  // ✅ ADDED
    const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");  // ✅ ADDED
    const [colorSuggestions] = useState(['Black', 'White', 'Blue', 'Red', 'Gold', 'Silver', 'Green', 'Pink']);
    const [specDefinitions, setSpecDefinitions] = useState<Record<string, string[]>>({});

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
    // ✅✅✅ FIXED: Watch for update success/error and auto-close dialog
    // ============================================
    useEffect(() => {
        // ✅ Handle successful update
        if (sellerProduct.productUpdated && !sellerProduct.loading) {
            setSnackbarMessage("✅ Product updated successfully!");
            setSnackbarSeverity("success");
            setOpenSnackbar(true);

            // ✅ Auto-close form after 1.5 seconds
            const timer = setTimeout(() => {
                if (onClose) onClose();  // ✅ THIS CLOSES THE DIALOG
            }, 1500);

            return () => clearTimeout(timer);
        }

        // ✅ Handle update error
        if (sellerProduct.error && !sellerProduct.loading) {
            const errorMsg = typeof sellerProduct.error === 'string'
                ? sellerProduct.error
                : (sellerProduct.error as any)?.message || 'Update failed';

            setSnackbarMessage(`❌ ${errorMsg}`);
            setSnackbarSeverity("error");
            setOpenSnackbar(true);
            // ✅ Don't close on error - let user fix issues
        }
    }, [sellerProduct.productUpdated, sellerProduct.error, sellerProduct.loading, onClose]);

    // ============================================
    // ✅ FORMIK
    // ============================================
    const formik = useFormik<UpdateProductFormValues>({
        initialValues,
        enableReinitialize: true,
        validationSchema,
        onSubmit: (values) => {
            console.log('🚀 Update form submitted');

            if (onSubmit) {
                onSubmit(values);
                return;
            }

            const productData: any = {
                title: values.title.trim(),
                description: values.description.trim(),
                brand: values.brand?.trim() || undefined,

                variants: values.variants
                    .flatMap(colorVariant =>
                        colorVariant.subVariants
                            .map(subVar => {
                                // ✅✅✅ CRITICAL: Skip variants marked for deletion
                                if ((subVar as any).toBeDeleted === true) {
                                    console.log('🗑️ Excluding deleted variant from payload:', {
                                        color: colorVariant.color,
                                        _id: subVar._id
                                    });
                                    return null;
                                }

                                // ✅ Safely parse with explicit validation (rest of your existing logic...)
                                const mrpPriceRaw = String(subVar.mrpPrice ?? '').trim();
                                const sellingPriceRaw = String(subVar.sellingPrice ?? '').trim();
                                const stockRaw = String(subVar.stock ?? '0').trim();

                                const mrpPrice = mrpPriceRaw && !isNaN(Number(mrpPriceRaw)) ? Number(mrpPriceRaw) : null;
                                const sellingPrice = sellingPriceRaw && !isNaN(Number(sellingPriceRaw)) ? Number(sellingPriceRaw) : null;
                                const stock = stockRaw && !isNaN(Number(stockRaw)) ? Number(stockRaw) : 0;

                                if (mrpPrice === null || sellingPrice === null || mrpPrice <= 0 || sellingPrice <= 0) {
                                    console.warn('⚠️ Invalid price values skipped:', {
                                        color: colorVariant.color,
                                        mrpPrice: mrpPriceRaw,
                                        sellingPrice: sellingPriceRaw
                                    });
                                    return null;
                                }

                                if (sellingPrice >= mrpPrice) {
                                    console.warn('⚠️ Selling price must be less than MRP:', { mrpPrice, sellingPrice });
                                    return null;
                                }

                                return {
                                    ...(subVar._id && { _id: String(subVar._id) }),
                                    color: colorVariant.color.trim(),
                                    specifications: { ...(subVar.specifications || {}) },
                                    mrpPrice,
                                    sellingPrice,
                                    stock,
                                    images: colorVariant.images,
                                    sku: subVar.sku?.trim() || undefined,
                                    isActive: subVar.isActive !== false,  // ✅ Keep existing isActive logic
                                };
                            })
                            .filter((v): v is NonNullable<typeof v> => v !== null)
                    ),
                isActive: values.isActive !== false,
            };

            if (productData.variants.length === 0) {
                alert('⚠️ Please ensure all variants have valid MRP and Selling Prices (greater than 0, and Selling Price < MRP)');
                return;
            }

            console.log('📤 Submitting update payload:', {
                productId: initialValues._id,
                title: productData.title,
                variantsCount: productData.variants.length,
            });

            if (initialValues._id) {
                dispatch(updateProduct({
                    productId: initialValues._id,
                    product: productData
                }));
            }
        },
    });

    // ============================================
    // ✅ EFFECTS (unchanged)
    // ============================================
    useEffect(() => {
        if (categoryState.categories.length === 0) {
            dispatch(fetchCategories());
        }
    }, [dispatch, categoryState.categories.length]);

    useEffect(() => {
        const category3Id = initialValues.category3;
        if (category3Id && attributeState.length === 0) {
            const level3Category = categoryState.categories.find((cat: Category) => cat._id === category3Id);
            if (level3Category?.categoryId) {
                dispatch(fetchCategoryAttributes({ categoryId: level3Category.categoryId, includeInactive: false }));
            }
        }
    }, [initialValues.category3, dispatch, categoryState.categories, attributeState.length]);

    useEffect(() => {
        if (attributeState.length > 0) {
            const specs: Record<string, string[]> = {};
            attributeState.forEach((attr: CategoryAttribute) => {
                if (attr.type === 'select' && attr.options && attr.options.length > 0) {
                    specs[attr.name] = attr.options;
                }
            });
            setSpecDefinitions(specs);
        }
    }, [attributeState]);

    // ============================================
    // ✅ MEMOIZED HELPERS (unchanged)
    // ============================================
    const levelOneCategories = useMemo(() => categoryState.categories.filter((cat: Category) => cat.level === 1).sort((a: Category, b: Category) => {
        const orderA = a.order ?? 999999, orderB = b.order ?? 999999;
        return orderA !== orderB ? orderA - orderB : (a.name || "").localeCompare(b.name || "");
    }), [categoryState.categories]);

    const levelTwoCategories = useMemo(() => {
        if (!initialValues.category) return [];
        return categoryState.categories.filter((cat: Category) => cat.level === 2 && cat.parentCategory === initialValues.category).sort((a: Category, b: Category) => {
            const orderA = a.order ?? 999999, orderB = b.order ?? 999999;
            return orderA !== orderB ? orderA - orderB : (a.name || "").localeCompare(b.name || "");
        });
    }, [categoryState.categories, initialValues.category]);

    const levelThreeCategories = useMemo(() => {
        if (!initialValues.category2) return [];
        return categoryState.categories.filter((cat: Category) => cat.level === 3 && cat.parentCategory === initialValues.category2).sort((a: Category, b: Category) => (a.name || "").localeCompare(b.name || ""));
    }, [categoryState.categories, initialValues.category2]);

    // ============================================
    // ✅ VARIANT HANDLERS (keep your existing handlers - unchanged)
    // ============================================
    const handleAddColorVariant = useCallback(() => {
        const newColorVariant: UpdateProductVariantForm = {
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
            setActiveColorTab(0); setExpandedSubVariant(0); return;
        }
        const newVariants = formik.values.variants.filter((_, i) => i !== index);
        formik.setFieldValue('variants', newVariants);
        if (activeColorTab >= newVariants.length) setActiveColorTab(Math.max(0, newVariants.length - 1));
    }, [formik.values.variants, activeColorTab, formik]);

    const handleColorVariantChange = useCallback((colorIndex: number, field: keyof UpdateProductVariantForm, value: string | boolean | string[]) => {
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

    const handleRemoveSubVariant = useCallback((
        colorIndex: number,
        subVariantIndex: number
    ) => {
        const newVariants = [...formik.values.variants];
        const subVariant = newVariants[colorIndex].subVariants[subVariantIndex];

        // ✅ If variant has an _id (exists in DB), mark it for deletion instead of removing
        if (subVariant._id) {
            // ✅ Mark with custom flag that will be filtered out in UI and payload
            newVariants[colorIndex].subVariants[subVariantIndex] = {
                ...subVariant,
                toBeDeleted: true  // ✅ Custom flag for deletion tracking
            } as UpdateProductSubVariantForm;

            formik.setFieldValue('variants', newVariants);
            console.log('🗑️ Sub-variant marked for deletion:', {
                _id: subVariant._id,
                color: newVariants[colorIndex].color
            });
        } else {
            // ✅ New variant (not in DB yet) - just remove from UI immediately
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

    const handleSubVariantChange = useCallback((colorIndex: number, subVariantIndex: number, field: keyof UpdateProductSubVariantForm, value: string | boolean | Record<string, string | number | boolean>) => {
        const newVariants = [...formik.values.variants];
        newVariants[colorIndex].subVariants[subVariantIndex] = { ...newVariants[colorIndex].subVariants[subVariantIndex], [field]: value };
        formik.setFieldValue('variants', newVariants);
    }, [formik.values.variants, formik]);

    const handleSubVariantSpecChange = useCallback((colorIndex: number, subVariantIndex: number, attributeName: string, value: string | number | boolean) => {
        const newVariants = [...formik.values.variants];
        newVariants[colorIndex].subVariants[subVariantIndex] = {
            ...newVariants[colorIndex].subVariants[subVariantIndex],
            specifications: { ...newVariants[colorIndex].subVariants[subVariantIndex].specifications, [attributeName]: value }
        };
        formik.setFieldValue('variants', newVariants);
    }, [formik.values.variants, formik]);

    const handleColorVariantImageUpload = useCallback(async (colorIndex: number, files: FileList | null) => {
        if (!files || files.length === 0) return;
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
            console.error("Color variant image upload failed:", error);
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
    const isFormValid = () => {
        return !!(
            formik.values.title?.trim() &&
            formik.values.description?.trim() &&
            formik.values.variants.length > 0 &&
            formik.values.variants.every(cv =>
                cv.color?.trim() &&
                cv.images.length > 0 &&
                cv.subVariants.length > 0 &&
                cv.subVariants.every(sv => sv.mrpPrice?.trim() && sv.sellingPrice?.trim())
            )
        );
    };

    const getColorVariantError = (colorIndex: number, field: keyof UpdateProductVariantForm): string | undefined => {
        const errors = formik.errors.variants;
        if (Array.isArray(errors) && errors[colorIndex]) {
            const variantError = errors[colorIndex] as Partial<UpdateProductVariantForm>;
            return variantError[field] as string | undefined;
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

    const getSubVariantError = (colorIndex: number, subVariantIndex: number, field: keyof UpdateProductSubVariantForm): string | undefined => {
        const errors = formik.errors.variants;
        if (Array.isArray(errors) && errors[colorIndex]) {
            const colorError = errors[colorIndex] as Partial<UpdateProductVariantForm>;
            if (colorError.subVariants && Array.isArray(colorError.subVariants) && colorError.subVariants[subVariantIndex]) {
                const subVarError = colorError.subVariants[subVariantIndex] as Partial<UpdateProductSubVariantForm>;
                if (field === 'specifications') return undefined;
                return subVarError[field] as string | undefined;
            }
        }
        return undefined;
    };

    // ============================================
    // ✅ RENDER: Variants Section (keep your existing renderVariantsSection - unchanged)
    // ============================================
    const renderVariantsSection = () => (
        <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">🎨 Color Variants with Storage Options</Typography>
                <Button startIcon={<AddCircleIcon />} onClick={handleAddColorVariant} variant="outlined" size="small">Add Color</Button>
            </Box>
            {formik.values.variants.length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'amber.50' }}><Typography>No color variants found.</Typography></Paper>
            ) : (
                <>
                    <Tabs value={activeColorTab} onChange={(_, val) => setActiveColorTab(val)} variant="scrollable" scrollButtons="auto" sx={{ mb: 2 }}>
                        {formik.values.variants.map((colorVariant, colorIndex) => (
                            <Tab key={colorIndex} label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PaletteIcon fontSize="small" /><Typography variant="body2">{colorVariant.color || `Color ${colorIndex + 1}`}{colorVariant.subVariants.length > 0 && ` (${colorVariant.subVariants.length} variants)`}</Typography></Box>}
                                icon={formik.values.variants.length > 1 ? (<Tooltip title="Remove color variant"><Box component="span" onClick={(e) => { e.stopPropagation(); handleRemoveColorVariant(colorIndex); }} sx={{ ml: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'error.main', '&:hover': { opacity: 0.8 } }}><RemoveCircleIcon fontSize="small" /></Box></Tooltip>) : undefined} iconPosition="end" />
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
                                    <Autocomplete freeSolo options={colorSuggestions} value={formik.values.variants[activeColorTab].color} onChange={(_, val) => handleColorVariantChange(activeColorTab, 'color', val || '')} renderInput={(params) => (<TextField {...params} label="Color *" error={Boolean(getColorVariantError(activeColorTab, 'color'))} helperText={getColorVariantError(activeColorTab, 'color') || ''} required />)} />
                                </Grid>
                            </Grid>
                            <Grid size={{ xs: 12 }} sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" gutterBottom>Images for {formik.values.variants[activeColorTab].color || 'this color'} *</Typography>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <input type="file" accept="image/*" multiple id={`color-images-${activeColorTab}`} style={{ display: 'none' }} onChange={(e) => handleColorVariantImageUpload(activeColorTab, e.target.files)} />
                                    <label htmlFor={`color-images-${activeColorTab}`}>
                                        <Button component="span" variant="outlined" startIcon={<AddPhotoAlternateIcon />} disabled={uploadingImage}>{uploadingImage ? <CircularProgress size={20} /> : 'Upload Images'}</Button>
                                    </label>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
                                    {formik.values.variants[activeColorTab].images.map((img, idx) => (
                                        <Box key={idx} sx={{ position: 'relative' }}>
                                            <img src={img} alt={`Color ${activeColorTab + 1} - ${idx + 1}`} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 8 }} />
                                            <IconButton size="small" onClick={() => handleRemoveColorVariantImage(activeColorTab, idx)} sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'white', '&:hover': { bgcolor: 'error.light' } }}><CloseIcon fontSize="small" /></IconButton>
                                        </Box>
                                    ))}
                                </Box>
                                {formik.touched.variants?.[activeColorTab] && getColorVariantError(activeColorTab, 'images') && (<FormHelperText error>{String(getColorVariantError(activeColorTab, 'images'))}</FormHelperText>)}
                            </Grid>
                            <Divider sx={{ mb: 3 }} />
                            {formik.values.variants[activeColorTab].subVariants
                                .filter((subVariant) => !(subVariant as any).toBeDeleted)
                                .map((subVariant, subIndex) => (
                                    <Accordion key={subIndex} expanded={expandedSubVariant === subIndex} onChange={() => setExpandedSubVariant(expandedSubVariant === subIndex ? null : subIndex)} sx={{ mb: 2 }}>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                                                <StorageIcon color="primary" />
                                                <Typography variant="subtitle2" fontWeight="bold">{subVariant.specifications?.storage || `Storage Variant ${subIndex + 1}`}{subVariant.specifications?.ram && ` • ${subVariant.specifications.ram}`}</Typography>
                                                <Chip label={`₹${subVariant.sellingPrice || '0'}`} size="small" color="success" variant="outlined" />
                                                {!subVariant.isActive && <Chip label="Inactive" size="small" color="default" />}
                                            </Box>
                                            {formik.values.variants[activeColorTab].subVariants.length > 1 && (<Box component="span" onClick={(e) => { e.stopPropagation(); handleRemoveSubVariant(activeColorTab, subIndex); }} sx={{ cursor: 'pointer', color: 'error.main', display: 'flex', alignItems: 'center', '&:hover': { opacity: 0.8 }, ml: 1 }}><RemoveCircleIcon fontSize="small" /></Box>)}
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
                                                        {/* 🔹 SECTION 1: Variant Selector Attributes (Flipkart-style chips) */}
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
                                                                        🔹 Variant Selector Fields
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                                                                        These appear as <strong>selector chips</strong> (like Flipkart).
                                                                        Customers select options to differentiate variants.
                                                                    </Typography>
                                                                    <Grid container spacing={2}>
                                                                        {variantAttributes.map((attr: CategoryAttribute) => {
                                                                            const specValue = subVariant.specifications?.[attr.name];
                                                                            const fieldIndex = formik.values.variants[activeColorTab].subVariants.indexOf(subVariant);
                                                                            const specError = getSubVariantSpecError(activeColorTab, fieldIndex, attr.name); // ✅ FIXED
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

                                                        {/* 🔸 SECTION 2: Product Highlights Attributes (Checklist style) */}
                                                        {highlightAttributes.length > 0 && (
                                                            <Grid size={{ xs: 12 }}>
                                                                <Box sx={{
                                                                    p: 2,
                                                                    bgcolor: 'success.50',
                                                                    borderRadius: 2,
                                                                    border: '1px solid',
                                                                    borderColor: 'success.light',
                                                                    mb: 2
                                                                }}>
                                                                    <Typography variant="subtitle2" fontWeight="bold" color="success.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <CheckCircleIcon fontSize="small" />
                                                                        🔸 Product Highlights Fields
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                                                                        These appear in the <strong>Product Highlights</strong> section.
                                                                        Same value shown for all variants (e.g., Processor, Warranty).
                                                                    </Typography>
                                                                    <Grid container spacing={2}>
                                                                        {highlightAttributes.map((attr: CategoryAttribute) => {
                                                                            const specValue = subVariant.specifications?.[attr.name];
                                                                            const specError = getSubVariantSpecError(activeColorTab, subIndex, attr.name); return (
                                                                                <Grid key={attr._id || attr.name} size={{ xs: 12, sm: 6 }}>
                                                                                    {attr.type === 'select' ? (
                                                                                        <FormControl fullWidth required={attr.required}>
                                                                                            <InputLabel>{attr.label}{attr.required && ' *'}</InputLabel>
                                                                                            <Select
                                                                                                value={specValue || ''}
                                                                                                onChange={(e) => handleSubVariantSpecChange(activeColorTab, subIndex, attr.name, e.target.value)}
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
                                                                                            onChange={(e) => handleSubVariantSpecChange(activeColorTab, subIndex, attr.name, e.target.value ? Number(e.target.value) : '')}
                                                                                            required={attr.required}
                                                                                            InputProps={{ inputProps: { min: attr.min, max: attr.max, step: attr.step || 1 } }}
                                                                                        />
                                                                                    ) : (
                                                                                        <TextField
                                                                                            fullWidth
                                                                                            label={`${attr.label}${attr.required ? ' *' : ''}`}
                                                                                            value={specValue || ''}
                                                                                            onChange={(e) => handleSubVariantSpecChange(activeColorTab, subIndex, attr.name, e.target.value)}
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

                                                        {/* ⚪ SECTION 3: Other Specification Fields (Standard inputs) */}
                                                        {otherAttributes.length > 0 && (
                                                            <Grid size={{ xs: 12 }}>
                                                                <Box sx={{
                                                                    p: 2,
                                                                    bgcolor: 'grey.50',
                                                                    borderRadius: 2,
                                                                    border: '1px dashed',
                                                                    borderColor: 'grey.300',
                                                                    mb: 2
                                                                }}>
                                                                    <Typography variant="subtitle2" fontWeight="bold" color="text.primary" sx={{ mb: 1 }}>
                                                                        ⚪ Additional Specifications
                                                                    </Typography>
                                                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                                                                        Standard fields that appear in the product specifications table.
                                                                    </Typography>
                                                                    <Grid container spacing={2}>
                                                                        {otherAttributes.map((attr: CategoryAttribute) => {
                                                                            const specValue = subVariant.specifications?.[attr.name];
                                                                            const specError = getSubVariantSpecError(activeColorTab, subIndex, attr.name); return (
                                                                                <Grid key={attr._id || attr.name} size={{ xs: 12, sm: 6 }}>
                                                                                    {attr.type === 'select' ? (
                                                                                        <FormControl fullWidth required={attr.required}>
                                                                                            <InputLabel>{attr.label}{attr.required && ' *'}</InputLabel>
                                                                                            <Select
                                                                                                value={specValue || ''}
                                                                                                onChange={(e) => handleSubVariantSpecChange(activeColorTab, subIndex, attr.name, e.target.value)}
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
                                                                                            onChange={(e) => handleSubVariantSpecChange(activeColorTab, subIndex, attr.name, e.target.value ? Number(e.target.value) : '')}
                                                                                            required={attr.required}
                                                                                            InputProps={{ inputProps: { min: attr.min, max: attr.max, step: attr.step || 1 } }}
                                                                                        />
                                                                                    ) : (
                                                                                        <TextField
                                                                                            fullWidth
                                                                                            label={`${attr.label}${attr.required ? ' *' : ''}`}
                                                                                            value={specValue || ''}
                                                                                            onChange={(e) => handleSubVariantSpecChange(activeColorTab, subIndex, attr.name, e.target.value)}
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
                                                    </>
                                                ) : (
                                                    <Grid size={{ xs: 12 }}>
                                                        <Typography variant="body2" color="text.secondary">
                                                            No additional specifications configured for this category
                                                        </Typography>
                                                    </Grid>
                                                )}

                                                {/* ✅ Price/Stock fields remain unchanged below the attribute sections */}
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        label="MRP Price (₹) *"
                                                        type="number"
                                                        value={subVariant.mrpPrice}
                                                        onChange={(e) => handleSubVariantChange(activeColorTab, subIndex, 'mrpPrice', e.target.value)}
                                                        error={Boolean(getSubVariantError(activeColorTab, subIndex, 'mrpPrice'))}
                                                        helperText={getSubVariantError(activeColorTab, subIndex, 'mrpPrice') || ''}
                                                        InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        label="Selling Price (₹) *"
                                                        type="number"
                                                        value={subVariant.sellingPrice}
                                                        onChange={(e) => handleSubVariantChange(activeColorTab, subIndex, 'sellingPrice', e.target.value)}
                                                        error={Boolean(getSubVariantError(activeColorTab, subIndex, 'sellingPrice'))}
                                                        helperText={getSubVariantError(activeColorTab, subIndex, 'sellingPrice') || ''}
                                                        InputProps={{ inputProps: { min: 0, step: "0.01" } }}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        label="Stock Quantity"
                                                        type="number"
                                                        value={subVariant.stock}
                                                        onChange={(e) => handleSubVariantChange(activeColorTab, subIndex, 'stock', e.target.value)}
                                                        InputProps={{ inputProps: { min: 0 } }}
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12, sm: 6 }}>
                                                    <TextField
                                                        fullWidth
                                                        label="SKU (Optional)"
                                                        value={subVariant.sku || ''}
                                                        onChange={(e) => handleSubVariantChange(activeColorTab, subIndex, 'sku', e.target.value)}
                                                        placeholder="Auto-generated if empty"
                                                    />
                                                </Grid>
                                                <Grid size={{ xs: 12 }}>
                                                    <FormControlLabel
                                                        control={
                                                            <Switch
                                                                checked={subVariant.isActive !== false}
                                                                onChange={(e) => handleSubVariantChange(activeColorTab, subIndex, 'isActive', e.target.checked)}
                                                            />
                                                        }
                                                        label="Active (visible to customers)"
                                                    />
                                                </Grid>
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

    // ============================================
    // ✅ JSX RETURN - ✅ FIXED: Snackbar with dynamic message
    // ============================================
    return (
        <div className="p-4">
            <Box sx={{ mb: 4 }}>
                <Typography variant="h5" fontWeight="bold">✏️ Edit Product: {formik.values.title || 'Loading...'}</Typography>
                <Typography variant="body2" color="text.secondary">Update variant details, prices, and stock. Categories cannot be changed.</Typography>
            </Box>
            <form onSubmit={formik.handleSubmit}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}><Paper className="p-4 bg-purple-50 border border-purple-200 rounded-lg"><Typography variant="h6" className="font-semibold text-purple-800">📝 Product Information</Typography></Paper></Grid>
                    <Grid size={{ xs: 12 }}><TextField fullWidth label="Product Title *" value={formik.values.title} onChange={(e) => formik.setFieldValue('title', e.target.value)} onBlur={formik.handleBlur} error={formik.touched.title && Boolean(formik.errors.title)} helperText={formik.touched.title && formik.errors.title ? String(formik.errors.title) : ""} required /></Grid>
                    <Grid size={{ xs: 12 }}><TextField multiline rows={4} fullWidth label="Description *" value={formik.values.description} onChange={(e) => formik.setFieldValue('description', e.target.value)} onBlur={formik.handleBlur} error={formik.touched.description && Boolean(formik.errors.description)} helperText={formik.touched.description && formik.errors.description ? String(formik.errors.description) : ""} required /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><TextField fullWidth label="Brand (Optional)" value={formik.values.brand || ''} onChange={(e) => formik.setFieldValue('brand', e.target.value)} onBlur={formik.handleBlur} helperText="e.g., Samsung, Apple, Nike" /></Grid>
                    <Grid size={{ xs: 12 }}><Paper className="p-3 bg-blue-50 border border-blue-200 rounded-lg"><Typography variant="body2" className="text-blue-700">📁 Category:{" "}{categoryState.categories.find((c: Category) => c._id === initialValues.category)?.name} →{" "}{categoryState.categories.find((c: Category) => c._id === initialValues.category2)?.name} →{" "}<strong>{categoryState.categories.find((c: Category) => c._id === initialValues.category3)?.name}</strong></Typography><Typography variant="caption" color="text.secondary">ℹ️ Categories are locked in edit mode</Typography></Paper></Grid>
                    <Grid size={{ xs: 12 }}><Divider sx={{ my: 2 }} />{renderVariantsSection()}</Grid>
                    <Grid size={12} className="flex justify-between mt-6">
                        {onClose && (<Button type="button" onClick={onClose} variant="outlined" color="secondary">Cancel</Button>)}
                        <Button sx={{ px: 4, py: 1.5 }} color="primary" variant="contained" type="submit" disabled={sellerProduct.loading || !isFormValid() || attributesLoading}>
                            {sellerProduct.loading ? <CircularProgress size={24} color="inherit" /> : "✅ Update Product"}
                        </Button>
                    </Grid>
                </Grid>
            </form>
            {/* ✅✅✅ FIXED: Snackbar with dynamic message and severity */}
            <Snackbar anchorOrigin={{ vertical: "top", horizontal: "right" }} open={snackbarOpen} autoHideDuration={6000} onClose={() => setOpenSnackbar(false)}>
                <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} variant="filled" sx={{ width: "100%" }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default UpdateProductForm;