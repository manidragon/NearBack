// D:\Mani\Code with Zosh\Backup\source code\frontend\src\admin\pages\Home Page\UpdateDealForm.tsx

import { useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
    TextField,
    Button,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    CircularProgress,
    Alert,
    Box,
} from "@mui/material";
import { useAppDispatch, useAppSelector } from "../../../Redux Toolkit/Store";
import { fetchHomeCategories } from "../../../Redux Toolkit/Admin/AdminSlice";
import { updateDeal, getAllDeals } from "../../../Redux Toolkit/Admin/DealSlice";
import type { HomeCategory } from "../../../types/homeDataTypes";

const validationSchema = Yup.object({
    discount: Yup.number()
        .required("Discount is required")
        .min(1, "Discount must be at least 1%")
        .max(100, "Discount cannot exceed 100%"),
    category: Yup.string()
        .required("Category is required"),
});

interface UpdateDealFormProps {
    deal: any;
    handleClose: () => void;
}

const UpdateDealForm = ({ deal, handleClose }: UpdateDealFormProps) => {
    const homePage = useAppSelector((state) => state.homePage);
    const dealState = useAppSelector((state) => state.deal);
    const dispatch = useAppDispatch();
    const [showSuccess, setShowSuccess] = useState(false);

    const formik = useFormik({
        initialValues: {
            discount: deal?.discount || 0,
            category: deal?.category?._id || "",
        },
        validationSchema,
        onSubmit: async (values) => {
            try {
                await dispatch(
                    updateDeal({
                        id: deal._id,
                        deal: {
                            discount: values.discount,
                            category: { _id: values.category },
                        },
                    })
                );
                setShowSuccess(true);
                setTimeout(() => {
                    handleClose();
                    dispatch(getAllDeals());
                }, 1000);
            } catch (error) {
                console.error("Update failed:", error);
            }
        },
    });

    useEffect(() => {
        dispatch(fetchHomeCategories());
    }, [dispatch]);

    return (
        <Box className="space-y-4">
            {showSuccess && (
                <Alert severity="success" sx={{ mb: 2 }}>
                    Deal updated successfully!
                </Alert>
            )}
            
            <Typography align="center" variant="h4" gutterBottom>
                Update Deal
            </Typography>

            <form onSubmit={formik.handleSubmit} className="space-y-4">
                <TextField
                    fullWidth
                    id="discount"
                    name="discount"
                    label="Discount (%)"
                    type="number"
                    value={formik.values.discount}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.discount && Boolean(formik.errors.discount)}
                    helperText={formik.touched.discount ? String(formik.errors.discount || "") : ""}
                />

                <FormControl
                    fullWidth
                    error={formik.touched.category && Boolean(formik.errors.category)}
                >
                    <InputLabel id="category-label">Category</InputLabel>
                    <Select
                        labelId="category-label"
                        id="category"
                        name="category"
                        value={formik.values.category}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        label="Category"
                    >
                        <MenuItem value="">
                            <em>Select Category</em>
                        </MenuItem>
                        {homePage.homePageData?.dealCategories?.map((cat: HomeCategory) => (
                            <MenuItem key={cat._id} value={cat._id}>
                                {/* ✅ FIXED: Use description instead of name/categoryId */}
                                {cat.description || cat.image || 'Category'}
                            </MenuItem>
                        ))}
                    </Select>
                    {formik.touched.category && formik.errors.category && (
                        <FormHelperText>{String(formik.errors.category)}</FormHelperText>
                    )}
                </FormControl>

                <Button
                    sx={{ py: ".8rem" }}
                    color="primary"
                    variant="contained"
                    fullWidth
                    type="submit"
                    disabled={dealState.loading || formik.isSubmitting}
                    startIcon={dealState.loading ? <CircularProgress size={20} /> : null}
                >
                    {dealState.loading ? "Updating..." : "Update Deal"}
                </Button>
            </form>
        </Box>
    );
};

export default UpdateDealForm;